#!/usr/bin/env python3
"""Trilha original do episódio, composta por código e encaixada nos eventos de cada cena.

Uso: python3 -I scripts/trilha.py ep01   (lê out/ep01-linha-do-tempo.json; rode `npm run linha` antes)
Saída: assets/audio/trilha.wav (48 kHz, estéreo, duração exata do episódio).

Cada bloco tem um tema conforme a situação:
  base comum: groove de crônica de sitcom em swing (120 bpm): baixo acústico caminhando, prato de condução,
  vassourinha, piano elétrico, tapete de cordas e um tema de vibrafone que respira entre as falas
  abertura    groove completo em Si♭, com metais
  regra       o mesmo groove em Fá, com pizzicato e tema "curioso"
  verde       em Dó, com cavaquinho no lugar do piano e tema de esperança
  roxo        órgão e celesta do Advento → bateria de arquibancada → acorde solene → música de espera
  branco      festa com glockenspiel → cordas majestosas no Apocalipse → silêncio para o comercial
  vermelho    cordas graves e tímpano, respeitosos → cordas subindo no Pentecostes
  rosa        funk (Lá menor, 100 bpm) até os óculos, quando a batida de hip-hop assume
  fechamento  reprise suave do groove de abertura
A mixagem cuida do ducking (12 dB abaixo da voz na fala, 8 dB nos respiros) e do silêncio nos congelamentos.
"""
import importlib.util
import json
import pathlib
import sys

import numpy as np
from scipy.io import wavfile

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SR = 48000
RNG = np.random.default_rng(1225)

_v = importlib.util.spec_from_file_location("vinheta", RAIZ / "scripts" / "vinheta.py")
V = importlib.util.module_from_spec(_v)
_v.loader.exec_module(V)
hz, filtro = V.hz, V.filtro

NOTAS = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def m(nome: str) -> int:
    """'Bb3' → 58."""
    letra = nome[:-1]
    return 12 * (int(nome[-1]) + 1) + NOTAS[letra]


# ---------- instrumentos ----------

def t_(d):
    return np.arange(max(1, int(d * SR))) / SR


def soltar(x, d, rel=0.08):
    t = np.arange(len(x)) / SR
    return x * np.clip((d + rel - t) / rel, 0, 1)


def piano_eletrico(nota, d, vel=0.8):
    t = t_(d + 0.3)
    f = hz(nota)
    mod = np.sin(2 * np.pi * f * t) * 1.3 * np.exp(-t / 0.4) * vel
    sino = np.sin(2 * np.pi * f * 14 * t) * 0.08 * np.exp(-t / 0.05)
    x = (np.sin(2 * np.pi * f * t + mod) + sino) * np.exp(-t / 1.2) * np.minimum(1, t / 0.003)
    return soltar(x, d, 0.25) * 0.35 * vel


def pizz(nota, d=0.3, brilho=1.0):
    t = t_(0.5)
    f = hz(nota)
    x = sum((1 / k) * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (6 + k * 5 / brilho)) for k in range(1, 9))
    return x * np.minimum(1, t / 0.002) * 0.5


def cavaquinho(nota, d=0.25):
    t = t_(0.45)
    f = hz(nota)
    x = sum((0.9**k) * np.sin(2 * np.pi * f * k * t + k) * np.exp(-t * (5 + k * 3)) for k in range(1, 12))
    return x * np.minimum(1, t / 0.001) * 0.18


def orgao(nota, d, vol=1.0):
    t = t_(d + 0.25)
    f = hz(nota)
    x = sum(a * np.sin(2 * np.pi * f * k * t) for k, a in ((0.5, 0.5), (1, 1), (2, 0.6), (3, 0.35), (4, 0.25), (6, 0.1)))
    x *= 1 + 0.08 * np.sin(2 * np.pi * 5.8 * t)
    x *= np.minimum(1, t / 0.04)
    return soltar(x, d, 0.25) * 0.12 * vol


