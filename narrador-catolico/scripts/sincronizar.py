#!/usr/bin/env python3
"""Sincroniza a narração real com o roteiro, palavra por palavra, sem depender de reconhecimento de fala.

Uso: python3 -I scripts/sincronizar.py roteiro/ep01-cores-liturgicas.json

Como funciona:
1. A faixa-guia (eSpeak) diz exatamente o texto do roteiro e sabe o tempo de cada palavra.
2. Guia e narração real viram sequências de MFCC (timbre normalizado) a cada 10 ms;
   o DTW acha o caminho de menor custo entre as duas (mesmo princípio do alinhador aeneas).
3. O tempo de cada palavra da guia é levado para a narração pelo caminho.
4. Palavras que começam depois de silêncio (punchlines, inícios de frase) são encaixadas no instante
   exato em que a voz volta (janelas de 5 ms); finais antes de pausa, no instante em que a voz some.
5. A grafia continua a do roteiro (Gaudete, Laetare, IGMR...).

Gera roteiro/<codigo>-timestamps.json (fonte "narracao-alinhada") e um relatório no terminal.
"""
import datetime
import json
import pathlib
import sys

import librosa
import numpy as np

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SR = 16000
HOP = 160  # 10 ms
JANELA_SNAP = 0.22  # s: até onde um início/fim pode ser puxado para a borda de silêncio


def feats(y: np.ndarray) -> np.ndarray:
    m = librosa.feature.mfcc(y=y, sr=SR, n_mfcc=20, hop_length=HOP, n_fft=512, n_mels=40)[1:]
    m = (m - m.mean(axis=1, keepdims=True)) / (m.std(axis=1, keepdims=True) + 1e-8)
    e = librosa.feature.rms(y=y, hop_length=HOP, frame_length=512)[0]
    e = 20 * np.log10(e + 1e-6)
    voz = np.clip((e - (e.max() - 45)) / 20, 0, 1)  # 0 = silêncio, 1 = voz plena
    d = librosa.feature.delta(m)
    return np.vstack([m, 0.6 * d, 3.0 * voz[None, :]])


def atividade(y: np.ndarray, sr: int):
    """Envelope de voz em janelas de 5 ms e limiar adaptativo."""
    hop = sr // 200
    rms = librosa.feature.rms(y=y, hop_length=hop, frame_length=hop * 4, center=True)[0]
    db = 20 * np.log10(rms + 1e-7)
    piso = np.percentile(db, 8)
    teto = np.percentile(db, 97)
    limiar = piso + 0.28 * (teto - piso)
    return db > limiar, hop / sr


def bordas(ativo: np.ndarray, passo: float, min_sil: float = 0.12):
    """Inícios (silêncio→voz) e fins (voz→silêncio), ignorando silêncios curtos."""
    inicios, fins = [], []
    n = len(ativo)
    i = 0
    while i < n:
        if not ativo[i]:
            j = i
            while j < n and not ativo[j]:
                j += 1
            if (j - i) * passo >= min_sil or i == 0:
                if i > 0:
                    fins.append(i * passo)
                if j < n:
                    inicios.append(j * passo)
            i = j
        else:
            i += 1
    return np.array(inicios), np.array(fins)


