#!/usr/bin/env python3
"""Sonoplastia da série: os 24 efeitos da seção 7, todos sintetizados aqui (originais, sem licença de terceiros).

Uso: python3 -I scripts/sfx.py            (gera todos)
     python3 -I scripts/sfx.py sino ting  (gera só os pedidos)

Vozes (claque, bocejo, coro, torcida, cochichos) usam MBROLA br1, br3 e br4.
Saída: assets/sfx/<nome>.wav (48 kHz, estéreo, pico em -3 dBFS) e src/sfx-disponiveis.json.
"""
import importlib.util
import json
import pathlib
import subprocess
import sys
import tempfile

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt, stft, istft

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SFX = RAIZ / "assets" / "sfx"
SR = 48000
RNG = np.random.default_rng(2611)

_v = importlib.util.spec_from_file_location("vinheta", RAIZ / "scripts" / "vinheta.py")
V = importlib.util.module_from_spec(_v)
_v.loader.exec_module(V)


# ---------- utilitários ----------

def t_(dur):
    return np.arange(int(dur * SR)) / SR


def ruido(dur):
    return RNG.standard_normal(int(dur * SR))


def filtro(x, tipo, f, ordem=2):
    return sosfilt(butter(ordem, f, btype=tipo, fs=SR, output="sos"), x)


def varredura(x, f_ini, f_fim, largura=0.6, passos=64):
    """Passa-faixa com centro variando no tempo (em blocos), para whooshes."""
    n = len(x)
    y = np.zeros(n)
    bloco = n // passos + 1
    for k in range(passos):
        a, b = k * bloco, min(n, (k + 1) * bloco + 256)
        fc = f_ini * (f_fim / f_ini) ** (k / (passos - 1))
        lo, hi = fc * (1 - largura / 2), min(fc * (1 + largura / 2), SR / 2 - 100)
        seg = filtro(x[max(0, a - 256) : b], "bandpass", [lo, hi])
        ini = a - max(0, a - 256)
        jan = np.ones(b - a)
        y[a:b] += seg[ini : ini + (b - a)] * jan[: len(seg[ini : ini + (b - a)])]
    return y


def estereo(x, pan=0.0):
    a = (pan + 1) * np.pi / 4
    return np.vstack([x * np.cos(a), x * np.sin(a)])


def somar(base, x, t0=0.0, ganho=1.0, pan=0.0):
    if x.ndim == 1:
        x = estereo(x, pan)
    i = int(t0 * SR)
    n = min(x.shape[1], base.shape[1] - i)
    if n > 0:
        base[:, i : i + n] += x[:, :n] * ganho
    return base


def sala(x, tempo=0.6, mistura=0.2):
    if x.ndim == 1:
        x = estereo(x)
    n = int(tempo * 1.3 * SR)
    t = np.arange(n) / SR
    out = np.empty((2, x.shape[1] + n))
    for c in range(2):
        ir = RNG.standard_normal(n) * np.exp(-6.9 * t / tempo)
        ir[: int(0.012 * SR)] = 0
        ir = filtro(ir, "highpass", 200)
        ir /= np.sqrt(np.sum(ir**2))
        seco = np.concatenate([x[c], np.zeros(n)])
        molhado = fftconvolve(x[c], ir)[: len(seco)]
        seco[: len(molhado)] += molhado * mistura
        out[c] = seco
    return out


def envelope(n, ataque=0.005, queda=None, sustain=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(ataque, 1e-4))
    if queda:
        e *= np.exp(-t / queda)
    return e


def mbrola(voz, linhas):
    """linhas: lista de (fonema, ms, [(pos%, Hz), ...]). Devolve áudio a 48 kHz."""
    with tempfile.TemporaryDirectory() as tmp:
        pho = pathlib.Path(tmp) / "a.pho"
        wav = pathlib.Path(tmp) / "a.wav"
        txt = []
        for ph, ms, pts in linhas:
            txt.append(f"{ph} {int(ms)} " + " ".join(f"{p} {f:.1f}" for p, f in pts))
        pho.write_text("\n".join(txt) + "\n")
        subprocess.run(["mbrola", "-e", f"/usr/share/mbrola/{voz}/{voz}", str(pho), str(wav)], check=True, capture_output=True)
        taxa, d = wavfile.read(wav)
    x = d.astype(np.float64) / 32768
    return resample_poly(x, SR, taxa)


# ---------- efeitos ----------

