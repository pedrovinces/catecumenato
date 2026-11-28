# Narrador Católico · instruções do projeto

## Entrega no Google Drive (pedido do autor)

Sempre que um vídeo e o seu storyboard ficarem prontos, enviar para a pasta do projeto no Drive:
"Projeto Narrador Católico", id `1u5STBEjiF2uLkfnZ0VXFGFgx6UD3QDEE`
(https://drive.google.com/drive/folders/1u5STBEjiF2uLkfnZ0VXFGFgx6UD3QDEE).

Organização (seguir o padrão que o autor criou):
- Uma subpasta por episódio, no formato `Episódio NN - Tema` (ex.: `Episódio 01 - Cores Litúrgicas`,
  id `1AM161fpBEZontD4dF3qVtcwPmgxC7Uu1`; `Episódio 02 - Infalibilidade Papal`, id `1zpf3JhUHx5k33wHYi1EZ0HT4bmHZvqN7`).
  Episódio novo: criar a subpasta no mesmo formato.
- Dentro dela:
  - `Ep. NN - <Título> - vídeo final.mp4`: o arquivo final na mais alta qualidade (a renderização original de `out/`).
  - `Ep. NN - Storyboard (celular).pdf` e `Ep. NN - Storyboard (A4).pdf`: o storyboard com tudo.
  - `Ep. NN - Narração com rubricas`: documento Google com o texto da narração, rubricas e pausas.

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
