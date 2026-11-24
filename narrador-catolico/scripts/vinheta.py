#!/usr/bin/env python3
"""Vinheta de fecho da série (composição original), sintetizada do zero.

Uso: python3 -I scripts/vinheta.py

Gera em assets/sfx/:
  vinheta-final.wav           instrumental (versão C: a frase entra escrita na tela)
  vinheta-final-cantada.wav   instrumental + coro "Everybody loves Mass" (versão A, coro sintético = guia)
  vinheta-coro-guia.wav       só o coro, para quem for gravar as vozes de verdade
e atualiza src/sfx-disponiveis.json (lista usada pela prévia do Remotion).

Música: B♭ maior, 140 bpm, um compasso de 4/4 e o acorde final no 1 do compasso seguinte.
Baixo caminhando (B♭ D E♭ E F → B♭), estalos no 2 e no 4, chimbal, virada de caixa,
dois golpes de metais (F9, F13) e acorde final B♭6/9 com prato. Coro em três vozes.
"""
import json
import pathlib
import subprocess
import tempfile

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SFX = RAIZ / "assets" / "sfx"
SR = 48000
BPM = 140
B = 60 / BPM  # tempo (semínima)
E = B / 2  # colcheia
GOLPE = 4 * B  # acorde final: 1,714 s
TOTAL = GOLPE + 1.95
RNG = np.random.default_rng(1129)


def hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def vazio() -> np.ndarray:
    return np.zeros((2, int(TOTAL * SR) + SR // 2))


def por(bus: np.ndarray, sinal: np.ndarray, t0: float, ganho: float = 1.0, pan: float = 0.0):
    """Coloca um sinal mono no barramento estéreo em t0 (s), com pan -1..1 (lei de potência constante)."""
    i = int(round(t0 * SR))
    n = min(len(sinal), bus.shape[1] - i)
    if n <= 0:
        return
    a = (pan + 1) * np.pi / 4
    bus[0, i : i + n] += sinal[:n] * ganho * np.cos(a)
    bus[1, i : i + n] += sinal[:n] * ganho * np.sin(a)


def filtro(x, tipo, f, ordem=2):
    sos = butter(ordem, f, btype=tipo, fs=SR, output="sos")
    return sosfilt(sos, x)


# ---------- instrumentos ----------

def metal(nota: float, dur: float, solta: float = 0.08, brilho: float = 3200, vib: bool = False) -> np.ndarray:
    """Naipe de metais: soma aditiva de harmônicos com filtro que abre no ataque ("blat")."""
    f0 = hz(nota)
    n = int((dur + solta) * SR)
    t = np.arange(n) / SR
    v = 1.0
    if vib:
        v = 1 + 0.0055 * np.sin(2 * np.pi * 5.6 * t) * np.clip((t - 0.3) / 0.35, 0, 1)
    fase = 2 * np.pi * np.cumsum(f0 * v) / SR
    corte = 380 + (brilho - 380) * (1 - np.exp(-t / 0.022)) * (0.72 + 0.28 * np.exp(-t / 0.22))
    sinal = np.zeros(n)
    k = 1
    while k * f0 < 13000:
        peso = 1 / (1 + (k * f0 / corte) ** 3)
        sinal += np.sin(k * fase + 0.3 * k) * peso / k
        k += 1
    env = np.minimum(1, t / 0.014) * (0.78 + 0.22 * np.exp(-t / 0.07))
    env *= np.clip((dur + solta - t) / solta, 0, 1)
    sopro = filtro(RNG.standard_normal(n), "bandpass", [1200, 5000]) * 0.03 * np.exp(-t / 0.05)
    return (sinal * 0.32 + sopro) * env


def naipe(notas, t0, dur, bus, ganho=1.0, solta=0.08, vib=False, brilho=3200):
    for j, nt in enumerate(notas):
        pan = -0.5 + j / max(1, len(notas) - 1)
        for desafina, atraso in ((0.0, 0.0), (0.07, 0.006)):  # dois músicos por nota
            por(bus, metal(nt + desafina, dur, solta, brilho, vib), t0 + atraso, ganho * 0.55, pan * 0.7)


def contrabaixo(nota: float, dur: float) -> np.ndarray:
    f0 = hz(nota)
    n = int((dur + 0.12) * SR)
    t = np.arange(n) / SR
    amps = [1.0, 0.55, 0.32, 0.18, 0.1, 0.06]
    s = sum(a * np.sin(2 * np.pi * f0 * (k + 1) * t) * np.exp(-t * (2.2 + k * 2.4)) for k, a in enumerate(amps))
    batida = filtro(RNG.standard_normal(n), "lowpass", 900) * np.exp(-t / 0.012) * 0.5
    env = np.minimum(1, t / 0.004) * np.clip((dur + 0.12 - t) / 0.12, 0, 1)
    return (s + batida) * env * 0.5


def estalo() -> np.ndarray:
    n = int(0.15 * SR)
    t = np.arange(n) / SR
    corpo = filtro(RNG.standard_normal(n), "bandpass", [1400, 4200], 2) * np.exp(-t / 0.011)
    clique = filtro(RNG.standard_normal(n), "highpass", 5000) * np.exp(-t / 0.002)
    return corpo * 0.9 + clique * 0.4


def chimbal(aberto=False) -> np.ndarray:
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    return filtro(RNG.standard_normal(n), "highpass", 7000, 4) * np.exp(-t / (0.09 if aberto else 0.022)) * 0.5


def caixa(forca: float) -> np.ndarray:
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    esteira = filtro(RNG.standard_normal(n), "bandpass", [1200, 7000]) * np.exp(-t / 0.07)
    pele = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.045)
    return (esteira * 0.8 + pele * 0.6) * forca


def bumbo() -> np.ndarray:
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    f = 45 + 75 * np.exp(-t / 0.035)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.28) * 1.1


