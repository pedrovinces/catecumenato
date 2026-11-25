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

## Áudio

```bash
npm run sincronizar   # narração real × roteiro (DTW contra a guia + encaixe nas bordas de silêncio)
npm run sfx           # 24 efeitos sintetizados em assets/sfx (originais)
npm run vinheta       # vinheta de fecho
npm run trilha        # trilha original por cena em assets/audio/trilha.wav (só entra se o roteiro tiver "audio.trilha")
npm run mixar         # voz tratada + efeitos (+ trilha, se houver); master -14 LUFS / -1 dBTP
                      # com -- --so-voz: só a narração
npm run final         # tudo acima + vídeo em resolução cheia + MP4 final em out/
```

Velocidade da narração: `python3 -I scripts/acelerar.py ep01 1.25` gera `assets/audio/narracao-1.25x.wav` (atempo, mantém o tom), guarda os tempos originais em `roteiro/ep01-timestamps-1x.json` e grava os novos (divididos pelo fator) em `roteiro/ep01-timestamps.json`; o roteiro passa a apontar para o arquivo acelerado. Cortes, legenda, efeitos e congelamentos se recalculam sozinhos. Fator 1 volta ao original. Depois de acelerar, não rode `--ressincronizar` (ele refaz os tempos da gravação original); se precisar, rode-o e depois acelere de novo.

Voz: a gravação do ep. 1 tinha grave demais (efeito de proximidade do microfone), o que abafava as consoantes. A mixagem nivela a voz em -20 LUFS, corta 140, 280 e 550 Hz, realça 3,2 kHz e o brilho acima de 7,5 kHz, aplica de-esser leve e dois compressores (o segundo segura os picos), e o master passa por um limitador a -2,2 dBFS antes do loudnorm.

Fundo: `python3 -I scripts/fundo.py ep01` gera `assets/audio/fundo.wav`, um tapete de acordes sustentados por cena (sem melodia, sem percussão, nada acima de ~2 kHz). Na mixagem fica 18 dB abaixo da voz nos respiros e 24 dB durante a fala, e some nos congelamentos. A trilha antiga com groove (`scripts/trilha.py`) continua disponível: basta apontar `audio.trilha` para `audio/trilha.wav`.

A sincronização não depende de reconhecimento de fala: a faixa-guia sabe o tempo de cada palavra e o DTW leva esses tempos para a gravação real. Se a gravação não tiver uma cena, use `--sem=<id>` (a cena 9 do ep. 1 não foi gravada e está com `"ativa": false`).

## Visual: filme de animação (desde o ep. 1)

O visual deixou de ser desenhado por código. Cada plano é uma imagem de animação 3D gerada no Canva e animada por IA (image-to-video) no fal.ai; a montagem, os textos e a legenda continuam no Remotion.

1. **Imagens:** `roteiro/<codigo>-imagens.json` guarda os prompts; as imagens ficam em `assets/img/<codigo>/<id>.png` (1536 x 2720). O Padre mantém o rosto porque toda imagem dele parte da referência `p00-padre-referencia`.
2. **Clipes:** `roteiro/<codigo>-clipes.json` lista os planos que ganham movimento (modelo, duração de 3 a 15 s, prompt de movimento em inglês). `python3 -I scripts/fal_clipes.py <codigo>` envia à fila do fal.ai, acompanha, baixa em `assets/video/<codigo>/` e registra cada pedido em `roteiro/<codigo>-clipes-registro.json`. Opções: `--so id1,id2`, `--refazer id`, `--saldo`. Se o acompanhamento cair, rodar de novo retoma os pedidos pendentes sem pagar outra vez.
   - Chave: neste ambiente de nuvem o proxy injeta a chave do fal.ai (hosts `queue.fal.run` e `api.fal.ai`); em outra máquina, `export FAL_KEY=...`.
   - Custo do ep. 1: Kling 3 Pro, sem áudio, US$ 0,112 por segundo; 19 clipes (89 s) mais um refeito, cerca de US$ 10.
