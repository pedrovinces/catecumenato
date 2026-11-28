#!/usr/bin/env python3
"""Fundo musical discreto: tapete de acordes sustentados, sem melodia e sem percussão.

Uso: python3 -I scripts/fundo.py ep01   (lê out/<codigo>-linha-do-tempo.json)
Saída: o arquivo de "audio.trilha" do roteiro, ex. assets/audio/fundo.wav (48 kHz, estéreo, duração exata do episódio).

Feito para ficar atrás da voz: só acordes longos (ataque e soltura lentos), graves suaves, nada acima de
~2 kHz (a faixa das consoantes fica livre). A harmonia muda com o clima de cada bloco litúrgico e as
trocas de cena são cruzadas. O nível final, o vale em 2,5 kHz, o ducking e o silêncio nos congelamentos
ficam com scripts/mixar.py.
"""
import json
import pathlib
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SR = 48000
NOTAS = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}

# acordes por cena: (baixo, [notas do tapete]); o ciclo se repete se a cena for longa
CLIMA = {
    "abertura":   [("Bb1", ["D4", "F4", "A4", "Bb4"]), ("G1", ["D4", "F4", "Bb4"]), ("Eb2", ["G4", "Bb4", "D5"]), ("F1", ["C4", "F4", "A4"])],  # curioso, leve
    "regra":      [("F1", ["C4", "F4", "A4"]), ("D2", ["D4", "F4", "A4", "C5"]), ("Bb1", ["D4", "F4", "A4"]), ("C2", ["E4", "G4", "C5"])],      # explicativo
    "verde":      [("C2", ["E4", "G4", "C5"]), ("B1", ["D4", "G4", "B4"]), ("A1", ["C4", "E4", "G4", "A4"]), ("F1", ["C4", "F4", "A4", "E5"])],  # esperança
    "roxo":       [("D2", ["D4", "F4", "A4"]), ("Bb1", ["D4", "F4", "Bb4"]), ("G1", ["D4", "G4", "Bb4"]), ("A1", ["C#4", "E4", "A4"])],       # espera, solene
    "branco":     [("F1", ["A4", "C5", "F5"]), ("E2", ["G4", "C5", "E5"]), ("D2", ["F4", "A4", "D5"]), ("Bb1", ["F4", "Bb4", "D5"])],        # festa, claro
    "vermelho":   [("A1", ["C4", "E4", "A4"]), ("F1", ["C4", "F4", "A4"]), ("C2", ["E4", "G4", "C5"]), ("G1", ["D4", "G4", "B4"])],          # intenso, reverente
    "rosa":       [("D2", ["F#4", "A4", "D5"]), ("C#2", ["E4", "A4", "C#5"]), ("B1", ["D4", "F#4", "B4"]), ("G1", ["D4", "G4", "B4"])],     # alegria
    "fechamento": [("F1", ["C4", "F4", "A4"]), ("G1", ["D4", "G4", "B4"]), ("C2", ["E4", "G4", "C5"])],                                    # resolução
    # ep. 2
    "nao-e":      [("G1", ["D4", "G4", "B4"]), ("E2", ["E4", "G4", "B4"]), ("C2", ["E4", "G4", "C5"]), ("D2", ["D4", "F#4", "A4"])],     # ágil, leve
    "cofre":      [("D2", ["D4", "F4", "A4"]), ("Bb1", ["D4", "F4", "Bb4"]), ("C2", ["E4", "G4", "C5"]), ("A1", ["C#4", "E4", "A4"])],    # mistério didático
    "nada-novo":  [("F1", ["C4", "F4", "A4"]), ("D2", ["D4", "F4", "A4", "C5"]), ("Bb1", ["D4", "F4", "A4"]), ("C2", ["E4", "G4", "C5"])],  # firme
    "quantas":    [("C2", ["E4", "G4", "C5"]), ("A1", ["C4", "E4", "A4"]), ("F1", ["C4", "F4", "A4", "E5"]), ("G1", ["D4", "G4", "B4"])],  # curiosidade
    "porque":     [("A1", ["C4", "E4", "A4"]), ("F1", ["C4", "F4", "A4"]), ("C2", ["E4", "G4", "C5"]), ("G1", ["D4", "G4", "B4"])],       # reverente
    "fecho":      [("F1", ["C4", "F4", "A4"]), ("G1", ["D4", "G4", "B4"]), ("C2", ["E4", "G4", "C5"])],                                    # resolução
    # ep. 3
    "quarto":     [("A1", ["C4", "E4", "A4"]), ("F1", ["C4", "F4", "A4"]), ("D2", ["D4", "F4", "A4"]), ("E2", ["E4", "G#4", "B4"])],      # noite, quieto
    "serpente":   [("D2", ["D4", "F4", "A4"]), ("C#2", ["E4", "G4", "A#4"]), ("D2", ["D4", "F4", "A4"]), ("Bb1", ["D4", "F4", "Bb4"])],    # malícia leve
    "heranca":    [("A1", ["C4", "E4", "A4"]), ("F1", ["C4", "F4", "A4"]), ("C2", ["E4", "G4", "C5"]), ("E2", ["E4", "G#4", "B4"])],      # sério, didático
    "liberdade":  [("C2", ["E4", "G4", "C5"]), ("G1", ["D4", "G4", "B4"]), ("A1", ["C4", "E4", "A4"]), ("F1", ["C4", "F4", "A4", "E5"])],  # leveza
    "confissao":  [("F1", ["C4", "F4", "A4"]), ("C2", ["E4", "G4", "C5"]), ("D2", ["D4", "F4", "A4"]), ("Bb1", ["D4", "F4", "Bb4"])],      # acolhimento
    # ep. 3, parte 2 (ep04)
    "exame":      [("C2", ["E4", "G4", "C5"]), ("A1", ["C4", "E4", "A4"]), ("F1", ["C4", "F4", "A4"]), ("G1", ["D4", "G4", "B4"])],       # didático, leve
    "arrependimento": [("D2", ["D4", "F4", "A4"]), ("Bb1", ["D4", "F4", "Bb4"]), ("F1", ["C4", "F4", "A4"]), ("A1", ["C#4", "E4", "A4"])],  # sério, terno
    "na-hora":    [("G1", ["D4", "G4", "B4"]), ("E2", ["E4", "G4", "B4"]), ("C2", ["E4", "G4", "C5"]), ("D2", ["D4", "F#4", "A4"])],     # prático, ágil
    "ato":        [("F1", ["C4", "F4", "A4"]), ("D2", ["D4", "F4", "A4"]), ("Bb1", ["D4", "F4", "Bb4"]), ("C2", ["E4", "G4", "C5"])],     # reverente
    "absolvicao": [("A1", ["C4", "E4", "A4"]), ("F1", ["C4", "F4", "A4"]), ("C2", ["E4", "G4", "C5"]), ("G1", ["D4", "G4", "B4"])],       # caloroso, solene
}
DUR_ACORDE = 3.6  # segundos por acorde (alvo)
CRUZA = 1.6       # sobreposição entre acordes e entre cenas