def prato() -> np.ndarray:
    n = int(2.4 * SR)
    t = np.arange(n) / SR
    ruido = filtro(RNG.standard_normal(n), "highpass", 4500, 2)
    metalico = sum(np.sign(np.sin(2 * np.pi * f * t + RNG.uniform(0, 6))) for f in (409.0, 563.0, 731.0, 922.0, 1187.0, 1553.0))
    metalico = filtro(metalico, "highpass", 3000, 2) * 0.08
    return (ruido * 0.55 + metalico) * np.exp(-t / 0.85) * np.minimum(1, t / 0.003)


def reverb(bus: np.ndarray, tempo: float = 1.1, mistura: float = 0.2) -> np.ndarray:
    n = int(tempo * 1.2 * SR)
    t = np.arange(n) / SR
    saida = np.empty_like(bus)
    for c in range(2):
        ir = RNG.standard_normal(n) * np.exp(-6.9 * t / tempo)
        ir[: int(0.018 * SR)] = 0
        ir = filtro(ir, "highpass", 250)
        ir /= np.sqrt(np.sum(ir**2))
        molhado = fftconvolve(bus[c], ir)[: bus.shape[1]]
        saida[c] = bus[c] + molhado * mistura
    return saida


# ---------- arranjo ----------

def instrumental() -> np.ndarray:
    bus = vazio()
    # baixo caminhando: B♭ D E♭ E F → B♭ (aproximação cromática para o acorde final)
    for nt, t0, d in ((34, 0, B * 0.9), (38, B, B * 0.9), (39, 2 * B, E * 0.9), (40, 2 * B + E, E * 0.9), (41, 3 * B, B * 0.9), (34, GOLPE, 1.5)):
        por(bus, contrabaixo(nt, d), t0, 1.0, 0.0)
    for t0 in (B, 3 * B):
        por(bus, estalo(), t0, 0.55, 0.35)
    for i in range(6):
        por(bus, chimbal(aberto=(i % 2 == 1)), i * E, 0.22 if i % 2 else 0.14, -0.45)
    for i, forca in enumerate((0.45, 0.55, 0.7, 0.9)):  # virada em semicolcheias no 4
        por(bus, caixa(forca), 3 * B + i * E / 2, 0.55, 0.1)
    # golpes de metais (F9 e F13, sem a fundamental) e acorde final B♭6/9
    naipe([57, 63, 67, 72], 2 * B + E, 0.12, bus, 0.9, 0.06)
    naipe([57, 63, 67, 74], 3 * B, 0.12, bus, 0.9, 0.06)
    naipe([58, 62, 67, 72, 77], GOLPE, 1.2, bus, 1.0, 0.55, vib=True, brilho=3600)
    por(bus, bumbo(), GOLPE, 0.9, 0.0)
    por(bus, prato(), GOLPE, 0.38, 0.25)
    return reverb(bus, 1.1, 0.18)


