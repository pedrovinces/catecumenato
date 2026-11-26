#!/usr/bin/env python3
"""Deixa a narração com som de estúdio antes da montagem.

Uso: python3 -I scripts/voz_estudio.py <gravação> <saída.wav> [--alvo scripts/voz_alvo.json] [--pausa-max 0.75]

Etapas (só numpy/scipy/librosa, sem modelos baixados):
1. Passa-altas de 70 Hz (zero fase): tira o ronco de sala e de manuseio.
2. Desreverberação WPE (Weighted Prediction Error, Nakatani/Yoshioka): estima a cauda de eco de cada faixa
   de frequência a partir dos quadros anteriores e a subtrai. É o método do pacote nara_wpe, reescrito aqui.
3. Redução de ruído por Wiener com decisão dirigida (Ephraim-Malah), com o perfil de ruído medido nas pausas
   da própria gravação e atenuação máxima de 15 dB (sem "som de lata").
4. Pausas mais longas que --pausa-max são encurtadas (cortes com fusão de 20 ms), tirando o ar morto.
5. Equalização casada: a curva média da voz é levada à curva da voz do ep. 1 já tratada (scripts/voz_alvo.json),
   para os episódios terem o mesmo timbre. Ganhos limitados a -18/+6 dB e suavizados em 1/3 de oitava.
A saída é 48 kHz mono; de-esser, compressão e nível ficam com scripts/mixar.py (cadeia "estudio").
"""
import json
import pathlib
import subprocess
import sys
import tempfile

import librosa
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, firwin2, sosfiltfilt

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SR = 48000


def carregar(caminho: pathlib.Path) -> np.ndarray:
    with tempfile.TemporaryDirectory() as tmp:
        wav = pathlib.Path(tmp) / "x.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(caminho), "-ac", "1", "-ar", str(SR), "-c:a", "pcm_f32le", str(wav)], check=True)
        _, x = wavfile.read(wav)
    return x.astype(np.float64)


def ltas(x: np.ndarray, bandas: np.ndarray) -> np.ndarray:
    """Espectro médio da fala (dB) em bandas de 1/6 de oitava, só nos quadros com voz."""
    S = np.abs(librosa.stft(x, n_fft=8192, hop_length=2048)) ** 2
    e = S.sum(axis=0)
    S = S[:, e > np.percentile(e, 45)]
    f = librosa.fft_frequencies(sr=SR, n_fft=8192)
    p = S.mean(axis=1)
    out = np.array([p[(f >= b / 2 ** (1 / 12)) & (f < b * 2 ** (1 / 12))].mean() for b in bandas])
    return 10 * np.log10(out + 1e-20)


def bandas_padrao() -> np.ndarray:
    return 1000.0 * 2 ** (np.arange(-24, 25) / 6)  # 62,5 Hz a 16 kHz


def wpe(x: np.ndarray, taps=10, atraso=3, iteracoes=3, n_fft=1536, hop=384) -> np.ndarray:
    Y = librosa.stft(x, n_fft=n_fft, hop_length=hop)
    F, T = Y.shape
    X = Y.copy()
    for f in range(F):
        y = Y[f]
        til = np.zeros((T, taps), dtype=complex)
        for k in range(taps):
            d = atraso + k
            til[d:, k] = y[: T - d]
        xf = y.copy()
        for _ in range(iteracoes):
            lam = np.abs(xf) ** 2
            lam = np.maximum(np.convolve(lam, np.ones(3) / 3, mode="same"), 1e-10 * (lam.max() + 1e-20))
            w = 1.0 / lam
            tw = til * w[:, None]
            R = tw.T @ til.conj()
            P = tw.T @ y.conj()
            R += np.eye(taps) * (1e-6 * np.trace(R).real / taps + 1e-12)
            g = np.linalg.solve(R, P)
            xf = y - til @ g.conj()
        X[f] = xf
    return librosa.istft(X, hop_length=hop, length=len(x))


def wiener(x: np.ndarray, n_fft=2048, hop=512, piso_db=-15.0, alfa=0.98) -> np.ndarray:
    Y = librosa.stft(x, n_fft=n_fft, hop_length=hop)
    P = np.abs(Y) ** 2
    e = P.sum(axis=0)
    ruido = P[:, e <= np.percentile(e, 10)].mean(axis=1, keepdims=True) * 1.3
    piso = 10 ** (piso_db / 20)
    G = np.ones_like(P)
    g_ant = np.ones((P.shape[0],))
    post_ant = np.ones((P.shape[0],))
    for t in range(P.shape[1]):
        post = P[:, t] / ruido[:, 0]
        prio = alfa * (g_ant**2) * post_ant + (1 - alfa) * np.maximum(post - 1, 0)
        g = prio / (1 + prio)
        g = np.maximum(g, piso)
        G[:, t] = g
        g_ant, post_ant = g, post
    G = np.apply_along_axis(lambda c: np.convolve(c, np.ones(3) / 3, mode="same"), 0, G)
    return librosa.istft(Y * G, hop_length=hop, length=len(x))