def midi(nome: str) -> int:
    return 12 * (int(nome[-1]) + 1) + NOTAS[nome[:-1]]


def hz(n: int) -> float:
    return 440.0 * 2 ** ((n - 69) / 12)


def voz_tapete(f: float, d: float, fase: float, desafina: float) -> np.ndarray:
    """Tapete de cordas sintetizado: três osciladores dente de serra levemente desafinados, só harmônicos baixos."""
    t = np.arange(int(d * SR)) / SR
    x = np.zeros_like(t)
    for cents in (-desafina, 0.0, desafina):
        fd = f * 2 ** (cents / 1200)
        n_harm = max(1, int(1800 / fd))  # nada acima de ~1,8 kHz
        for k in range(1, min(n_harm, 12) + 1):
            x += np.sin(2 * np.pi * fd * k * t + fase * k) / k ** 1.25
    return x / 3


def envelope(n: int, ataque: float, soltura: float) -> np.ndarray:
    t = np.arange(n) / SR
    d = n / SR
    sobe = np.clip(t / ataque, 0, 1)
    desce = np.clip((d - t) / soltura, 0, 1)
    return (np.sin(sobe * np.pi / 2) ** 2) * (np.sin(desce * np.pi / 2) ** 2)


def main():
    codigo = sys.argv[1] if len(sys.argv) > 1 else "ep01"
    linha = json.loads((RAIZ / "out" / f"{codigo}-linha-do-tempo.json").read_text(encoding="utf-8"))
    fps = linha["fps"]
    n_total = int(linha["duracao"] / fps * SR) + SR
    saida = np.zeros((2, n_total))
    rng = np.random.default_rng(2611)

    for cena in linha["cenas"]:
        ini = cena["inicio"] / fps - (CRUZA / 2 if cena["inicio"] > 0 else 0)
        fim = cena["fim"] / fps + CRUZA / 2
        acordes = CLIMA.get(cena["id"], CLIMA["regra"])
        n_ac = max(1, round((fim - ini) / DUR_ACORDE))
        passo = (fim - ini) / n_ac
        for k in range(n_ac):
            baixo, notas = acordes[k % len(acordes)]
            a = ini + k * passo
            d = passo + CRUZA
            i0 = max(0, int(a * SR))
            n = int(d * SR)
            env = envelope(n, ataque=1.1, soltura=1.4)
            for canal in (0, 1):
                camada = np.zeros(n)
                for nota in notas:
                    camada += voz_tapete(hz(midi(nota)), d, rng.uniform(0, 2 * np.pi), 7 + 3 * canal)
                camada /= max(1, len(notas))
                # baixo: senoide suave uma oitava acima do nome (o "1" é grave demais para celular)
                fb = hz(midi(baixo) + 12)
                tb = np.arange(n) / SR
                camada += 0.35 * np.sin(2 * np.pi * fb * tb) + 0.08 * np.sin(2 * np.pi * 2 * fb * tb)
                # respiração lenta do tapete
                camada *= 1 + 0.08 * np.sin(2 * np.pi * 0.11 * tb + canal * 1.7)
                fim_i = min(n_total, i0 + n)
                saida[canal, i0:fim_i] += (camada * env)[: fim_i - i0]

    # cortes de segurança: nada de subgrave nem de brilho
    sos_pa = butter(2, 70, "highpass", fs=SR, output="sos")
    sos_pb = butter(4, 2000, "lowpass", fs=SR, output="sos")
    saida = sosfilt(sos_pb, sosfilt(sos_pa, saida, axis=1), axis=1)
    saida = saida[:, : int(linha["duracao"] / fps * SR)]
    saida *= 0.5 / (np.max(np.abs(saida)) + 1e-9)
    destino = RAIZ / "assets" / (linha.get("trilha") or "audio/fundo.wav")
    destino.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(destino, SR, saida.T.astype(np.float32))
    print(f"{destino.relative_to(RAIZ)}: {saida.shape[1] / SR:.2f} s, {len(linha['cenas'])} blocos")


if __name__ == "__main__":
    main()