def record_scratch():
    # "disco" de origem: acorde e bateria, lido com velocidade variando (vai e volta) e agulha arrastando
    fonte_dur = 3.0
    t = t_(fonte_dur)
    fonte = sum(np.sign(np.sin(2 * np.pi * V.hz(n) * t)) * 0.2 for n in (58, 62, 65, 70))
    fonte += filtro(ruido(fonte_dur), "bandpass", [200, 3000]) * (np.sin(2 * np.pi * 2.3 * t) > 0.6) * 0.6
    fonte = filtro(fonte, "lowpass", 3500)
    dur = 0.55
    tt = t_(dur)
    taxa = np.interp(tt, [0, 0.05, 0.12, 0.2, 0.28, 0.36, 0.44, 0.55], [1.0, -2.6, -2.2, 2.8, 1.5, -1.8, -0.4, 0.0])
    pos = 1.4 * SR + np.cumsum(taxa)
    x = np.interp(pos, np.arange(len(fonte)), fonte)
    x = filtro(x, "bandpass", [300, 4000]) * 1.6
    chiado = filtro(ruido(dur), "highpass", 3000) * 0.12 * (np.abs(taxa) / 3)
    estalos = np.zeros(len(tt))
    for i in RNG.integers(0, len(tt), 12):
        estalos[i] = RNG.uniform(0.3, 0.8)
    return sala(x + chiado + estalos, 0.3, 0.08)


def risada(voz, f0, n_silabas, vogal="a", vel=1.0):
    linhas = [("_", 20, [])]
    f = f0
    for k in range(n_silabas):
        rr = RNG.uniform(45, 70) / vel
        a = RNG.uniform(85, 130) / vel
        linhas.append(("rr", rr, [(0, f * 0.95), (100, f)]))
        linhas.append((vogal, a, [(0, f * 1.04), (60, f), (100, f * 0.92)]))
        f *= RNG.uniform(0.93, 0.99)
    linhas.append(("_", 60, []))
    return mbrola(voz, linhas)


def palmas(dur, densidade=180):
    x = np.zeros(int(dur * SR) + SR // 10)
    for _ in range(int(dur * densidade)):
        i = int(RNG.uniform(0, dur) * SR)
        n = int(0.03 * SR)
        c = filtro(RNG.standard_normal(n), "bandpass", [RNG.uniform(700, 1200), RNG.uniform(2500, 4500)]) * np.exp(-np.arange(n) / (0.006 * SR))
        x[i : i + n] += c * RNG.uniform(0.3, 1.0)
    return x


def claque(dur, pessoas, com_palmas):
    base = np.zeros((2, int((dur + 0.8) * SR)))
    vozes = [("br3", 120, 210), ("br1", 110, 190), ("br4", 210, 360)]
    for _ in range(pessoas):
        voz, lo, hi = vozes[RNG.integers(0, 3)]
        x = risada(voz, RNG.uniform(lo, hi), int(RNG.integers(3, 7)), "a" if RNG.random() < 0.7 else "e", RNG.uniform(0.85, 1.25))
        x = x * np.exp(-np.arange(len(x)) / (SR * RNG.uniform(0.6, 1.4)))
        somar(base, x, RNG.uniform(0, dur * 0.35), RNG.uniform(0.35, 1.0), RNG.uniform(-0.8, 0.8))
    if com_palmas:
        p = palmas(dur * 0.9) * np.minimum(1, t_(dur * 0.9 + 0.1) / 0.25)[: len(palmas(dur * 0.9))] if False else palmas(dur * 0.9)
        p *= np.exp(-np.arange(len(p)) / (SR * dur * 0.7))
        somar(base, estereo(p, -0.2) * 0.25 + estereo(np.roll(p, 2000), 0.3) * 0.25, 0.15)
    base = sala(base, 0.9, 0.35)
    fim = int(dur * SR)
    base = base[:, : fim + int(0.4 * SR)]
    base[:, fim:] *= np.linspace(1, 0, base.shape[1] - fim)
    return base


def swish_cabide():
    x = varredura(ruido(0.22), 900, 4500, 0.7, 24) * np.sin(np.pi * np.linspace(0, 1, int(0.22 * SR))) ** 2
    t = t_(0.2)
    tink = np.sin(2 * np.pi * 2900 * t) * np.exp(-t / 0.05) * 0.15
    y = np.zeros(int(0.3 * SR))
    y[: len(x)] += x
    y[int(0.04 * SR) : int(0.04 * SR) + len(tink)] += tink
    return estereo(y, 0.2)


def bocejo():
    inspira = filtro(ruido(0.45), "bandpass", [400, 2500]) * np.linspace(0, 1, int(0.45 * SR)) ** 2 * 0.05
    voz = mbrola("br3", [("_", 30, []), ("a", 760, [(0, 150), (25, 215), (55, 190), (100, 118)]), ("o", 420, [(0, 118), (100, 92)]), ("_", 40, [])])
    sopro = filtro(ruido(len(voz) / SR), "bandpass", [500, 3000]) * 0.04
    voz = voz + sopro[: len(voz)] * np.hanning(len(voz))
    x = np.concatenate([inspira, voz])
    return sala(x, 0.4, 0.15)


def thud_livro():
    t = t_(0.7)
    f = 48 + 70 * np.exp(-t / 0.03)
    grave = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18)
    tapa = filtro(ruido(0.7), "lowpass", 1800) * np.exp(-t / 0.025) * 0.8
    poeira = filtro(ruido(0.7), "bandpass", [2000, 6000]) * np.exp(-t / 0.15) * 0.06
    return sala(grave * 1.2 + tapa + poeira, 0.5, 0.18)


