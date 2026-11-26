#!/usr/bin/env python3
"""Ajusta os tempos das palavras às pausas reais da narração (depois de scripts/sincronizar.py, antes de acelerar).

Uso: python3 -I scripts/refinar_tempos.py ep02

O DTW de scripts/sincronizar.py acerta a ordem e o ritmo geral, mas às vezes comprime ou estica um trecho
(a legenda acende cedo ou tarde em volta de uma vírgula). Aqui as pausas reais viram âncoras:
1. Detecta as pausas da narração (0,22 s ou mais, 38 dB abaixo do pico).
2. Liga cada pausa ao limite entre palavras mais provável: primeiro os que o texto marca (vírgula, ponto,
   dois-pontos, ponto e vírgula, interrogação, aspas ou [pausa]) a até 0,7 s do tempo do DTW; sem marca por
   perto, o limite mais próximo. A ordem do texto é sempre respeitada.
3. Em cada âncora, a palavra anterior termina no começo da pausa e a seguinte começa no fim dela.
4. As palavras entre duas âncoras são redistribuídas no trecho de fala entre elas, na proporção do DTW.
Atualiza roteiro/<codigo>-timestamps.json (rode de novo o sincronizar para voltar ao DTW puro).
"""
import json
import pathlib
import re
import sys

import librosa
import numpy as np

RAIZ = pathlib.Path(__file__).resolve().parent.parent
MARGEM = 0.03


def pausas(caminho: pathlib.Path, limiar_db=-38.0, minimo=0.22):
    y, _ = librosa.load(caminho, sr=16000, mono=True)
    r = librosa.feature.rms(y=y, frame_length=512, hop_length=160)[0]
    db = 20 * np.log10(r + 1e-9)
    db -= db.max()
    sil = db < limiar_db
    out, i = [], 0
    while i < len(sil):
        if sil[i]:
            j = i
            while j < len(sil) and sil[j]:
                j += 1
            if (j - i) * 0.01 >= minimo:
                out.append((i * 0.01, j * 0.01))
            i = j
        else:
            i += 1
    return out


def marcas_do_texto(roteiro) -> list[bool]:
    """Para cada palavra (na ordem global), True se o texto marca pausa depois dela."""
    out = []
    for cena in roteiro["cenas"]:
        if cena.get("ativa", True) is False:
            continue
        tokens = []
        for parte in re.split(r"(\[[^\]]*\]|\([^)]*\))", cena["locucao"]):
            if not parte.strip():
                continue
            if parte.startswith("["):
                if tokens:
                    tokens[-1] = True
            elif parte.startswith("("):
                continue
            else:
                for w in parte.split():
                    tokens.append(bool(re.search(r"[,.;:?!\"”…]$", w)))
        if tokens:
            tokens[-1] = True  # fim de cena
        out.extend(tokens)
    return out


def main():
    codigo = sys.argv[1] if len(sys.argv) > 1 else "ep02"
    arq = RAIZ / "roteiro" / f"{codigo}-timestamps.json"
    ts = json.loads(arq.read_text(encoding="utf-8"))
    rot = next(
        d for d in (json.loads(p.read_text(encoding="utf-8")) for p in sorted((RAIZ / "roteiro").glob(f"{codigo}-*.json")))
        if isinstance(d, dict) and "cenas" in d and "slug" in d
    )
    P = ts["palavras"]
    marcado = marcas_do_texto(rot)
    if len(marcado) != len(P):
        sys.exit(f"texto tem {len(marcado)} palavras e os tempos {len(P)}: rode o sincronizar de novo")
    orig = [(w["inicio"], w["fim"]) for w in P]
    limite = [(orig[k][1] + orig[k + 1][0]) / 2 for k in range(len(P) - 1)]  # tempo DTW do limite k|k+1

    ancoras = []  # (k, a, b): pausa (a,b) entre a palavra k e a k+1
    usado = -1
    for a, b in pausas(RAIZ / "assets" / rot["audio"]["narracao"]):
        m = (a + b) / 2
        if m < orig[0][0] - 0.1 or m > orig[-1][1] + 0.1:
            continue
        cands = [k for k in range(usado + 1, len(limite)) if abs(limite[k] - m) <= 0.7]
        if not cands:
            continue
        com_marca = [k for k in cands if marcado[k]]
        k = min(com_marca or cands, key=lambda k: abs(limite[k] - m))
        ancoras.append((k, a, b))
        usado = k

    # bordas da fala: primeira e última palavra
    novos = [list(t) for t in orig]
    pontos = [(-1, None, orig[0][0])] + ancoras + [(len(P) - 1, orig[-1][1], None)]
    for (k1, _, b1), (k2, a2, _) in zip(pontos, pontos[1:]):
        i0, i1 = k1 + 1, k2  # palavras i0..i1 entre as âncoras
        ini = (b1 - MARGEM) if b1 is not None and k1 >= 0 else orig[i0][0]
        fim = (a2 + MARGEM) if a2 is not None and k2 < len(P) - 1 else orig[i1][1]
        o0, o1 = orig[i0][0], orig[i1][1]
        escala = (fim - ini) / max(o1 - o0, 1e-3)
        for i in range(i0, i1 + 1):
            novos[i][0] = ini + (orig[i][0] - o0) * escala
            novos[i][1] = ini + (orig[i][1] - o0) * escala
    for i, w in enumerate(P):
        w["inicio"], w["fim"] = round(novos[i][0], 3), round(max(novos[i][1], novos[i][0] + 0.05), 3)
    for c in ts["cenas"]:
        ws = [w for w in P if w["cena"] == c["id"]]
        c["inicio"], c["fim"] = ws[0]["inicio"], ws[-1]["fim"]
    ts["fonte"] = ts["fonte"].split("+")[0] + "+pausas"
    arq.write_text(json.dumps(ts, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    sem_marca = [k for k, _, _ in ancoras if not marcado[k]]
    print(f"{len(ancoras)} pausas ancoradas ({len(sem_marca)} sem marca no texto: "
          + ", ".join(f"{P[k]['texto']}|{P[k + 1]['texto']}" for k in sem_marca) + ")")
    maior = max(range(len(P)), key=lambda i: abs(novos[i][0] - orig[i][0]))
    print(f"maior deslocamento: '{P[maior]['texto']}' {novos[maior][0] - orig[maior][0]:+.2f} s")


if __name__ == "__main__":
    main()
