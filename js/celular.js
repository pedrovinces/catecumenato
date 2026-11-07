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
    $('fab').hidden = !eu || id === 'v-cadastro' || id === 'v-quiz';
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
    $('btn-tirar').addEventListener('click', function () { fotoNova = null; previa(); });
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
      var b = $('btn-entrar'); b.disabled = true; msg($('m-cad'), 'Entrando…');
      loja.rpc('jogador_entrar', { p_sala: SALA, p_aparelho: C.APARELHO, p_apelido: a, p_foto: fotoNova }).then(function (r) {
        b.disabled = false;
        var d = r && r.data;
        if (!d || !d.ok) { msg($('m-cad'), (d && d.erro) || C.traduzErro(r && r.error && r.error.message), 'err'); return; }
        eu = { aparelho: C.APARELHO, apelido: d.apelido, cor: d.cor, foto: fotoNova };
        salvarL('eu', eu);
        if (d.apelido !== a) msg($('m-cad'), 'Esse apelido já existia. Você ficou como “' + d.apelido + '”.', 'ok');
        pintarEu(); atualizarPlacar(); seguir(true);
      });
    });
  }
  function previa() {
    $('cad-gota').innerHTML = C.gotaSVG({ apelido: $('apelido').value || '?', foto: fotoNova, cor: (eu && eu.cor) || 3 });
    $('btn-tirar').hidden = !fotoNova;
    $('btn-foto').textContent = fotoNova ? 'Trocar selfie' : 'Tirar selfie (opcional)';
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
      case 'entrada': telaEspera('Você entrou no plantão', 'Olhe o telão: a sua gota acabou de cair no frasco.'); break;
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
      var extra = meus.map(function (p) { return '<circle class="meu" cx="' + (p[0] * 400).toFixed(1) + '" cy="' + (p[1] * 1000).toFixed(1) + '" r="16"/>'; }).join('');
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
        '<p class="nota">Inclui ' + fmt(d.bonus) + ' pontos de bônus pelas dinâmicas. ' + fmt(d.jogadores) + ' pessoas no plantão.</p>';
    });
  }

  /* quiz */
  function telaQuiz(mudou) {
    var s = loja.sala, p = loja.pergunta(s.quiz_ordem);
    var resp = lerL('quiz', {}), meu = resp[s.quiz_ordem];
    clearInterval(timerQuiz);
    mostrar('v-quiz');
    if (!p) { $('quiz-box').innerHTML = '<h2>Prepare-se…</h2>'; return; }
    var cab = '<div class="kick">' + (p.tipo === 'numero' ? 'Desempate' : 'Pergunta ' + p.ordem) + '</div><h2>' + esc(p.texto) + '</h2>';
    if (s.quiz_revelada) {
      $('quiz-box').innerHTML = cab + '<div class="msg">Conferindo…</div>';
      atualizarPlacar().then(function (d) {
        var certo = p.tipo === 'multipla' ? p.opcoes[s.quiz_correta] : s.quiz_valor;
        var ult = d && d.ultima;
        var html = cab;
        if (p.tipo === 'numero') html += '<div class="resultado ok">' + esc(s.quiz_valor) + '</div><p class="nota">Você respondeu ' + (meu != null ? esc(meu.v) : 'nada') + '. Quem chegar mais perto desempata.</p>';
        else if (ult > 0) html += '<div class="resultado ok">Acertou! +' + fmt(ult) + '</div>';
        else html += '<div class="resultado">' + (meu != null ? 'Não foi dessa vez' : 'Sem resposta') + '</div><p class="nota">Resposta certa: ' + esc(certo) + '</p>';
        if (d) html += '<div class="placar"><div><b>' + (d.posicao ? d.posicao + 'º' : '–') + '</b><small>posição</small></div><div><b>' + fmt(d.total) + '</b><small>pontos</small></div></div>';
        $('quiz-box').innerHTML = html;
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
    var et = [['espera', 'Espera'], ['entrada', 'Check-in']];
    A.slides.forEach(function (s) {
      if (s.tipo === 'nuvem' || s.tipo === 'mito' || s.tipo === 'regua' || s.tipo === 'mapa' || s.tipo === 'caca') et.push([s.tipo + ':' + s.id, s.tipo + ' · ' + s.id]);
    });
    et.push(['quiz', 'Quiz'], ['ranking', 'Placar'], ['intencoes', 'Intenções'], ['mural', 'Mural']);
    var d = document.createElement('div'); d.id = 'demo-bar';
    d.innerHTML = '<select aria-label="Etapa de demonstração">' + et.map(function (e) { return '<option value="' + e[0] + '">' + e[1] + '</option>'; }).join('') + '</select>';
    document.body.appendChild(d);
    d.querySelector('select').addEventListener('change', function () {
      var v = this.value;
      if (v === 'quiz') { loja.rpc('quiz_preparar', { p_ordem: 1 }); loja.rpc('quiz_abrir', {}); }
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
      if (tipo === 'sala' || tipo === 'carga') seguir(false);
      if (tipo === 'mural' || tipo === 'carga') { if (!$('folha').hidden) listaMural(); }
      if (tipo === 'conexao') status();
    });
    loja.iniciar().then(function () {
      if (eu && !loja.demo) {
        /* confere se o cadastro existe nesta sala (ensaio recomeçado, por exemplo) */
        loja.cliente.from('jogadores').select('aparelho').eq('sala', SALA).eq('aparelho', C.APARELHO).maybeSingle().then(function (r) {
          if (!r.data) { eu = null; limparLocal(); }
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
