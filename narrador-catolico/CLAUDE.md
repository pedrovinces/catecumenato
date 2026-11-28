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

Limites do conector a partir da sessão na nuvem:
- No máximo 10 MB por arquivo e cerca de 3,1 MB de arquivo por chamada.
- Os vídeos finais (80 a 100 MB) não passam: mandar na conversa e avisar o autor para subir na pasta do episódio.
- PDF acima de 3,1 MB também não passa: avisar e perguntar como proceder.

## Preferências de texto do autor

Português; sem travessões; sem as palavras proibidas listadas nas preferências do autor. O bordão
"E foi assim que eu aprendi. E agora você também." é sempre a última frase; qualquer chamada para o próximo
episódio vem antes dele.

## Storyboards

- Ep. 3 e 4 (em produção): `docs/ep03-04-storyboard.html`. Os quadros são montados com os recortes do elenco.
- Ep. 1: `docs/ep01-storyboard.html`. Os quadros são frames reais do vídeo final.
- PDF de celular: páginas de 412 × 915, um plano por página e nenhum cartão partido.
- Todo HTML de storyboard começa com `<meta charset="utf-8">`. Sem isso, o PDF sai com os acentos trocados.
