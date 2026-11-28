#!/usr/bin/env bash
# Episódio completo: tempos → linha do tempo → mixagem → inventário de clipes → vídeo → MP4 final.
# Uso: bash scripts/final.sh ep01 [--ressincronizar] [--sem=cenaX]
set -euo pipefail
cd "$(dirname "$0")/.."
COD="${1:-ep01}"; shift || true
# o roteiro é o JSON do episódio que tem "cenas" (há outros ep01-*.json: planos, clipes, imagens, tempos)
ROT=$(python3 -I -c "
import json, pathlib, sys
for p in sorted(pathlib.Path('roteiro').glob(sys.argv[1] + '-*.json')):
    try:
        d = json.loads(p.read_text(encoding='utf-8'))
    except Exception:
        continue
    if isinstance(d, dict) and 'cenas' in d and 'slug' in d:
        print(p); break
" "$COD")
[ -n "$ROT" ] || { echo "roteiro de $COD não encontrado"; exit 1; }
if [[ " $* " == *" --ressincronizar "* ]] || [ ! -f "roteiro/${COD}-timestamps.json" ]; then
  python3 -I scripts/sincronizar.py "$ROT" $(printf '%s\n' "$@" | grep -- '--sem=' || true)
fi
npx tsx scripts/linha-do-tempo.ts "$COD"
TRILHA=$(python3 -I -c "import json,sys; print(json.load(open(sys.argv[1]))['audio'].get('trilha') or '')" "$ROT")
case "$TRILHA" in
  *fundo.wav) python3 -I scripts/fundo.py "$COD" ;;   # tapete discreto (ep. 1 em diante)
  ?*) python3 -I scripts/trilha.py "$COD" ;;           # trilha com groove (versão antiga)
esac
python3 -I scripts/mixar.py "$COD"
python3 -I scripts/listar_clipes.py
npx remotion render src/index.ts "$COD" "out/${COD}-video-mudo.mp4" --muted --crf=18 --concurrency=3 --log=error
SLUG=$(python3 -I -c "import json,sys;print(json.load(open(sys.argv[1]))['slug'])" "$ROT")
ffmpeg -v error -y -i "out/${COD}-video-mudo.mp4" -i "out/${COD}-mix.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "out/${SLUG}.mp4"
echo "pronto: out/${SLUG}.mp4"
# versão leve para o celular (720p), sempre refeita a partir da final
ffmpeg -v error -y -i "out/${SLUG}.mp4" -c:v libx264 -preset medium -crf 26 -vf scale=720:1280 -c:a aac -b:a 128k -movflags +faststart "out/${SLUG}-leve.mp4"
echo "versão leve: out/${SLUG}-leve.mp4"
# entrega automática no Drive (pedido do autor): a versão nova substitui a anterior; sem credencial, só avisa
python3 -I scripts/drive_sync.py "$COD" --video --legenda || echo "aviso: o envio ao Drive falhou; rode: python3 -I scripts/drive_sync.py $COD --video"