def pagina():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    am = 0.6 + 0.4 * np.abs(filtro(RNG.standard_normal(n), "lowpass", 45))
    env = np.sin(np.pi * np.clip(t / 0.42, 0, 1)) ** 1.5
    x = filtro(ruido(0.5), "bandpass", [1200, 9000]) * am * env * 0.6
    flap = filtro(ruido(0.5), "lowpass", 600) * np.exp(-np.maximum(0, t - 0.36) / 0.02) * (t > 0.36) * 0.5
    return estereo(x + flap, -0.1)


def plim():
    t = t_(1.0)
    f = 1760 * (1 + 0.01 * np.exp(-t / 0.01))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.35)
    x += 0.5 * np.sin(2 * np.pi * 2637 * t) * np.exp(-t / 0.25)
    x += 0.25 * np.sin(2 * np.pi * 4858 * t) * np.exp(-t / 0.08)
    return sala(x * np.minimum(1, t / 0.002), 0.5, 0.2)


def blip():
    def um(f0, f1, d):
        t = t_(d)
        f = f0 * (f1 / f0) ** (t / d)
        fase = 2 * np.pi * np.cumsum(f) / SR
        return (np.sin(fase) + 0.25 * np.sign(np.sin(fase))) * np.exp(-t / (d * 0.7)) * np.minimum(1, t / 0.003)

    y = np.zeros(int(0.45 * SR))
    a = um(500, 1400, 0.11)
    b = um(800, 2000, 0.13)
    y[: len(a)] += a
    y[int(0.13 * SR) : int(0.13 * SR) + len(b)] += b
    return estereo(y * 0.6)


def flip_calendario():
    y = np.zeros(int(0.9 * SR))
    for k in range(14):
        n = int(0.03 * SR)
        f = filtro(RNG.standard_normal(n), "bandpass", [1500, 8000]) * np.hanning(n) * RNG.uniform(0.5, 1)
        i = int((k * 0.045 + RNG.uniform(0, 0.008)) * SR)
        y[i : i + n] += f
    return estereo(y, 0.15)


def fanfarra_desafinada():
    base = np.zeros((2, int(2.4 * SR)))
    notas = [(67, 0.0, 0.16), (67, 0.2, 0.16), (72, 0.4, 0.16), (76, 0.62, 1.1)]
    for nota, t0, d in notas:
        for desaf, pan, g in ((0.0, -0.4, 1.0), (-0.55, 0.1, 0.9), (0.32, 0.45, 0.8)):  # um trompete bem fora
            x = V.metal(nota + desaf, d, 0.12, 2800, vib=d > 0.5)
            if d > 0.5:  # nota final cai e vacila
                k = np.arange(len(x)) / SR
                x = x * (1 - 0.25 * (k > 0.7))
            somar(base, x, t0 + RNG.uniform(0, 0.02), g * 0.6, pan)
    tuba = V.metal(43, 0.5, 0.15, 900)
    somar(base, tuba, 0.62, 0.8, 0)
    return sala(base, 0.7, 0.15)


def fosforo():
    d = 0.9
    t = t_(d)
    risco = filtro(ruido(d), "bandpass", [2000, 9000]) * (t < 0.12) * (0.5 + 0.5 * RNG.random(len(t)))
    chama = filtro(ruido(d), "lowpass", 900) * np.exp(-np.maximum(0, t - 0.12) / 0.25) * (t > 0.1) * np.minimum(1, np.maximum(0, t - 0.1) / 0.05) * 0.9
    estalos = np.zeros(len(t))
    for i in RNG.integers(int(0.12 * SR), len(t), 20):
        estalos[i : i + 40] += RNG.uniform(0.1, 0.4) * np.hanning(40)
    return estereo(risco * 0.7 + chama + estalos)


