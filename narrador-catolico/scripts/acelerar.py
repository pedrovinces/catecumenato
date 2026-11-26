#!/usr/bin/env python3
"""Acelera a narração sem mudar o tom e leva os tempos das palavras junto.

Uso: python3 -I scripts/acelerar.py ep01 1.25

- Áudio: o original ("audio.original" do roteiro; padrão assets/audio/narracao.wav) → <mesmo nome>-<fator>x.wav, com o atempo do ffmpeg
  (WSOLA, o mesmo tipo de algoritmo dos players de podcast: preserva o timbre da fala).
- Tempos: roteiro/<codigo>-timestamps-1x.json guarda os tempos da gravação original (criado na primeira vez);
  roteiro/<codigo>-timestamps.json passa a ter os tempos divididos pelo fator. Rodar de novo com outro
  fator parte sempre do original, então não acumula aceleração.
- Roteiro: "audio.narracao" passa a apontar para o arquivo acelerado (fator 1 volta ao original).

Cortes, legenda, efeitos e congelamentos são recalculados a partir das palavras, então tudo acompanha.
"""
import json
import pathlib
import shutil
import subprocess
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent


def roteiro_de(codigo: str) -> pathlib.Path:
    for p in sorted((RAIZ / "roteiro").glob(f"{codigo}-*.json")):
        try:
            d = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        if isinstance(d, dict) and "cenas" in d and "slug" in d:
            return p
    sys.exit(f"roteiro de {codigo} não encontrado")


def main():
    codigo = sys.argv[1] if len(sys.argv) > 1 else "ep01"
    fator = float(sys.argv[2]) if len(sys.argv) > 2 else 1.25
    rot = roteiro_de(codigo)
    ts = RAIZ / "roteiro" / f"{codigo}-timestamps.json"
    ts1 = RAIZ / "roteiro" / f"{codigo}-timestamps-1x.json"
    if not ts1.exists():
        shutil.copy(ts, ts1)
    orig = json.loads(ts1.read_text(encoding="utf-8"))

    original_rel = json.loads(rot.read_text(encoding="utf-8"))["audio"].get("original", "audio/narracao.wav")
    fonte = RAIZ / "assets" / original_rel
    if fator == 1:
        destino_rel = original_rel
    else:
        destino_rel = original_rel.rsplit(".", 1)[0] + f"-{fator:g}x.wav"
        destino = RAIZ / "assets" / destino_rel
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(fonte), "-af", f"atempo={fator}", "-c:a", "pcm_s16le", str(destino)], check=True)
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(destino)], capture_output=True, text=True, check=True).stdout)
        print(f"{destino_rel}: {dur:.2f} s (original {orig['duracao']:.2f} s / {fator} = {orig['duracao'] / fator:.2f} s)")

    novo = dict(orig)
    novo["fonte"] = f"{orig['fonte']}" + ("" if fator == 1 else f" a {fator:g}x")
    novo["duracao"] = round(orig["duracao"] / fator, 4)
    novo["cenas"] = [{**c, "inicio": round(c["inicio"] / fator, 4), "fim": round(c["fim"] / fator, 4)} for c in orig["cenas"]]
    novo["palavras"] = [{**w, "inicio": round(w["inicio"] / fator, 4), "fim": round(w["fim"] / fator, 4)} for w in orig["palavras"]]
    ts.write_text(json.dumps(novo, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    texto = rot.read_text(encoding="utf-8")
    d = json.loads(texto)
    atual = d["audio"]["narracao"]
    if atual != destino_rel:
        texto = texto.replace(f'"narracao": "{atual}"', f'"narracao": "{destino_rel}"', 1)
        json.loads(texto)
        rot.write_text(texto, encoding="utf-8")
    print(f"tempos: {ts.relative_to(RAIZ)} ({len(novo['palavras'])} palavras); roteiro aponta para {destino_rel}")


if __name__ == "__main__":
    main()
