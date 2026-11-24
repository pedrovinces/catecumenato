#!/usr/bin/env bash
# Baixa as fontes do Google Fonts (licença SIL Open Font License 1.1) para assets/fonts.
# Ficam fora do git; rode uma vez em cada máquina.
set -euo pipefail
cd "$(dirname "$0")/../assets/fonts"
css=$(curl -fsS "https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@800;900&display=swap")
url() { echo "$css" | awk -v fam="$1" -v w="$2" '/font-family/{f=($0 ~ fam)} /font-weight/{ok=(f && $0 ~ w)} /src:/{ if(ok){ match($0,/https:[^)]*/); print substr($0,RSTART,RLENGTH); exit } }'; }
curl -fsS -o Anton-Regular.ttf "$(url Anton 400)"
curl -fsS -o Montserrat-ExtraBold.ttf "$(url Montserrat 800)"
curl -fsS -o Montserrat-Black.ttf "$(url Montserrat 900)"
ls -la *.ttf