def torcida_corneta():
    d = 1.65
    base = np.zeros((2, int(d * SR)))
    for _ in range(22):
        voz, lo, hi = [("br3", 140, 260), ("br1", 130, 240), ("br4", 230, 420)][RNG.integers(0, 3)]
        f = RNG.uniform(lo, hi)
        vog = ["e", "o", "a", "u"][RNG.integers(0, 4)]
        x = mbrola(voz, [("_", 10, []), (vog, RNG.uniform(700, 1400), [(0, f * 0.9), (20, f * 1.15), (70, f * 1.1), (100, f * 0.85)]), ("_", 20, [])])
        somar(base, x, RNG.uniform(0, 0.35), RNG.uniform(0.25, 0.7), RNG.uniform(-0.9, 0.9))
    multidao = filtro(ruido(d), "bandpass", [300, 2500]) * (0.6 + 0.4 * np.abs(filtro(ruido(d), "lowpass", 4))) * 0.08
    somar(base, estereo(multidao), 0)
    t = t_(1.2)
    f = 233 * (1 + 0.012 * np.sin(2 * np.pi * 5 * t))
    fase = 2 * np.pi * np.cumsum(f) / SR
    corneta = sum(np.sin(k * fase) / k for k in range(1, 30)) * np.minimum(1, t / 0.03) * 0.25
    corneta = filtro(corneta, "bandpass", [200, 4000])
    somar(base, corneta, 0.25, 0.7, 0.3)
    base = sala(base, 1.0, 0.3)[:, : int(d * SR)]
    base[:, -int(0.04 * SR) :] *= np.linspace(1, 0, int(0.04 * SR))  # cortada pelo sino
    return base


def sino():
    d = 4.0
    t = t_(d)
    f = 196.0
    parciais = [(0.5, 0.5, 3.8), (1.0, 0.8, 3.0), (1.19, 0.55, 2.4), (1.5, 0.3, 1.8), (2.0, 0.6, 1.4), (2.51, 0.25, 0.9), (3.0, 0.2, 0.7), (4.07, 0.12, 0.4)]
    x = np.zeros(len(t))
    for r, a, dec in parciais:
        for bat in (-0.25, 0.25):
            x += a * np.sin(2 * np.pi * (f * r + bat) * t + RNG.uniform(0, 6)) * np.exp(-t / dec) * 0.5
    golpe = filtro(ruido(d), "bandpass", [800, 5000]) * np.exp(-t / 0.008) * 0.6
    return sala((x + golpe) * np.minimum(1, t / 0.002), 1.8, 0.3)


def loading():
    y = np.zeros(int(1.2 * SR))
    for k, nota in enumerate((72, 76, 79, 84)):
        t = t_(0.12)
        b = np.sin(2 * np.pi * V.hz(nota) * t) * np.exp(-t / 0.04) * np.minimum(1, t / 0.002)
        i = int(k * 0.11 * SR)
        y[i : i + len(b)] += b * 0.7
    t = t_(0.45)
    f = 330 * (0.5 ** (t / 0.45))
    trava = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-t / 0.2) * 0.25
    trava = filtro(trava, "lowpass", 2500)
    i = int(0.6 * SR)
    y[i : i + len(trava)] += trava
    return estereo(y)


def coro():
    d = 2.2
    base = np.zeros((2, int(d * SR)))
    # acorde de Si♭ maior: vozes graves (br1, br3) e agudas (br4)
    for voz, notas in (("br3", [46, 53, 58]), ("br1", [50, 58]), ("br4", [65, 70, 74])):
        for nota in notas:
            for rep in range(2):
                f = V.hz(nota) * (1 + RNG.uniform(-0.004, 0.004))
                pts = []
                for k in range(0, 101, 5):
                    tt = 1.9 * k / 100
                    pts.append((k, f * (1 + 0.01 * np.sin(2 * np.pi * 5.2 * tt + rep) * min(1, tt / 0.4))))
                x = mbrola(voz, [("_", 20, []), ("a", 1900, pts), ("_", 60, [])])
                x *= np.minimum(1, np.arange(len(x)) / (0.18 * SR))
                somar(base, x, rep * 0.012, 0.35, RNG.uniform(-0.7, 0.7))
    base = sala(base, 2.5, 0.5)
    fim = int(2.0 * SR)
    base = base[:, : int(2.6 * SR)]
    base[:, fim:] *= np.linspace(1, 0, base.shape[1] - fim)
    return base


