# Catequese interativa · Catecumenato São Judas Tadeu

Apresentações com interação pelo celular para os encontros do Catecumenato da Paróquia São Judas Tadeu (Arquidiocese de Niterói). O motor é reaproveitável: cada encontro é um arquivo de conteúdo em `aulas/<nome>/aula.js`.

## Endereços

| Página | Para quem | Endereço |
|---|---|---|
| Celular | participantes (QR Code) | `catecumenato.pedrovinces.com.br` |
| Telão | computador ligado ao projetor | `/palco.html` |
| Painel | celular do apresentador | `/apresentador.html` |
| Ensaio | sala separada, sem misturar com o encontro | acrescente `?s=uncao-ensaio` a qualquer página |
| Demonstração | prévia sem banco, com dados fictícios | acrescente `?demo=1` |

As três páginas precisam estar na mesma sala (`?s=`). Sem o parâmetro, a sala é `uncao`.

## Roteiro do dia

1. Abra o painel do projeto no Supabase alguns dias antes: no plano gratuito, o projeto pausa depois de uma semana com pouca atividade.
2. No computador do projetor, abra `/palco.html`, digite a chave do apresentador e aperte `F` para tela cheia.
3. No seu celular, abra `/apresentador.html` com a mesma chave: avançar, voltar, ir para qualquer slide, aprovar perguntas do mural.
4. Ao terminar, use **Encerrar** no painel: as selfies e os nomes das intenções são descartados.

## Teclas do telão

| Tecla | Ação |
|---|---|
| `→`, espaço, `PageDown` | próximo passo ou slide (funciona com passador de slides) |
| `←`, `PageUp` | voltar |
| `F` | tela cheia |
| `Q` | mostrar ou esconder o QR Code no canto |
| `B` | tela preta |
| `Home` / `End` | primeiro / último slide |

Slides com dinâmica têm passos: a nuvem acende primeiro as palavras de fim e depois as de força; a régua mostra o marcador do Catecismo; o mapa mostra fronte e mãos e depois os sentidos (até 1972); o quiz abre, conta o tempo e mostra a resposta.

## Pontuação

- Acerto no quiz: de 500 a 1000 pontos, conforme a rapidez (calculado no servidor).
- Bônus: 50 pontos por dinâmica respondida durante a aula (nuvens, mito ou verdade, régua, mapa, caça).
- Desempate: proximidade na pergunta numérica; depois, o menor tempo somado nos acertos.
- O gabarito fica somente no banco e aparece na sala depois que o apresentador revela a resposta.

## Nova aula

1. Copie `aulas/uncao` para `aulas/<novo-nome>` e edite `aula.js` (tipos de slide disponíveis: `capa`, `entrada`, `nuvem`, `foto`, `sacramentos`, `texto`, `citacao`, `titulo`, `regua`, `mito`, `tres`, `mapa`, `rito`, `caca`, `efeitos`, `eclesial`, `testemunho`, `comparar`, `mural`, `quiz-intro`, `quiz`, `ranking`, `podio`, `intencoes`, `final`).
2. Carregue as perguntas e o gabarito no banco (tabelas `quiz_perguntas` e `quiz_gabarito`) com o mesmo `aula`. O arquivo de gabarito não vai para este repositório.
3. Abra as páginas com `?a=<novo-nome>`.

## Estrutura

```
index.html · palco.html · apresentador.html
js/      config.js (endereço do banco e domínio) · nucleo.js · palco.js · celular.js · apresentador.js
css/     marca.css (identidade da logo) · palco.css · celular.css
aulas/   uncao/aula.js · uncao/demo.js · uncao/img/
sql/     01-esquema.sql (documentação do banco)
```

Banco: Supabase `catequese-interativa` (São Paulo). A chave pública em `js/config.js` é feita para ficar no navegador; a segurança está nas regras de linha e nas funções do banco, que exigem a chave do apresentador para qualquer comando.
