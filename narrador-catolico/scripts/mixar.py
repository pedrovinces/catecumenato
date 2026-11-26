#!/usr/bin/env python3
"""Mixagem final do episódio: voz + trilha + efeitos, com as regras da seção 7.

Uso: python3 -I scripts/mixar.py ep01   (lê out/ep01-linha-do-tempo.json)

- Voz: a gravação tinha grave demais (125 e 250 Hz uns 21 dB acima de 1 kHz, efeito de proximidade do
  microfone), o que abafava as consoantes. Corrente: passa-altas 85 Hz (4 polos), cortes em 140 Hz (-13 dB),
  280 Hz (-9 dB) e 550 Hz (-3 dB), presença em 3,2 kHz (+3 dB), brilho acima de 7,5 kHz (+2 dB), de-esser
  leve e compressão suave. Trechos colocados conforme a linha do tempo (inclui as "caudas" entre cenas).
- Fundo (trilha): 18 dB abaixo da voz nos respiros e 24 dB abaixo durante a fala (ducking de 6 dB), com um
  vale suave em 2,5 kHz; muda em cada congelamento e volta no corte seguinte. A narração vem sempre na frente.
- Efeitos: 16 dB abaixo da voz quando estão sozinhos; 22 dB abaixo quando coincidem com fala
  (ducking dinâmico, então efeitos longos só abaixam no trecho com voz); param no fim da cena.
  O campo "volume" do JSON soma em dB.
- Master: loudnorm em duas passagens para -14 LUFS integrados e -1 dBTP; AAC 48 kHz no vídeo.

Saída: out/<codigo>-mix.wav e o relatório de loudness.
"""
import json
import pathlib
import subprocess
import sys
import tempfile

import numpy as np
import pyloudnorm as pyln
from scipy.io import wavfile
from scipy.signal import fftconvolve, lfilter, resample_poly

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SR = 48000
# Níveis relativos à voz (dB). O fundo é só um tapete: bem baixo, nunca disputa com a narração.
TRILHA_RESPIRO = -18.0
DUCKING = -6.0  # fundo a -24 dB durante a fala
PAUSA_DB = 12.0  # quanto a voz desce nas pausas entre frases
SFX_SOZINHO = -16.0  # efeitos são acessórios: nunca disputam com a voz
SFX_SOB_FALA = -22.0
VOZ_FILTROS = (
    "afftdn=nr=10:nf=-62:tn=1,"  # redutor de ruído: tira o chiado da gravação antes de realçar os agudos
    "highpass=f=85:poles=2,highpass=f=85:poles=2,"
    "equalizer=f=140:t=q:w=0.8:g=-13,equalizer=f=280:t=q:w=0.9:g=-9,equalizer=f=550:t=q:w=1.2:g=-3,"
    "equalizer=f=3200:t=q:w=1.0:g=3,highshelf=f=7500:g=1,"
    "deesser=i=0.2:m=0.5:f=0.5,"
    "acompressor=threshold=-24dB:ratio=2.5:attack=8:release=160:makeup=1.5,"
    "acompressor=threshold=-14dB:ratio=6:attack=1:release=60:knee=3"  # pega-picos: crista da fala ~13 dB
)
# voz já tratada por scripts/voz_estudio.py (eco, ruído e EQ casada com o ep. 1): só de-esser e dinâmica
VOZ_FILTROS_ESTUDIO = (
    "highpass=f=75:poles=2,"
    "deesser=i=0.3:m=0.5:f=0.5,"
    "acompressor=threshold=-24dB:ratio=2.5:attack=8:release=160:makeup=1.5,"
    "acompressor=threshold=-14dB:ratio=6:attack=1:release=60:knee=3"
)
SFX_MUSICAIS = {"vinheta-final": 6.0, "vinheta-final-cantada": 6.0, "vinheta-narrador": 14.0, "vinheta-amen": 14.0, "licenciado-turn-down-for-what": 14.0}  # a vinheta toca depois da última fala


def ler(caminho) -> np.ndarray:
    taxa, d = wavfile.read(caminho)
    x = d.astype(np.float64) / (32768.0 if d.dtype == np.int16 else 1.0)
    if x.ndim == 1:
        x = np.vstack([x, x])
    else:
        x = x.T
    if taxa != SR:
        x = resample_poly(x, SR, taxa, axis=1)
    return x