def fm_sino(nota, dur, indice=3.0, razao=3.5):
    t = t_(dur)
    f = V.hz(nota)
    mod = np.sin(2 * np.pi * f * razao * t) * indice * np.exp(-t / 0.25)
    return np.sin(2 * np.pi * f * t + mod) * np.exp(-t / (dur * 0.5)) * np.minimum(1, t / 0.002)


def jingle_retro():
    """Jingle de comercial dos anos 90 (melodia original): sino FM, baixo sintético e bateria eletrônica."""
    bpm = 116
    b = 60 / bpm
    # termina no sino: a última nota (com o "ting") é o joia do Padre; a bateria para ali, sem cauda de sinos
    d = 5.5 * b + 1.9
    base = np.zeros((2, int(d * SR)))
    melodia = [(72, 0, 0.5), (76, 0.5, 0.5), (79, 1, 0.5), (81, 1.5, 0.5), (79, 2, 1), (76, 3, 0.5), (77, 3.5, 0.5), (79, 4, 0.5), (84, 4.5, 0.5), (83, 5, 0.5), (84, 5.5, 2.5)]
    for nota, ini, dur in melodia:
        somar(base, fm_sino(nota, dur * b + 0.3), ini * b, 0.45, 0.15)
        somar(base, fm_sino(nota - 12, dur * b + 0.3, 1.5, 1.0), ini * b, 0.2, -0.15)
    for k, nota in enumerate([48, 48, 53, 53, 55, 55]):
        t = t_(b * 0.9)
        f = V.hz(nota)
        s = filtro(np.sign(np.sin(2 * np.pi * f * t)) * np.exp(-t / 0.3), "lowpass", 900) * 0.35
        somar(base, s, k * b, 1.0, 0)
    for k in range(6):
        if k % 2 == 0:
            somar(base, V.bumbo() * 0.5, k * b, 1.0, 0)
        else:
            somar(base, V.caixa(0.7), k * b, 0.6, 0.1)
        somar(base, V.chimbal(), k * b + b / 2, 0.25, -0.3)
    somar(base, ting(), 5.5 * b, 0.5, 0)
    return sala(base, 0.8, 0.2)


def alarme_industrial():
    """Alarme de evacuação de fábrica: dois "uóóóm" de sirene subindo, timbre metálico, eco de galpão."""
    base = np.zeros((2, int(1.6 * SR)))
    for k in range(2):
        dur = 0.62
        t = t_(dur)
        f = 470 * (1150 / 470) ** np.minimum(1, t / 0.5)
        fase = 2 * np.pi * np.cumsum(f) / SR
        x = np.tanh(2.2 * (0.6 * np.sign(np.sin(fase)) + 0.3 * np.sin(2 * fase) + 0.2 * np.sin(3 * fase)))
        x = filtro(filtro(x, "lowpass", 3200), "highpass", 250)
        env = np.minimum(1, t / 0.02) * np.clip((dur - t) / 0.06, 0, 1)
        somar(base, x * env * 0.6, 0.03 + k * 0.68, 1.0, 0)
    return sala(base, 1.4, 0.35)


def ting():
    t = t_(1.0)
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / dec) for f, a, dec in ((2637, 0.6, 0.45), (3520, 0.4, 0.35), (5274, 0.25, 0.2), (7040, 0.12, 0.1)))
    brilho = varredura(ruido(0.4), 3000, 9000, 0.5, 16) * np.hanning(int(0.4 * SR)) * 0.15
    y = x * np.minimum(1, t / 0.002)
    y[: len(brilho)] += brilho
    return sala(y, 0.8, 0.25)


def chamas():
    d = 1.2
    t = t_(d)
    env = np.minimum(1, t / 0.35) * np.exp(-np.maximum(0, t - 0.5) / 0.35)
    sopro = varredura(ruido(d), 250, 2400, 1.0, 32) * env
    ronco = filtro(ruido(d), "lowpass", 140) * env * 1.5
    estalos = np.zeros(len(t))
    for i in RNG.integers(0, len(t) - 60, 40):
        estalos[i : i + 60] += RNG.uniform(0.05, 0.3) * np.hanning(60)
    return sala(sopro * 0.8 + ronco + estalos, 0.6, 0.2)