def encurtar_pausas(x: np.ndarray, maximo: float, limiar_db=-42.0, minimo=0.35) -> tuple[np.ndarray, float]:
    rms = librosa.feature.rms(y=x, frame_length=1024, hop_length=240)[0]
    db = 20 * np.log10(rms + 1e-9) - 20 * np.log10(np.max(rms) + 1e-9)
    silencio = db < limiar_db
    passo = 240 / SR
    trechos, i = [], 0
    while i < len(silencio):
        if silencio[i]:
            j = i
            while j < len(silencio) and silencio[j]:
                j += 1
            if (j - i) * passo >= minimo:
                trechos.append((i * passo, j * passo))
            i = j
        else:
            i += 1
    partes, cursor, removido = [], 0, 0.0
    fus = int(0.02 * SR)
    for a, b in trechos:
        dur = b - a
        if a < 0.05 or b > len(x) / SR - 0.05:
            continue
        if dur <= maximo:
            continue
        # mantém metade do máximo em cada lado do corte
        corte_a = int((a + maximo / 2) * SR)
        corte_b = int((b - maximo / 2) * SR)
        partes.append(x[cursor:corte_a])
        cursor = corte_b
        removido += (corte_b - corte_a) / SR
    partes.append(x[cursor:])
    y = partes[0]
    for p in partes[1:]:
        r = min(fus, len(y), len(p))
        rampa = np.linspace(0, 1, r)
        y = np.concatenate([y[:-r], y[-r:] * (1 - rampa) + p[:r] * rampa, p[r:]])
    # silêncio inicial e final: 0,25 s
    inicio = trechos[0][1] - 0.25 if trechos and trechos[0][0] < 0.05 else 0.0
    y = y[max(0, int(inicio * SR)):]
    fim_ativo = np.nonzero(np.abs(y) > 10 ** (limiar_db / 20) * np.max(np.abs(y)))[0]
    if len(fim_ativo):
        y = y[: min(len(y), fim_ativo[-1] + int(0.35 * SR))]
    return y, removido


def eq_casada(x: np.ndarray, alvo_db: np.ndarray, bandas: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    atual = ltas(x, bandas)

    def suave(c):  # ~1 oitava: casa o equilíbrio tonal, não os formantes de cada gravação
        return np.convolve(np.pad(c, 3, mode="edge"), np.ones(7) / 7, mode="valid")

    alvo_s, atual_s = suave(alvo_db), suave(atual)
    ref = (bandas >= 500) & (bandas <= 2000)
    dif = (alvo_s - alvo_s[ref].mean()) - (atual_s - atual_s[ref].mean())
    dif = np.clip(dif, -18, 6)
    dif[bandas > 12000] = np.minimum(dif[bandas > 12000], 0)
    freqs = np.concatenate([[0], bandas, [SR / 2]])
    ganhos = np.concatenate([[dif[0]], dif, [dif[-1]]])
    h = firwin2(4097, freqs / (SR / 2), 10 ** (ganhos / 20))
    y = fftconvolve(x, h, mode="full")[2048 : 2048 + len(x)]
    return y, dif


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    entrada, saida = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
    args = sys.argv[3:]
    alvo_arq = RAIZ / (args[args.index("--alvo") + 1] if "--alvo" in args else "scripts/voz_alvo.json")
    pausa_max = float(args[args.index("--pausa-max") + 1]) if "--pausa-max" in args else 0.75

    x = carregar(entrada)
    x = sosfiltfilt(butter(4, 70, "highpass", fs=SR, output="sos"), x)
    print(f"gravação: {len(x) / SR:.1f} s")
    x = wpe(x)
    print("eco: WPE aplicado")
    x = wiener(x)
    print("ruído: Wiener aplicado")
    x, removido = encurtar_pausas(x, pausa_max)
    print(f"pausas: {removido:.2f} s de ar morto removidos (máximo {pausa_max} s) → {len(x) / SR:.1f} s")
    bandas = bandas_padrao()
    alvo = json.loads(alvo_arq.read_text(encoding="utf-8"))
    x, dif = eq_casada(x, np.array(alvo["ltas_db"]), np.array(alvo["bandas"]) if "bandas" in alvo else bandas)
    print("EQ casada (dB): " + ", ".join(f"{b:.0f} Hz {d:+.1f}" for b, d in zip(bandas[::3], dif[::3])))
    x = x / (np.max(np.abs(x)) + 1e-9) * 10 ** (-3 / 20)
    saida.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(saida, SR, (x * 32767).astype(np.int16))
    print(f"salvo: {saida}")


if __name__ == "__main__":
    main()
