#!/usr/bin/env python3
"""Grava src/clipes-disponiveis.json: {codigo: {id: duração em segundos}} dos vídeos em assets/video.

O Remotion não enxerga o disco durante o render; a montagem usa esta lista para decidir entre o
clipe animado e a imagem parada com movimento de câmera.
"""
import json
import pathlib
import subprocess

RAIZ = pathlib.Path(__file__).resolve().parent.parent
saida = {}
for pasta in sorted((RAIZ / "assets" / "video").glob("*")):
    if not pasta.is_dir():
        continue
    for mp4 in sorted(pasta.glob("*.mp4")):
        d = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp4)],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        saida.setdefault(pasta.name, {})[mp4.stem] = round(float(d), 3)
(RAIZ / "src" / "clipes-disponiveis.json").write_text(json.dumps(saida, indent=2) + "\n", encoding="utf-8")
print({k: len(v) for k, v in saida.items()})