def cordas(nota, d, ataque=0.35, vol=1.0, tremolo=False):
    t = t_(d + 0.5)
    f = hz(nota)
    x = np.zeros(len(t))
    for desaf in (-0.06, 0.0, 0.07):
        ff = f * 2 ** (desaf / 12) * (1 + 0.004 * np.sin(2 * np.pi * 5.3 * t + desaf * 40))
        fase = 2 * np.pi * np.cumsum(ff) / SR
        k = 1
        while k * f < 6000:
            x += np.sin(k * fase) / k * (1 / (1 + (k * f / 2200) ** 2))
            k += 1
    if tremolo:
        x *= 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 7 * t))
    x *= np.minimum(1, t / ataque)
    return soltar(x, d, 0.5) * 0.07 * vol


def celesta(nota, d=0.6, vol=1.0):
    t = t_(d + 0.8)
    f = hz(nota)
    x = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / 0.1)) * np.exp(-t / 0.7)
    return x * np.minimum(1, t / 0.002) * 0.25 * vol


def assobio(nota, d):
    t = t_(d + 0.1)
    f = hz(nota) * (1 + 0.012 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / 0.2))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR)
    sopro = filtro(np.random.default_rng(int(nota)).standard_normal(len(t)), "bandpass", [hz(nota) * 0.8, hz(nota) * 1.3]) * 0.15
    env = np.minimum(1, t / 0.04)
    return soltar((x + sopro) * env, d, 0.06) * 0.16


def clav(nota, d=0.15):
    t = t_(0.3)
    f = hz(nota)
    x = np.sign(np.sin(2 * np.pi * f * t)) * 0.5 + np.sin(2 * np.pi * f * 2 * t) * 0.3
    x = filtro(x, "bandpass", [400, 3500]) * np.exp(-t / 0.08)
    return x * 0.22


def baixo_funk(nota, d=0.2):
    t = t_(d + 0.08)
    f = hz(nota)
    x = sum(a * np.sin(2 * np.pi * f * k * t) for k, a in ((1, 1.0), (2, 0.6), (3, 0.35), (4, 0.2), (5, 0.12)))
    tapa = filtro(np.random.default_rng(int(nota * 7)).standard_normal(len(t)), "bandpass", [1500, 5000]) * np.exp(-t / 0.006) * 0.4
    return soltar((x * np.exp(-t / 0.35) + tapa) * np.minimum(1, t / 0.002), d, 0.04) * 0.45


def timpano(nota, vol=1.0):
    t = t_(1.6)
    f = hz(nota) * (1 + 0.04 * np.exp(-t / 0.05))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.9) + filtro(np.random.default_rng(3).standard_normal(len(t)), "lowpass", 400) * np.exp(-t / 0.03) * 0.3
    return x * 0.5 * vol


def chocalho():
    t = t_(0.08)
    return filtro(RNG.standard_normal(len(t)), "highpass", 6000) * np.exp(-t / 0.02) * 0.12


def palma():
    t = t_(0.2)
    x = np.zeros(len(t))
    for atraso in (0, 0.008, 0.017):
        i = int(atraso * SR)
        x[i:] += filtro(RNG.standard_normal(len(t) - i), "bandpass", [900, 3500]) * np.exp(-np.arange(len(t) - i) / (0.012 * SR))
    return x * 0.4


def aro():
    t = t_(0.08)
    return (np.sin(2 * np.pi * 1700 * t) * 0.5 + filtro(RNG.standard_normal(len(t)), "bandpass", [1500, 5000]) * 0.5) * np.exp(-t / 0.012) * 0.35


# ---------- sequenciador ----------

