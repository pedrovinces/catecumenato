/* Aula: Unção dos Enfermos · Catecumenato 2026 · Paróquia São Judas Tadeu
   Narrativa: um plantão no Hospital São Judas Tadeu.
   O gabarito do quiz fica no banco (tabela quiz_gabarito), nunca neste arquivo. */
window.AULA = {
  id: 'uncao',
  titulo: 'Unção dos Enfermos',
  edicao: 'Catecumenato 2026',
  img: 'aulas/uncao/img/',
  bonusPorDinamica: 50,
  /* som de cada pergunta do quiz: vinheta ao entrar, trilha na metade dela, silêncio ao revelar */
  somQuiz: { efeito: 'vinheta.mp3', efeitoVolume: 1, musica: 'suspense2.mp3', volume: 0.55 },

  slides: [
    { tipo: 'capa', titulo: ['Unção dos', 'Enfermos'], subtitulo: 'Um sacramento de cura', kicker: 'Catecumenato 2026',
      imagem: 'capa-gota.jpg', rodape: 'Paróquia São Judas Tadeu · Arquidiocese de Niterói',
      nota: 'Boas-vindas. Peça que todos peguem o celular.' },

    { tipo: 'entrada', titulo: 'Aponte a câmera', somGota: true,
      texto: 'Tire uma selfie e veja sua gota cair no frasco.',
      nota: 'Cada pessoa que entra vira uma gota com o próprio rosto e cai no frasco de óleo; o apelido aparece ao lado. Quem não tem celular joga em dupla com o vizinho.' },

    { tipo: 'nuvem', id: 'abertura', kicker: 'Primeira palavra',
      pergunta: 'Em uma palavra: o que vem à sua cabeça quando ouve “Unção dos Enfermos”?',
      grupos: {
        fim: ['morte', 'morrer', 'fim', 'final', 'extrema', 'extrema-uncao', 'extrema uncao', 'ultim', 'despedida', 'adeus', 'velorio', 'luto', 'enterro', 'perda', 'medo', 'tristeza', 'partida', 'terminal', 'leito de morte', 'moribundo', 'agonia'],
        forca: ['paz', 'cura', 'forca', 'esperanca', 'consolo', 'conforto', 'coragem', 'graca', 'fe', 'amor', 'alivio', 'saude', 'vida', 'misericordia', 'perdao', 'reconforto', 'cuidado', 'presenca', 'acolhimento', 'oracao', 'serenidade', 'confianca', 'bencao', 'protecao', 'salvacao']
      },
      passos: ['Coleta', 'Acender “fim”', 'Acender “força”'],
      musica: 'suspense.mp3', musicaQuando: 'resposta', volume: 0.55,
      nota: 'A música começa sozinha com a primeira palavra e some ao trocar de slide. Deixe a nuvem crescer. Primeiro acenda as palavras de fim, depois as de força.' },

    { tipo: 'foto', imagem: 'hospital-fachada.jpg', transicao: 'entrar', origem: '50% 86%',
      kicker: 'Hospital São Judas Tadeu', legenda: 'Hoje, você entra comigo num plantão.',
      nota: 'Convite: entrar pela porta do hospital.' },

    { tipo: 'foto', imagem: 'hospital-recepcao.jpg', transicao: 'entrar', origem: '50% 52%',
      kicker: 'Recepção', legenda: 'Antes do leito, uma pergunta: o que a Igreja leva a quem sofre?' },

    { tipo: 'sacramentos', titulo: 'Os sacramentos', imagem: 'sacramentos.jpg',
      lista: ['Batismo', 'Eucaristia', 'Crisma', 'Confissão', 'Unção dos Enfermos', 'Matrimônio', 'Ordem'],
      destaque: [3, 4], rotulo: 'Sacramentos de cura',
      nota: 'Situe a Unção ao lado da Confissão: os dois sacramentos de cura.' },

    { tipo: 'texto', kicker: 'CIC 1500-1501', titulo: ['A enfermidade', 'na vida humana'],
      itens: [
        'Acompanha a humanidade desde sempre e faz a pessoa tocar os próprios limites.',
        'Leva à angústia, ao fechamento em si mesmo e até à revolta contra Deus.',
        'Também amadurece, ajuda a distinguir o essencial e muitas vezes faz buscar a Deus.'
      ],
      imagens: ['enfermidade-mulher.jpg', 'enfermidade-familia.jpg'] },

    { tipo: 'foto', imagem: 'uti-enfermeira.jpg', transicao: 'portas', kicker: 'UTI · 23h40',
      legenda: 'As portas da UTI se abrem.', nota: 'Narre a chegada ao leito.' },

    { tipo: 'regua', id: 'quando', kicker: 'Você no plantão',
      pergunta: 'O paciente piorou. Em que momento você chamaria o padre?',
      pontos: ['Diagnóstico de doença grave', 'Véspera de cirurgia de risco', 'Internação', 'Piora na enfermaria', 'Intubado na UTI', 'Últimas horas'],
      certo: [0, 1],
      marcador: 'O Catecismo indica a Unção desde o início do perigo, por doença ou velhice, e antes de uma cirurgia importante.',
      fonte: 'CIC 1514-1515',
      passos: ['Coleta', 'Mostrar o Catecismo'],
      musica: 'suspense.mp3', musicaQuando: 'resposta', volume: 0.55,
      nota: 'A música começa com a primeira resposta e sai quando você mostra o Catecismo. Mostre a mediana da sala e conte o que você vê na UTI: o padre que chega quando o paciente já não responde.' },

    { tipo: 'foto', imagem: 'uti-piora.jpg', transicao: 'suave', kicker: 'UTI · 02h15', legenda: 'O plantonista liga para a família.' },
    { tipo: 'foto', imagem: 'uti-familia.jpg', transicao: 'suave', kicker: 'UTI · 06h30', legenda: 'A família chega.' },
    { tipo: 'foto', imagem: 'uti-medico-familia.jpg', transicao: 'suave', kicker: 'UTI · 07h00', legenda: 'Após notícias ruins, a família pede ajuda ao médico para receber o sacerdote.' },
    { tipo: 'foto', imagem: 'uti-padre.jpg', transicao: 'suave', kicker: 'UTI · 07h20',
      legenda: 'Quem entra agora é Cristo, pelas mãos da Igreja.', nota: 'Pausa. Deixe a imagem falar.' },

    { tipo: 'texto', kicker: 'Mt 10,8 · Mc 6,13 · Tg 5,14-15', titulo: ['“Curai os', 'enfermos”'],
      itens: [
        'Cristo convida os discípulos a tomar a cruz e segui-lo (Mt 10,38).',
        'A Igreja recebeu do Senhor a missão de curar e a cumpre cuidando dos doentes e intercedendo por eles (Mt 10,8).',
        'Os apóstolos já ungiam os enfermos com óleo (Mc 6,13), e São Tiago atesta o rito próprio (Tg 5,14-15).'
      ],
      passagens: [
        { ref: 'Mt 10,8', texto: 'Curai os enfermos, ressuscitai os mortos, limpai os leprosos, expeli os demônios. Dai de graça o que de graça recebestes.' },
        { ref: 'Mt 10,38', texto: 'O que não toma a sua cruz e não me segue, não é digno de mim.' },
        { ref: 'Mc 6,13', texto: 'Expeliam muitos demônios, ungiam com óleo muitos enfermos, e curavam-nos.' },
        { ref: 'Tg 5,14-15', texto: 'Está entre vós algum enfermo? Chame os sacerdotes da Igreja, e estes façam orações sobre ele, ungindo-o com óleo em nome do Senhor; a oração da fé salvará o enfermo e o Senhor o aliviará; se estiver com pecados, ser-lhe-ão perdoados.' }
      ],
      nota: 'Passe o mouse sobre uma citação para mostrar o versículo; clique nela, ou use os botões do painel, para abrir a passagem em destaque. Clique fora ou toque em Fechar passagem para fechar.',
      imagem: 'curai-jesus.jpg' },

    { tipo: 'citacao', texto: 'Alguém dentre vós está doente? Mande chamar os presbíteros da Igreja.', autor: 'Tg 5,14',
      complemento: 'São Tiago descreve o rito: a oração dos presbíteros, a unção com óleo no nome do Senhor e a promessa de alívio e de perdão.' },

    { tipo: 'mito', id: 'mito', kicker: 'Mito ou verdade?', opcoes: ['Mito', 'Verdade'],
      efeito: 'vinheta.mp3', efeitoVolume: 1, musica: 'suspense2.mp3', volume: 0.55, efeitoPorItem: true,
      itens: [
        { t: 'A Unção é reservada a quem está morrendo.', r: 0, exp: 'Não é sacramento reservado aos que estão à beira da morte.', fonte: 'CIC 1514' },
        { t: 'Faz sentido receber a Unção antes de uma cirurgia de alto risco.', r: 1, exp: 'O Catecismo indica a Unção antes de uma cirurgia importante.', fonte: 'CIC 1515' },
        { t: 'O diácono administra a Unção dos Enfermos.', r: 0, exp: 'Somente bispos e presbíteros administram o sacramento.', fonte: 'CIC 1516; CDC cân. 1003 §1' },
        { t: 'Quem já recebeu recebe de novo se a doença se agravar.', r: 1, exp: 'Repete-se em nova doença grave ou no agravamento da mesma.', fonte: 'CIC 1515; CDC cân. 1004 §2' }
      ],
      nota: 'A cada afirmação toca a vinheta e a trilha de suspense começa no meio dela; ao mostrar a resposta, a trilha sai (M silencia tudo). Para cada afirmação: espere os votos, depois avance para mostrar a resposta.' },

    { tipo: 'tres', titulo: ['Unção dos', 'Enfermos'], imagem: 'uncao-familia.jpg', fonte: 'CIC 1514-1516; CDC cân. 1003-1004',
      colunas: [
        { t: 'Finalidade', itens: ['Força, paz e coragem diante da doença.', 'Pedir a cura, se for da vontade de Deus.'] },
        { t: 'Quem recebe', itens: ['Todo batizado com uso da razão em perigo por doença grave ou velhice.', 'Antes de cirurgia de alto risco.', 'Mais de uma vez, se a doença voltar ou se agravar.'] },
        { t: 'Quem administra', itens: ['Somente os sacerdotes: bispos e presbíteros.'] }
      ] },

    { tipo: 'mapa', id: 'corpo', kicker: 'O gesto',
      pergunta: 'Toque nos lugares onde o sacerdote unge o enfermo. Você tem até 3 toques.',
      passos: ['Coleta', 'Fronte e mãos', 'Antes de 1972'],
      musica: 'suspense.mp3', musicaQuando: 'resposta', volume: 0.55,
      atual: { texto: 'Fronte e mãos', fonte: 'Paulo VI, Sacram Unctionem Infirmorum, 1972 · CIC 1513' },
      antigo: { texto: 'Até 1972, ungiam-se os sentidos: olhos, ouvidos, narinas, lábios, mãos e pés.' },
      nota: 'A trilha de suspense começa com o primeiro toque e sai quando você mostra fronte e mãos. Mostre o mapa de calor. Quem tocou olhos e lábios não errou: está 50 anos atrasado.' },

    { tipo: 'rito', titulo: 'O rito', fonte: 'Sacram Unctionem Infirmorum · CIC 1513 · CDC cân. 999 e 1003',
      blocos: [
        { t: 'Matéria', d: 'Óleo de oliva ou outro óleo vegetal, abençoado: o Óleo dos Enfermos. Em caso de necessidade, o presbítero o benze na própria celebração.' },
        { t: 'Gesto e palavra', d: 'Unção na fronte e nas mãos, com uma oração dita uma única vez.', citacao: '“…o Senhor venha em teu auxílio com a graça do Espírito Santo.”' },
        { t: 'Ministro', d: 'O bispo ou o presbítero.' }
      ],
      nota: 'Leia a fórmula completa do Ritual em voz alta.' },

    { tipo: 'caca', id: 'efeitos', kicker: 'Caça aos intrusos',
      pergunta: 'Toque nos intrusos: o que NÃO é efeito da Unção dos Enfermos?',
      itens: [
        'Reconforto, paz e coragem diante da doença',
        'União mais íntima com a Paixão de Cristo',
        'Garante a cura do corpo',
        'A Igreja intercede, e o enfermo contribui para a santificação de todos',
        'Perdão dos pecados',
        'É o último sacramento do cristão',
        'Restabelecimento da saúde, se convier à salvação',
        'Preparação para a passagem à vida eterna'
      ],
      intrusos: [2, 5],
      fontes: ['CIC 1520', 'CIC 1521', 'CIC 1520', 'CIC 1522', 'CIC 1520; Tg 5,15', 'CIC 1517 e 1524', 'CIC 1520', 'CIC 1523'],
      passos: ['Coleta', 'Mostrar os intrusos'],
      efeito: 'vinheta.mp3', efeitoVolume: 1, musica: 'suspense2.mp3', volume: 0.55, efeitoPorItem: true,
      nota: 'Ao entrar, toca a vinheta e a trilha de suspense começa no meio dela; ao mostrar os intrusos, a trilha sai (M silencia).' },

    { tipo: 'efeitos', titulo: ['Efeitos', 'espirituais'],
      itens: [
        { t: 'Reconforto e coragem', d: 'Dom do Espírito Santo contra o desânimo e o medo da morte.', f: 'CIC 1520' },
        { t: 'União com a Paixão de Cristo', d: 'O sofrimento ganha sentido novo: participa da obra salvífica de Jesus.', f: 'CIC 1521' },
        { t: 'Graça eclesial', d: 'A Igreja intercede pelo enfermo, e ele colabora com o bem de todos.', f: 'CIC 1522' },
        { t: 'Preparação para a passagem', d: 'Completa a configuração com a morte e a ressurreição de Cristo.', f: 'CIC 1523' }
      ],
      imagem: 'efeitos-padre.jpg' },

    { tipo: 'eclesial', titulo: 'Graça eclesial', fonte: 'CIC 1522', somGota: true,
      texto: 'Ninguém é ungido sozinho. A Igreja inteira reza pelo enfermo, e o enfermo, unido a Cristo, oferece-se pela Igreja.',
      legenda: 'Cada gota desta sala faz parte dessa intercessão.',
      nota: 'As gotas de todos os participantes se reúnem ao redor da gota central.' },

    { tipo: 'titulo', kicker: 'CIC 1517 · 1524', titulo: ['E o último', 'sacramento?'],
      texto: 'É a Eucaristia, recebida como Viático: o alimento para a passagem à vida eterna.' },

    { tipo: 'testemunho', kicker: 'O que busca um doente?', fotos: ['igor-pb.jpg', 'igor-sorriso.jpg'],
      citacao: 'O leito de hospital tem algo de altar.', autor: 'Igor Pavan Três', papel: 'ex-seminarista', data: '06/04/2025',
      nota: 'Leia o texto completo do Igor. O próximo slide traz o texto integral, se quiser projetar.' },

    { tipo: 'relato', kicker: 'O texto do Igor', titulo: ['O que busca um doente?', 'A cura!'], opcional: true,
      paragrafos: [
        'O leito de hospital tem algo de altar.',
        'Ali, onde o corpo fraqueja e a alma se inquieta, a verdade aparece sem maquiagem.',
        'Já não há como disfarçar a dor, nem fingir força. A fragilidade não pede licença - ela simplesmente vem. E com ela vem também o silêncio que nos obriga a olhar para dentro.',
        'Vê-se mais do que febre ou ferida. Vê-se o pecado acumulado, a pressa com que se viveu, as coisas que se deixaram para depois. Tudo pesa. Tudo grita.',
        'Mas ali também está Ele.',
        'Jesus não assiste de longe. Senta-se à beira do leito. Escuta até o que não dizes. Sofre contigo.',
        'E Maria, Mãe de verdade, passa. Com mãos que não curam só o corpo mas acalmam o coração.',
        'Eles não prometem fuga da dor. Mas estão ali, presentes. Fiéis. E isso muda tudo.'
      ],
      autor: 'Igor Pavan Três', papel: 'ex-seminarista', data: '06/04/2025',
      fotos: ['igor-pb.jpg', 'igor-sorriso.jpg'],
      nota: 'Texto integral do Igor. Leia devagar, com o texto na tela, ou pule.' },

    { tipo: 'testemunho', kicker: 'Fé e medicina', fotos: ['igor-batina.jpg'],
      citacao: 'Entre a fé e a medicina, não há guerra. Há encontro.', autor: 'Igor Pavan Três', papel: 'ex-seminarista', data: '15 de maio',
      nota: 'Ponte com a sua vida de médico.' },

    { tipo: 'relato', variante: 'documento', kicker: 'O testamento do Igor', titulo: ['Testamento espiritual'], aspas: false, opcional: true,
      epigrafe: '“Em vossas mãos, Senhor, entrego o meu espírito.” (Sl 30,6)',
      paginas: [
        [
          'Sentindo a possibilidade do desenlace e do encontro com o Juiz, cujo dia e hora somente Ele conhece, mas consciente das minhas condições de saúde e das debilidades que me acompanham, decidi escrever estas linhas como meu testamento espiritual.',
          'Nada sei sobre o tempo que ainda me será concedido. Sei, porém, que a vida é breve e que cada dia é uma preparação silenciosa para comparecer diante d’Aquele que é a Verdade.',
          'Ofereço a cruz que me foi confiada, com suas dores, limitações e incertezas, pela Santa Igreja, pelo Santo Padre, pelo Bispo Diocesano, por todo o Clero, pela conversão dos pecadores, pelos que sofrem no corpo e na alma, pelas almas do purgatório e pelos cristãos perseguidos em tantas partes do mundo. Ofereço-a também em reparação pelos meus pecados e pelos pecados do mundo.'
        ],
        [
          'Sei que o sofrimento, por si só, não santifica automaticamente. Ele pode endurecer ou purificar. Em minha fraqueza, reconheço que muitas vezes fui infiel. Contudo, posso testemunhar que a dor me ensinou a não permanecer afastado de Deus por muito tempo. Como um cavalo indócil que tenta fugir, fui mantido nas rédeas pelo Senhor, que se serviu do sofrimento para impedir minha fuga definitiva. Se hoje permaneço, é por misericórdia, não por mérito.',
          'Peço perdão, de modo particular e público, a todos os que foram afetados por minhas iniquidades, palavras, omissões ou escândalos. Àqueles a quem prejudiquei direta ou indiretamente, rogo que me perdoem. Confio que Deus saberá reparar aquilo que eu não soube ou não pude reparar suficientemente.'
        ],
        [
          'Agradeço aos meus familiares, que me sustentaram com amor paciente; aos amigos, que permaneceram; aos profissionais de saúde, que me serviram com competência e humanidade; e a todos os benfeitores que, de modo visível ou oculto, aliviaram meu caminho. Cada gesto foi instrumento da Providência.',
          'Rogo à Advogada, Maria Santíssima, que me ampare na hora decisiva e interceda por mim junto a seu Filho. Confio-me à Misericórdia de Deus, único fundamento da minha esperança.',
          'Se for chamado, peço ao Senhor que me conceda o descanso eterno enquanto aguardo, na comunhão dos santos, a ressurreição da carne e a vida do mundo que há de vir.'
        ]
      ],
      autor: 'Igor Pavan Três', data: '20 de fevereiro de 2026',
      fotos: ['igor-batina.jpg'],
      nota: 'Testamento espiritual do Igor, em 3 páginas: avance para virar cada página. Leia devagar.' },

    { tipo: 'nuvem', id: 'final', kicker: 'Última palavra', comparar: 'abertura',
      pergunta: 'E agora? Em uma palavra: o que é a Unção dos Enfermos para você?',
      passos: ['Coleta'],
      musica: 'suspense.mp3', musicaQuando: 'resposta', volume: 0.55,
      nota: 'Mesma pergunta da abertura, com outra moldura. A trilha de suspense começa com a primeira palavra, como no slide 3.' },

    { tipo: 'comparar', a: 'abertura', b: 'final', titulo: 'Antes e depois',
      nota: 'Leia os percentuais: quanto da sala falava de fim na abertura e quanto fala agora.' },

    { tipo: 'quiz-intro', titulo: 'Passagem de plantão',
      efeito: 'vinheta.mp3', efeitoVolume: 1, musica: 'suspense.mp3', volume: 0.5,
      nota: 'Abertura do quiz: vinheta e trilha de suspense nº 1 de fundo enquanto você explica as regras.',
      texto: 'Antes de sair, todo plantonista passa o caso adiante. Agora é a sua vez.',
      regras: ['10 perguntas sobre o que vimos hoje', 'Acerto vale de 500 a 1000 pontos: quanto mais rápido, mais pontos', 'Cada dinâmica respondida durante a aula já rendeu 50 pontos', 'O primeiro lugar leva o prêmio'] },

    { tipo: 'quiz', ordem: 1 }, { tipo: 'quiz', ordem: 2 }, { tipo: 'quiz', ordem: 3 },
    { tipo: 'ranking', titulo: 'Placar do plantão', limite: 5 },
    { tipo: 'quiz', ordem: 4 }, { tipo: 'quiz', ordem: 5 }, { tipo: 'quiz', ordem: 6 },
    { tipo: 'ranking', titulo: 'Placar do plantão', limite: 5 },
    { tipo: 'quiz', ordem: 7 }, { tipo: 'quiz', ordem: 8 }, { tipo: 'quiz', ordem: 9 },
    { tipo: 'ranking', titulo: 'Placar do plantão', limite: 5 },
    { tipo: 'quiz', ordem: 10 },
    { tipo: 'quiz', ordem: 11, desempate: true },
    { tipo: 'podio', titulo: 'Alta com louvor', nota: 'Chame o primeiro lugar para receber o prêmio e confira o apelido no celular.' },

    { tipo: 'intencoes', titulo: 'Por quem vamos rezar?',
      texto: 'Escreva somente o primeiro nome de alguém enfermo. Os nomes aparecem aqui e são apagados ao final.',
      nota: 'Conduza a oração pelos enfermos enquanto os nomes sobem. Ao terminar, use Encerrar no painel.' },

    { tipo: 'texto', kicker: '11 de fevereiro', titulo: ['Dia Mundial', 'do Enfermo'],
      itens: [
        'Instituído por São João Paulo II em 1992, na memória de Nossa Senhora de Lourdes.',
        'Uma boa data para a comunidade celebrar a Unção com os seus enfermos (CIC 1517).'
      ] },

    { tipo: 'final', imagem: 'alta.jpg', titulo: 'Obrigado', legenda: 'Alta do plantão.' }
  ]
};