def extintor():
    d = 0.75
    t = t_(d)
    valvula = filtro(ruido(d), "bandpass", [600, 2000]) * np.exp(-t / 0.01) * 0.6
    jato = filtro(ruido(d), "highpass", 1200) * (1 + 0.15 * np.sin(2 * np.pi * 13 * t)) * np.minimum(1, t / 0.008)
    jato *= t < 0.62  # interrompido seco
    return estereo(valvula + jato * 0.7, 0.3)


def cochicho(texto_fonemas, voz, f0):
    x = mbrola(voz, [("_", 20, [])] + [(ph, ms, [(0, f0), (100, f0 * 0.95)]) for ph, ms in texto_fonemas] + [("_", 40, [])])
    # sussurro: mantém o envelope espectral (formantes) e troca a fonte por ruído
    f, t, Z = stft(x, SR, nperseg=1024)
    mag = np.abs(Z)
    k = np.ones(9) / 9
    mag = np.apply_along_axis(lambda m: np.convolve(m, k, mode="same"), 0, mag)
    fase = np.exp(1j * RNG.uniform(0, 2 * np.pi, Z.shape))
    _, y = istft(mag * fase, SR, nperseg=1024)
    return filtro(y, "highpass", 900)


def cochichos():
    base = np.zeros((2, int(1.8 * SR)))
    perdeu = [("p", 60), ("e", 90), ("r", 50), ("d", 60), ("e", 90), ("w", 60), ("a", 70), ("p", 60), ("o", 90), ("s", 90), ("t", 50), ("a", 120)]
    mudou = [("m", 60), ("u", 90), ("d", 60), ("o", 90), ("w", 60), ("d", 50), ("i", 70), ("t", 60), ("i", 70), ("m", 70), ("i", 120)]
    somar(base, cochicho(perdeu, "br4", 230), 0.0, 1.0, -0.5)
    somar(base, cochicho(mudou, "br3", 140), 0.55, 1.0, 0.5)
    return sala(base, 0.4, 0.15)


def whoosh():
    d = 0.5
    x = varredura(ruido(d), 3500, 350, 0.8, 32) * np.sin(np.pi * np.linspace(0, 1, int(d * SR))) ** 1.5
    return estereo(x, -0.1)


def clack():
    t = t_(0.25)
    x = filtro(ruido(0.25), "highpass", 2000) * np.exp(-t / 0.003)
    x += (np.sin(2 * np.pi * 2800 * t) * 0.6 + np.sin(2 * np.pi * 4150 * t) * 0.35) * np.exp(-t / 0.035)
    x += np.sin(2 * np.pi * 310 * t) * np.exp(-t / 0.02) * 0.6
    return sala(x, 0.3, 0.1)


def cadeado_abre():
    """Cadeado abrindo: clique metálico duplo (a chave gira e a haste salta) com ressonância curta de latão."""
    base = np.zeros(int(0.5 * SR))
    for t0, g in ((0.0, 0.7), (0.07, 1.0)):
        t = t_(0.3)
        x = filtro(ruido(0.3), "bandpass", [2500, 9000]) * np.exp(-t / 0.004) * 0.8
        x += sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, a, d in ((1870, 0.5, 0.05), (3240, 0.35, 0.03), (5100, 0.2, 0.02)))
        i = int(t0 * SR)
        base[i : i + len(x)] += x * g
    t = t_(0.5)
    base += np.sin(2 * np.pi * 980 * t) * np.exp(-np.maximum(0, t - 0.07) / 0.12) * (t > 0.07) * 0.18
    return sala(base, 0.35, 0.12)


def cadeado_fecha():
    """Cadeado fechando com força: estalo seco e grave da haste batendo no corpo."""
    t = t_(0.45)
    x = filtro(ruido(0.45), "bandpass", [1500, 7000]) * np.exp(-t / 0.006) * 1.0
    x += np.sin(2 * np.pi * 220 * t) * np.exp(-t / 0.06) * 0.8
    x += sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, a, d in ((1450, 0.45, 0.07), (2610, 0.3, 0.05)))
    return sala(x, 0.4, 0.15)