def main():
    caminho = RAIZ / (sys.argv[1] if len(sys.argv) > 1 else "roteiro/ep01-cores-liturgicas.json")
    roteiro = json.loads(caminho.read_text(encoding="utf-8"))
    cod = roteiro["codigo"]
    guia_ts = json.loads((RAIZ / "roteiro" / f"{cod}-timestamps-guia.json").read_text(encoding="utf-8"))
    yg, _ = librosa.load(RAIZ / "assets" / roteiro["audio"]["guia"], sr=SR, mono=True)
    sem = set()
    for a in sys.argv[2:]:
        if a.startswith("--sem="):
            sem |= set(a.split("=", 1)[1].split(","))
    if sem:
        # recorta da guia o áudio e as palavras das cenas que a gravação não tem
        pedacos, palavras_g, cenas_g, desloc = [], [], [], 0.0
        cs = guia_ts["cenas"]
        for k, c in enumerate(cs):
            ini = 0.0 if k == 0 else (cs[k - 1]["fim"] + c["inicio"]) / 2
            fim = (c["fim"] + cs[k + 1]["inicio"]) / 2 if k + 1 < len(cs) else len(yg) / SR
            if c["id"] in sem:
                desloc += fim - ini
                continue
            pedacos.append(yg[int(ini * SR) : int(fim * SR)])
            cenas_g.append({**c, "inicio": c["inicio"] - desloc, "fim": c["fim"] - desloc})
            palavras_g += [{**w, "inicio": w["inicio"] - desloc, "fim": w["fim"] - desloc} for w in guia_ts["palavras"] if w["cena"] == c["id"]]
        yg = np.concatenate(pedacos)
        guia_ts = {**guia_ts, "cenas": cenas_g, "palavras": palavras_g}
    yr, _ = librosa.load(RAIZ / "assets" / roteiro["audio"]["narracao"], sr=SR, mono=True)

    fg, fr = feats(yg), feats(yr)
    custo, caminho_dtw = librosa.sequence.dtw(X=fg, Y=fr, metric="euclidean", backtrack=True)
    caminho_dtw = caminho_dtw[::-1]
    # para cada quadro da guia, o quadro médio correspondente na narração
    mapa = np.zeros(fg.shape[1])
    soma = np.zeros(fg.shape[1])
    for ig, ir in caminho_dtw:
        mapa[ig] += ir
        soma[ig] += 1
    mapa = mapa / np.maximum(soma, 1)
    passo = HOP / SR

    def leva(t: float) -> float:
        i = t / passo
        a = int(np.clip(np.floor(i), 0, len(mapa) - 1))
        b = min(a + 1, len(mapa) - 1)
        return float((mapa[a] + (mapa[b] - mapa[a]) * (i - a)) * passo)

    yr48, sr48 = librosa.load(RAIZ / "assets" / roteiro["audio"]["narracao"], sr=48000, mono=True)
    ativo, p5 = atividade(yr48, sr48)
    inicios, fins = bordas(ativo, p5)

    palavras = guia_ts["palavras"]
    novas = []
    ajustes = []
    for k, w in enumerate(palavras):
        ini, fim = leva(w["inicio"]), leva(w["fim"])
        ant = palavras[k - 1] if k else None
        prox = palavras[k + 1] if k + 1 < len(palavras) else None
        depois_de_silencio = ant is None or ant["cena"] != w["cena"] or w["inicio"] - ant["fim"] > 0.15
        antes_de_silencio = prox is None or prox["cena"] != w["cena"] or prox["inicio"] - w["fim"] > 0.15
        if depois_de_silencio and len(inicios):
            j = np.argmin(np.abs(inicios - ini))
            if abs(inicios[j] - ini) <= JANELA_SNAP:
                ajustes.append(inicios[j] - ini)
                ini = float(inicios[j])
        if antes_de_silencio and len(fins):
            j = np.argmin(np.abs(fins - fim))
            if abs(fins[j] - fim) <= JANELA_SNAP:
                fim = float(fins[j])
        novas.append({**w, "inicio": round(ini, 3), "fim": round(max(fim, ini + 0.05), 3)})
    # monotonia
    for k in range(1, len(novas)):
        if novas[k]["inicio"] < novas[k - 1]["inicio"] + 0.03:
            novas[k]["inicio"] = round(novas[k - 1]["inicio"] + 0.03, 3)
        if novas[k - 1]["fim"] > novas[k]["inicio"] and novas[k]["cena"] == novas[k - 1]["cena"]:
            novas[k - 1]["fim"] = max(novas[k - 1]["inicio"] + 0.03, novas[k]["inicio"])

    for w in novas:
        w["fim"] = round(max(w["fim"], w["inicio"] + 0.03), 3)

    cenas = []
    for c in guia_ts["cenas"]:
        ws = [w for w in novas if w["cena"] == c["id"]]
        cenas.append({"id": c["id"], "inicio": ws[0]["inicio"], "fim": ws[-1]["fim"]})

    # qualidade: razão de duração por palavra e custo médio do caminho
    razoes = []
    for a, b in zip(palavras, novas):
        dg = a["fim"] - a["inicio"]
        dr = b["fim"] - b["inicio"]
        razoes.append(dr / max(dg, 0.02))
    razoes = np.array(razoes)
    estranhas = [(n["cena"], n["texto"], round(r, 2)) for n, r in zip(novas, razoes) if r < 0.25 or r > 3.5]

    saida = {
        "fonte": "narracao-alinhada",
        "metodo": "DTW de MFCC contra a faixa-guia + encaixe nas bordas de silêncio",
        "gerado": datetime.datetime.now().isoformat(timespec="seconds"),
        "duracao": round(len(yr48) / sr48, 3),
        "cenas": cenas,
        "palavras": novas,
        "ausentes": sorted(sem),
    }
    (RAIZ / "roteiro" / f"{cod}-timestamps.json").write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"narração: {saida['duracao']:.1f} s; {len(novas)} palavras; custo médio do caminho {custo[-1, -1] / len(caminho_dtw):.2f}")
    print(f"inícios encaixados no silêncio: {len(ajustes)} (desvio mediano {np.median(np.abs(ajustes)) * 1000:.0f} ms, máx {np.max(np.abs(ajustes)) * 1000:.0f} ms)")
    for c in cenas:
        print(f"  {c['id']:12s} {c['inicio']:6.2f} a {c['fim']:6.2f}  ({c['fim'] - c['inicio']:.1f} s)")
    if estranhas:
        print("palavras com duração estranha (conferir):", estranhas)


if __name__ == "__main__":
    main()