3. **Planos:** `roteiro/<codigo>-planos.json` diz em que palavra da narração cada plano entra (`palavra`, `ocorrencia`, `ancora`, `deslocamento` em quadros), o movimento de câmera das imagens paradas (`camera.de/para`: zoom `z`, `x`, `y`), o trecho do clipe (`trecho`, em s) quando ele é usado duas vezes e os anexos presos à imagem (`placa`, `graca`, `baloes`). Sem clipe, o plano usa a imagem com aproximação lenta.
4. **Inventário:** `python3 -I scripts/listar_clipes.py` grava `src/clipes-disponiveis.json` (o `final.sh` já roda).
5. **Conferência:** `npx tsx scripts/quadros-filme.ts ep01 1.0 17.5 75.3` renderiza quadros nos segundos pedidos em `out/quadros-filme/`.

A composição `ep01` é o filme (`src/filme/`); a versão desenhada antiga continua como `ep01-desenho`.

## Músicas de terceiros

Trechos de músicas protegidas fornecidos pelo autor (ex.: `assets/sfx/licenciado-turn-down-for-what.wav`, no corte dos óculos escuros do ep. 1) usam o prefixo `licenciado-` e ficam fora do git (`.gitignore`). Para renderizar em outra máquina, coloque o arquivo de novo nessa pasta; sem ele, a mixagem avisa "faltando" e segue sem o trecho. O Instagram detecta música protegida no áudio enviado e pode silenciar o Reel ou limitar o alcance; a alternativa sem esse risco é adicionar a música pelo editor de Reels, que tem a licença.

## Marca

Nome: **Narrador Católico** (@narradorcatolico). Símbolo oficial: conceito D · Traço, um microfone de podcast em linha, com cruz latina na cápsula e auréola, numa cor só.

- Arquivos prontos em `marca/`: foto de perfil do Instagram (`narrador-catolico-perfil-instagram-1080.png`, símbolo maior e traço mais grosso para ler a 32 px; também em 320 px), avatar genérico (1080 x 1080), logotipo horizontal e empilhado para fundo escuro e claro (PNG transparente), símbolo em ouro, branco e preto (PNG 1024 e SVG).
- Cores: ouro `#E9B949` (ouro escuro `#9C7420` sobre fundo claro), creme `#F6EBD3`, noite `#14111C`. Tipografia: Cinzel 700 (nome), Montserrat 800 (chamadas).
- Fonte única da geometria: `TRACO` em `src/marca/Marca.tsx`; `npx tsx scripts/marca.ts` regera todos os arquivos (inclusive os SVG).
- `src/marca/PranchaMarca.tsx` (Still "Marca") guarda os quatro conceitos estudados (A Clássico, B Vitral, C Estola, D Traço).
- No vídeo, o texto de posição `assinatura` do roteiro vira a revelação da marca (`src/marca/Revelacao.tsx`), sincronizada com a vinheta do autor `assets/sfx/vinheta-amen.wav` (4,8 s, acorde "Amém"): a auréola acende na primeira nota, o microfone e a cruz se desenham quando entra o grave, NARRADOR e CATÓLICO surgem no ápice e a chamada entra no repouso final. (`vinheta-narrador.wav`, a anterior, segue na pasta.) A cena final tem `cauda` de 5,3 s para caber a vinheta inteira.

## Estado atual

Ep. 1 em filme de animação: 27 imagens, 19 clipes animados, montagem com cortes na fala, sobreposições em serifa, congelamento em sépia e legenda karaokê. Marca definida (conceito D · Traço) e aplicada no cartão final.

Antes (versão desenhada): motor (legenda, selo, wipe, congela, textos, câmera), Padre com 16 poses, fiéis, influencer, cenário, cenas 1 (abertura), 3 (verde), 4 (roxo) e 7 (rosa), sincronização com a narração real, 24 efeitos, trilha original por cena, mixagem com loudness, vinheta de fecho, três propostas de logotipo.

Em andamento: cenas 2, 5, 6 e 8 (hoje provisórias); capa; SRT.

O ep. 1 usa a narração a 1,25x e o fundo discreto de `scripts/fundo.py` (a trilha com groove competia com a voz).
