#!/usr/bin/env bash
# Episódio completo: tempos → linha do tempo → trilha → mixagem → vídeo → MP4 final.
# Uso: bash scripts/final.sh ep01 [--ressincronizar] [--sem=cenaX]
set -euo pipefail
cd "$(dirname "$0")/.."
COD="${1:-ep01}"; shift || true
ROT=$(ls roteiro/${COD}-*.json | grep -v timestamps | grep -v ajustes | head -1)
if [[ " $* " == *" --ressincronizar "* ]] || [ ! -f "roteiro/${COD}-timestamps.json" ]; then
  python3 -I scripts/sincronizar.py "$ROT" $(printf '%s\n' "$@" | grep -- '--sem=' || true)
fi
npx tsx scripts/linha-do-tempo.ts "$COD"
python3 -I scripts/trilha.py "$COD"
python3 -I scripts/mixar.py "$COD"
npx remotion render src/index.ts "$COD" "out/${COD}-video-mudo.mp4" --muted --crf=18 --log=error
SLUG=$(python3 -I -c "import json,sys;print(json.load(open(sys.argv[1]))['slug'])" "$ROT")
ffmpeg -v error -y -i "out/${COD}-video-mudo.mp4" -i "out/${COD}-mix.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "out/${SLUG}.mp4"
echo "pronto: out/${SLUG}.mp4"
