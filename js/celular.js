/* Celular do participante · segue a etapa definida pelo telão */
(function () {
  'use strict';
  var C = window.Catequese, esc = C.esc, SALA = C.SALA;
  var A, loja, eu = null, etapaAtual = null, itemAtual = null, ordemAtual = null, timerQuiz = null;
  var $ = function (id) { return document.getElementById(id); };
  var K = function (nome) { return 'cat-' + SALA + '-' + nome; };
  function lerL(nome, d) { return C.ler(K(nome), d); }
  function salvarL(nome, v) { C.guardar(K(nome), v); }

  function limparLocal() {
    try {
      var pref = K(''), apagar = [];
      for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf(pref) === 0 && k !== K('eu')) apagar.push(k); }
      apagar.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) {}
  }
  function slideDef(tipo, id) {
    for (var i = 0; i < A.slides.length; i++) { var s = A.slides[i]; if (s.tipo === tipo && (id == null || s.id === id)) return s; }
    return null;
  }
  function msg(el, texto, tipo) { el.textContent = texto || ''; el.className = 'msg' + (tipo ? ' ' + tipo : ''); }
  function fmt(n) { return Number(n || 0).toLocaleString('pt-BR'); }

  /* ---------- views ---------- */
  function mostrar(id) {
    Array.prototype.forEach.call(document.querySelectorAll('.view'), function (v) { v.classList.toggle('on', v.id === id); });
    $('fab').hidden = !temMural() || !eu || id === 'v-cadastro' || id === 'v-quiz';
  }
  function status() {
    var s = $('status'); s.classList.toggle('on', loja.online);
    s.querySelector('span').textContent = loja.demo ? 'demonstração' : (loja.online ? 'conectado' : 'reconectando');
  }
  function pintarEu() {
    if (!eu) { $('eu').hidden = true; return; }
    $('eu').hidden = false;
    $('eu-gota').innerHTML = C.gotaSVG(eu);
    $('eu-nome').textContent = eu.apelido;
  }
  function atualizarPlacar() {
    if (!eu) return Promise.resolve();
    return loja.rpc('meu_placar', { p_sala: SALA, p_aparelho: C.APARELHO }).then(function (r) {
      var d = r && r.data; if (!d) return d;
      $('eu-pts').textContent = fmt(d.total) + ' pontos' + (d.posicao ? ' · ' + d.posicao + 'º de ' + d.jogadores : '');
      return d;
    });
  }

  /* ---------- cadastro: apelido e selfie ---------- */
  var fotoNova = null;
  function prepararCadastro() {
    var salvo = lerL('eu', null);
    $('apelido').value = salvo ? salvo.apelido : '';
    fotoNova = salvo ? salvo.foto || null : null;
    previa();
    $('apelido').addEventListener('input', previa);
    $('btn-foto').addEventListener('click', function () { $('arquivo').click(); });
    $('arquivo').addEventListener('change', function () {
      var f = this.files && this.files[0]; if (!f) return;
      msg($('m-cad'), 'Preparando a foto…');
      reduzir(f).then(function (d) { fotoNova = d; previa(); msg($('m-cad'), 'Foto pronta.', 'ok'); })
        .catch(function () { msg($('m-cad'), 'Não foi possível ler a foto. Tente outra.', 'err'); });
      this.value = '';
    });
    $('f-cad').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var a = C.compacto($('apelido').value), e = C.validarApelido(a);
      if (e) { msg($('m-cad'), e, 'err'); return; }
      if (!fotoNova) { msg($('m-cad'), 'Tire a selfie para entrar: é ela que identifica você no telão.', 'err'); return; }
      var b = $('btn-entrar'); b.disabled = true; msg($('m-cad'), 'Entrando…');
      Plic.liberar();
      loja.rpc('jogador_entrar', { p_sala: SALA, p_aparelho: C.APARELHO, p_apelido: a, p_foto: fotoNova }).then(function (r) {
        b.disabled = false;
        var d = r && r.data;
        if (!d || !d.ok) { msg($('m-cad'), (d && d.erro) || C.traduzErro(r && r.error && r.error.message), 'err'); return; }
        eu = { aparelho: C.APARELHO, apelido: d.apelido, cor: d.cor, foto: fotoNova };
        salvarL('eu', eu); if (loja.geracao() != null) salvarL('geracao', loja.geracao());
        Plic.tocar(); try { if (navigator.vibrate) navigator.vibrate(35); } catch (x) {}
        if (d.apelido !== a) msg($('m-cad'), 'Esse apelido já existia. Você ficou como “' + d.apelido + '”.', 'ok');
        pintarEu(); atualizarPlacar(); seguir(true);
      });
    });
  }
  function previa() {
    $('cad-gota').innerHTML = C.gotaSVG({ apelido: $('apelido').value || '?', foto: fotoNova, cor: (eu && eu.cor) || 3 });
    $('btn-foto').textContent = fotoNova ? 'Trocar selfie' : 'Tirar selfie';
    $('btn-foto').className = fotoNova ? 'btn sec peq' : 'btn';
    $('btn-entrar').hidden = !fotoNova;
  }
  function reduzir(file) {
    return new Promise(function (ok, falha) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var s = Math.min(im.naturalWidth, im.naturalHeight), c = document.createElement('canvas'), L = 192;
        c.width = L; c.height = L;
        var ctx = c.getContext('2d');
        ctx.drawImage(im, (im.naturalWidth - s) / 2, (im.naturalHeight - s) / 2, s, s, 0, 0, L, L);
        var q = 0.74, d = c.toDataURL('image/jpeg', q);
        while (d.length > 60000 && q > 0.3) { q -= 0.12; d = c.toDataURL('image/jpeg', q); }
        URL.revokeObjectURL(url);
        if (d.indexOf('data:image/jpeg;base64,') !== 0) falha(new Error('formato')); else ok(d);
      };
      im.onerror = function () { URL.revokeObjectURL(url); falha(new Error('img')); };
      im.src = url;
    });
  }

  /* ---------- som da gota no celular: o toque em Entrar libera o áudio, e a gota pinga quando o cadastro entra ---------- */
  var Plic = (function () {
    var ctx = null, buf = null, carregando = null;
    function contexto() {
      if (!ctx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; try { ctx = new AC(); } catch (e) { return null; } }
      return ctx;
    }
    function carregar() {
      if (carregando) return carregando;
      var c = contexto(); if (!c) return Promise.reject(new Error('sem áudio'));
      var v = (window.CATEQUESE_CFG || {}).versao;
      carregando = fetch('audio/gota.mp3' + (v ? '?v=' + v : '')).then(function (r) { return r.arrayBuffer(); })
        .then(function (b) { return new Promise(function (ok, falha) { c.decodeAudioData(b, ok, falha); }); })
        .then(function (b) { buf = b; }).catch(function (e) { carregando = null; throw e; });
      return carregando;
    }
    return {
      liberar: function () {
        var c = contexto(); if (!c) return;
        try { if (c.state === 'suspended') c.resume(); var sil = c.createBufferSource(); sil.buffer = c.createBuffer(1, 1, 22050); sil.connect(c.destination); sil.start(0); } catch (e) {}
        carregar().catch(function () {});
      },
      tocar: function () {
        var c = contexto(); if (!c) return;
        carregar().then(function () {
          var src = c.createBufferSource(), g = c.createGain();
          src.buffer = buf; src.playbackRate.value = 0.92; g.gain.value = 0.9;
          src.connect(g); g.connect(c.destination); src.start();
        }).catch(function () {});
      }
    };
  })();

  /* ---------- encontro recomeçado do zero no painel: cadastro completo de novo ---------- */
  function verificarReinicio() {
    var g = loja.geracao(), minha = lerL('geracao', null);
    if (g == null) return;
    if (!eu) return;
    if (minha == null || minha === '') { salvarL('geracao', g); return; }
    if (+minha === g) return;
    eu = null; limparLocal(); salvarL('eu', null); salvarL('geracao', '');
    fotoNova = null; $('apelido').value = ''; previa();
    etapaAtual = null; itemAtual = null; ordemAtual = null; vistoQuiz = null;
    pintarEu(); mostrar('v-cadastro');
    msg($('m-cad'), 'O encontro recomeçou do início. Faça o cadastro de novo, com a selfie.', 'ok');
    window.scrollTo(0, 0);
  }

  /* ---------- seguir o telão ---------- */
  function seguir(forcar) {
    status();
    if (!eu) { mostrar('v-cadastro'); return; }
    var s = loja.sala;
    if (!s) { mostrar('v-espera'); $('espera-txt').textContent = 'O encontro ainda não começou. Esta tela muda sozinha.'; return; }
    var et = s.etapa || 'espera', partes = et.split(':'), tipo = partes[0], id = partes[1];
    var mudou = forcar || et !== etapaAtual || +s.item !== itemAtual || (tipo === 'quiz' && s.quiz_ordem !== ordemAtual);
    etapaAtual = et; itemAtual = +s.item; ordemAtual = s.quiz_ordem;
    if (tipo === 'quiz') { telaQuiz(mudou); return; }
    if (!mudou) return;
    clearInterval(timerQuiz);
    switch (tipo) {
      case 'nuvem': telaNuvem(id); break;
      case 'mito': telaMito(id, +s.item); break;
      case 'regua': telaRegua(id); break;
      case 'mapa': telaMapa(id); break;
      case 'caca': telaCaca(id); break;
      case 'mural': abrirFolha(); telaEspera('Perguntas no telão', 'Toque em “Pergunte” para mandar a sua ou apoiar a de alguém.'); break;
      case 'intencoes': telaIntencoes(); break;
      case 'entrada': telaEspera('Sua gota chegou', 'Olhe o telão: a gota com o seu rosto acabou de cair no frasco de óleo.'); break;
      case 'eclesial': telaEspera('Graça eclesial', 'A sua gota está no telão, junto com todas as outras.'); break;
      case 'quiz-intro': atualizarPlacar(); telaEspera('Passagem de plantão', 'O quiz vai começar. Acerto rápido vale mais. Fique de olho no telão.'); break;
      case 'ranking': case 'podio': telaPlacar(); break;
      default: telaEspera('Acompanhe no telão', 'Quando houver uma pergunta para você, ela aparece aqui.');
    }
  }
  function telaEspera(titulo, texto) {
    $('espera-tit').textContent = titulo; $('espera-txt').textContent = texto;
    $('espera-gota').innerHTML = C.gotaSVG(eu);
    mostrar('v-espera');
  }

  /* nuvem */
  function telaNuvem(id) {
    var sl = slideDef('nuvem', id); if (!sl) return telaEspera('Acompanhe no telão', '');
    $('nuvem-kick').textContent = sl.kicker || 'Nuvem de palavras';
    $('nuvem-perg').textContent = sl.pergunta;
    $('f-nuvem').dataset.id = id;
    chipsNuvem(id); msg($('m-nuvem'), 'Mande quantas palavras quiser.');
    $('w-nuvem').value = '';
    mostrar('v-nuvem');
  }
  function chipsNuvem(id) {
    var minhas = lerL('nuvem-' + id, []);
    $('chips-nuvem').innerHTML = minhas.slice(-12).map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('');
  }
  var ultimoEnvio = 0;
  function enviarNuvem(ev) {
    ev.preventDefault();
    var id = $('f-nuvem').dataset.id, inp = $('w-nuvem'), w = C.compacto(inp.value), e = C.validarPalavra(w);
    if (e) { msg($('m-nuvem'), e, 'err'); return; }
    if (Date.now() - ultimoEnvio < 2500) { msg($('m-nuvem'), 'Aguarde um instante para mandar outra.', 'err'); return; }
    ultimoEnvio = Date.now();
    var b = $('f-nuvem').querySelector('button'); b.disabled = true;
    loja.enviar('palavras', { interacao: id, palavra: w }).then(function (r) {
      b.disabled = false;
      if (!r.ok) { msg($('m-nuvem'), r.msg, 'err'); return; }
      var m = lerL('nuvem-' + id, []); m.push(w.toLowerCase()); salvarL('nuvem-' + id, m); chipsNuvem(id);
      inp.value = ''; msg($('m-nuvem'), 'Enviada. Mande outra, se quiser.', 'ok'); inp.focus();
    });
  }

  /* mito ou verdade */
  function telaMito(id, item) {
    var sl = slideDef('mito', id); if (!sl || !sl.itens[item]) return telaEspera('Acompanhe no telão', '');
    $('mito-kick').textContent = (sl.kicker || 'Mito ou verdade?') + ' · ' + (item + 1) + '/' + sl.itens.length;
    $('mito-afirm').textContent = sl.itens[item].t;
    var votos = lerL('mito-' + id, {}), meu = votos[item];
    $('mito-ops').innerHTML = sl.opcoes.map(function (o, i) { return '<button type="button" class="voto' + (meu === i ? ' sel' : '') + '" data-i="' + i + '">' + esc(o) + '</button>'; }).join('');
    Array.prototype.forEach.call($('mito-ops').children, function (b) {
      b.addEventListener('click', function () {
        var i = +b.dataset.i; if (votos[item] === i) return;
        loja.enviar('votos', { interacao: id, item: item, opcao: i }).then(function (r) {
          if (!r.ok) { msg($('m-mito'), r.msg, 'err'); return; }
          votos[item] = i; salvarL('mito-' + id, votos);
          Array.prototype.forEach.call($('mito-ops').children, function (x) { x.classList.toggle('sel', +x.dataset.i === i); });
          msg($('m-mito'), 'Voto registrado. Dá para trocar.', 'ok');
        });
      });
    });
    msg($('m-mito'), meu != null ? 'Voto registrado. Dá para trocar.' : '');
    mostrar('v-mito');
  }

  /* régua */
  function telaRegua(id) {
    var sl = slideDef('regua', id); if (!sl) return telaEspera('Acompanhe no telão', '');
    $('regua-kick').textContent = sl.kicker || 'Sua resposta';
    $('regua-perg').textContent = sl.pergunta;
    var meu = lerL('regua-' + id, null);
    $('regua-lista').innerHTML = sl.pontos.map(function (p, i) { return '<button type="button" data-i="' + i + '" class="' + (meu === i ? 'sel' : '') + '">' + esc(p) + '</button>'; }).join('');
    Array.prototype.forEach.call($('regua-lista').children, function (b) {
      b.addEventListener('click', function () {
        var i = +b.dataset.i; if (lerL('regua-' + id, null) === i) return;
        loja.enviar('regua', { interacao: id, valor: i }).then(function (r) {
          if (!r.ok) { msg($('m-regua'), r.msg, 'err'); return; }
          salvarL('regua-' + id, i);
          Array.prototype.forEach.call($('regua-lista').children, function (x) { x.classList.toggle('sel', +x.dataset.i === i); });
          msg($('m-regua'), 'Resposta registrada. Dá para trocar.', 'ok');
        });
      });
    });
    msg($('m-regua'), meu != null ? 'Resposta registrada. Dá para trocar.' : 'Toque em uma opção.');
    mostrar('v-regua');
  }

  /* mapa do corpo */
  function telaMapa(id) {
    var sl = slideDef('mapa', id); if (!sl) return telaEspera('Acompanhe no telão', '');
    $('mapa-kick').textContent = sl.kicker || 'Toque na figura';
    $('mapa-perg').textContent = sl.pergunta;
    var meus = lerL('mapa-' + id, []);
    function desenhar() {
      var extra = meus.map(function (p) { return '<circle class="meu" cx="' + (p[0] * 400).toFixed(1) + '" cy="' + (p[1] * 1000).toFixed(1) + '" r="9"/>'; }).join('');
      $('mapa-box').innerHTML = C.corpoSVG(extra);
      var svg = $('mapa-box').querySelector('svg');
      svg.addEventListener('click', function (ev) {
        if (meus.length >= 3) { msg($('m-mapa'), 'Você já usou os 3 toques.', 'err'); return; }
        var pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
        var loc = pt.matrixTransform(svg.getScreenCTM().inverse());
        var x = Math.min(1, Math.max(0, loc.x / 400)), y = Math.min(1, Math.max(0, loc.y / 1000));
        loja.enviar('mapa', { interacao: id, x: +x.toFixed(4), y: +y.toFixed(4) }).then(function (r) {
          if (!r.ok) { msg($('m-mapa'), r.msg, 'err'); return; }
          meus.push([x, y]); salvarL('mapa-' + id, meus); desenhar();
          msg($('m-mapa'), meus.length + ' de 3 toques. Olhe o telão.', 'ok');
        });
      });
    }
    desenhar();
    msg($('m-mapa'), meus.length ? meus.length + ' de 3 toques.' : 'Toque direto na figura.');
    mostrar('v-mapa');
  }

  /* caça aos intrusos */
  function telaCaca(id) {
    var sl = slideDef('caca', id); if (!sl) return telaEspera('Acompanhe no telão', '');
    $('caca-kick').textContent = sl.kicker || 'Caça';
    $('caca-perg').textContent = sl.pergunta;
    var marc = lerL('caca-' + id, []);
    $('caca-lista').innerHTML = sl.itens.map(function (t, i) { return '<button type="button" data-i="' + i + '" class="' + (marc.indexOf(i) >= 0 ? 'sel' : '') + '">' + esc(t) + '</button>'; }).join('');
    Array.prototype.forEach.call($('caca-lista').children, function (b) {
      b.addEventListener('click', function () {
        var i = +b.dataset.i; if (marc.indexOf(i) >= 0) return;
        loja.enviar('toques', { interacao: id, item: i }).then(function (r) {
          if (!r.ok && !/Já registrado/.test(r.msg)) { msg($('m-caca'), r.msg, 'err'); return; }
          marc.push(i); salvarL('caca-' + id, marc); b.classList.add('sel');
          msg($('m-caca'), marc.length + (marc.length === 1 ? ' marcada.' : ' marcadas.'), 'ok');
        });
      });
    });
    msg($('m-caca'), 'Marque todas as que você acha que são intrusas.');
    mostrar('v-caca');
  }

  /* intenções */
  function telaIntencoes() {
    var sl = slideDef('intencoes');
    $('int-tit').textContent = sl ? sl.titulo : 'Intenções';
    $('int-txt').textContent = sl ? sl.texto : '';
    chipsInt(); $('w-int').value = ''; msg($('m-int'), '');
    mostrar('v-int');
  }
  function chipsInt() { $('chips-int').innerHTML = lerL('intencoes', []).map(function (w) { return '<span>' + esc(w) + '</span>'; }).join(''); }
  function enviarIntencao(ev) {
    ev.preventDefault();
    var w = C.compacto($('w-int').value), e = C.validarNome(w);
    if (e) { msg($('m-int'), e, 'err'); return; }
    loja.enviar('intencoes', { nome: w }).then(function (r) {
      if (!r.ok) { msg($('m-int'), r.msg, 'err'); return; }
      var m = lerL('intencoes', []); m.push(w); salvarL('intencoes', m); chipsInt();
      $('w-int').value = ''; msg($('m-int'), 'Recebido. Rezamos juntos.', 'ok');
    });
  }

  /* placar */
  function telaPlacar() {
    mostrar('v-placar');
    $('placar-box').innerHTML = '<div class="msg">Carregando…</div>';
    atualizarPlacar().then(function (d) {
      if (!d) return;
      $('placar-box').innerHTML = '<div class="placar"><div><b>' + (d.posicao ? d.posicao + 'º' : '–') + '</b><small>posição</small></div>' +
        '<div><b>' + fmt(d.total) + '</b><small>pontos</small></div><div><b>' + fmt(d.acertos) + '</b><small>acertos</small></div></div>' +
        '<p class="nota">Inclui ' + fmt(d.bonus) + ' pontos de bônus pelas dinâmicas. ' + fmt(d.jogadores) + (d.jogadores === 1 ? ' participante.' : ' participantes.') + '</p>';
    });
  }

  /* ---------- resultado de cada pergunta: selo animado ---------- */
  var vistoQuiz = null;
  var CALMO = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function vibrar(padrao, atraso) {
    setTimeout(function () { try { if (navigator.vibrate) navigator.vibrate(padrao); } catch (e) {} }, atraso || 0);
  }
  function contar(el, de, ate, ms, antes, depois) {
    if (!el) return;
    function txt(n) { el.textContent = antes + fmt(n) + depois; }
    if (!ms || de === ate) { txt(ate); return; }
    var t0 = null;
    txt(de);
    function passo(t) {
      if (!el.isConnected) return;
      if (t0 == null) t0 = t;
      var k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      txt(Math.round(de + (ate - de) * e));
      if (k < 1) requestAnimationFrame(passo);
    }
    setTimeout(function () { requestAnimationFrame(passo); }, 250);
  }
  /* decide o resultado: a marcação guardada no aparelho vale primeiro; o placar do banco confirma */
  function veredito(p, s, meu, d) {
    if (p.tipo === 'numero') {
      var alvo = parseInt(s.quiz_valor, 10);
      if (!meu || meu.v == null || isNaN(alvo)) return { tipo: 'sem' };
      var dif = Math.abs(+meu.v - alvo);
      return dif === 0 ? { tipo: 'acerto', dif: 0 } : { tipo: 'alvo', dif: dif };
    }
    var marcou = meu && meu.o != null ? +meu.o : null;
    if (marcou != null && s.quiz_correta != null) return { tipo: marcou === +s.quiz_correta ? 'acerto' : 'erro', marcou: marcou };
    if (d && d.ultima > 0) return { tipo: 'acerto', marcou: null };
    if (d && d.respondeu) return { tipo: 'erro', marcou: null };
    return { tipo: 'sem' };
  }
  function seloSVG(tipo, dif) {
    var miolo = '';
    if (tipo === 'acerto') miolo = '<path class="marca" pathLength="1" d="M36 62 L53 79 L86 44"/>';
    else if (tipo === 'erro') miolo = '<path class="marca m1" pathLength="1" d="M42 42 L78 78"/><path class="marca m2" pathLength="1" d="M78 42 L42 78"/>';
    else if (tipo === 'alvo') {
      /* quanto menor a diferença, mais perto do centro o dardo crava */
      var r = Math.min(40, 6 + 34 * Math.sqrt(Math.min(dif, 50) / 50)), ang = ((dif * 137.5) % 360) * Math.PI / 180;
      var x = (60 + r * Math.cos(ang)).toFixed(1), y = (60 + r * Math.sin(ang)).toFixed(1);
      miolo = '<circle class="anel" cx="60" cy="60" r="38"/><circle class="anel" cx="60" cy="60" r="24"/><circle class="miolo-alvo" cx="60" cy="60" r="10"/>' +
        '<circle class="impacto" cx="' + x + '" cy="' + y + '" r="6"/><g class="dardo"><circle cx="' + x + '" cy="' + y + '" r="6"/></g>';
    } else miolo = '<path class="ponteiro pm" d="M60 60 L60 30"/><path class="ponteiro ph" d="M60 60 L77 60"/><circle class="eixo" cx="60" cy="60" r="4"/>';
    return '<svg class="selo-svg" viewBox="0 0 120 120" aria-hidden="true"><circle class="disco" cx="60" cy="60" r="50"/><circle class="aro" pathLength="1" cx="60" cy="60" r="50"/>' + miolo + '</svg>';
  }
  function faiscas() {
    var h = '';
    for (var i = 0; i < 16; i++) {
      var ang = 22.5 * i + (i % 2 ? 7 : -5), dist = 84 + (i % 3) * 18;
      h += '<i class="' + (i % 2 ? 'ponto' : 'risco') + '" style="--ang:' + ang + 'deg;--dist:' + dist + 'px;animation-delay:' + (560 + (i % 4) * 35) + 'ms"></i>';
    }
    return '<span class="faiscas">' + h + '</span>';
  }
  function chip(p, i, rot, cls) {
    if (i == null || !p.opcoes || p.opcoes[i] == null) return '';
    var sinal = cls === 'certa' ? '<path d="M8 14.5l4.2 4.2L20.5 9.5"/>' : '<path d="M9.5 9.5l9 9M18.5 9.5l-9 9"/>';
    return '<div class="vd-op op-' + i + ' ' + cls + '">' + C.formaSVG(i) + '<span class="tx"><small>' + rot + '</small><span>' + esc(p.opcoes[i]) + '</span></span>' +
      '<svg class="sinal" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="13"/>' + sinal + '</svg></div>';
  }
  function pintarVeredito(cab, p, s, meu, v, novo) {
    var certa = p.tipo === 'multipla' && s.quiz_correta != null ? +s.quiz_correta : null;
    var tit = '', sub = '', ops = '', rotulo = '';
    if (p.tipo === 'numero') {
      if (v.tipo === 'acerto') { tit = 'Na mosca!'; sub = 'Você cravou ' + esc(s.quiz_valor) + '.'; rotulo = 'Você acertou o número exato'; }
      else if (v.tipo === 'alvo') { tit = esc(s.quiz_valor); sub = 'Você respondeu ' + esc(meu.v) + ': diferença de ' + fmt(v.dif) + '.'; rotulo = 'Resposta ' + esc(s.quiz_valor) + ', diferença de ' + fmt(v.dif); }
      else { tit = 'Sem resposta'; sub = 'A resposta era ' + esc(s.quiz_valor) + '.'; rotulo = 'Sem resposta'; }
      sub += '<br>Quem chegar mais perto desempata.';
    } else if (v.tipo === 'acerto') { tit = 'Acertou!'; ops = chip(p, certa, 'Sua resposta', 'certa'); rotulo = 'Você acertou'; }
    else if (v.tipo === 'erro') { tit = 'Não foi dessa vez'; ops = chip(p, v.marcou, 'Você marcou', 'voce') + chip(p, certa, 'Resposta certa', 'certa'); rotulo = 'Você errou'; }
    else { tit = 'Sem resposta'; ops = chip(p, certa, 'Resposta certa', 'certa'); rotulo = 'Sem resposta'; }
    var box = $('quiz-box');
    box.classList.remove('brilha-ok', 'brilha-erro');
    box.classList.add('revelada');
    box.innerHTML = cab +
      '<div class="veredito ' + v.tipo + (p.tipo === 'numero' ? ' num' : '') + (novo && !CALMO ? '' : ' fixo') + '" role="status" aria-label="' + rotulo + '">' +
        '<div class="selo">' + (v.tipo === 'acerto' ? '<span class="halo"></span><span class="onda"></span><span class="onda o2"></span>' + faiscas() : '') + seloSVG(v.tipo, v.dif) + '</div>' +
        '<div class="vd-tit">' + tit + '</div>' +
        (v.tipo === 'acerto' || v.tipo === 'alvo' ? '<div class="vd-pts" id="vd-pts"></div>' : '') +
        (sub ? '<p class="vd-sub">' + sub + '</p>' : '') +
        (ops ? '<div class="vd-ops">' + ops + '</div>' : '') +
      '</div>' +
      '<div class="placar vd-placar" id="vd-placar"></div>';
    if (!novo) return;
    /* traz o cartão do resultado para a tela, sem esconder o selo */
    setTimeout(function () {
      var vd = box.querySelector('.veredito'); if (!vd) return;
      var rb = box.getBoundingClientRect(), rv = vd.getBoundingClientRect();
      if (rv.bottom > window.innerHeight - 20 || rb.top < 0) window.scrollBy({ top: rb.top - 12, behavior: CALMO ? 'auto' : 'smooth' });
    }, 120);
    if (!CALMO) { void box.offsetWidth; if (v.tipo === 'acerto') box.classList.add('brilha-ok'); else if (v.tipo === 'erro') box.classList.add('brilha-erro'); }
    if (v.tipo === 'acerto') vibrar([28, 60, 28, 60, 110], 620);
    else if (v.tipo === 'erro') vibrar([90, 70, 90], 960);
    else if (v.tipo === 'alvo') vibrar(70, 620);
  }

  /* quiz */
  function telaQuiz(mudou) {
    var s = loja.sala, p = loja.pergunta(s.quiz_ordem);
    var resp = lerL('quiz', {}), meu = resp[s.quiz_ordem];
    clearInterval(timerQuiz);
    mostrar('v-quiz');
    if (!s.quiz_revelada) $('quiz-box').classList.remove('revelada', 'brilha-ok', 'brilha-erro');
    if (!p) { $('quiz-box').innerHTML = '<h2>Prepare-se…</h2>'; return; }
    var cab = '<div class="kick">' + (p.tipo === 'numero' ? 'Desempate' : 'Pergunta ' + p.ordem) + '</div><h2>' + esc(p.texto) + '</h2>';
    if (s.quiz_revelada) {
      var chave = s.quiz_ordem + '|' + (s.quiz_aberta_em || '');
      if (!mudou && vistoQuiz === chave && $('quiz-box').querySelector('.veredito')) return;
      var novo = vistoQuiz !== chave;
      vistoQuiz = chave;
      var v = veredito(p, s, meu, null);
      pintarVeredito(cab, p, s, meu, v, novo);
      atualizarPlacar().then(function (d) {
        var agora = loja.sala;
        if (!d || !agora || !agora.quiz_revelada || agora.quiz_ordem !== s.quiz_ordem || vistoQuiz !== chave) return;
        var v2 = veredito(p, agora, meu, d);
        if (v2.tipo !== v.tipo) { v = v2; pintarVeredito(cab, p, agora, meu, v, novo); }
        var ult = d.ultima > 0 ? d.ultima : 0, anima = novo && !CALMO;
        if (ult && (v.tipo === 'acerto' || v.tipo === 'alvo')) contar($('vd-pts'), 0, ult, anima ? 1100 : 0, '+', ' pontos');
        var pl = $('vd-placar');
        if (pl) {
          pl.innerHTML = '<div><b>' + (d.posicao ? d.posicao + 'º' : '–') + '</b><small>posição</small></div><div><b id="vd-total"></b><small>pontos</small></div>';
          contar($('vd-total'), Math.max(0, d.total - ult), d.total, anima && ult ? 1300 : 0, '', '');
          pl.classList.add('on');
        }
      });
      return;
    }
    if (!s.quiz_aberta_em) { $('quiz-box').innerHTML = cab + '<div class="msg ok">Prepare-se: a pergunta abre no telão.</div>'; return; }
    var aberta = new Date(s.quiz_aberta_em).getTime(), tempo = s.quiz_tempo || p.tempo || 20;
    function restante() { return Math.max(0, tempo - (loja.agora() - aberta) / 1000); }
    if (meu != null) { $('quiz-box').innerHTML = cab + '<div class="msg ok">Resposta enviada. Aguarde o resultado no telão.</div>'; return; }
    if (restante() <= 0) { $('quiz-box').innerHTML = cab + '<div class="msg err">Tempo esgotado.</div>'; return; }
    var corpo = p.tipo === 'numero'
      ? '<form id="f-num" class="linha"><input type="number" inputmode="numeric" id="w-num" min="' + (p.numero_min || 0) + '" max="' + (p.numero_max || 9999) + '" placeholder="ano"><button class="btn" type="submit">Enviar</button></form>'
      : '<div class="ops">' + p.opcoes.map(function (o, i) { return '<button type="button" class="op op-' + i + '" data-i="' + i + '">' + C.formaSVG(i) + '<span>' + esc(o) + '</span></button>'; }).join('') + '</div>';
    $('quiz-box').innerHTML = cab + '<div class="tempo"><i id="barra-t"></i></div>' + corpo + '<div class="msg" id="m-quiz"></div>';
    function responder(opcao, valor) {
      Array.prototype.forEach.call($('quiz-box').querySelectorAll('button'), function (b) { b.disabled = true; });
      loja.rpc('quiz_responder', { p_sala: SALA, p_aparelho: C.APARELHO, p_opcao: opcao, p_valor: valor }).then(function (r) {
        var d = r && r.data;
        if (d && (d.ok || d.repetida)) {
          resp[s.quiz_ordem] = { o: opcao, v: valor }; salvarL('quiz', resp);
          $('quiz-box').innerHTML = cab + '<div class="msg ok">Resposta enviada. Aguarde o resultado no telão.</div>';
        } else {
          var e = d && d.erro;
          msg($('m-quiz'), e === 'tempo' || e === 'fechada' ? 'Tempo esgotado.' : e === 'cadastro' ? 'Entre com um apelido para pontuar.' : 'Não foi possível enviar. Tente de novo.', 'err');
          Array.prototype.forEach.call($('quiz-box').querySelectorAll('button'), function (b) { b.disabled = false; });
        }
      });
    }
    Array.prototype.forEach.call($('quiz-box').querySelectorAll('.op'), function (b) {
      b.addEventListener('click', function () { b.classList.add('sel'); responder(+b.dataset.i, null); });
    });
    var fn = $('f-num');
    if (fn) fn.addEventListener('submit', function (ev) { ev.preventDefault(); var v = parseInt($('w-num').value, 10); if (isNaN(v)) return; responder(null, v); });
    timerQuiz = setInterval(function () {
      var r = restante(), bt = $('barra-t'); if (bt) bt.style.width = (100 * r / tempo) + '%';
      if (r <= 0) { clearInterval(timerQuiz); if ($('m-quiz')) msg($('m-quiz'), 'Tempo esgotado.', 'err'); Array.prototype.forEach.call($('quiz-box').querySelectorAll('button'), function (b) { b.disabled = true; }); }
    }, 200);
  }

  /* ---------- mural (folha inferior) ---------- */
  function temMural() { return !!(A && A.slides.some(function (s) { return s.tipo === 'mural'; })); }
  function abrirFolha() { $('folha').hidden = false; listaMural(); }
  function fecharFolha() { $('folha').hidden = true; }
  function listaMural() {
    var apoiadas = lerL('apoios', []);
    var l = loja.mural.filter(function (m) { return m.aprovada && !m.oculta; }).sort(function (a, b) { return b.apoios - a.apoios; });
    $('mural-lista').innerHTML = l.length ? l.map(function (m) {
      var feito = apoiadas.indexOf(m.id) >= 0;
      return '<div class="perg-item"><p>' + esc(m.texto) + '</p><button type="button" data-id="' + m.id + '" class="' + (feito ? 'feito' : '') + '">' + (feito ? '✓ apoiada · ' : 'Apoiar · ') + m.apoios + '</button></div>';
    }).join('') : '<p class="nota">As perguntas aprovadas aparecem aqui para você apoiar.</p>';
    Array.prototype.forEach.call($('mural-lista').querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () {
        var id = isNaN(+b.dataset.id) ? b.dataset.id : +b.dataset.id;
        if (apoiadas.indexOf(id) >= 0) return;
        if (loja.demo) { apoiadas.push(id); salvarL('apoios', apoiadas); listaMural(); return; }
        loja.cliente.from('mural_apoios').insert({ sala: SALA, mural_id: id, aparelho: C.APARELHO }).then(function (r) {
          if (!r.error || /duplicate/.test(r.error.message)) { apoiadas.push(id); salvarL('apoios', apoiadas); b.classList.add('feito'); b.textContent = '✓ apoiada · ' + (+b.textContent.replace(/\D/g, '') + 1); }
        });
      });
    });
  }
  function enviarPergunta(ev) {
    ev.preventDefault();
    var t = C.compacto($('w-perg').value), e = C.validarFrase(t);
    if (e) { msg($('m-perg'), e, 'err'); return; }
    loja.enviar('mural', { texto: t }).then(function (r) {
      if (!r.ok) { msg($('m-perg'), r.msg, 'err'); return; }
      $('w-perg').value = ''; msg($('m-perg'), 'Enviada. Ela aparece no telão depois de aprovada.', 'ok');
    });
  }

  /* ---------- demonstração ---------- */
  function barraDemo() {
    var et = [['espera', 'Espera'], ['entrada', 'Entrada']];
    A.slides.forEach(function (s) {
      if (s.tipo === 'nuvem' || s.tipo === 'mito' || s.tipo === 'regua' || s.tipo === 'mapa' || s.tipo === 'caca') et.push([s.tipo + ':' + s.id, s.tipo + ' · ' + s.id]);
    });
    et.push(['quiz', 'Quiz'], ['quiz-desempate', 'Quiz · desempate'], ['quiz-revelar', 'Quiz · resultado'], ['ranking', 'Placar'], ['intencoes', 'Intenções']);
    if (temMural()) et.push(['mural', 'Mural']);
    var d = document.createElement('div'); d.id = 'demo-bar';
    d.innerHTML = '<select aria-label="Etapa de demonstração">' + et.map(function (e) { return '<option value="' + e[0] + '">' + e[1] + '</option>'; }).join('') + '</select>';
    document.body.appendChild(d);
    d.querySelector('select').addEventListener('change', function () {
      var v = this.value;
      if (v === 'quiz') { loja.rpc('quiz_preparar', { p_ordem: 1 }); loja.rpc('quiz_abrir', {}); }
      else if (v === 'quiz-desempate') { loja.rpc('quiz_preparar', { p_ordem: 11 }); loja.rpc('quiz_abrir', {}); }
      else if (v === 'quiz-revelar') loja.rpc('quiz_revelar', {});
      else loja.rpc('mudar', { p_etapa: v, p_item: 0 });
    });
  }

  /* ---------- início ---------- */
  function iniciar() {
    A = window.AULA;
    document.title = A.titulo + ' · Catecumenato';
    $('aula-tit').textContent = A.titulo;
    loja = new C.Loja({ tabelas: ['mural'], intervalo: 12000, semDadosDemo: false });
    eu = lerL('eu', null);
    prepararCadastro();
    $('f-nuvem').addEventListener('submit', enviarNuvem);
    $('f-int').addEventListener('submit', enviarIntencao);
    $('f-perg').addEventListener('submit', enviarPergunta);
    $('fab').addEventListener('click', abrirFolha);
    $('fechar-folha').addEventListener('click', fecharFolha);
    $('folha').addEventListener('click', function (ev) { if (ev.target === this) fecharFolha(); });
    $('eu-editar').addEventListener('click', function () { mostrar('v-cadastro'); });
    loja.ouvir(function (tipo) {
      if (tipo === 'sala' || tipo === 'carga') { verificarReinicio(); seguir(false); }
      if (tipo === 'mural' || tipo === 'carga') { if (!$('folha').hidden) listaMural(); }
      if (tipo === 'conexao') status();
    });
    loja.iniciar().then(function () {
      if (eu && !loja.demo) {
        /* confere se o cadastro existe nesta sala (ensaio recomeçado, por exemplo) */
        loja.cliente.from('jogadores').select('aparelho').eq('sala', SALA).eq('aparelho', C.APARELHO).maybeSingle().then(function (r) {
          if (!r.data) { eu = null; limparLocal(); salvarL('geracao', ''); }
          else if (loja.geracao() != null) salvarL('geracao', loja.geracao());
          pintarEu(); if (eu) atualizarPlacar(); seguir(true);
        });
      } else { pintarEu(); seguir(true); }
      if (loja.demo) barraDemo();
    });
  }

  C.carregarScript('aulas/' + C.AULA_ID + '/aula.js')
    .then(function () { return C.DEMO ? C.carregarScript('aulas/' + C.AULA_ID + '/demo.js').catch(function () {}) : null; })
    .then(iniciar)
    .catch(function (e) { document.body.innerHTML = '<p style="padding:24px">Não foi possível carregar: ' + esc(e.message) + '</p>'; });
})();