def vale(x: np.ndarray, f0=2500.0, ganho_db=-3.5, q=0.8) -> np.ndarray:
    """Equalizador de pico (RBJ) para abrir espaço para a voz."""
    a_ = 10 ** (ganho_db / 40)
    w0 = 2 * np.pi * f0 / SR
    alfa = np.sin(w0) / (2 * q)
    b = [1 + alfa * a_, -2 * np.cos(w0), 1 - alfa * a_]
    a = [1 + alfa / a_, -2 * np.cos(w0), 1 - alfa / a_]
    return lfilter(np.array(b) / a[0], np.array(a) / a[0], x, axis=-1)


def loud(x: np.ndarray) -> float:
    medidor = pyln.Meter(SR)
    y = x.T
    if y.shape[0] < int(0.5 * SR):
        y = np.vstack([y, np.zeros((int(0.5 * SR) - y.shape[0], y.shape[1]))])
    return medidor.integrated_loudness(y)


def curva(n, janelas, ganho_db, ataque=0.06, soltura=0.3, antecipa=0.08):
    """Curva de ganho (linear) que vale ganho_db dentro das janelas, com rampas suaves."""
    alvo = np.zeros(n)
    for a, b in janelas:
        i = max(0, int((a - antecipa) * SR))
        j = min(n, int(b * SR))
        alvo[i:j] = 1
    # rampas: média móvel assimétrica simples (descida rápida, subida lenta)
    g = np.zeros(n)
    a_coef = np.exp(-1 / (ataque * SR))
    r_coef = np.exp(-1 / (soltura * SR))
    # passo em blocos de 1 ms para ficar rápido
    bloco = SR // 1000
    estado = 0.0
    for k in range(0, n, bloco):
        v = alvo[k]
        coef = a_coef ** bloco if v > estado else r_coef ** bloco
        estado = v + (estado - v) * coef
        g[k : k + bloco] = estado
    return 10 ** (ganho_db * g / 20)


