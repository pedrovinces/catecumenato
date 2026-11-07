/* Dados fictícios para o modo demonstração (?demo=1). Não contém gabarito. */
(function () {
  var semente = 7;
  function rnd() { semente = (semente * 9301 + 49297) % 233280; return semente / 233280; }
  function nuvemDe(cx, cy, n, dx, dy) {
    var r = []; for (var i = 0; i < n; i++) r.push([Math.min(1, Math.max(0, cx + (rnd() - 0.5) * dx)), Math.min(1, Math.max(0, cy + (rnd() - 0.5) * dy))]);
    return r;
  }
  var pontos = [].concat(
    nuvemDe(0.5, 0.06, 14, 0.12, 0.03), nuvemDe(0.45, 0.092, 6, 0.04, 0.012), nuvemDe(0.55, 0.092, 5, 0.04, 0.012),
    nuvemDe(0.5, 0.13, 7, 0.06, 0.012), nuvemDe(0.5, 0.3, 9, 0.18, 0.08), nuvemDe(0.13, 0.6, 10, 0.07, 0.05),
    nuvemDe(0.87, 0.6, 9, 0.07, 0.05), nuvemDe(0.4, 0.97, 3, 0.06, 0.02), nuvemDe(0.6, 0.97, 2, 0.06, 0.02)
  );
  window.DEMO_DADOS = {
    palavras: {
      abertura: { 'morte': 9, 'extrema-unção': 6, 'padre': 7, 'fim': 5, 'óleo': 5, 'doença': 4, 'oração': 4, 'paz': 4, 'despedida': 3, 'medo': 3, 'hospital': 3, 'fé': 3, 'sacramento': 3, 'luto': 2, 'velório': 2, 'cura': 2, 'tristeza': 2, 'cuidado': 2 },
      final: { 'paz': 9, 'força': 8, 'esperança': 7, 'cura': 6, 'consolo': 5, 'graça': 5, 'coragem': 4, 'presença': 4, 'amor': 4, 'fé': 4, 'cuidado': 3, 'vida': 3, 'misericórdia': 3, 'oração': 3, 'alívio': 3, 'perdão': 2, 'comunidade': 2, 'morte': 1 }
    },
    votos: [
      { interacao: 'mito', item: 0, contagem: [17, 9] }, { interacao: 'mito', item: 1, contagem: [8, 18] },
      { interacao: 'mito', item: 2, contagem: [13, 13] }, { interacao: 'mito', item: 3, contagem: [7, 19] }
    ],
    regua: [{ interacao: 'quando', valores: [0, 0, 1, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5] }],
    mapa: [{ interacao: 'corpo', pontos: pontos }],
    toques: [{ interacao: 'efeitos', contagem: [3, 2, 19, 5, 6, 12, 8, 4] }],
    mural: [['Quem pede a unção: o doente ou a família?', 7], ['Pessoa em coma recebe a unção?', 5], ['Precisa se confessar antes?', 4], ['Criança doente recebe o sacramento?', 3]],
    intencoes: ['Maria', 'José', 'Antônio', 'Lúcia', 'Carmem', 'Rafael', 'Dona Neide', 'Paulo']
  };
  window.DEMO_QUIZ = [
    { ordem: 1, tipo: 'multipla', tempo: 20, texto: 'Segundo o Catecismo, além da angústia, a doença também se torna ocasião de…', opcoes: ['Castigo pelos pecados pessoais', 'Amadurecimento e retorno a Deus', 'Afastamento da comunidade', 'Prova de falta de fé'] },
    { ordem: 2, tipo: 'multipla', tempo: 20, texto: 'Qual carta do Novo Testamento descreve o rito de chamar os presbíteros para ungir o enfermo com óleo?', opcoes: ['Carta aos Romanos', 'Primeira Carta de Pedro', 'Carta de Tiago', 'Carta aos Hebreus'] },
    { ordem: 3, tipo: 'multipla', tempo: 20, texto: 'Quem administra validamente a Unção dos Enfermos?', opcoes: ['Bispos e presbíteros', 'Somente o bispo', 'Diáconos e ministros da Eucaristia', 'Qualquer batizado, em caso de urgência'] },
    { ordem: 4, tipo: 'multipla', tempo: 20, texto: 'Antes de uma cirurgia de alto risco, a Unção dos Enfermos…', opcoes: ['É proibida', 'Deve esperar o pós-operatório', 'É apropriada', 'Exige autorização do bispo'] },
    { ordem: 5, tipo: 'multipla', tempo: 20, texto: 'Quem se recuperou e, anos depois, adoece gravemente de novo…', opcoes: ['Não recebe: a Unção é única', 'Recebe a Unção outra vez', 'Recebe apenas a Confissão', 'Recebe somente se estiver inconsciente'] },
    { ordem: 6, tipo: 'multipla', tempo: 20, texto: 'Em que partes do corpo o rito romano atual unge o enfermo?', opcoes: ['Olhos, ouvidos e lábios', 'Peito e costas', 'Pés e mãos', 'Fronte e mãos'] },
    { ordem: 7, tipo: 'multipla', tempo: 25, texto: 'Qual é o óleo usado na Unção dos Enfermos?', opcoes: ['Óleo de oliva ou outro óleo vegetal, abençoado', 'Santo Crisma, o mesmo da Confirmação', 'Água benta misturada com óleo', 'Qualquer óleo, sem bênção'] },
    { ordem: 8, tipo: 'multipla', tempo: 30, texto: 'O que quer dizer “graça eclesial”?', opcoes: ['O sacramento vale somente dentro da igreja', 'A Igreja intercede pelo enfermo, e ele, unido a Cristo, contribui para a santificação de todos', 'A paróquia passa a cuidar do enfermo', 'O enfermo passa a fazer parte do clero'] },
    { ordem: 9, tipo: 'multipla', tempo: 20, texto: 'Qual é o último sacramento da vida do cristão?', opcoes: ['A Unção dos Enfermos', 'A Confissão', 'A Eucaristia como Viático', 'A Crisma'] },
    { ordem: 10, tipo: 'multipla', tempo: 20, texto: 'Qual era o nome antigo da Unção dos Enfermos?', opcoes: ['Extrema-Unção', 'Santa Bênção', 'Viático', 'Bênção final'] },
    { ordem: 11, tipo: 'numero', tempo: 25, numero_min: 1900, numero_max: 2025, texto: 'Desempate: em que ano Paulo VI promulgou a constituição que deu ao rito da Unção a forma atual?', opcoes: [] }
  ];
})();