class Faixa:
    def __init__(self, dur):
        self.dur = dur
        self.x = np.zeros((2, int((dur + 2.0) * SR)))

    def por(self, sinal, t0, ganho=1.0, pan=0.0):
        if t0 >= self.dur or t0 < -1:
            return
        i = int(round(max(0, t0) * SR))
        n = min(len(sinal), self.x.shape[1] - i)
        if n <= 0:
            return
        a = (pan + 1) * np.pi / 4
        self.x[0, i : i + n] += sinal[:n] * ganho * np.cos(a)
        self.x[1, i : i + n] += sinal[:n] * ganho * np.sin(a)

    def recorte(self, a=0.0, b=None):
        """Áudio entre a e b (s), com 15 ms de rampa nas pontas (corte seco de sitcom)."""
        b = self.dur if b is None else b
        y = self.x[:, int(a * SR) : int(b * SR)].copy()
        r = min(int(0.015 * SR), y.shape[1] // 2)
        if r > 0:
            y[:, :r] *= np.linspace(0, 1, r)
            y[:, -r:] *= np.linspace(1, 0, r)
        return y


def tempos(bpm, dur):
    b = 60 / bpm
    return b, int(np.ceil(dur / b)) + 1


def ride(vel=1.0):
    """Prato de condução: parciais inarmônicos com batida curta e cauda metálica."""
    t = t_(0.9)
    x = sum((1 / (k + 1)) * np.sin(2 * np.pi * f * t + RNG.uniform(0, 6)) for k, f in enumerate((3215.0, 4127.0, 5003.0, 5911.0, 6870.0, 8240.0)))
    x = x * np.exp(-t / 0.5) + filtro(RNG.standard_normal(len(t)), "highpass", 7000) * np.exp(-t / 0.2) * 0.5
    x += np.sin(2 * np.pi * 4600 * t) * np.exp(-t / 0.06) * 0.6
    return x * 0.06 * vel


def vassoura(vel=1.0):
    t = t_(0.25)
    env = np.minimum(1, t / 0.012) * np.exp(-t / 0.09)
    return filtro(RNG.standard_normal(len(t)), "bandpass", [1500, 6500]) * env * 0.22 * vel


def vibrafone(nota, d, vol=1.0):
    t = t_(d + 1.2)
    f = hz(nota)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t / 0.15) + 0.05 * np.sin(2 * np.pi * f * 9.8 * t) * np.exp(-t / 0.05)
    x *= (1 - 0.25 * (0.5 + 0.5 * np.sin(2 * np.pi * 5.2 * t))) * np.exp(-t / 1.3) * np.minimum(1, t / 0.003)
    return soltar(x, d + 0.6, 0.4) * 0.2 * vol


QUALIDADES = {"maj7": [0, 4, 7, 11], "7": [0, 4, 7, 10], "m7": [0, 3, 7, 10], "6": [0, 4, 7, 9], "m": [0, 3, 7], "": [0, 4, 7], "m6": [0, 3, 7, 9]}


def acorde(simbolo):
    """'Bbmaj7' → (raiz do baixo, [notas do piano em voicing fechado], [notas do acorde])."""
    raiz = simbolo[:2] if len(simbolo) > 1 and simbolo[1] in "b#" else simbolo[:1]
    qual = simbolo[len(raiz):]
    pc = NOTAS[raiz]
    graus = QUALIDADES[qual]
    baixo = 36 + pc if 36 + pc <= 46 else 24 + pc
    cores = [graus[1], graus[-1], 14, graus[2]]  # terça, sétima/sexta, nona, quinta
    voicing = sorted(58 + ((pc + g - 58) % 12) for g in cores)
    return baixo, voicing, [pc + g for g in graus]


MELODIAS = {  # (semitons acima da tônica, início em tempos, duração em tempos), frase de 2 compassos; os 2 seguintes ficam livres
    "tema": [(4, 0, 1), (7, 1, 0.5), (9, 1.5, 0.5), (7, 2, 1.5), (4, 4.5, 0.5), (2, 5, 1), (0, 6, 2)],
    "curioso": [(7, 0, 0.5), (4, 1, 0.5), (7, 2, 0.5), (9, 2.5, 0.5), (7, 3, 1), (5, 4.5, 0.5), (4, 5, 0.5), (2, 5.5, 0.5), (0, 6, 1)],
    "esperanca": [(4, 0, 1.5), (5, 1.5, 0.5), (7, 2, 2), (9, 4, 1), (7, 5, 1), (4, 6, 2)],
    "festa": [(7, 0, 0.5), (9, 0.5, 0.5), (11, 1, 0.5), (12, 1.5, 1.5), (11, 4, 0.5), (9, 4.5, 0.5), (7, 5, 1), (4, 6, 2)],
}