# coro: (sílaba, fonemas MBROLA br3 com durações em ms) e notas das três vozes
SILABAS = [
    ("Ev", [("ee", 100), ("v", 64)]),
    ("ry", [("r", 50), ("i", 150), ("b", 64)]),
    ("bo", [("oo", 150), ("j", 65)]),
    ("dy", [("i", 150), ("l", 64)]),
    ("loves", [("a", 110), ("v", 35), ("i", 10), ("z", 25), ("m", 34)]),
    ("MASS", [("ee", 950), ("s2", 120)]),
]
# vogal de cada sílaba começa exatamente no tempo: colcheias a partir do "2 e"
INICIOS = [B + E, 2 * B, 2 * B + E, 3 * B, 3 * B + E, GOLPE]
VOZES = {
    "melodia": [53, 55, 58, 55, 60, 62],  # F3 G3 B♭3 G3 C4 D4
    "terca": [50, 51, 55, 51, 57, 58],  # D3 E♭3 G3 E♭3 A3 B♭3
    "sexta": [46, 48, 50, 48, 53, 53],  # B♭2 C3 D3 C3 F3 F3
}


def pho_da_voz(notas) -> str:
    """Partitura em formato .pho do MBROLA: cada fonema com duração e pontos de altura (Hz)."""
    linhas = []
    # silêncio até a primeira vogal (a primeira sílaba começa na vogal)
    linhas.append(f"_ {int(INICIOS[0] * 1000)}")
    for (silaba, fonemas), nota in zip(SILABAS, notas):
        f = hz(nota)
        for ph, dur in fonemas:
            if ph == "ee" and silaba == "MASS":
                pontos = []
                for k in range(0, 101, 4):
                    tt = dur * k / 100 / 1000
                    vib = 1 + 0.012 * np.sin(2 * np.pi * 5.4 * tt) * min(1, max(0, (tt - 0.25) / 0.3))
                    pontos.append(f"{k} {f * vib:.1f}")
                linhas.append(f"{ph} {dur} " + " ".join(pontos))
            else:
                linhas.append(f"{ph} {dur} 0 {f:.1f} 100 {f:.1f}")
    linhas.append("_ 300")
    return "\n".join(linhas) + "\n"


def coro() -> np.ndarray:
    bus = vazio()
    ganhos = {"melodia": 1.0, "terca": 0.72, "sexta": 0.62}
    pans = {"melodia": 0.0, "terca": -0.35, "sexta": 0.35}
    with tempfile.TemporaryDirectory() as tmp:
        for nome, notas in VOZES.items():
            pho = pathlib.Path(tmp) / f"{nome}.pho"
            wav = pathlib.Path(tmp) / f"{nome}.wav"
            pho.write_text(pho_da_voz(notas))
            subprocess.run(["mbrola", "-e", "/usr/share/mbrola/br3/br3", str(pho), str(wav)], check=True, capture_output=True)
            taxa, dados = wavfile.read(wav)
            x = dados.astype(np.float64) / 32768
            x = resample_poly(x, SR, taxa)
            x = filtro(x, "highpass", 110)
            # cada voz dobrada (dois cantores), com atraso e pan opostos
            por(bus, x, 0.0, ganhos[nome], pans[nome])
            por(bus, x, 0.014, ganhos[nome] * 0.55, -pans[nome] - 0.2)
    return reverb(bus, 1.3, 0.3)


def gravar(caminho: pathlib.Path, x: np.ndarray, pico_db: float = -1.5):
    x = np.tanh(x * 1.1) / np.tanh(1.1)
    x *= 10 ** (pico_db / 20) / np.max(np.abs(x))
    fim = int((TOTAL + 0.3) * SR)
    x = x[:, :fim]
    fade = int(0.25 * SR)
    x[:, -fade:] *= np.linspace(1, 0, fade)
    wavfile.write(caminho, SR, (x.T * 32767).astype(np.int16))
    print(f"  {caminho.relative_to(RAIZ)}  {x.shape[1] / SR:.2f} s")


def main():
    SFX.mkdir(parents=True, exist_ok=True)
    inst = instrumental()
    voz = coro()
    gravar(SFX / "vinheta-final.wav", inst)
    gravar(SFX / "vinheta-final-cantada.wav", inst * 0.8 + voz * 1.35)
    gravar(SFX / "vinheta-coro-guia.wav", voz, -3)
    disponiveis = sorted(p.stem for p in SFX.glob("*.wav"))
    (RAIZ / "src" / "sfx-disponiveis.json").write_text(json.dumps(disponiveis, ensure_ascii=False, indent=1) + "\n")
    print(f"  golpe final em {GOLPE:.3f} s ({round(GOLPE * 30)} quadros)")


if __name__ == "__main__":
    main()
