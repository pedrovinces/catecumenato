#!/usr/bin/env python3
"""Legenda .srt do episódio a partir de out/<codigo>-linha-do-tempo.json.

Uso: python3 -I scripts/srt.py ep01   → out/<slug>.srt

Cada bloco é uma frase (ou pedaço de até ~42 caracteres por linha, no máximo 2 linhas), com a grafia
do roteiro; quebra também nas pausas da narração. Os tempos são os mesmos da legenda queimada no vídeo.
"""
import json
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
MAX_LINHA = 42
PAUSA = 0.45  # segundos de silêncio que encerram um bloco


def tempo(s: float) -> str:
    ms = int(round(s * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    seg, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{seg:02d},{ms:03d}"


def minusculas(w: str) -> str:
    """No roteiro, MAIÚSCULAS marcam ênfase de locução; na legenda escrita, volta à grafia normal."""
    letras = [c for c in w if c.isalpha()]
    return w.lower() if len(letras) > 1 and all(c.isupper() for c in letras) else w


def quebrar(palavras: list[str]) -> str:
    texto = " ".join(palavras)
    if len(texto) <= MAX_LINHA:
        return texto
    melhor, idx = None, 1
    for i in range(1, len(palavras)):
        a, b = " ".join(palavras[:i]), " ".join(palavras[i:])
        custo = abs(len(a) - len(b)) - (8 if a.endswith(",") else 0) + (40 if max(len(a), len(b)) > MAX_LINHA + 4 else 0)
        if melhor is None or custo < melhor:
            melhor, idx = custo, i
    return " ".join(palavras[:idx]) + "\n" + " ".join(palavras[idx:])


def main():
    codigo = sys.argv[1] if len(sys.argv) > 1 else "ep01"
    linha = json.loads((RAIZ / "out" / f"{codigo}-linha-do-tempo.json").read_text(encoding="utf-8"))
    fps = linha["fps"]
    rot = next(
        p for p in sorted((RAIZ / "roteiro").glob(f"{codigo}-*.json"))
        if isinstance(d := json.loads(p.read_text(encoding="utf-8")), dict) and "cenas" in d and "slug" in d
    )
    slug = json.loads(rot.read_text(encoding="utf-8"))["slug"]

    # 1. frases: terminam em pontuação final ou numa pausa da narração
    frases = []
    for cena in linha["cenas"]:
        atual = []
        palavras = cena["palavras"]
        for k, p in enumerate(palavras):
            ini = (cena["inicio"] + p["inicio"]) / fps
            fim = (cena["inicio"] + p["fim"]) / fps
            atual.append((minusculas(p["texto"]), ini, fim))
            prox = palavras[k + 1] if k + 1 < len(palavras) else None
            pausa = (prox["inicio"] - p["fim"]) / fps if prox else 99
            if prox is None or p["texto"].endswith((".", "?", "!", "...", ":")) or pausa >= PAUSA:
                frases.append(atual)
                atual = []
    # 2. frase longa vira partes de tamanho parecido (até 2 linhas cada), preferindo cortar depois de vírgula
    blocos = []
    for fr in frases:
        total = len(" ".join(w for w, _, _ in fr))
        partes = max(1, -(-total // (2 * MAX_LINHA - 6)))
        if partes == 1:
            blocos.append(fr)
            continue
        alvo = total / partes
        atual, acum, cortes = [], 0, 0
        for i, item in enumerate(fr):
            atual.append(item)
            acum += len(item[0]) + 1
            resta = len(fr) - i - 1
            virgula = item[0].endswith(",")
            if cortes < partes - 1 and resta >= 2 and (acum >= alvo or (virgula and acum >= 0.7 * alvo)):
                blocos.append(atual)
                atual, acum, cortes = [], 0, cortes + 1
        if atual:
            blocos.append(atual)
    linhas = []
    for n, b in enumerate(blocos, 1):
        ini, fim = b[0][1], b[-1][2]
        if n < len(blocos):
            fim = min(fim + 0.35, blocos[n][0][1] - 0.04)  # segura um pouco, sem encostar no próximo
        linhas += [str(n), f"{tempo(ini)} --> {tempo(fim)}", quebrar([w for w, _, _ in b]), ""]
    destino = RAIZ / "out" / f"{slug}.srt"
    destino.write_text("\n".join(linhas), encoding="utf-8")
    print(f"{destino.relative_to(RAIZ)}: {len(blocos)} blocos")


if __name__ == "__main__":
    main()
