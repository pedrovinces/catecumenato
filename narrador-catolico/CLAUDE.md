# Narrador Católico · instruções do projeto

## Entrega no Google Drive (pedido do autor)

### Envio automático, sem o autor pedir (regra do autor, 28/11)

Tudo o que for produzido sobe para o Drive na hora, sem esperar pedido, e a versão nova substitui a anterior
(mesmo nome no Drive; na pasta fica só a última). Ferramenta: `python3 -I scripts/drive_sync.py <cod> [opções]`,
que compara o MD5 e só envia o que mudou; destinos em `roteiro/drive-pastas.json`.
- Vídeo final: automático no fim de `scripts/final.sh` (`--video`). Uma cópia antiga com o nome do arquivo de saída
  (`<slug>.mp4`, como as que o autor subiu à mão) vai para a lixeira do Drive quando a nova sobe.
- Clipes do fal.ai: automático no fim de `scripts/fal_clipes.py` (`--clipes`).
- Imagens do Canva: logo depois de baixar os PNGs para `assets/img/<cod>/`, rodar `--imagens`.
- Áudio: logo depois de receber uma gravação (`assets/audio/<cod>/*.m4a`), rodar `--audio`. Gravação nova de um
  episódio que já tem uma: dar outro nome no mapa (`audio`) para não apagar a anterior, a não ser que o autor diga
  que a antiga não vale mais.
- Storyboard: depois de gerar os PDFs, rodar `--storyboard`. Narração com rubricas (documento Google): atualizar
  pelo conector sempre que o texto mudar.
- Episódio novo: criar a pasta (`drive_enviar.py pasta "Episódio NN - Tema"`) e acrescentar a entrada no mapa.
- Sem DRIVE_PONTE na sessão, o script só avisa. Gravações até ~2,9 MB vão pelo conector; o resto, dizer ao autor no
  fim da tarefa o que ficou pendente e por quê.

### Organização