def groove(dur, tonica, cifras, bpm=120, metais=False, melodia=None, cavaco=False, pizzicato=False, palmas_=False, glock=False, ep=True, suave=False):
    """Groove de crônica de sitcom em swing: baixo caminhando, condução, vassourinha, piano elétrico, tapete de cordas, vibrafone."""
    f = Faixa(dur)
    b = 60 / bpm
    sw = b * 2 / 3  # colcheia com balanço
    compassos = int(np.ceil(dur / (4 * b))) + 1
    ton = m(tonica)
    for c in range(compassos):
        o = c * 4 * b
        baixo, voicing, notas = acorde(cifras[c % len(cifras)])
        prox = acorde(cifras[(c + 1) % len(cifras)])[0]
        terca = baixo + (notas[1] - notas[0])
        quinta = baixo + 7
        linha = [baixo, terca if c % 2 else quinta, quinta if c % 2 else baixo + (notas[-1] - notas[0]) - 12 + 12, prox + (1 if (c % 3) else -1)]
        for k, nt in enumerate(linha):
            nt = nt if nt < 52 else nt - 12
            f.por(V.contrabaixo(nt + 12, b * 0.9), o + k * b, 0.95, 0)
            if pizzicato:
                f.por(pizz(nt + 24, brilho=0.6), o + k * b, 0.35, 0.2)
        # condução e vassourinha
        for k, pos in enumerate((0, 1, 1 + sw / b, 2, 3, 3 + sw / b)):
            f.por(ride(0.8 if k in (0, 3) else 1.0), o + pos * b, 0.55 if suave else 0.8, 0.35)
        for s in (1, 3):
            f.por(vassoura(), o + s * b, 0.9, -0.15)
        f.por(V.bumbo(), o, 0.18, 0)
        # tapete de cordas (corpo da trilha)
        for j, nt in enumerate(voicing):
            f.por(cordas(nt - 12, 4 * b + 0.2, 0.5, 0.55), o, 1.0, -0.4 + 0.25 * j)
        # comping
        if ep:
            for pos, dd in ((0, 0.9), (1 + sw / b, 0.5)) if c % 2 == 0 else ((1 + sw / b, 0.6), (3, 0.8)):
                for j, nt in enumerate(voicing):
                    f.por(piano_eletrico(nt, dd * b, 0.6 if suave else 0.75), o + pos * b + j * 0.006, 0.9, -0.25 + j * 0.15)
        if cavaco:
            for k in range(8):
                for j, nt in enumerate(voicing if k % 2 == 0 else voicing[::-1]):
                    f.por(cavaquinho(nt + 12), o + (k // 2) * b + (sw if k % 2 else 0) + j * 0.007, 0.4 if k % 2 == 0 else 0.25, 0.3)
        if glock:
            for k in range(4):
                f.por(celesta(notas[k % len(notas)] + 72 - 12 * (notas[0] + 72 > 90), 0.3, 0.7), o + k * b + sw, 0.6, 0.4)
        if palmas_:
            for s in (1, 3):
                f.por(palma(), o + s * b, 0.45, 0.1)
        if metais and c % 4 == 3:
            for nt in voicing[-2:]:
                f.por(V.metal(nt + 12, 0.12, 0.06), o + 3 * b + sw, 0.3, 0.1)
        # tema no vibrafone: frase nos compassos 1-2 de cada 4 (respiro para a narração)
        if melodia and c % 4 == 0:
            for semi, ini, dd in MELODIAS[melodia]:
                f.por(vibrafone(ton + 12 + semi, dd * b, 0.8 if suave else 1.0), o + ini * b + (sw - b / 2 if ini % 1 else 0), 0.8, -0.1)
    return f


# ---------- temas ----------

ACORDES_SITCOM = [  # (fundamental do baixo, terça, quinta, voicing do piano)
    (m("Bb1"), m("D2"), m("F2"), [m("D4"), m("F4"), m("G4"), m("Bb4")]),
    (m("G1"), m("B1"), m("D2"), [m("F4"), m("B4"), m("D5"), m("E5")]),
    (m("C2"), m("Eb2"), m("G2"), [m("Eb4"), m("G4"), m("Bb4"), m("D5")]),
    (m("F1"), m("A1"), m("C2"), [m("Eb4"), m("A4"), m("C5"), m("D5")]),
]


def tema_sitcom(dur, suave=False):
    f = Faixa(dur)
    b, n = tempos(140, dur)
    compassos = n // 4 + 1
    for c in range(compassos):
        raiz, terca, quinta, voicing = ACORDES_SITCOM[c % 4]
        prox = ACORDES_SITCOM[(c + 1) % 4][0]
        o = c * 4 * b
        for k, nota in enumerate([raiz, terca, quinta, prox + (1 if c % 2 else -1)]):
            f.por(V.contrabaixo(nota + 12, b * 0.85), o + k * b, 0.9, 0)
        for pos, dd in ((1.5, 0.3), (3.0, 0.45)):
            for j, nt in enumerate(voicing):
                f.por(piano_eletrico(nt, dd * b * 2, 0.7 if suave else 0.85), o + pos * b, 0.9, -0.3 + j * 0.2)
        for k in range(8):
            f.por(V.chimbal(), o + k * b / 2 + (b / 6 if k % 2 else 0), 0.10 if k % 2 else 0.16, -0.4)
        if not suave:
            for s in (1, 3):
                f.por(V.estalo(), o + s * b, 0.35, 0.4)
            if c % 2 == 1:
                f.por(V.metal(voicing[-1] + 12, 0.12, 0.06), o + 3.5 * b, 0.35, 0.2)
                f.por(V.metal(voicing[-2] + 12, 0.12, 0.06), o + 3.5 * b, 0.3, -0.2)
        else:
            for s in (1, 3):
                f.por(aro(), o + s * b, 0.5, 0.3)
    return f


def tema_pizz(dur):
    f = Faixa(dur)
    b, n = tempos(108, dur)
    prog = [("F2", ["A3", "C4", "F4"]), ("C2", ["G3", "Bb3", "E4"]), ("F2", ["A3", "C4", "F4"]), ("Bb1", ["Bb3", "D4", "F4"])]
    melodia = ["C5", "A4", "F4", "A4", "G4", "E4", "C4", "E4", "F4", "A4", "C5", "D5", "C5", "Bb4", "A4", "G4"]
    for c in range(n // 4 + 1):
        raiz, triade = prog[c % 4]
        o = c * 4 * b
        f.por(pizz(m(raiz) + 12, brilho=0.7), o, 0.9, 0)
        f.por(pizz(m(raiz) + 19, brilho=0.7), o + 2 * b, 0.7, 0)
        for s in (1, 3):
            for j, nt in enumerate(triade):
                f.por(pizz(m(nt)), o + s * b + 0.01 * j, 0.45, -0.3 + 0.3 * j)
        for k in range(4):
            nt = melodia[(c * 4 + k) % len(melodia)]
            if (c * 4 + k) % 3 != 2:
                f.por(celesta(m(nt), 0.4, 0.8), o + k * b + b / 2, 0.8, 0.25)
    return f


def tema_pastoral(dur):
    f = Faixa(dur)
    b, n = tempos(118, dur)
    prog = [("C2", ["C4", "E4", "G4", "C5"]), ("F2", ["C4", "F4", "A4", "C5"]), ("G2", ["B3", "D4", "G4", "B4"]), ("C2", ["C4", "E4", "G4", "C5"])]
    frase = [("E5", 0, 1), ("G5", 1, 0.5), ("A5", 1.5, 0.5), ("G5", 2, 1.5), ("E5", 4, 0.5), ("D5", 4.5, 0.5), ("C5", 5, 1), ("D5", 6, 1.5)]
    for c in range(n // 4 + 1):
        raiz, acorde = prog[c % 4]
        o = c * 4 * b
        f.por(V.contrabaixo(m(raiz) + 12, b * 0.9), o, 0.8, 0)
        f.por(V.contrabaixo(m(raiz) + 19, b * 0.9), o + 2 * b, 0.7, 0)
        for k in range(8):  # batida: baixo-cima em colcheias
            sobe = k % 2 == 1
            for j, nt in enumerate(acorde if not sobe else acorde[::-1]):
                f.por(cavaquinho(m(nt)), o + k * b / 2 + j * 0.008, 0.55 if k % 4 == 0 else 0.35, 0.3)
        for k in range(16):
            f.por(chocalho(), o + k * b / 4, 0.9 if k % 4 == 2 else 0.5, -0.4)
        if c % 2 == 0:
            for nt, ini, dd in frase:
                f.por(assobio(m(nt), dd * b), o + ini * b, 1.0, -0.1)
    return f


def tema_advento(dur):
    f = Faixa(dur)
    b, n = tempos(72, dur)
    prog = [["D3", "F3", "A3", "D4"], ["Bb2", "D3", "F3", "Bb3"], ["G2", "Bb2", "D3", "G3"], ["A2", "C#3", "E3", "A3"]]
    for c in range(n // 4 + 1):
        o = c * 4 * b
        acorde = prog[c % 4]
        for nt in acorde:
            f.por(orgao(m(nt), 4 * b, 0.9), o, 1.0, 0)
        f.por(pizz(m(acorde[0]) - 12 + 12, brilho=0.6), o, 0.8, 0)
        f.por(pizz(m(acorde[0]) - 12 + 12, brilho=0.6), o + 2 * b, 0.6, 0)
        for nt in acorde[1:]:
            f.por(cordas(m(nt), 4 * b + 0.2, 0.6, 0.6), o, 1.0, 0)
        arpejo = [acorde[1], acorde[2], acorde[3], acorde[2]] * 2
        for k, nt in enumerate(arpejo):
            f.por(celesta(m(nt) + 12, 0.5, 0.7), o + k * b / 2, 0.7, 0.3 if k % 2 else -0.3)
    return f


def tema_arquibancada(dur):
    f = Faixa(dur)
    b, n = tempos(128, dur)
    for k in range(n):
        f.por(V.bumbo(), k * b, 0.7, 0)
        for s in range(4):
            forca = 0.9 if s == 0 and k % 2 else 0.35
            f.por(V.caixa(forca), k * b + s * b / 4, 0.35, 0.1)
        if k % 4 == 0:
            for nt in ("D4", "F#4", "A4"):
                f.por(V.metal(m(nt), 0.18, 0.08), k * b, 0.3, 0)
    return f


def acorde_solene(dur):
    f = Faixa(dur)
    for nt in ("Bb2", "F3", "Bb3", "D4", "F4"):
        f.por(orgao(m(nt), dur, 0.8), 0, 1.0, 0)
    return f


def tema_espera(dur):
    f = Faixa(dur)
    b, n = tempos(120, dur)
    prog = [(m("D2"), [m("F4"), m("A4"), m("C5"), m("E5")]), (m("G1"), [m("F4"), m("B4"), m("E5")]), (m("C2"), [m("E4"), m("G4"), m("B4"), m("D5")]), (m("A1"), [m("G4"), m("C#5"), m("Bb4")])]
    for c in range(n // 4 + 1):
        raiz, voicing = prog[c % 4]
        o = c * 4 * b
        f.por(V.contrabaixo(raiz + 12, b * 1.4), o, 0.7, 0)
        f.por(V.contrabaixo(raiz + 19, b * 0.9), o + 2 * b + b / 2, 0.6, 0)
        for pos in (0.5, 1.5, 2.75, 3.5):  # batida de bossa no aro
            f.por(aro(), o + pos * b, 0.6, 0.3)
        for pos in (0, 1.5, 3):
            for nt in voicing:
                f.por(piano_eletrico(nt, b * 0.7, 0.6), o + pos * b, 0.8, -0.2)
    return f


def tema_festa(dur):
    f = Faixa(dur)
    b, n = tempos(124, dur)
    prog = [("G2", ["G4", "B4", "D5"]), ("C3", ["G4", "C5", "E5"]), ("D3", ["F#4", "A4", "D5"]), ("G2", ["G4", "B4", "D5"])]
    for c in range(n // 4 + 1):
        raiz, triade = prog[c % 4]
        o = c * 4 * b
        for k in range(4):
            f.por(pizz(m(raiz) + 12 + (7 if k % 2 else 0), brilho=0.8), o + k * b, 0.8, 0)
        for k in range(8):
            nt = triade[k % 3] if k < 6 else triade[2 - (k % 3)]
            f.por(celesta(m(nt) + 12, 0.35, 0.9), o + k * b / 2, 0.8, 0.35 if k % 2 else -0.35)
        for s in (1, 3):
            f.por(palma(), o + s * b, 0.7, 0)
    return f


def tema_majestoso(dur):
    f = Faixa(dur)
    b = 60 / 66
    prog = [["G2", "D3", "G3", "B3", "D4"], ["C3", "G3", "C4", "E4", "G4"], ["D3", "A3", "D4", "F#4", "A4"], ["G2", "D3", "G3", "B3", "D4"]]
    c = 0
    while c * 2 * b < dur:
        for nt in prog[c % 4]:
            f.por(cordas(m(nt), 2 * b + 0.2, 0.4, 1.0), c * 2 * b, 1.0, -0.3 + 0.15 * prog[c % 4].index(nt))
        c += 1
    return f


def tema_solene_vermelho(dur):
    f = Faixa(dur)
    b = 1.0
    prog = [["D2", "A2", "D3", "F3"], ["Bb1", "F2", "D3", "F3"], ["G1", "D2", "Bb2", "D3"], ["A1", "E2", "C#3", "E3"]]
    c = 0
    while c * 4 * b < dur:
        for nt in prog[c % 4]:
            f.por(cordas(m(nt), 4 * b + 0.3, 0.8, 1.2), c * 4 * b, 1.0, 0)
        f.por(timpano(m(prog[c % 4][0]) + 12, 0.6), c * 4 * b, 1.0, 0)
        c += 1
    return f


def tema_pentecostes(dur):
    f = Faixa(dur)
    passos = ["D3", "E3", "F#3", "A3", "B3", "D4"]
    passo = max(dur / len(passos), 0.4)
    for k, nt in enumerate(passos):
        for intervalo in (0, 4, 7, 12):
            f.por(cordas(m(nt) + intervalo, passo + 0.4, 0.15, 0.8 + 0.12 * k, tremolo=True), k * passo, 1.0, -0.4 + 0.25 * (intervalo / 4))
    return f


def tema_funk(dur):
    f = Faixa(dur)
    b, n = tempos(100, dur)
    s = b / 4
    baixo = [("A1", 0, 2), ("A2", 3, 1), ("A1", 6, 1), ("C2", 8, 2), ("D2", 10, 1), ("E2", 12, 1), ("G2", 14, 1)]
    for c in range(n // 4 + 1):
        o = c * 4 * b
        for nt, pos, dd in baixo:
            f.por(baixo_funk(m(nt) + 12, dd * s * 0.9), o + pos * s, 1.0, 0)
        for pos in (2, 5, 7, 10, 13, 15):
            for nt in ("A3", "C4", "E4", "G4"):
                f.por(clav(m(nt)), o + pos * s, 0.6, 0.35)
        for k in range(16):
            f.por(V.chimbal(), o + k * s, 0.18 if k % 2 else 0.1, -0.35)
        for k in (0, 2):
            f.por(V.bumbo(), o + k * b, 0.55, 0)
        f.por(V.bumbo(), o + 2.75 * b, 0.4, 0)
        for k in (1, 3):
            f.por(V.caixa(0.8), o + k * b, 0.45, 0.05)
    return f


# ---------- montagem por cena ----------

def ev(cena, nome, n=0):
    lst = cena["eventos"].get(nome)
    return lst[n] / 30 if lst and len(lst) > n else None


def montar(linha):
    fps = linha["fps"]
    total = linha["duracao"] / fps
    saida = np.zeros((2, int((total + 0.5) * SR)))

    def colar(audio, t0, ganho=1.0):
        i = int(round(t0 * SR))
        n = min(audio.shape[1], saida.shape[1] - i)
        saida[:, i : i + n] += audio[:, :n] * ganho

    resumo = []
    for c in linha["cenas"]:
        ini = c["inicio"] / fps
        dur = c["duracao"] / fps
        partes = []  # (início relativo, fim relativo, gerador, ganho)
        cid = c["id"]
        if cid == "abertura":
            partes = [(0, dur, lambda d: groove(d, "Bb4", ["Bbmaj7", "G7", "Cm7", "F7"], metais=True, melodia="tema"), 1.0)]
        elif cid == "regra":
            partes = [(0, dur, lambda d: groove(d, "F4", ["Fmaj7", "Dm7", "Gm7", "C7"], pizzicato=True, melodia="curioso"), 1.0)]
        elif cid == "verde":
            partes = [(0, dur, lambda d: groove(d, "C5", ["C6", "Am7", "Dm7", "G7"], cavaco=True, ep=False, melodia="esperanca"), 1.0)]
        elif cid == "roxo":
            tor, sino, load = ev(c, "torcedor"), ev(c, "sino"), ev(c, "loading")
            partes = [(0, tor, tema_advento, 1.0), (tor, sino, tema_arquibancada, 0.9), (sino + 0.3, load, acorde_solene, 0.9), (load, dur, tema_espera, 1.0)]
        elif cid == "branco":
            per, com = ev(c, "pergaminho"), ev(c, "comercial")
            partes = [
                (0, per, lambda d: groove(d, "G4", ["Gmaj7", "Em7", "Am7", "D7"], glock=True, palmas_=True, melodia="festa"), 1.0),
                (per, com - 0.1, tema_majestoso, 1.0),
            ]  # no comercial, só o jingle
        elif cid == "vermelho":
            cen = ev(c, "cenaculo")
            partes = [(0, cen, tema_solene_vermelho, 1.0), (cen, dur, tema_pentecostes, 1.0)]
        elif cid == "rosa":
            oc = ev(c, "oculos")
            partes = [(0, oc - 0.5, tema_funk, 1.0)]  # nos óculos, entra a batida de hip-hop
        elif cid == "fechamento":
            partes = [(0, dur, lambda d: groove(d, "Bb4", ["Bbmaj7", "G7", "Cm7", "F7"], melodia="tema", suave=True), 0.95)]
        for a, b, gerar, g in partes:
            if a is None or b is None or b - a < 0.2:
                continue
            faixa = gerar(b - a)
            colar(faixa.recorte(0, b - a), ini + a, g)
            resumo.append(f"  {cid:11s} {ini + a:6.2f} a {ini + b:6.2f}  {gerar.__name__ if hasattr(gerar, '__name__') else 'tema'}")
    return saida[:, : int(total * SR)], resumo


def main():
    codigo = sys.argv[1] if len(sys.argv) > 1 else "ep01"
    linha = json.loads((RAIZ / "out" / f"{codigo}-linha-do-tempo.json").read_text(encoding="utf-8"))
    x, resumo = montar(linha)
    x *= 10 ** (-3 / 20) / max(1e-9, np.max(np.abs(x)))
    destino = RAIZ / "assets" / "audio" / "trilha.wav"
    wavfile.write(destino, SR, (x.T * 32767).astype(np.int16))
    print(f"trilha: {destino.relative_to(RAIZ)}  {x.shape[1] / SR:.2f} s")
    print("\n".join(resumo))


if __name__ == "__main__":
    main()
