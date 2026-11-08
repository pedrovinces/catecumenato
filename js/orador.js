/* Painel do orador · controle remoto do telão no iPad, com roteiro, respostas e monitor ao vivo */
(function () {
  'use strict';
  var C = window.Catequese, esc = C.esc, SALA = C.SALA;
  var $ = function (id) { return document.getElementById(id); };
  var A, slides, loja, chave = null;
  var roteiro = null, gabarito = {}, monitor = null;
  var idxVisto = -1, vendo = null, slideDesde = Date.now(), timerVivo = null, timerMonitor = null, ultimoPintarVivo = 0;
  var abaAtual = 'vivo';
  var encontro = C.ler('cat-encontro', null) || { inicio: null, pausa: null, acum: 0 };
  var tamFala = +C.ler('cat-tam-fala', '21') || 21;

  /* ---------- utilidades ---------- */
  function fmt(n) { return Number(n || 0).toLocaleString('pt-BR'); }
  function pct(a, b) { return b ? Math.round(a * 100 / b) : 0; }
  function mmss(ms) { var s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function mediana(v) { if (!v.length) return null; v = v.slice().sort(function (a, b) { return a - b; }); var m = v.length >> 1; return v.length % 2 ? v[m] : Math.round((v[m - 1] + v[m]) / 2 - 0.01); }
  function texto(t) {
    return esc(t || '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\[([^\]]{2,40})\]/g, function (m, x) { return '<span class="lacuna vazia" data-lac="' + esc(x) + '">[' + esc(x) + ']</span>'; });
  }
  function toast(t, erro) {
    var el = $('toast'); el.textContent = t; el.className = 'toast on' + (erro ? ' err' : '');
    clearTimeout(el._t); el._t = setTimeout(function () { el.className = 'toast' + (erro ? ' err' : ''); }, 2600);
  }
  function nomeDe(a) { var j = loja.jogadores[a]; return j ? j.apelido : 'alguém'; }
  function nJog() { return Object.keys(loja.jogadores).length; }
  var ICONES = {
    som: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
    mudo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
    cheia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    sair: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/></svg>'
  };

  /* rola somente a coluna, sem mexer na página (scrollIntoView arrasta a barra de cima para fora da tela) */
  function rolarPara(col, el, centro) {
    var y = 0, n = el;
    while (n && n !== col) { y += n.offsetTop; n = n.offsetParent; }
    var alvo = centro ? y - col.clientHeight / 2 + el.offsetHeight / 2 : y - 12;
    col.scrollTo({ top: Math.max(0, alvo), behavior: 'smooth' });
  }

  /* ---------- telão: comandos e estado ---------- */
  /* o telão aparece por dois caminhos: presença em tempo real e um pulso gravado no banco a cada poucos segundos */
  var estadoPalco = null, assinaturaEstado = '';
  function pulsoOn() {
    if (!estadoPalco || !estadoPalco.visto) return false;
    var idade = new Date(estadoPalco.agora).getTime() - new Date(estadoPalco.visto).getTime();
    return idade < 25000 && Date.now() - estadoPalco.recebido < 30000;
  }
  function meta() { return (loja && loja.palcoOnline && loja.palcoMeta) || (pulsoOn() ? estadoPalco.meta : null) || (loja && loja.palcoMeta); }
  function telaoOn() { return C.DEMO ? !!meta() : !!((loja && loja.palcoOnline) || pulsoOn()); }
  function buscarEstado() {
    if (!chave || C.DEMO || !loja) return;
    loja.rpc('orador_estado', { p_chave: chave, p_sala: SALA }).then(function (r) {
      var d = r && r.data; if (!d) return;
      d.recebido = Date.now(); estadoPalco = d;
      var ass = JSON.stringify(d.meta) + (pulsoOn() ? '1' : '0');
      if (ass !== assinaturaEstado) { assinaturaEstado = ass; if (!loja.palcoOnline || !loja.palcoMeta) pintar(); }
    });
  }
  function cmd(c, okMsg) {
    if (!loja.sala) { toast('A sala ainda não existe: abra o telão no computador do projetor e digite a chave.', true); return Promise.resolve(); }
    if (!telaoOn()) toast('Comando enviado, mas o telão está fechado.', true);
    return loja.rpc('comandar', { p_chave: chave, p_sala: SALA, p_comando: c }).then(function (r) {
      if (r && r.error) toast(/chave/.test(r.error.message) ? 'Chave recusada.' : 'Falha ao enviar: ' + r.error.message, true);
      else if (okMsg) toast(okMsg);
      return r;
    });
  }
  function indiceTelao() {
    var m = meta();
    if (m && typeof m.i === 'number' && m.i >= 0) return m.i;
    return loja.sala ? +loja.sala.slide || 0 : 0;
  }
  function passoTelao(idx) {
    var m = meta();
    if (m && m.i === idx) return { p: +m.p || 0, n: +m.n || 1, q: m.q || null };
    return { p: 0, n: 1, q: null };
  }

  /* ---------- rótulos ---------- */
  var TIPOS = { capa: 'Capa', entrada: 'Entrada', nuvem: 'Nuvem de palavras', foto: 'Foto', sacramentos: 'Sacramentos', texto: 'Texto', regua: 'Régua', citacao: 'Citação', mito: 'Mito ou verdade', tres: 'Resumo', mapa: 'Mapa do corpo', rito: 'Rito', caca: 'Caça aos intrusos', efeitos: 'Efeitos', eclesial: 'Gotas', titulo: 'Título', testemunho: 'Testemunho', relato: 'Relato', comparar: 'Antes e depois', 'quiz-intro': 'Abertura do quiz', quiz: 'Pergunta', ranking: 'Placar', podio: 'Pódio', intencoes: 'Intenções', final: 'Final' };
  function rotSlide(i) { return (roteiro && roteiro.slides && roteiro.slides[String(i + 1)]) || null; }
  function tituloDe(i) {
    var r = rotSlide(i), s = slides[i];
    if (s.tipo === 'quiz') { var q = loja.pergunta(s.ordem); return q ? (q.tipo === 'numero' ? 'Desempate' : 'Pergunta ' + s.ordem) : 'Pergunta ' + s.ordem; }
    if (r && r.titulo) return r.titulo;
    var t = s.titulo || s.pergunta || s.legenda || s.kicker || s.citacao || TIPOS[s.tipo] || s.tipo;
    return Array.isArray(t) ? t.join(' ') : String(t);
  }
  function multiplas() { return loja.perguntas.filter(function (q) { return q.tipo === 'multipla'; }).length; }

  /* ---------- roteiro ---------- */
  function tipoDoRotulo(r) {
    var x = (r || '').toLowerCase();
    if (!x) return 'nota';
    if (/^(fale|oração|leia)/.test(x)) return 'fala';
    if (/^na tela/.test(x)) return 'tela';
    if (/^no celular/.test(x)) return 'celular';
    if (/^(música|som)/.test(x)) return 'som';
    if (/^atenção/.test(x)) return 'atencao';
    return 'faca';
  }
  function passoDoRotulo(r) {
    var x = (r || '').toLowerCase();
    var pg = x.match(/^leia.*página (\d+) de/);   /* textos em páginas (testamento do Igor): destaca a página no telão */
    if (pg) return +pg[1] - 1;
    if (!/^fale/.test(x)) return null;
    if (/terceiro/.test(x)) return 3;
    if (/segundo/.test(x)) return 2;
    if (/depois do (primeiro )?toque/.test(x)) return 1;
    if (/, com (o|a|as|os) /.test(x)) return 0;
    return null;
  }
  function htmlBloco(b, k, extra) {
    var tipo = tipoDoRotulo(b.r), ps = passoDoRotulo(b.r), h = '';
    if (b.tabela) {
      h = '<table>' + b.tabela.map(function (l, i) { return '<tr data-l="' + i + '">' + l.map(function (c) { return i ? '<td>' + texto(c) + '</td>' : '<th>' + texto(c) + '</th>'; }).join('') + '</tr>'; }).join('') + '</table>';
      return '<div class="bloco tabela" data-k="' + k + '">' + h + '</div>';
    }
    if (b.r) h += '<span class="rot">' + esc(b.r.replace(/[.:]+$/, '')) + '</span>';
    if (tipo === 'fala' && b.t && !b.fala) h += '<p>' + texto(b.t.replace(/^"|"$/g, '')) + '</p>';
    else if (b.t) h += '<p>' + texto(b.t) + '</p>';
    (b.fala || []).forEach(function (f) { h += '<p>' + texto(f) + '</p>'; });
    if (b.itens) h += '<ul>' + b.itens.map(function (x) { return '<li>' + texto(x) + '</li>'; }).join('') + '</ul>';
    return '<div class="bloco ' + tipo + '" data-k="' + k + '"' + (ps != null ? ' data-passo="' + ps + '"' : '') + '>' + h + (extra || '') + '</div>';
  }
  function pintarRoteiro(forcar) {
    var i = vendo != null ? vendo : indiceTelao(), s = slides[i], r = rotSlide(i);
    var box = $('roteiro');
    if (!forcar && box.dataset.i === String(i) && box.dataset.carregado === (roteiro ? '1' : '0')) { marcarPasso(); preencherLacunas(); return; }
    box.dataset.i = String(i); box.dataset.carregado = roteiro ? '1' : '0';
    var parte = '';
    if (roteiro) roteiro.partes.forEach(function (p) { if (p.slides.indexOf(i + 1) >= 0) parte = p.titulo; });
    var metaH = [];
    if (r && r.tempo) metaH.push('<span class="chip">' + esc(r.tempo) + '</span>');
    if (s.opcional || (r && r.opcional)) metaH.push('<span class="chip ouro">opcional</span>');
    metaH.push('<span class="chip">' + esc(TIPOS[s.tipo] || s.tipo) + '</span>');
    $('cab-slide').innerHTML = '<div class="kick">' + esc(parte || A.titulo) + '</div><h1><span class="n">' + (i + 1) + '</span>' + esc(tituloDe(i)) + '</h1><div class="meta">' + metaH.join('') + '</div>';
    var h = '';
    if (!roteiro) h = '<p class="vazio">' + (chave ? 'O roteiro ainda não chegou. Ele é lido do banco com a chave; confira a conexão.' : 'Entre com a chave para ver o roteiro.') + '</p>' + (s.nota ? htmlBloco({ r: 'Nota do slide', t: s.nota }, 0) : '');
    else if (!r) h = '<p class="vazio">Este slide não tem fala no roteiro.</p>' + (s.nota ? htmlBloco({ r: 'Nota do slide', t: s.nota }, 0) : '');
    else {
      if (s.tipo === 'quiz' && r.gabarito) h += htmlBloco({ r: 'Comente em uma frase', t: r.gabarito.frase + (r.gabarito.fonte ? ' (' + r.gabarito.fonte + ')' : '') }, 'g');
      var comBotoes = false;
      h += r.blocos.map(function (b, k) {
        if (s.passagens && s.passagens.length && !comBotoes && /^passage/i.test(b.r || '')) { comBotoes = true; return htmlBloco(b, k, botoesPassagem(s, i)); }
        return htmlBloco(b, k);
      }).join('');
      if (s.passagens && s.passagens.length && !comBotoes) h = htmlBloco({ r: 'Passagens no telão' }, 'p', botoesPassagem(s, i)) + h;
      if (r.quiz && roteiro.quiz) h += '<details class="comum"><summary>Como cada pergunta funciona</summary>' + roteiro.quiz.map(function (b, k) { return htmlBloco(b, 'q' + k); }).join('') + '</details>';
    }
    box.innerHTML = h;
    if (s.passagens && s.passagens.length) ligarRefs(box, s);
    marcarPassagens();
    var prox = slides[i + 1];
    if (prox) {
      var rp = rotSlide(i + 1), primeira = '';
      if (rp) rp.blocos.some(function (b) { if (tipoDoRotulo(b.r) === 'fala') { primeira = (b.fala && b.fala[0]) || b.t || ''; return true; } return false; });
      $('proximo').innerHTML = 'Depois: <b>' + (i + 2) + ' · ' + esc(tituloDe(i + 1)) + '</b>' + (primeira ? '<p>' + texto(primeira.length > 160 ? primeira.slice(0, 157) + '…' : primeira) + '</p>' : '');
    } else $('proximo').innerHTML = 'Último slide da apresentação.';
    if (vendo == null) $('col-roteiro').scrollTop = 0;
    marcarPasso(true); preencherLacunas();
  }
  /* passagens bíblicas: botões dentro da rubrica e as citações do roteiro viram links que abrem e fecham o popup no telão */
  function botoesPassagem(s, i) {
    var noTelao = indiceTelao() === i;
    return '<div class="botoes-passagem">' + s.passagens.map(function (p, k) {
      return '<button class="ref-bt" type="button" data-passagem="' + k + '" data-ref="' + esc(p.ref) + '"' + (noTelao ? '' : ' disabled') + '><b>' + esc(p.ref) + '</b><span>' + esc(p.texto.length > 70 ? p.texto.slice(0, 68) + '…' : p.texto) + '</span></button>';
    }).join('') + '<button class="ref-bt fechar" type="button" data-passagem="fechar"' + (noTelao ? '' : ' disabled') + '><b>Fechar no telão</b><span>fecha o popup aberto</span></button></div>' +
      (noTelao ? '' : '<p class="nota">Os botões funcionam quando o telão estiver neste slide.</p>');
  }
  function ligarRefs(box, s) {
    var refs = s.passagens.map(function (p) { return p.ref; }).sort(function (a, b) { return b.length - a.length; });
    var re = new RegExp('(' + refs.map(function (r) { return r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')(?![\\d-])');
    var w = document.createTreeWalker(box, NodeFilter.SHOW_TEXT), nos = [];
    while (w.nextNode()) { var n = w.currentNode; if (n.parentNode.closest('.botoes-passagem, .rot')) continue; if (re.test(n.nodeValue)) nos.push(n); }
    nos.forEach(function (no) {
      var frag = document.createDocumentFragment();
      no.nodeValue.split(re).forEach(function (parte, k) {
        if (!parte) return;
        if (k % 2) {
          var idx = -1; s.passagens.some(function (p, j) { if (p.ref === parte) { idx = j; return true; } return false; });
          var b = document.createElement('button'); b.type = 'button'; b.className = 'ref-link'; b.dataset.passagem = idx; b.dataset.ref = parte; b.textContent = parte;
          frag.appendChild(b);
        } else frag.appendChild(document.createTextNode(parte));
      });
      no.parentNode.replaceChild(frag, no);
    });
  }
  function marcarPassagens() {
    var m = meta(), aberta = m && m.passagem, i = +$('roteiro').dataset.i, noTelao = indiceTelao() === i;
    Array.prototype.forEach.call(document.querySelectorAll('#roteiro [data-passagem]'), function (b) {
      var k = b.dataset.passagem;
      if (k === 'fechar') { b.disabled = !noTelao || !aberta; return; }
      b.classList.toggle('on', !!aberta && b.dataset.ref === aberta);
      if (b.classList.contains('ref-bt')) b.disabled = !noTelao;
    });
  }

  /* destaca a fala do passo em que o telão está (primeiro toque, segundo toque…) */
  function marcarPasso(rolar) {
    var box = $('roteiro'), i = +box.dataset.i, ativo = vendo == null || vendo === indiceTelao();
    var ps = passoTelao(i), s = slides[i], tem = ps.n > 1;
    var blocos = box.querySelectorAll('.bloco[data-passo]'), alvo = null;
    var algum = false;
    Array.prototype.forEach.call(blocos, function (b) { if (+b.dataset.passo === ps.p) algum = true; });
    Array.prototype.forEach.call(blocos, function (b) {
      var sim = ativo && tem && algum && +b.dataset.passo === ps.p;
      b.classList.toggle('agora', sim); b.classList.toggle('outro', ativo && tem && algum && !sim);
      if (sim && !alvo) alvo = b;
    });
    if (s && s.tipo === 'mito') {
      var item = Math.floor(ps.p / 2);
      Array.prototype.forEach.call(box.querySelectorAll('.tabela tr'), function (tr) { tr.classList.toggle('agora', ativo && +tr.dataset.l === item + 1); });
    }
    var chave2 = i + ':' + ps.p;
    if (alvo && box.dataset.rolado !== chave2) { box.dataset.rolado = chave2; if (!rolar || ps.p > 0) rolarPara($('col-roteiro'), alvo); }
  }
  /* lacunas do roteiro, como [leia a coluna], preenchidas com os números da sala */
  function preencherLacunas() {
    var box = $('roteiro'), i = +box.dataset.i, s = slides[i]; if (!s) return;
    var vals = null;
    if (s.tipo === 'regua') {
      var v = loja.valoresRegua(s.id), md = mediana(v);
      vals = function () { return md != null ? s.pontos[md] : null; };
    } else if (s.tipo === 'comparar') {
      var a = estatNuvem(s.a), b = estatNuvem(s.b), seq = [a.fim + '%', b.fim + '%', a.forca + '%', b.forca + '%'], k = 0;
      if (!a.tot && !b.tot) seq = [null, null, null, null];
      vals = function () { return seq[k++] || null; };
    }
    if (!vals) return;
    Array.prototype.forEach.call(box.querySelectorAll('.lacuna'), function (el) {
      var x = vals();
      if (x != null) { el.textContent = x; el.classList.remove('vazia'); } else { el.textContent = '[' + el.dataset.lac + ']'; el.classList.add('vazia'); }
    });
  }
  function gruposDe(id) { for (var i = 0; i < slides.length; i++) if (slides[i].tipo === 'nuvem' && slides[i].id === id && slides[i].grupos) return slides[i].grupos; return null; }
  function estatNuvem(id) {
    var sl = null; slides.forEach(function (s) { if (s.tipo === 'nuvem' && s.id === id) sl = s; });
    var itens = loja.nuvem(id, gruposDe(sl && sl.comparar ? sl.comparar : id)), tot = 0, fim = 0, forca = 0;
    itens.forEach(function (it) { tot += it.n; if (it.grupo === 'fim') fim += it.n; if (it.grupo === 'forca') forca += it.n; });
    return { itens: itens, tot: tot, fim: pct(fim, tot), forca: pct(forca, tot) };
  }

  /* ---------- barra de navegação ---------- */
  function rotulosNav(i) {
    var s = slides[i], ps = passoTelao(i), prox = slides[i + 1];
    var seguinte = ['Próximo slide', prox ? (i + 2) + ' · ' + tituloDe(i + 1) : 'fim da apresentação'];
    var t = null;
    switch (s.tipo) {
      case 'nuvem': if (ps.p < ps.n - 1) t = [(s.passos && s.passos[ps.p + 1]) || 'Próximo passo', 'passo ' + (ps.p + 2) + ' de ' + ps.n]; break;
      case 'regua': if (ps.p === 0) t = ['Mostrar o Catecismo', 'acende as colunas certas']; break;
      case 'mito':
        var it = Math.floor(ps.p / 2), N = s.itens.length;
        if (ps.p % 2 === 0) t = ['Carimbar a resposta', 'afirmação ' + (it + 1) + ' de ' + N];
        else if (it < N - 1) t = ['Próxima afirmação', (it + 2) + ' de ' + N];
        break;
      case 'mapa': if (ps.p === 0) t = ['Mostrar fronte e mãos', 'resposta do rito atual']; else if (ps.p === 1) t = ['Mostrar o rito antigo', 'sentidos ungidos até 1972']; break;
      case 'caca': if (ps.p === 0) t = ['Mostrar os intrusos', 'risca as duas frases']; break;
      case 'relato': if (ps.p < ps.n - 1) t = ['Virar a página', 'página ' + (ps.p + 2) + ' de ' + ps.n]; break;
      case 'podio': if (ps.p < 3) t = [['Mostrar o 3º lugar', 'Mostrar o 2º lugar', 'Mostrar o 1º lugar'][ps.p], ps.p === 2 ? 'com confete e o prêmio' : 'pódio']; break;
      case 'quiz':
        if (ps.q === 'preparada' || (!ps.q && !(loja.sala && loja.sala.quiz_aberta_em))) t = ['Abrir pergunta', 'inicia o cronômetro'];
        else if (ps.q === 'aberta' || ps.q === 'encerrada') t = ['Mostrar a resposta', 'encerra a votação agora'];
        break;
    }
    return { av: t || seguinte, volta: ps.p > 0 ? 'desfaz o último passo' : (i > 0 ? 'slide ' + i : 'primeiro slide') };
  }
  function pintarNav() {
    var i = indiceTelao(), r = rotulosNav(i), ps = passoTelao(i);
    $('tit-avancar').textContent = r.av[0]; $('sub-avancar').textContent = r.av[1];
    $('sub-voltar').textContent = r.volta;
    var h = '';
    if (ps.n > 1 && ps.n <= 12) for (var k = 0; k < ps.n; k++) h += '<i class="' + (k < ps.p ? 'feito' : k === ps.p ? 'agora' : '') + '"></i>';
    $('passos').innerHTML = h;
  }
  function avancar() {
    var i = indiceTelao(), s = slides[i], ps = passoTelao(i);
    if (s && s.tipo === 'quiz' && meta() && meta().i === i) {
      if (ps.q === 'preparada') return cmd('quiz:abrir');
      if (ps.q === 'aberta' || ps.q === 'encerrada') return cmd('quiz:revelar');
    }
    return cmd('avancar');
  }

  /* ---------- relógios ---------- */
  function guardarEncontro() { C.guardar('cat-encontro', JSON.stringify(encontro)); }
  function decorrido() { if (!encontro.inicio) return 0; return encontro.acum + (encontro.pausa ? 0 : Date.now() - encontro.inicio); }
  function alternarEncontro() {
    if (!encontro.inicio) { encontro = { inicio: Date.now(), pausa: null, acum: 0 }; toast('Cronômetro do encontro iniciado.'); }
    else if (encontro.pausa) { encontro.inicio = Date.now(); encontro.pausa = null; toast('Cronômetro retomado.'); }
    else { encontro.acum += Date.now() - encontro.inicio; encontro.pausa = Date.now(); toast('Cronômetro pausado.'); }
    guardarEncontro(); relogios();
  }
  function planejadoAte(i) { var t = 0; for (var k = 0; k < i; k++) { var r = rotSlide(k); t += (r && r.seg) || 0; } return t * 1000; }
  function relogios() {
    var i = indiceTelao(), r = rotSlide(i), plan = r && r.seg ? r.seg * 1000 : 0, el = Date.now() - slideDesde;
    var bs = $('p-tempo-slide');
    bs.querySelector('b').textContent = mmss(el);
    bs.querySelector('em').textContent = plan ? 'de ' + mmss(plan) : '';
    bs.querySelector('.trilho span').style.width = plan ? Math.min(100, 100 * el / plan) + '%' : '0';
    bs.classList.toggle('estourou', !!plan && el > plan);
    var bt = $('p-tempo-total'), d = decorrido();
    bt.querySelector('b').textContent = encontro.inicio ? mmss(d) : 'iniciar';
    var em = bt.querySelector('em'); bt.classList.remove('atrasado', 'adiantado');
    if (encontro.inicio && roteiro) {
      var delta = d - planejadoAte(i), min = Math.round(delta / 60000);
      if (Math.abs(delta) < 60000) em.textContent = encontro.pausa ? 'pausado' : 'no ritmo';
      else { em.textContent = (min > 0 ? 'atrasado ' : 'adiantado ') + Math.abs(min) + ' min'; bt.classList.add(min > 0 ? 'atrasado' : 'adiantado'); }
      if (encontro.pausa) em.textContent = 'pausado';
    } else em.textContent = encontro.inicio && encontro.pausa ? 'pausado' : '';
  }

  /* ---------- barra superior ---------- */
  function pintarBarra() {
    var on = telaoOn(), m = meta(), i = indiceTelao();
    var pt = $('p-telao'); pt.classList.toggle('on', on);
    pt.querySelector('span').textContent = !on ? 'telão fechado' : C.DEMO ? 'telão (demonstração)' : m && m.cheia ? 'telão · tela cheia' : 'telão · janela';
    $('p-slide').textContent = 'Slide ' + (i + 1) + ' de ' + slides.length;
    $('p-gente').querySelector('b').textContent = fmt(nJog());
    var mudo = !!(m && m.mudo);
    $('b-mudo').innerHTML = mudo ? ICONES.mudo : ICONES.som; $('b-mudo').classList.toggle('on', mudo);
    $('b-mudo').setAttribute('aria-label', mudo ? 'Ligar o som do telão' : 'Silenciar o telão');
    $('vol-txt').textContent = volAtual() + '%';
    var f = $('faixa'), aviso = '';
    if (chave && !on && !C.DEMO) aviso = 'O telão está fechado. Abra palco.html no computador do projetor, sala ' + SALA + '.';
    else if (on && m && m.chave === false) aviso = 'O telão abriu sem a chave: os celulares não acompanham. Digite a chave no telão.';
    else if (on && m && m.inicio) aviso = 'O telão espera um clique para liberar o som da apresentação: clique uma vez na tela do telão. Depois disso, todas as músicas e gotas entram sozinhas.';
    else if (on && m && (m.som === 'bloqueado' || m.gota === 'bloqueada')) aviso = 'O som do telão está bloqueado pelo navegador (música e gotas): um clique na tela do telão, a tecla F ou um toque no botão dourado do canto libera.';
    else if (on && m && m.preto) aviso = 'O telão está com a tela preta. Toque em Tela preta na aba Telão para voltar.';
    f.textContent = aviso; f.hidden = !aviso;
  }

  /* ---------- aba Ao vivo ---------- */
  function cartao(titulo, extra, corpo) { return '<div class="cartao"><h3>' + titulo + (extra ? '<small>' + extra + '</small>' : '') + '</h3>' + corpo + '</div>'; }
  function barra(rot, n, total, cls, forma) {
    return '<div class="barra ' + (cls || '') + '"><div class="enche" style="width:' + pct(n, Math.max(total, 1)) + '%"></div>' + (forma != null ? C.formaSVG(forma) : '<span></span>') +
      '<span class="tx">' + esc(rot) + '</span><span class="n">' + fmt(n) + '<small>' + pct(n, total) + '%</small></span></div>';
  }
  function cartaoZerar() {
    return '<div class="cartao zerar"><h3>Começar do zero</h3><p class="nota">Apaga participantes, selfies, respostas, pontos e intenções desta sala, leva o telão ao slide 1 e faz todos os celulares voltarem ao cadastro completo, com selfie nova.</p>' +
      '<button class="bt perigo grande" type="button" data-zerar="1">Zerar tudo e começar do início</button></div>';
  }
  function pedirZerar() { $('modal-zerar').hidden = false; $('b-zerar-sim').focus(); }
  function zerarTudo() {
    $('modal-zerar').hidden = true;
    var b = $('b-zerar-sim'); b.disabled = true;
    loja.rpc('sala_limpar', { p_chave: chave, p_sala: SALA }).then(function (r) {
      b.disabled = false;
      if (r && r.data) toast('Tudo zerado: o telão voltou ao slide 1 e os celulares pedem cadastro novo.');
      else toast('Não foi possível zerar: ' + ((r && r.error && r.error.message) || 'sem resposta do banco'), true);
    });
  }
  /* geração nova da sala (zerada aqui ou em outro painel): o painel recomeça junto */
  var geracaoVista = null;
  function verGeracao() {
    var g = loja.geracao(); if (g == null) return;
    if (geracaoVista == null) { geracaoVista = g; return; }
    if (g === geracaoVista) return;
    geracaoVista = g; monitor = null; idxVisto = -1; vendo = null;
    encontro = { inicio: null, pausa: null, acum: 0 }; guardarEncontro();
    loja.zerar().then(function () { pintar(); pintarVivo(); });
  }
  function vivoPassagens(s) {
    if (!s.passagens || !s.passagens.length) return '';
    var aberta = meta() && meta().passagem;
    return cartao('Passagens', 'abrem em destaque no telão', '<div class="grade2">' + s.passagens.map(function (p, i) {
      return '<button class="bt passagem-bt' + (aberta === p.ref ? ' on' : '') + '" type="button" data-passagem="' + i + '"><b>' + esc(p.ref) + '</b><span>' + esc(p.texto.length > 90 ? p.texto.slice(0, 88) + '…' : p.texto) + '</span></button>';
    }).join('') + '</div><button class="bt" type="button" data-passagem="fechar"' + (aberta ? '' : ' disabled') + '>Fechar passagem</button>');
  }
  function vivoEntrada() {
    var js = loja.listaJogadores(), n = js.length, total = +C.ler('cat-sala-total', '0') || 0;
    var corpo = '<div class="numeros"><div><small>entraram</small><b class="ouro">' + fmt(n) + '</b></div>' +
      (total ? '<div><small>da sala</small><b' + (pct(n, total) >= 80 ? ' class="ok"' : '') + '>' + pct(n, total) + '%</b></div>' : '') + '</div>' +
      (total ? '<div class="barra"><div class="enche" style="width:' + Math.min(100, pct(n, total)) + '%"></div><span></span><span class="tx">meta: 80% da sala (' + Math.ceil(total * 0.8) + ' pessoas)</span><span class="n">' + fmt(n) + '/' + fmt(total) + '</span></div>' : '') +
      '<label class="nota" style="display:flex;align-items:center;gap:10px">Pessoas na sala <input id="w-total" type="number" inputmode="numeric" min="0" max="999" value="' + (total || '') + '" style="width:90px;font:16px var(--fonte);padding:8px;border-radius:10px;border:0;-webkit-user-select:text;user-select:text"></label>' +
      (n ? '<div class="nota">Últimos a entrar</div><div class="nomes">' + js.slice(-12).reverse().map(function (j) { return '<span class="nome">' + esc(j.apelido) + '</span>'; }).join('') + '</div>' : '<p class="nota">Ninguém entrou ainda.</p>');
    return cartao('Entrada', '', corpo);
  }
  function vivoNuvem(s, ps) {
    var e = estatNuvem(s.id), pessoas = loja.participantesDe('palavras', s.id), top = e.itens.slice(0, 14), max = top.length ? top[0].n : 1;
    var corpo = '<div class="numeros"><div><small>palavras</small><b>' + fmt(e.tot) + '</b></div><div><small>pessoas</small><b>' + fmt(pessoas) + '</b></div>' +
      (s.grupos || s.comparar ? '<div><small>falam de fim</small><b>' + e.fim + '%</b></div><div><small>de força</small><b class="ouro">' + e.forca + '%</b></div>' : '') + '</div>' +
      (s.passos && s.passos.length > 1 ? '<p class="nota">No telão agora: <b>' + esc(s.passos[ps.p] || '') + '</b></p>' : '') +
      '<div class="barras">' + (top.length ? top.map(function (it) { return barra(it.label, it.n, max, it.grupo || ''); }).join('') : '<p class="nota">As palavras aparecem aqui assim que chegarem.</p>') + '</div>';
    return cartao('Nuvem ao vivo', '', corpo);
  }
  function vivoRegua(s, ps) {
    var v = loja.valoresRegua(s.id), c = s.pontos.map(function () { return 0; }), md = mediana(v);
    v.forEach(function (x) { if (c[x] != null) c[x]++; });
    var corpo = '<div class="numeros"><div><small>respostas</small><b>' + fmt(v.length) + '</b></div><div><small>mediana da sala</small><b class="ouro" style="font-size:20px">' + (md != null ? esc(s.pontos[md]) : '–') + '</b></div></div>' +
      '<div class="barras">' + s.pontos.map(function (p, i) { return barra(p + (i === md ? ' · mediana' : ''), c[i], v.length, s.certo.indexOf(i) >= 0 ? 'certa' : ''); }).join('') + '</div>' +
      '<p class="nota">' + (ps.p ? 'O marcador do Catecismo já está no telão.' : 'Resposta do Catecismo (em dourado): ainda escondida no telão.') + '</p>';
    return cartao('Régua ao vivo', '', corpo);
  }
  function vivoMito(s, ps, i) {
    var it = Math.floor(ps.p / 2), x = s.itens[it], rev = ps.p % 2 === 1, c = loja.contarVotos(s.id, it, s.opcoes.length), t = c.reduce(function (a, b) { return a + b; }, 0);
    var r = rotSlide(i), dizer = '';
    if (r) r.blocos.forEach(function (b) { if (b.tabela && b.tabela[it + 1]) dizer = b.tabela[it + 1][3] || ''; });
    var corpo = '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="kick">Afirmação ' + (it + 1) + ' de ' + s.itens.length + '</span><span class="estado-q' + (rev ? ' revelada' : ' valendo') + '">' + (rev ? 'carimbada no telão' : 'votação aberta') + '</span></div>' +
      '<p class="perg">' + esc(x.t) + '</p>' +
      '<div class="resposta-certa"><div class="kick">Resposta</div><b>' + esc(s.opcoes[x.r]) + '</b><p>' + esc(x.exp) + ' <span class="fonte">' + esc(x.fonte || '') + '</span></p>' + (dizer ? '<p><b style="font-size:13px">Diga depois do carimbo:</b> ' + texto(dizer) + '</p>' : '') + '</div>' +
      '<div class="barras">' + s.opcoes.map(function (o, k) { return barra(o, c[k], t, k === x.r ? 'certa' : ''); }).join('') + '</div>' +
      '<div class="numeros"><div><small>votos</small><b>' + fmt(t) + '</b></div><div><small>acertando</small><b class="ok">' + pct(c[x.r], t) + '%</b></div></div>';
    return cartao('Mito ou verdade', '', corpo);
  }
  function vivoMapa(s, ps) {
    var pts = loja.pontosMapa(s.id), pessoas = loja.participantesDe('mapa', s.id), al = C.ALVOS_CORPO, certos = 0;
    pts.forEach(function (p) {
      var x = p.x * 400, y = p.y * 1000, perto = function (a, r) { return Math.hypot(x - a[0], y - a[1]) < r; };
      if (al.fronte.some(function (a) { return perto(a, 40); }) || al.maos.some(function (a) { return perto(a, 48); })) certos++;
    });
    var corpo = '<div class="numeros"><div><small>toques</small><b>' + fmt(pts.length) + '</b></div><div><small>pessoas</small><b>' + fmt(pessoas) + '</b></div><div><small>na fronte ou nas mãos</small><b class="ok">' + pct(certos, pts.length) + '%</b></div></div>' +
      '<div class="resposta-certa"><div class="kick">Resposta</div><b>' + esc(s.atual.texto) + '</b><p class="fonte">' + esc(s.atual.fonte) + '</p></div>' +
      '<p class="nota">No telão agora: <b>' + esc((s.passos || [])[ps.p] || '') + '</b></p>';
    return cartao('Mapa do corpo', '', corpo);
  }
  function vivoCaca(s, ps) {
    var c = loja.contarToques(s.id, s.itens.length);
    var corpo = '<div class="numeros"><div><small>pessoas caçando</small><b>' + fmt(c.pessoas) + '</b></div></div>' +
      '<div class="barras">' + s.itens.map(function (t, i) { return barra(t, c.porItem[i], c.pessoas, s.intrusos.indexOf(i) >= 0 ? 'intruso' : ''); }).join('') + '</div>' +
      '<p class="nota">' + (ps.p ? 'Os intrusos já estão riscados no telão.' : 'Os intrusos (em dourado) ainda estão escondidos no telão.') + '</p>';
    return cartao('Caça aos intrusos', '', corpo);
  }
  function vivoComparar(s) {
    var a = estatNuvem(s.a), b = estatNuvem(s.b);
    var corpo = '<div class="numeros"><div><small>fim na abertura</small><b>' + a.fim + '%</b></div><div><small>fim agora</small><b>' + b.fim + '%</b></div>' +
      '<div><small>força na abertura</small><b>' + a.forca + '%</b></div><div><small>força agora</small><b class="ouro">' + b.forca + '%</b></div></div>' +
      '<p class="nota">' + fmt(a.tot) + ' palavras na abertura e ' + fmt(b.tot) + ' agora. Os números entram também nas lacunas da fala, à esquerda.</p>';
    return cartao('Antes e depois', '', corpo);
  }
  function vivoIntencoes() {
    var l = loja.intencoes.slice().reverse();
    return cartao('Intenções recebidas', fmt(l.length), l.length ? '<div class="nomes">' + l.map(function (x) { return '<span class="nome">' + esc(x.nome) + '</span>'; }).join('') + '</div>' : '<p class="nota">Os nomes aparecem aqui à medida que chegam.</p>');
  }
  function vivoRanking(s, ps) {
    var r = monitor && monitor.ranking;
    if (!r) return cartao('Placar ao vivo', '', '<p class="nota">Carregando…</p>');
    if (!r.length) return cartao('Placar ao vivo', '', '<p class="nota">Ninguém pontuou ainda.</p>');
    var pod = s && s.tipo === 'podio';
    var corpo = '<div class="rank">' + r.map(function (j) {
      var rev = pod && ((j.pos === 3 && ps.p >= 1) || (j.pos === 2 && ps.p >= 2) || (j.pos === 1 && ps.p >= 3));
      return '<div class="lin' + (j.pos <= 3 ? ' top' : '') + (rev ? ' revelado' : '') + '"><span class="pos">' + j.pos + 'º</span><span>' + esc(j.apelido) + '</span><span class="ac">' + fmt(j.acertos) + '/' + fmt(j.respondidas) + ' acertos</span><span class="pts">' + fmt(j.total) + '</span></div>';
    }).join('') + '</div>' + (pod ? '<p class="nota">Confira o 1º lugar no celular da pessoa antes de entregar o prêmio: na tela dela aparece "1º".</p>' : '') + historicoHtml();
    return cartao(pod ? 'Pódio' : 'Placar ao vivo', 'inclui a pergunta em andamento', corpo);
  }
  function historicoHtml() {
    var hs = monitor && monitor.historico; if (!hs || !hs.length) return '';
    return '<div class="nota">Acerto da sala por pergunta</div><div class="historico">' + hs.map(function (h) {
      var p = pct(h.ok, h.n), q = loja.pergunta(h.ordem);
      return '<div><i style="height:' + Math.max(3, p * 0.5) + 'px"></i><span>' + (q && q.tipo === 'numero' ? 'D' : h.ordem) + '</span><span>' + p + '%</span></div>';
    }).join('') + '</div>';
  }
  function estadoQuiz(s) {
    var sala = loja.sala || {};
    if (+sala.quiz_ordem !== +s.ordem || !sala.quiz_aberta_em) return { e: 'pronta', rest: null };
    if (sala.quiz_revelada) return { e: 'revelada', rest: 0 };
    var tempo = sala.quiz_tempo || 20, rest = tempo - (loja.agora() - new Date(sala.quiz_aberta_em).getTime()) / 1000;
    return { e: rest > 0 ? 'valendo' : 'esgotado', rest: Math.max(0, rest) };
  }
  function vivoQuiz(s) {
    var q = loja.pergunta(s.ordem), g = gabarito[s.ordem] || {}, st = estadoQuiz(s), m = monitor && +monitor.ordem === +s.ordem ? monitor : null;
    if (!q) return cartao('Pergunta ' + s.ordem, '', '<p class="nota">Pergunta não encontrada no banco.</p>');
    if (m && m.correta != null) g = Object.assign({}, g, { correta: m.correta, valor: m.valor, comentario: m.comentario || g.comentario, fonte: m.fonte || g.fonte });
    var resp = m ? m.respostas : [], nj = m ? m.jogadores : nJog(), acertos = resp.filter(function (x) { return x.ok; }).length;
    var rot = rotSlide(slides.indexOf(s)), frase = rot && rot.gabarito ? rot.gabarito.frase : '';
    var rotEstado = { pronta: 'Pronta para abrir', valendo: 'Valendo', esgotado: 'Tempo esgotado', revelada: 'Resposta no telão' }[st.e];
    var h = '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="kick">' + (q.tipo === 'numero' ? 'Desempate' : 'Pergunta ' + q.ordem + ' de ' + multiplas()) + '</span>' +
      '<span class="estado-q ' + (st.e === 'valendo' ? 'valendo' : st.e === 'revelada' ? 'revelada' : '') + '">' + rotEstado + (st.e === 'valendo' ? ' · <span id="q-rest">' + Math.ceil(st.rest) + '</span>s' : '') + '</span></div>' +
      '<p class="perg">' + esc(q.texto) + '</p>';
    var certaTxt = q.tipo === 'numero' ? (g.valor != null ? String(g.valor) : '?') : (g.correta != null && q.opcoes[g.correta] != null ? q.opcoes[g.correta] : '?');
    h += '<div class="resposta-certa"><div class="kick">Resposta certa</div><b>' + (q.tipo !== 'numero' && g.correta != null ? '<span style="display:inline-block;width:22px;height:22px;vertical-align:-4px;margin-right:6px">' + C.formaSVG(g.correta) + '</span>' : '') + esc(certaTxt) + '</b>' +
      (frase ? '<p><b style="font-size:13px">Em uma frase:</b> ' + esc(frase) + '</p>' : '') + (g.comentario ? '<p>' + esc(g.comentario) + (g.fonte ? ' <span class="fonte">' + esc(g.fonte) + '</span>' : '') + '</p>' : '') + '</div>';
    if (q.tipo === 'multipla') {
      var tot = resp.length;
      h += '<div class="barras">' + q.opcoes.map(function (o, k) { return barra(o, resp.filter(function (x) { return +x.o === k; }).length, tot, k === +g.correta ? 'certa' : '', k); }).join('') + '</div>';
    }
    h += '<div class="numeros"><div><small>responderam</small><b>' + fmt(resp.length) + '<span style="font-size:16px;color:var(--suave)">/' + fmt(nj) + '</span></b></div>' +
      (q.tipo === 'multipla' ? '<div><small>acertaram</small><b class="ok">' + fmt(acertos) + '</b></div><div><small>acerto</small><b class="ok">' + pct(acertos, resp.length) + '%</b></div>' : '') + '</div>';
    var acoes = '';
    if (st.e === 'pronta') acoes = '<button class="bt ouro grande" type="button" data-acao="quiz:abrir">Abrir pergunta</button>';
    else if (st.e === 'valendo' || st.e === 'esgotado') acoes = '<button class="bt ouro grande" type="button" data-acao="quiz:revelar">Mostrar a resposta agora</button>';
    if (acoes) h += '<div class="acoes">' + acoes + '</div>';
    var corpo = cartao('Quiz ao vivo', '', h);
    if (resp.length || st.e !== 'pronta') {
      var ok = resp.filter(function (x) { return x.ok; }).sort(function (a, b) { return a.ms - b.ms; });
      var err = resp.filter(function (x) { return !x.ok; });
      var vistos = {}; resp.forEach(function (x) { vistos[x.a] = 1; });
      var faltam = loja.listaJogadores().filter(function (j) { return !vistos[j.aparelho]; });
      var lista = '';
      if (q.tipo === 'numero') {
        var alvo = g.valor != null ? +g.valor : null;
        var ord = resp.slice().sort(function (a, b) { return alvo == null ? 0 : Math.abs(a.v - alvo) - Math.abs(b.v - alvo); });
        lista += '<div class="nota">Mais perto do ano certo</div><div class="nomes">' + ord.map(function (x) { return '<span class="nome' + (alvo != null && +x.v === alvo ? ' ok' : '') + '">' + esc(nomeDe(x.a)) + ' <span class="t">' + esc(x.v) + (alvo != null ? ' · ' + Math.abs(x.v - alvo) : '') + '</span></span>'; }).join('') + '</div>';
      } else {
        lista += '<div class="nota">Acertaram (' + ok.length + '), do mais rápido ao mais lento</div><div class="nomes">' + (ok.length ? ok.map(function (x) { return '<span class="nome ok">' + esc(nomeDe(x.a)) + ' <span class="t">' + (x.ms / 1000).toFixed(1) + ' s · ' + fmt(x.pts) + '</span></span>'; }).join('') : '<span class="nota">ninguém ainda</span>') + '</div>';
        lista += '<div class="nota">Erraram (' + err.length + ')</div><div class="nomes">' + (err.length ? err.map(function (x) { return '<span class="nome erro">' + C.formaSVG(+x.o) + esc(nomeDe(x.a)) + '</span>'; }).join('') : '<span class="nota">ninguém</span>') + '</div>';
      }
      if (faltam.length && st.e !== 'pronta') lista += '<div class="nota">Ainda não responderam (' + faltam.length + ')</div><div class="nomes">' + faltam.slice(0, 40).map(function (j) { return '<span class="nome">' + esc(j.apelido) + '</span>'; }).join('') + (faltam.length > 40 ? '<span class="nota">e mais ' + (faltam.length - 40) + '</span>' : '') + '</div>';
      corpo += cartao('Quem respondeu', '', lista);
    }
    if (monitor && monitor.ranking && monitor.ranking.length) {
      corpo += cartao('Placar ao vivo', 'top 5, inclui esta pergunta', '<div class="rank">' + monitor.ranking.slice(0, 5).map(function (j) {
        return '<div class="lin' + (j.pos <= 3 ? ' top' : '') + '"><span class="pos">' + j.pos + 'º</span><span>' + esc(j.apelido) + '</span><span class="ac">' + fmt(j.acertos) + ' acertos</span><span class="pts">' + fmt(j.total) + '</span></div>';
      }).join('') + '</div>' + historicoHtml());
    }
    return corpo;
  }
  function pintarVivo() {
    ultimoPintarVivo = Date.now();
    var box = $('aba-vivo'), i = indiceTelao(), s = slides[i], ps = passoTelao(i);
    if (document.activeElement && box.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;
    var h = '';
    switch (s.tipo) {
      case 'entrada': h = vivoEntrada(); break;
      case 'nuvem': h = vivoNuvem(s, ps); break;
      case 'regua': h = vivoRegua(s, ps); break;
      case 'mito': h = vivoMito(s, ps, i); break;
      case 'mapa': h = vivoMapa(s, ps); break;
      case 'caca': h = vivoCaca(s, ps); break;
      case 'comparar': h = vivoComparar(s); break;
      case 'intencoes': h = vivoIntencoes(); break;
      case 'quiz': h = vivoQuiz(s); break;
      case 'ranking': case 'podio': case 'quiz-intro': h = vivoRanking(s, ps); break;
      case 'eclesial': h = cartao('Gotas no telão', '', '<div class="numeros"><div><small>participantes</small><b class="ouro">' + fmt(nJog()) + '</b></div></div>'); break;
      default: h = cartao(esc(TIPOS[s.tipo] || 'Slide'), '', '<div class="numeros"><div><small>participantes</small><b>' + fmt(nJog()) + '</b></div></div>' + (s.nota ? '<p class="nota">' + esc(s.nota) + '</p>' : ''));
    }
    h += vivoPassagens(s);
    if (i <= 1) h = cartaoZerar() + h;
    var col = $('col-lado'), topo = col.scrollTop;
    box.innerHTML = h;
    col.scrollTop = topo;
    var w = $('w-total');
    if (w) w.addEventListener('change', function () { C.guardar('cat-sala-total', String(Math.max(0, +w.value || 0))); pintarVivo(); });
  }
  var pendenteVivo = null;
  function pedirVivo() {
    if (pendenteVivo) return;
    var espera = Math.max(0, 350 - (Date.now() - ultimoPintarVivo));
    pendenteVivo = setTimeout(function () { pendenteVivo = null; pintarVivo(); }, espera);
  }
  function precisaMonitor() { var s = slides[indiceTelao()]; return s && ['quiz', 'ranking', 'podio', 'quiz-intro'].indexOf(s.tipo) >= 0; }
  function buscarMonitor() {
    if (!chave || !loja.sala) return;
    loja.rpc('orador_monitor', { p_chave: chave, p_sala: SALA }).then(function (r) {
      if (r && r.data) { monitor = r.data; if (abaAtual === 'vivo') pedirVivo(); }
    });
  }
  function lacoMonitor() {
    clearTimeout(timerMonitor);
    if (precisaMonitor()) buscarMonitor();
    timerMonitor = setTimeout(lacoMonitor, precisaMonitor() ? 1500 : 6000);
  }

  /* ---------- aba Slides ---------- */
  function montarLista() {
    var h = '', parteDe = {};
    if (roteiro) roteiro.partes.forEach(function (p) { if (p.slides.length) parteDe[p.slides[0]] = p.titulo; });
    slides.forEach(function (s, i) {
      if (parteDe[i + 1]) h += '<li class="parte">' + esc(parteDe[i + 1]) + '</li>';
      var r = rotSlide(i);
      h += '<li class="it" data-i="' + i + '"><span class="n">' + (i + 1) + '</span><span class="t">' + esc(tituloDe(i)) + '<small>' + esc(TIPOS[s.tipo] || s.tipo) + (r && r.tempo ? ' · ' + esc(r.tempo) : '') + (s.opcional || (r && r.opcional) ? ' · opcional' : '') + '</small></span>' +
        '<button class="bt ir" type="button" data-ir="' + i + '">Ir</button></li>';
    });
    $('lista').innerHTML = h;
    marcarLista();
  }
  function marcarLista() {
    var i = indiceTelao();
    Array.prototype.forEach.call($('lista').querySelectorAll('.it'), function (li) {
      li.classList.toggle('atual', +li.dataset.i === i); li.classList.toggle('vendo', vendo != null && +li.dataset.i === vendo);
    });
  }
  function previa(i) {
    vendo = i === indiceTelao() ? null : i;
    var p = $('previa');
    if (vendo != null) { p.hidden = false; p.innerHTML = '<span>Prévia do slide ' + (i + 1) + '. O telão está no ' + (indiceTelao() + 1) + '.</span><span style="display:flex;gap:6px"><button class="bt" type="button" data-ir="' + i + '">Ir para ele</button><button class="bt ouro" type="button" id="b-voltar-atual">Voltar ao atual</button></span>'; }
    else p.hidden = true;
    pintarRoteiro(true); marcarLista();
  }

  /* ---------- aba Telão ---------- */
  var NOMES_FORMATO = { auto: 'Automático', '169': '16:9', '43': '4:3 com faixas', '43c': '4:3 compensado' };
  function montarTelao() {
    var base = location.origin + location.pathname.replace(/[^/]*$/, '');
    var url = base + 'palco.html' + (SALA !== C.AULA_ID ? '?s=' + encodeURIComponent(SALA) : '');
    $('aba-telao').innerHTML =
      cartao('Telão', '<span id="t-estado"></span>',
        '<div class="grade3"><button class="bt" type="button" data-cmd="preto" id="b-preto">Tela preta</button><button class="bt" type="button" data-cmd="qr" id="b-qr">QR no canto</button><button class="bt" type="button" data-cmd="recarregar">Recarregar telão</button></div>') +
      cartao('Formato da tela', '<span id="t-formato"></span>',
        '<div class="grade4" id="formatos">' + ['auto', '169', '43', '43c'].map(function (f) { return '<button class="bt" type="button" data-cmd="formato:' + f + '" data-f="' + f + '">' + NOMES_FORMATO[f] + '</button>'; }).join('') + '</div>' +
        '<button class="bt" type="button" data-cmd="teste" id="b-teste">Teste de tela: círculo e moldura</button>' +
        '<p class="nota">Datashow 16:9 em tela 4:3: use 4:3 com faixas. Se o círculo do teste ficar alto e estreito, use 4:3 compensado.</p>') +
      cartao('Tamanho e posição da imagem', '<span id="t-ajuste"></span>',
        '<div class="faixa-zoom"><button class="ic" type="button" data-aj="z:-1">−</button><input type="range" id="r-zoom" min="60" max="110" step="1" value="100" aria-label="Tamanho da imagem"><button class="ic" type="button" data-aj="z:1">+</button><span class="valor" id="v-zoom">100%</span></div>' +
        '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><div class="pad"><span></span><button class="bt" type="button" data-aj="y:-1" aria-label="Subir">▲</button><span></span>' +
        '<button class="bt" type="button" data-aj="x:-1" aria-label="Para a esquerda">◀</button><button class="bt meio" type="button" data-aj="centro">centro</button><button class="bt" type="button" data-aj="x:1" aria-label="Para a direita">▶</button>' +
        '<span></span><button class="bt" type="button" data-aj="y:1" aria-label="Descer">▼</button><span></span></div>' +
        '<div style="flex:1;min-width:180px;display:flex;flex-direction:column;gap:8px"><button class="bt" type="button" data-aj="reset">Restaurar 100% e centro</button><p class="nota">Cada toque move 1% da tela. Abra o teste de tela para encaixar a moldura dourada nas bordas da projeção.</p></div></div>') +
      cartao('Som do telão', '<span id="t-som"></span>',
        '<div class="faixa-zoom"><button class="ic" type="button" id="b-mudo2"></button><input type="range" id="r-vol" min="0" max="120" step="5" value="100" aria-label="Volume do telão"><span class="valor" id="v-vol">100%</span></div>' +
        '<p class="nota">Cada toque em − ou + muda 10%, o equivalente a 3 dB: uma diferença que o ouvido percebe. 100% é o volume programado de cada trilha; 110% e 120% reforçam as músicas de fundo. 0% silencia. Confira também o volume do computador e da caixa de som.</p>') +
      cartao('Tela cheia', '<span id="t-cheia"></span>',
        '<p class="nota">O navegador só deixa entrar em tela cheia com um toque no próprio computador: aperte <b>F</b> no teclado do telão. Para abrir o telão já em tela cheia e com o som liberado, crie um atalho do Chrome com este comando:</p>' +
        '<p class="nota"><b>Windows</b> (destino do atalho):<br><code>"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --kiosk --autoplay-policy=no-user-gesture-required ' + esc(url) + '</code></p>' +
        '<p class="nota"><b>Mac</b> (Terminal, com o Chrome fechado):<br><code>open -na "Google Chrome" --args --kiosk --autoplay-policy=no-user-gesture-required ' + esc(url) + '</code></p>' +
        '<p class="nota">No modo quiosque, Alt+F4 (Windows) ou Cmd+Q (Mac) fecha o telão. Este iPad entra em tela cheia pelo botão do canto superior direito; adicionado à Tela de Início (Compartilhar, Adicionar à Tela de Início), abre como aplicativo, sem barra do Safari.</p>') +
      cartao('Cronômetro do encontro', '', '<div class="grade2"><button class="bt" type="button" id="b-cron">Iniciar ou pausar</button><button class="bt" type="button" id="b-cron-zerar">Zerar</button></div><p class="nota">Ele começa sozinho quando o telão sai do slide 1 e compara o tempo com o planejado no roteiro.</p>') +
      cartao('Sessão', '<span id="t-sessao"></span>',
        '<button class="bt" type="button" id="b-encerrar">Encerrar: apagar fotos e intenções</button>' +
        '<button class="bt perigo" type="button" data-zerar="1">Zerar tudo e começar do início</button>' +
        '<div class="grade3"><a class="bt" href="palco.html' + esc(location.search) + '" target="_blank" rel="noopener">Abrir telão</a><a class="bt" href="index.html' + esc(location.search) + '" target="_blank" rel="noopener">Página do celular</a><button class="bt" type="button" id="b-sair">Sair</button></div>');
    var rz = $('r-zoom'), rv = $('r-vol'), tz = null, tv = null;
    rz.addEventListener('input', function () { $('v-zoom').textContent = rz.value + '%'; clearTimeout(tz); tz = setTimeout(function () { var a = ajusteAtual(); a.z = +rz.value; enviarAjuste(a); }, 250); });
    rv.addEventListener('input', function () { pedirVolume(+rv.value); });
    $('b-cron').addEventListener('click', alternarEncontro);
    $('b-cron-zerar').addEventListener('click', function () { if (!confirm('Zerar o cronômetro do encontro?')) return; encontro = { inicio: null, pausa: null, acum: 0 }; guardarEncontro(); relogios(); });
    $('b-encerrar').addEventListener('click', function () {
      if (!confirm('Apagar as selfies e as intenções desta sala? Os pontos continuam.')) return;
      loja.rpc('sala_encerrar', { p_chave: chave, p_sala: SALA }).then(function (r) { var d = r && r.data; toast(d ? d.fotos_apagadas + ' fotos e ' + d.intencoes_apagadas + ' intenções apagadas.' : 'Falha ao encerrar.', !d); });
    });
    $('b-sair').addEventListener('click', function () { if (!confirm('Sair do painel neste iPad?')) return; C.guardar('cat-chave', ''); C.guardar('cat-roteiro-' + C.AULA_ID, ''); history.replaceState(null, '', location.pathname + location.search); location.reload(); });
    $('b-mudo2').addEventListener('click', alternarMudo);
  }
  function ajusteAtual() {
    var m = meta(), t = (m && m.ajuste) || '100:0:0', p = String(t).split(':');
    return { z: +p[0] || 100, x: +p[1] || 0, y: +p[2] || 0 };
  }
  function enviarAjuste(a) {
    a.z = Math.max(60, Math.min(110, a.z)); a.x = Math.max(-20, Math.min(20, a.x)); a.y = Math.max(-20, Math.min(20, a.y));
    cmd('ajuste:' + a.z + ':' + a.x + ':' + a.y);
  }
  function pintarTelao() {
    if (!$('t-estado')) return;
    var on = telaoOn(), m = meta() || {};
    $('t-estado').textContent = !on ? 'fechado' : C.DEMO ? 'demonstração' : 'conectado';
    $('t-formato').textContent = on && m.formato ? NOMES_FORMATO[m.formato] + (m.formato === 'auto' ? ' (agora ' + (m.layout === '43' ? '4:3' : '16:9') + ')' : '') : '';
    Array.prototype.forEach.call(document.querySelectorAll('#formatos [data-f]'), function (b) { b.classList.toggle('on', !!(on && m.formato === b.dataset.f)); });
    $('b-teste').classList.toggle('on', !!m.teste); $('b-preto').classList.toggle('on', !!m.preto); $('b-qr').classList.toggle('on', !!m.qr);
    var a = ajusteAtual();
    $('t-ajuste').textContent = 'tamanho ' + a.z + '% · ' + (a.x > 0 ? '+' : '') + a.x + ' / ' + (a.y > 0 ? '+' : '') + a.y;
    if (document.activeElement !== $('r-zoom')) { $('r-zoom').value = a.z; $('v-zoom').textContent = a.z + '%'; }
    var vol = volAtual();
    if (document.activeElement !== $('r-vol')) { $('r-vol').value = vol; $('v-vol').textContent = vol + '%'; }
    var est = m.som, mudo = !!m.mudo;
    $('t-som').textContent = !on ? '' : est === 'tocando' ? 'tocando' : est === 'bloqueado' ? 'bloqueada pelo navegador' : mudo ? 'desligado' : 'pronto';
    $('b-mudo2').innerHTML = mudo ? ICONES.mudo : ICONES.som; $('b-mudo2').classList.toggle('on', mudo);
    $('t-cheia').textContent = !on ? '' : m.cheia ? 'telão em tela cheia' : 'telão em janela';
    $('t-sessao').textContent = fmt(nJog()) + ' participantes · sala ' + SALA;
  }
  function alternarMudo() { var m = meta(); cmd('mudo:' + (m && m.mudo ? '0' : '1'), m && m.mudo ? 'Som ligado no telão.' : 'Telão silenciado.'); }
  /* Volume: o painel guarda o valor pedido e soma os toques sobre ele, sem esperar o telão confirmar
     (a confirmação chega pela presença, com atraso de 1 a 2 segundos). Toques seguidos viram um único
     envio a cada 250 ms, sempre com o valor final. */
  var VOL_MAX = 120, volPedido = null, envioVol = { t: null, ultimo: 0 };
  function volAtual() {
    var m = meta(), mv = m && m.vol != null ? Math.min(VOL_MAX, m.vol) : 100;
    if (volPedido) {
      if (mv === volPedido.v || Date.now() - volPedido.desde > 6000) volPedido = null;
      else return volPedido.v;
    }
    return mv;
  }
  function pintarVolume(v) {
    $('vol-txt').textContent = v + '%';
    var rv = $('r-vol'); if (rv && document.activeElement !== rv) rv.value = v;
    if ($('v-vol')) $('v-vol').textContent = v + '%';
  }
  function pedirVolume(v) {
    v = Math.max(0, Math.min(VOL_MAX, Math.round(v)));
    volPedido = { v: v, desde: Date.now() };
    pintarVolume(v);
    clearTimeout(envioVol.t);
    envioVol.t = setTimeout(function () { envioVol.ultimo = Date.now(); cmd('volume:' + volPedido.v); }, Math.max(0, 250 - (Date.now() - envioVol.ultimo)));
  }
  function mudarVolume(d) { pedirVolume(volAtual() + d); }

  /* ---------- aba Apoio ---------- */
  function montarApoio() {
    if (!roteiro || !roteiro.apoio) { $('aba-apoio').innerHTML = '<p class="nota">O material de apoio vem com o roteiro.</p>'; return; }
    var h = '';
    roteiro.apoio.forEach(function (sec, si) {
      var corpo = '';
      if (/montagem/i.test(sec.titulo)) {
        sec.blocos.forEach(function (b, k) {
          if (!b.t && !b.itens) return;
          var id = 'cat-ok-' + si + '-' + k, feito = String(C.ler(id, '')) === '1';
          corpo += '<label class="check' + (feito ? ' feito' : '') + '"><input type="checkbox" data-check="' + id + '"' + (feito ? ' checked' : '') + '><span>' + (b.r ? '<b>' + esc(b.r.replace(/[.:]+$/, '')) + ':</b> ' : '') + texto(b.t || '') + '</span></label>';
        });
      } else corpo = sec.blocos.map(htmlBloco).join('');
      h += cartao(esc(sec.titulo), sec.sub ? esc(sec.sub) : '', corpo);
    });
    $('aba-apoio').innerHTML = h;
    Array.prototype.forEach.call(document.querySelectorAll('[data-check]'), function (c) {
      c.addEventListener('change', function () { C.guardar(c.dataset.check, c.checked ? '1' : ''); c.parentNode.classList.toggle('feito', c.checked); });
    });
  }

  /* ---------- pintura geral ---------- */
  function pintar() {
    var i = indiceTelao();
    if (i !== idxVisto) {
      var anterior = idxVisto;
      idxVisto = i; slideDesde = Date.now();
      if (vendo === i) vendo = null;
      /* o cronômetro do encontro começa quando o telão sai do slide 1 */
      if (anterior === 0 && i >= 1 && !encontro.inicio) { encontro = { inicio: Date.now(), pausa: null, acum: 0 }; guardarEncontro(); }
      if (vendo == null) { $('previa').hidden = true; pintarRoteiro(true); } else previa(vendo);
      lacoMonitor();
    } else pintarRoteiro(false);
    pintarBarra(); pintarNav(); marcarLista(); pintarTelao(); relogios(); marcarPassagens();
    if (abaAtual === 'vivo') pedirVivo();
  }

  /* ---------- tela cheia e tela acesa no iPad ---------- */
  function emTelaCheia() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function alternarTelaCheia() {
    var d = document.documentElement;
    if (emTelaCheia()) { (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document); return; }
    var f = d.requestFullscreen || d.webkitRequestFullscreen;
    if (f) { try { var r = f.call(d); if (r && r.catch) r.catch(function () { toast('Este navegador não abriu a tela cheia. Use Compartilhar, Adicionar à Tela de Início.', true); }); } catch (e) { toast('Use Compartilhar, Adicionar à Tela de Início, para abrir sem a barra do Safari.', true); } }
    else toast('Use Compartilhar, Adicionar à Tela de Início, para abrir sem a barra do Safari.', true);
  }
  var trava = null;
  function manterAcesa() {
    if (!('wakeLock' in navigator) || trava || document.visibilityState !== 'visible') return;
    navigator.wakeLock.request('screen').then(function (t) { trava = t; t.addEventListener('release', function () { trava = null; }); }).catch(function () {});
  }

  /* ---------- entrada ---------- */
  function carregarRoteiro() {
    return loja.rpc('orador_roteiro', { p_chave: chave, p_aula: C.AULA_ID }).then(function (r) {
      var d = r && r.data;
      if (d && d.slides) { roteiro = d; C.guardar('cat-roteiro-' + C.AULA_ID, JSON.stringify(d)); }
      else { var c = C.ler('cat-roteiro-' + C.AULA_ID, null); if (c && c.slides) roteiro = c; }
    }).catch(function () { var c = C.ler('cat-roteiro-' + C.AULA_ID, null); if (c && c.slides) roteiro = c; });
  }
  function carregarGabarito() {
    return loja.rpc('orador_gabarito', { p_chave: chave, p_aula: C.AULA_ID }).then(function (r) {
      gabarito = {}; ((r && r.data) || []).forEach(function (g) { gabarito[g.ordem] = g; });
    });
  }
  function entrar(v) {
    return loja.rpc('chave_valida', { p_chave: v }).then(function (r) {
      if (!(r && r.data === true)) {
        if (r && r.error && !C.DEMO && /fetch|conex|network/i.test(r.error.message || '')) { $('m-login').textContent = 'Sem conexão com o banco. Confira a internet do iPad e toque em Entrar.'; $('w-chave').value = v; }
        else { $('m-login').textContent = 'Chave incorreta.'; C.guardar('cat-chave', ''); }
        $('login').hidden = false; $('app').hidden = true; return;
      }
      chave = v; if (!C.DEMO) C.guardar('cat-chave', v);
      $('login').hidden = true; $('app').hidden = false;
      if (!loja.sala) loja.rpc('sala_garantir', { p_chave: v, p_sala: SALA, p_aula: C.AULA_ID });
      return Promise.all([carregarRoteiro(), carregarGabarito()]).then(function () {
        verGeracao(); montarLista(); montarApoio(); montarTelao(); pintarRoteiro(true); pintar(); lacoMonitor();
      });
    });
  }

  function ligar() {
    $('login').addEventListener('submit', function (ev) { ev.preventDefault(); var v = $('w-chave').value.trim(); if (v) entrar(v); });
    $('b-avancar').addEventListener('click', avancar);
    $('b-voltar').addEventListener('click', function () { cmd('voltar'); });
    $('b-mudo').addEventListener('click', alternarMudo);
    $('b-vol-menos').addEventListener('click', function () { mudarVolume(-10); });
    $('b-vol-mais').addEventListener('click', function () { mudarVolume(10); });
    $('b-cheia').innerHTML = ICONES.cheia; $('b-cheia').addEventListener('click', alternarTelaCheia);
    $('p-tempo-total').addEventListener('click', alternarEncontro);
    $('p-tempo-slide').addEventListener('click', function () { slideDesde = Date.now(); relogios(); toast('Tempo do slide zerado.'); });
    function tam(d) { tamFala = Math.max(16, Math.min(32, tamFala + d)); document.documentElement.style.setProperty('--tam-fala', tamFala + 'px'); C.guardar('cat-tam-fala', String(tamFala)); }
    $('b-a-menos').addEventListener('click', function () { tam(-2); }); $('b-a-mais').addEventListener('click', function () { tam(2); });
    document.documentElement.style.setProperty('--tam-fala', tamFala + 'px');
    Array.prototype.forEach.call(document.querySelectorAll('.abas [data-aba]'), function (b) {
      b.addEventListener('click', function () {
        abaAtual = b.dataset.aba;
        Array.prototype.forEach.call(document.querySelectorAll('.abas [data-aba]'), function (x) { x.classList.toggle('on', x === b); });
        Array.prototype.forEach.call(document.querySelectorAll('.aba'), function (x) { x.classList.toggle('on', x.id === 'aba-' + abaAtual); });
        $('col-lado').scrollTop = 0;
        if (abaAtual === 'vivo') pintarVivo();
        if (abaAtual === 'slides') { var at = $('lista').querySelector('.atual'); if (at) rolarPara($('col-lado'), at, true); }
      });
    });
    /* cliques delegados: lista, prévia, passagens, ações do quiz, comandos do telão, ajuste */
    document.addEventListener('click', function (ev) {
      var t = ev.target.closest ? ev.target.closest('button, .it') : null; if (!t) return;
      if (t.dataset.zerar) { pedirZerar(); return; }
      if (t.id === 'b-zerar-sim') { zerarTudo(); return; }
      if (t.id === 'b-zerar-nao' || t.id === 'modal-zerar') { $('modal-zerar').hidden = true; return; }
      if (t.dataset.ir != null) { ev.stopPropagation(); var n = +t.dataset.ir; cmd('ir:' + n, 'Telão indo para o slide ' + (n + 1) + '.'); vendo = null; $('previa').hidden = true; return; }
      if (t.id === 'b-voltar-atual') { previa(indiceTelao()); return; }
      if (t.classList.contains('it')) { previa(+t.dataset.i); return; }
      if (t.dataset.passagem != null) {
        var mm = meta(), jaAberta = t.dataset.ref && mm && mm.passagem === t.dataset.ref;
        var alvo = jaAberta ? 'fechar' : t.dataset.passagem;
        if (t.classList.contains('ref-link') && indiceTelao() !== +$('roteiro').dataset.i) { toast('Leve o telão até este slide para abrir a passagem.', true); return; }
        cmd('passagem:' + alvo, alvo === 'fechar' ? 'Passagem fechada no telão.' : 'Abrindo ' + (t.dataset.ref || 'a passagem') + ' no telão.');
        return;
      }
      if (t.dataset.acao) { cmd(t.dataset.acao, t.dataset.acao === 'quiz:abrir' ? 'Pergunta aberta.' : 'Mostrando a resposta no telão.'); return; }
      if (t.dataset.cmd) { cmd(t.dataset.cmd); return; }
      if (t.dataset.aj) {
        var a = ajusteAtual(), k = t.dataset.aj;
        if (k === 'reset') a = { z: 100, x: 0, y: 0 };
        else if (k === 'centro') { a.x = 0; a.y = 0; }
        else { var p = k.split(':'); a[p[0]] += +p[1]; }
        enviarAjuste(a);
      }
    });
    /* passador de slides ou teclado ligado ao iPad */
    document.addEventListener('keydown', function (ev) {
      if (!chave || /INPUT|TEXTAREA/.test((ev.target || {}).tagName || '')) return;
      var k = ev.key;
      if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { ev.preventDefault(); avancar(); }
      else if (k === 'ArrowLeft' || k === 'PageUp') { ev.preventDefault(); cmd('voltar'); }
      else if (k === 'b' || k === 'B' || k === '.') cmd('preto');
    });
    document.addEventListener('visibilitychange', manterAcesa);
    document.addEventListener('click', manterAcesa, { once: true });
    document.addEventListener('touchend', manterAcesa, { once: true });
    setInterval(buscarEstado, 2500);
    setInterval(function () {
      relogios();
      var r = $('q-rest'), s = slides[indiceTelao()];
      if (r && s && s.tipo === 'quiz') { var st = estadoQuiz(s); if (st.e === 'valendo') r.textContent = Math.ceil(st.rest); else pedirVivo(); }
    }, 250);
  }

  function iniciar() {
    A = window.AULA; slides = A.slides;
    document.title = 'Orador · ' + A.titulo;
    loja = new C.Loja({ tabelas: ['jogadores', 'palavras', 'votos', 'regua', 'mapa', 'toques', 'intencoes'], intervalo: 8000, verPresenca: true });
    loja.ouvir(function (t) {
      if (!chave) return;
      if (t === 'sala') verGeracao();
      if (t === 'sala' || t === 'presenca' || t === 'carga') { pintar(); return; }
      if (t === 'jogadores') { pintarBarra(); pintarTelao(); }
      var s = slides[indiceTelao()];
      if (s && (s.tipo === 'regua' || s.tipo === 'comparar') && (t === 'regua' || t === 'palavras')) preencherLacunas();
      if (abaAtual === 'vivo') pedirVivo();
    });
    ligar();
    var salva = C.DEMO ? 'demo' : String(C.ler('cat-chave', '') || '');
    if (!salva) { $('login').hidden = false; setTimeout(function () { $('w-chave').focus(); }, 60); }
    loja.iniciar().then(function () { if (salva) entrar(salva); });
  }

  C.carregarScript('aulas/' + C.AULA_ID + '/aula.js')
    .then(function () { return C.DEMO ? C.carregarScript('aulas/' + C.AULA_ID + '/demo.js').catch(function () {}) : null; })
    .then(iniciar)
    .catch(function (e) { document.body.textContent = 'Erro ao carregar a aula: ' + e.message; });
})();