def main():
    codigo = sys.argv[1] if len(sys.argv) > 1 else "ep01"
    linha = json.loads((RAIZ / "out" / f"{codigo}-linha-do-tempo.json").read_text(encoding="utf-8"))
    fps = linha["fps"]
    n = int(linha["duracao"] / fps * SR)

    # 1. voz tratada (antes, nivela a gravação em -20 LUFS para os compressores trabalharem na faixa certa)
    roteiro = next(
        (d for d in (json.loads(q.read_text(encoding="utf-8")) for q in sorted((RAIZ / "roteiro").glob(f"{codigo}-*.json")))
         if isinstance(d, dict) and "cenas" in d and "slug" in d),
        {},
    )
    estudio = roteiro.get("audio", {}).get("voz") == "estudio"
    print("cadeia de voz:", "estúdio (voz pré-tratada)" if estudio else "padrão")
    taxa_bruta, bruta = wavfile.read(RAIZ / "assets" / linha["narracao"]["arquivo"])
    bruta = bruta.astype(np.float64) / (32768.0 if bruta.dtype == np.int16 else 1.0)
    pre_ganho = -20.0 - pyln.Meter(taxa_bruta).integrated_loudness(bruta)
    with tempfile.TemporaryDirectory() as tmp:
        tratada = pathlib.Path(tmp) / "voz.wav"
        subprocess.run(
            [
                "ffmpeg", "-v", "error", "-y", "-i", str(RAIZ / "assets" / linha["narracao"]["arquivo"]),
                "-af", f"volume={pre_ganho:.2f}dB," + VOZ_FILTROS_ESTUDIO if estudio
                else VOZ_FILTROS.replace("highpass=f=85:poles=2,highpass", f"volume={pre_ganho:.2f}dB,highpass=f=85:poles=2,highpass", 1),
                "-ar", str(SR), "-ac", "1", "-c:a", "pcm_s16le", str(tratada),
            ],
            check=True,
        )
        voz_bruta = ler(tratada)[0]
    # filtros de FFT (redutor de ruído) atrasam o sinal; mede o atraso contra a gravação crua e compensa,
    # senão a voz chega depois da legenda e o ataque das sílabas some
    crua = bruta if bruta.ndim == 1 else bruta.mean(axis=1)
    if taxa_bruta != SR:
        crua = resample_poly(crua, SR, taxa_bruta)
    janela = min(len(crua), len(voz_bruta), 20 * SR)
    corr = fftconvolve(voz_bruta[:janela], crua[:janela][::-1], mode="full")
    atraso = int(np.argmax(corr[janela - 1 : janela - 1 + SR // 5]))  # procura de 0 a 200 ms
    if atraso:
        voz_bruta = np.concatenate([voz_bruta[atraso:], np.zeros(atraso)])
    print(f"atraso da cadeia de voz compensado: {atraso / SR * 1000:.1f} ms")
    voz = np.zeros(n)
    for s in linha["narracao"]["segmentos"]:
        a, b = int(s["origemIni"] * SR), int(s["origemFim"] * SR)
        trecho = voz_bruta[a:b].copy()
        r = int(0.01 * SR)
        trecho[:r] *= np.linspace(0, 1, r)
        trecho[-r:] *= np.linspace(1, 0, r)
        i = int(s["destino"] * SR)
        m = min(len(trecho), n - i)
        voz[i : i + m] += trecho[:m]
    # pausas entre frases: a voz baixa 12 dB fora das palavras (some o chiado que os compressores levantam);
    # entra 80 ms antes de cada palavra e solta em 300 ms, então começo e fim de sílaba ficam intactos
    falas = [(w["inicio"] / linha["fps"], w["fim"] / linha["fps"]) for w in linha["fala"]]
    voz *= curva(n, falas, PAUSA_DB, ataque=0.03, soltura=0.3, antecipa=0.08) * 10 ** (-PAUSA_DB / 20)
    voz_st = np.vstack([voz, voz])
    lv = loud(voz_st)

    fala = [(w["inicio"] / fps, w["fim"] / fps) for w in linha["fala"]]
    muda = [(w["inicio"] / fps, w["fim"] / fps) for w in linha["trilhaMuda"]]

    # 2. trilha
    # a trilha só entra se o roteiro tiver "audio.trilha" (o ep. 1 ficou sem, a pedido: competia com a narração)
    so_voz = "--so-voz" in sys.argv
    trilha_arq = RAIZ / "assets" / linha["trilha"] if linha.get("trilha") else None
    trilha = np.zeros((2, n))
    if trilha_arq is not None and trilha_arq.exists() and not so_voz:
        t = ler(trilha_arq)[:, :n]
        trilha[:, : t.shape[1]] = t
        lt = loud(trilha)
        trilha *= 10 ** ((lv + TRILHA_RESPIRO - lt) / 20)
        trilha = vale(trilha)
        trilha *= curva(n, fala, DUCKING, ataque=0.08, soltura=0.4)
        corte = np.ones(n)
        r = int(0.01 * SR)
        for k, (a, b) in enumerate(muda):
            i, j = int(a * SR), int(b * SR)
            if k == len(muda) - 1 and j >= n - SR:
                # congelamento final (cartão da marca): o fundo desce em 0,6 s em vez de parar seco
                rf = int(0.6 * SR)
                corte[i : i + rf] = np.minimum(corte[i : i + rf], np.linspace(1, 0, len(corte[i : i + rf])))
                corte[i + rf : j] = 0
                continue
            corte[i:j] = 0
            corte[max(0, i - r) : i] = np.minimum(corte[max(0, i - r) : i], np.linspace(1, 0, i - max(0, i - r)))
        trilha *= corte

    # 3. efeitos
    efeitos = np.zeros((2, n))
    faltando = set()
    relatorio = []
    for s in [] if so_voz else linha["sfx"]:
        arq = RAIZ / "assets" / "sfx" / f"{s['arquivo']}.wav"
        if not arq.exists():
            faltando.add(s["arquivo"])
            continue
        x = ler(arq)
        alvo = lv + SFX_SOZINHO + s.get("volume", 0) + SFX_MUSICAIS.get(s["arquivo"], 0)
        x *= 10 ** ((alvo - loud(x)) / 20)
        t0 = s["quadro"] / fps
        cena = next((c for c in linha["cenas"] if c["id"] == s["cena"]), None)
        if cena is not None:
            limite = int((cena["fim"] / fps + 0.4 - t0) * SR)
            if 0 < limite < x.shape[1]:
                r = min(int(s.get("saida", 0.2) * SR), limite)  # fade-out no fim da cena ("saida" no roteiro)
                x = x[:, :limite].copy()
                x[:, -r:] *= np.linspace(1, 0, r)
        # ducking só onde há voz: leva o efeito de -3 para -10 dB em relação à voz
        locais = [(a - t0, b - t0) for a, b in fala if b > t0 and a < t0 + x.shape[1] / SR]
        if locais:
            x *= curva(x.shape[1], locais, SFX_SOB_FALA - SFX_SOZINHO, 0.03, 0.2, 0.03)
        i = int(t0 * SR)
        m = min(x.shape[1], n - i)
        if m > 0:
            efeitos[:, i : i + m] += x[:, :m]
        relatorio.append(f"  {t0:7.2f}s  {s['arquivo']:20s} {'sob fala' if locais else 'livre'}")

    # 4. soma e master (com --stems, grava as três faixas para conferência)
    if "--stems" in sys.argv:
        pasta = RAIZ / "out" / "stems"
        pasta.mkdir(parents=True, exist_ok=True)
        for nome, st in (("voz", voz_st), ("trilha", trilha), ("efeitos", efeitos)):
            wavfile.write(pasta / f"{codigo}-{nome}.wav", SR, st.T.astype(np.float32))
    mix = voz_st + trilha + efeitos
    with tempfile.TemporaryDirectory() as tmp:
        bruto = pathlib.Path(tmp) / "bruto.wav"
        pico = np.max(np.abs(mix))
        wavfile.write(bruto, SR, (mix.T / max(pico, 1) * 0.98).astype(np.float32))
        # limitador suave antes do master: segura só os picos das consoantes (realçadas pela EQ de presença),
        # para o loudnorm linear chegar a -14 LUFS sem passar de -1,5 dBTP
        limitado = pathlib.Path(tmp) / "limitado.wav"
        ganho_db = -14 - loud(mix / max(pico, 1) * 0.98)  # leva a mixagem a -14 LUFS antes de limitar
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-i", str(bruto), "-af", f"volume={ganho_db:.2f}dB,alimiter=limit=0.776:attack=1.5:release=60:level=false",
             "-c:a", "pcm_f32le", str(limitado)],
            check=True,
        )
        bruto = limitado
        medida = subprocess.run(
            ["ffmpeg", "-hide_banner", "-nostats", "-i", str(bruto), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
            capture_output=True, text=True, check=True,
        ).stderr
        js = json.loads(medida[medida.rindex("{") : medida.rindex("}") + 1])
        destino = RAIZ / "out" / f"{codigo}-mix{'-so-voz' if so_voz else ''}.wav"
        filtro = (
            f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
            f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true"
        )
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(bruto), "-af", filtro, "-ar", str(SR), "-c:a", "pcm_s24le", str(destino)], check=True)
    final = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(destino), "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    resumo = [l.strip() for l in final.splitlines() if l.strip().startswith(("I:", "LRA:", "Peak:"))]
    tem_trilha = bool(np.any(trilha))
    print(f"voz {lv:.1f} LUFS antes do master; trilha: {f'{TRILHA_RESPIRO:+.0f}/{TRILHA_RESPIRO + DUCKING:+.0f} dB' if tem_trilha else 'sem'}; efeitos: {'sem' if so_voz else f'{SFX_SOZINHO:+.0f}/{SFX_SOB_FALA:+.0f} dB'}")
    print(f"mix: {destino.relative_to(RAIZ)}  " + "  ".join(resumo[-3:]))
    print(f"master: ganho {ganho_db:+.1f} dB, limitador a -2,2 dBFS, loudnorm {js['normalization_type'] if 'normalization_type' in js else ''}")
    print(f"efeitos posicionados: {len(relatorio)}")
    if faltando:
        print("faltando:", ", ".join(sorted(faltando)))


if __name__ == "__main__":
    main()
