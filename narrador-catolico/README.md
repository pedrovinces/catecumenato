# Narrador Católico · Reels feitos por código

Reels verticais (1080 x 1920, 30 fps) do perfil **@narradorcatolico**, montados com Remotion (React + TypeScript) e finalizados com ffmpeg. Cada episódio nasce de um arquivo JSON de roteiro; personagens, legendas, selos, wipes, congelamentos e sincronização são reaproveitados.

## Requisitos

- Node 22 e npm
- ffmpeg 6 ou mais novo
- Python 3 (scripts de áudio)
- Para a faixa-guia robótica: `espeak-ng`, `mbrola` e `mbrola-br3` (Ubuntu/Debian: `apt-get install espeak-ng mbrola mbrola-br3`)
- Chromium: o Remotion baixa o dele; nesta máquina de nuvem o download é bloqueado, então `remotion.config.ts` usa o Chromium já instalado. Em outra máquina, defina `CHROMIUM=/caminho/do/chrome` ou não faça nada.

## Primeiros passos

```bash
npm install
npm run fontes          # Anton e Montserrat em assets/fonts (fora do git)
npm run guia            # voz robótica + tempo de cada palavra (enquanto a narração real não chega)
npm run linha -- ep01   # valida o roteiro e mostra a linha do tempo resolvida
npm run studio          # prévia interativa no navegador
npm run quadros -- ep01 # quadros-chave em out/quadros/
npm run previa          # vídeo inteiro em meia resolução, com a voz-guia
```

## Estrutura

```
assets/audio/       narracao.wav e trilha.mp3 (seus), narracao-guia.wav (gerado)
assets/sfx/         efeitos sonoros (nomes na lista de assets)
assets/img/         ilustrações opcionais
assets/fonts/       fontes baixadas por `npm run fontes`
roteiro/            epNN-<slug>.json (roteiro) e epNN-timestamps.json (tempo de cada palavra)
src/components/     Padre, Fiel, BarraDeCarregamento, OculosMeme, Pergaminho, Calendario, Balao, cenário, logotipo
src/components/motor/  Legenda, SeloDeBloco, Wipe, Congela, TextoTela, Camera, área segura
src/scenes/         uma cena por arquivo; index.ts liga o "tipo" do JSON ao componente
src/lib/            esquema do JSON, tokens, linha do tempo, paleta, animação
scripts/            guia (Python), linha do tempo, quadros-chave, fontes
out/                renders (fora do git)
```

## Como nasce um episódio novo

1. **Copie o roteiro.** `roteiro/ep01-cores-liturgicas.json` vira `roteiro/ep02-<assunto>.json`. Troque `episodio`, `codigo` (`ep02`), `slug`, `titulo`.
2. **Escreva as cenas.** Cada cena tem:
   - `id` e, se quiser reaproveitar um visual, `tipo` (nome do componente em `src/scenes`). Sem componente próprio, a cena usa a provisória.
   - `cor`: `sepia`, `verde`, `roxo`, `branco`, `vermelho`, `rosa` ou `escuro`. O wipe entra sozinho quando a cor muda.
   - `selo`: `{ "cor": "VERDE", "tempo": "TEMPO COMUM" }` ou nada.
   - `locucao`: o texto com as marcações da direção de locução: `[pausa]` (0,4 s), `[pausa longa]` (0,8 s), `(seco)`, `(sorrindo)`, `(sussurrando)`, MAIÚSCULAS para ênfase.
   - `gatilhos`: `{ "palavra": "torcedor", "evento": "torcedor" }`. A palavra (ou frase) precisa estar na locução; `ocorrencia` escolhe a repetição; `deslocamento` adianta ou atrasa em quadros. O evento `congela` aceita `duracao` (0,8 a 1,5 s) ou `ate` (outra palavra).
   - `textos`: `conteudo`, `entrada` (`pop`, `desliza`, `carimbo`, `impacto`, `fade`), `posicao` (`titulo`, `subtitulo`, `carimbo`, `letreiro`, `assinatura`), início por `palavra` ou `inicio` (s), fim por `ate`, `duracao` ou fim da cena.
   - `sfx`: `arquivo` (nome em `assets/sfx`, sem extensão) e `gatilho` (palavra), `evento` ou `inicio`; `volume` em dB; `repetir` para sons em série. Todo congelamento já leva record scratch.
   - `cauda`: segundos de imagem depois da última palavra da cena (o silêncio é inserido na narração).
3. **Gere os tempos.** Com a narração real: sincronização (Whisper + alinhamento com o roteiro). Antes dela: `python3 -I scripts/guia_espeak.py roteiro/ep02-<assunto>.json`.
4. **Registre o episódio** em `src/episodios.ts` (duas linhas de import).
5. **Confira:** `npm run linha -- ep02` aponta qualquer palavra-gatilho que não esteja na locução.
6. **Visuais novos:** crie `src/scenes/MinhaCena.tsx` usando `useCena()` (quadro local, `ev`, `desde`, `passou`, `pal`) e registre em `src/scenes/index.ts`.

## Regras que o motor garante

- Texto só dentro da área segura: fora dos 288 px de cima, dos 384 px de baixo e dos 120 px da direita (`src/components/motor/area.ts`).
- Legendas de 2 a 4 palavras, caixa alta, contorno de 8 px, palavra falada a 110% na cor da cena; os grupos não atravessam pausas, então a punchline nunca aparece antes de ser dita.
- Congelamento: sépia, granulação, vinheta, zoom de 105%, record scratch e trilha muda; legendas e textos continuam vivos.
- Animação dos personagens em degraus de 2 a 4 quadros (trocas secas de pose).

## Estado atual

Feito: motor (legenda, selo, wipe, congela, textos, câmera), Padre com 16 poses, fiéis, influencer, cenário, cenas 1 (abertura), 4 (roxo) e 7 (rosa), faixa-guia com tempo exato por palavra, três propostas de logotipo.

Vinheta de fecho original ("Everybody loves Mass"), instrumental e cantada (guia): `npm run vinheta`, detalhes em `docs/vinheta-melodia.md`.

Em andamento: cenas 2, 3, 5, 6, 8 e 9; sincronização com a narração real; mixagem e loudness no ffmpeg; demais efeitos sonoros; capa; SRT.