def batida_hiphop():
    bpm = 92
    b = 60 / bpm
    d = 8 * b + 0.6
    base = np.zeros((2, int(d * SR)))
    for compasso in range(2):
        o = compasso * 4 * b
        for kk in (0, 1.75, 2.5):  # bumbo
            t = t_(0.5)
            f = 50 + 90 * np.exp(-t / 0.025)
            k = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22) + filtro(ruido(0.5), "highpass", 3000) * np.exp(-t / 0.002) * 0.3
            somar(base, k * 1.1, o + kk * b, 1.0, 0)
        for s in (1, 3):  # caixa com corpo
            somar(base, sala(V.caixa(1.0), 0.5, 0.25), o + s * b, 0.8, 0.05)
        for h in range(8):  # chimbal com balanço
            somar(base, V.chimbal(aberto=(h == 7)), o + h * b / 2 + (0.03 if h % 2 else 0), 0.3 if h % 2 else 0.45, -0.3)
        # baixo grave
        t = t_(b * 1.5)
        somar(base, np.sin(2 * np.pi * V.hz(33 if compasso == 0 else 31) * t) * np.exp(-t / 0.6) * 0.6, o, 1.0, 0)
    chiado = filtro(ruido(d), "bandpass", [2000, 8000]) * 0.015
    somar(base, estereo(chiado), 0)
    return base


def fanfarra():
    """Fanfarra afinada e festiva (arpejo de Dó maior, harmonizado), com rufo e prato no acorde final."""
    base = np.zeros((2, int(2.6 * SR)))
    frase = [((67, 64), 0.0, 0.14), ((67, 64), 0.17, 0.14), ((72, 67), 0.34, 0.14), ((76, 72), 0.52, 1.3)]
    for (alta, baixa), t0, d in frase:
        for nota, pan, g in ((alta, -0.25, 1.0), (baixa, 0.25, 0.8), (alta - 12, 0.0, 0.5)):
            somar(base, V.metal(nota, d, 0.12, 3400, vib=d > 0.5), t0, g * 0.55, pan)
    for k in range(8):  # rufo curto até o acorde
        somar(base, V.caixa(0.35 + k * 0.08), 0.34 + k * 0.022, 0.4, 0.1)
    somar(base, V.prato(), 0.52, 0.35, 0.2)
    somar(base, V.bumbo(), 0.52, 0.6, 0)
    return sala(base, 0.9, 0.18)


def confete():
    """Lança-confete: estouro seco e papel picado chovendo."""
    d = 1.2
    t = t_(d)
    estouro = filtro(ruido(d), "lowpass", 2500) * np.exp(-t / 0.012) * 1.2 + np.sin(2 * np.pi * 90 * t) * np.exp(-t / 0.05) * 0.6
    papel = filtro(ruido(d), "bandpass", [2500, 9000]) * (0.4 + 0.6 * np.abs(filtro(ruido(d), "lowpass", 30))) * np.exp(-np.maximum(0, t - 0.05) / 0.5) * (t > 0.04) * 0.25
    return sala(estouro + papel, 0.5, 0.15)


def aplausos():
    """Aplausos calorosos com alguns "uhu!" de alegria."""
    d = 2.4
    base = np.zeros((2, int((d + 0.6) * SR)))
    p = palmas(d, 260)
    env = np.minimum(1, np.arange(len(p)) / (0.12 * SR)) * np.exp(-np.maximum(0, np.arange(len(p)) / SR - 1.2) / 0.7)
    somar(base, estereo(p * env, -0.3) * 0.5 + estereo(np.roll(p, 1500) * env, 0.3) * 0.5, 0)
    for _ in range(5):
        voz, lo, hi = [("br3", 150, 220), ("br1", 140, 200), ("br4", 260, 380)][RNG.integers(0, 3)]
        f0 = RNG.uniform(lo, hi)
        x = mbrola(voz, [("_", 10, []), ("u", 120, [(0, f0), (100, f0 * 1.1)]), ("u", 260, [(0, f0 * 1.25), (60, f0 * 1.6), (100, f0 * 1.45)]), ("_", 30, [])])
        somar(base, x, RNG.uniform(0.05, 0.6), RNG.uniform(0.25, 0.45), RNG.uniform(-0.7, 0.7))
    return sala(base, 0.9, 0.3)



# ── ep. 3: porta, copo, sibilo, moeda de jogo, fita rebobinando
def porta_batendo():
    d = 1.2
    t = t_(d)
    baque = np.sin(2 * np.pi * 70 * t) * np.exp(-t / 0.09) + 0.6 * np.sin(2 * np.pi * 118 * t) * np.exp(-t / 0.06)
    estalo = filtro(ruido(d), "bandpass", [300, 2500]) * np.exp(-t / 0.025) * 0.9
    tremor = filtro(ruido(d), "bandpass", [1500, 6000]) * np.exp(-((t - 0.12) / 0.18) ** 2) * 0.12
    return sala((baque + estalo + tremor) * np.minimum(1, t / 0.001), 0.7, 0.25)