Sempre que um vídeo e o seu storyboard ficarem prontos, enviar para a pasta do projeto no Drive:
"Projeto Narrador Católico", id `1u5STBEjiF2uLkfnZ0VXFGFgx6UD3QDEE`
(https://drive.google.com/drive/folders/1u5STBEjiF2uLkfnZ0VXFGFgx6UD3QDEE).

Organização (seguir o padrão que o autor criou):
- Uma subpasta por episódio, no formato `Episódio NN - Tema` (ex.: `Episódio 01 - Cores Litúrgicas`,
  id `1AM161fpBEZontD4dF3qVtcwPmgxC7Uu1`; `Episódio 02 - Infalibilidade Papal`, id `1zpf3JhUHx5k33wHYi1EZ0HT4bmHZvqN7`).
  Episódio novo: criar a subpasta no mesmo formato.
- Episódio em duas partes: uma pasta única do episódio na raiz e, dentro dela, uma subpasta por parte
  (pedido do autor em 28/11; não recriar pastas de parte soltas na raiz). O ep. 3 é assim:
  `Episódio 03 - Pecado Original e Confissão` (id `1GmNP0x5fKe8Yy_EQuYrASRtFcRNtQv_3`), com
  `Parte 1 - Pecado Original` (id `1nC4NESr1Th9CJgZ5igguMu2R-fV4vQxj`) e `Parte 2 - Confissão`
  (id `12TAiDKuAMIslaPBBLJXgXfybhYGGpF9y`). O storyboard, que cobre as duas partes, fica na pasta do episódio
  (`Ep. 03 - Storyboard (celular).pdf` e `(A4).pdf`); vídeo final, narração e brutos ficam na pasta de cada parte.
  No repositório a parte 2 tem o código `ep04` (arquivos ep04-*), mas tudo que o autor vê diz "Ep. 03 · Parte 2";
  nos nomes de arquivo, `Ep. 03 (Parte 2) - ...`.
- Dentro de cada pasta (do episódio, ou de cada parte):
  - `Ep. NN - <Título> - vídeo final.mp4`: o arquivo final na mais alta qualidade (a renderização original de `out/`).
  - `Ep. NN - Storyboard (celular).pdf` e `Ep. NN - Storyboard (A4).pdf`: o storyboard com tudo.
  - `Ep. NN - Narração com rubricas`: documento Google com o texto da narração, rubricas e pausas.
  - Subpastas com os arquivos brutos (pedido do autor): `Imagens (Canva)` (PNGs de cena em resolução cheia e
    recortes do elenco), `Clipes (fal.ai)` (MP4 originais do Kling) e `Áudio bruto` (gravação original do autor).
    Ep. 3 parte 1: `Imagens (Canva)` `1tRBhzN3KfyO5dxiU9WDwdwLiCPYWbtmZ`, `Clipes (fal.ai)` `1zZ_f-6vAB7a0COe38v02_idAGT5QKLAX`,
    `Áudio bruto` `1IB9dsbyDDfo0eZcnXRKPLH0DSJ2BkS4g`. Ep. 2: `Áudio bruto` `1Kdhc2zJsRW905mEcGic4tRTBmQ1X2cPm`
    (as três gravações; a v3 é a usada no vídeo).
    Ep. 3 parte 2: `Imagens (Canva)` `1mCW_4LiD0VjZ8kkK-RatISOUYk_aVqsa`, `Clipes (fal.ai)` `1niPwHoNNdEtq-U1jv2MboKX8-lHpcvFP`,
    `Áudio bruto` `1EitY1yaWs2bmPLyOka_Bgnl3EbL4APcl`.
    Ep. 1: `Imagens (Canva)` `1sldqYmFlRsE_2d4GELrFJVJDO6MWEajO`, `Clipes (fal.ai)` `1ft13T9rHWcupod8COpMrPcduI8M1gNt3`.
    Ep. 2: `Imagens (Canva)` `1cHn1cUuiSkVwpfS-LFVseUM9QhaxImKG`, `Clipes (fal.ai)` `1tUecUdEYTLgLbuA2TmVxxPQ9tq5wcDKR`.
  - O áudio do episódio fica fora do git (assets/audio/<ep>/), então só a sessão que recebeu a gravação consegue
    enviá-lo; gravações de até ~2,9 MB passam pelo conector do Drive. O vídeo final (out/) também fica fora do git:
    envie da própria sessão que renderizou, pela ponte (o `final.sh` já faz isso sozinho quando há DRIVE_PONTE).

Como enviar: `python3 -I scripts/drive_enviar.py` (upload retomável, sem limite de tamanho; substitui arquivo de mesmo nome).
- `pasta "Episódio NN - Tema"` acha ou cria a subpasta e imprime o id.
- `enviar <arquivo> --pasta <id> --nome "..."`, com `--doc` para a narração virar documento Google.
- Credencial, cadastrada pelo autor nas variáveis de ambiente do ambiente "catecumenato" (nunca pedir no chat):
  DRIVE_PONTE, com a URL do app da Web do Apps Script do autor (código em `scripts/drive_ponte.gs`) e `?chave=...`.
  É gratuito e não expira enquanto a implantação existir. A alternativa com app OAuth no Google Cloud
  (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN) foi recusada pelo autor.
- Sem as variáveis, o conector do Drive serve de reserva: no máximo 10 MB por arquivo e cerca de 3,1 MB por chamada.
  Vídeos não passam por ele.

## Preferências de texto do autor

Português; sem travessões; sem as palavras proibidas listadas nas preferências do autor. O bordão
"E foi assim que eu aprendi. E agora você também." é sempre a última frase; qualquer chamada para o próximo
episódio vem antes dele.

## Storyboards

- Ep. 3 e 4 (em produção): `docs/ep03-04-storyboard.html`. Os quadros são montados com os recortes do elenco.
- Ep. 1: `docs/ep01-storyboard.html`. Os quadros são frames reais do vídeo final.
- PDF de celular: páginas de 412 × 915, um plano por página e nenhum cartão partido.
- Todo HTML de storyboard começa com `<meta charset="utf-8">`. Sem isso, o PDF sai com os acentos trocados.