def agua_copo():
    d = 1.4
    t = t_(d)
    tilin = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / dec) for f, a, dec in ((2350, 0.5, 0.25), (3720, 0.3, 0.18), (5100, 0.2, 0.1)))
    respingo = filtro(ruido(d), "bandpass", [600, 7000]) * np.exp(-((t - 0.25) / 0.16) ** 2) * 0.55
    gotas = np.zeros_like(t)
    for k in range(9):
        i = int((0.35 + 0.08 * k + RNG.uniform(0, 0.05)) * SR)
        g = t_(0.04)
        b = np.sin(2 * np.pi * RNG.uniform(900, 1800) * g) * np.exp(-g / 0.012) * 0.25
        gotas[i : i + len(b)] += b[: max(0, len(gotas) - i)]
    return sala(tilin * np.minimum(1, t / 0.001) + respingo + gotas, 0.4, 0.15)


def sibilo():
    d = 1.1
    t = t_(d)
    x = filtro(ruido(d), "bandpass", [3500, 9000]) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    return estereo(x * 0.8, 0.15)


def moeda_jogo():
    y = np.zeros(int(0.45 * SR))
    for k, nota in enumerate((83, 88)):
        t = t_(0.09 if k == 0 else 0.3)
        b = np.sign(np.sin(2 * np.pi * V.hz(nota) * t)) * np.exp(-t / (0.05 if k == 0 else 0.12)) * 0.35
        i = int(k * 0.08 * SR)
        y[i : i + len(b)] += b[: len(y) - i]
    return estereo(filtro(y, "lowpass", 6000))


def rebobina():
    d = 0.9
    t = t_(d)
    f = 400 * 2 ** (t / d * 3.2)
    fase = 2 * np.pi * np.cumsum(f * (1 + 0.04 * np.sin(2 * np.pi * 13 * t))) / SR
    chiado = filtro(ruido(d), "bandpass", [1200, 6000]) * 0.35
    x = (np.sin(fase) * 0.3 + chiado) * np.minimum(1, t / 0.03) * np.minimum(1, (d - t) / 0.05)
    return estereo(x)

GERADORES = {
    "record-scratch": record_scratch,
    "claque-curta": lambda: claque(1.3, 16, False),
    "claque-forte": lambda: claque(2.4, 30, True),
    "swish-cabide": swish_cabide,
    "bocejo": bocejo,
    "thud-livro": thud_livro,
    "pagina": pagina,
    "plim": plim,
    "blip": blip,
    "flip-calendario": flip_calendario,
    "fanfarra-desafinada": fanfarra_desafinada,
    "fanfarra": fanfarra,
    "confete": confete,
    "aplausos": aplausos,
    "fosforo": fosforo,
    "torcida-corneta": torcida_corneta,
    "sino": sino,
    "loading": loading,
    "coro": coro,
    "jingle-retro": jingle_retro,
    "alarme-industrial": alarme_industrial,
    "ting": ting,
    "chamas": chamas,
    "extintor": extintor,
    "cochichos": cochichos,
    "whoosh": whoosh,
    "clack": clack,
    "cadeado-abre": cadeado_abre,
    "cadeado-fecha": cadeado_fecha,
    "batida-hiphop": batida_hiphop,
    "porta-batendo": porta_batendo,
    "agua-copo": agua_copo,
    "sibilo": sibilo,
    "moeda-jogo": moeda_jogo,
    "rebobina": rebobina,
}


def gravar(nome, x):
    if x.ndim == 1:
        x = estereo(x)
    x = np.nan_to_num(x)
    x *= 10 ** (-3 / 20) / max(1e-9, np.max(np.abs(x)))
    wavfile.write(SFX / f"{nome}.wav", SR, (x.T * 32767).astype(np.int16))
    print(f"  {nome:22s} {x.shape[1] / SR:5.2f} s")


def main():
    SFX.mkdir(parents=True, exist_ok=True)
    pedidos = sys.argv[1:] or list(GERADORES)
    for nome in pedidos:
        gravar(nome, GERADORES[nome]())
    disponiveis = sorted(p.stem for p in SFX.glob("*.wav"))
    (RAIZ / "src" / "sfx-disponiveis.json").write_text(json.dumps(disponiveis, ensure_ascii=False, indent=1) + "\n")


if __name__ == "__main__":
    main()
