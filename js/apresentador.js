/* Painel do apresentador · comanda o telão pelo celular e modera o mural */
(function () {
  'use strict';
  var C = window.Catequese, esc = C.esc, SALA = C.SALA;
  var A, loja, chave = null, timerMural = null;
  var $ = function (id) { return document.getElementById(id); };

  function rotulo(s, i) {
    var t = s.titulo || s.pergunta || s.legenda || s.citacao || s.texto || s.kicker || '';
    if (Array.isArray(t)) t = t.join(' ');
    var tipos = { capa: 'Capa', entrada: 'Entrada (QR)', nuvem: 'Nuvem', foto: 'Foto', sacramentos: 'Sacramentos', texto: 'Texto', regua: 'Régua', citacao: 'Citação', mito: 'Mito ou verdade', tres: 'Resumo', mapa: 'Mapa do corpo', rito: 'Rito', caca: 'Caça', efeitos: 'Efeitos', eclesial: 'Gotas', titulo: 'Título', testemunho: 'Testemunho', relato: 'Relato', comparar: 'Antes e depois', mural: 'Mural', 'quiz-intro': 'Quiz', quiz: 'Pergunta ' + s.ordem, ranking: 'Placar', podio: 'Pódio', intencoes: 'Intenções', final: 'Final' };
    return { tipo: tipos[s.tipo] || s.tipo, texto: s.tipo === 'quiz' ? ((loja.pergunta(s.ordem) || {}).texto || '') : String(t) };
  }
  /* reserva para quando a presença em tempo real falhar: o pulso que o telão grava no banco */
  var estadoPalco = null;
  function pulsoOn() { return !!(estadoPalco && estadoPalco.visto && new Date(estadoPalco.agora) - new Date(estadoPalco.visto) < 25000 && Date.now() - estadoPalco.recebido < 30000); }
  function telaoOn() { return C.DEMO || !!loja.palcoOnline || pulsoOn(); }
  function buscarEstado() {
    if (!chave || C.DEMO) return;
    loja.rpc('orador_estado', { p_chave: chave, p_sala: SALA }).then(function (r) { if (r && r.data) { estadoPalco = r.data; estadoPalco.recebido = Date.now(); pintarPresenca(); } });
  }
  setInterval(buscarEstado, 4000);
  function cmd(c) {
    if (!loja.sala) { aviso('A sala ainda não existe. Abra o telão (palco.html) no computador do projetor e digite a chave.', true); return Promise.resolve(); }
    if (!telaoOn()) aviso('Comando enviado, mas o telão está fechado. Abra palco.html no computador do projetor, na sala ' + SALA + '.', true);
    return loja.rpc('comandar', { p_chave: chave, p_sala: SALA, p_comando: c }).then(function (r) {
      if (r && r.error) aviso(/chave/.test(r.error.message) ? 'Chave recusada.' : 'Falha ao enviar: ' + r.error.message, true);
      return r;
    });
  }
  function pintarPresenca() {
    var p = $('presenca'); if (!p) return;
    var on = telaoOn();
    p.className = 'status' + (on ? ' on' : '');
    p.querySelector('span').textContent = on ? 'telão conectado' : 'telão fechado';
    var m = loja.palcoMeta || (pulsoOn() ? estadoPalco.meta : null), nomes = { auto: 'Automático', '169': '16:9', '43': '4:3 com faixas', '43c': '4:3 compensado' };
    var fa = $('formato-atual');
    if (fa) fa.textContent = C.DEMO ? 'demonstração' : !on ? 'telão fechado' : m && m.formato ?
      nomes[m.formato] + (m.formato === 'auto' ? ' (agora ' + (m.layout === '43' ? '4:3' : '16:9') + ')' : '') + (m.teste ? ' · teste aberto' : '') : 'telão conectado';
    Array.prototype.forEach.call(document.querySelectorAll('#formatos [data-f]'), function (b) { b.classList.toggle('ativo', !!(on && m && m.formato === b.dataset.f)); });
    marcarPassagem();
    var sa = $('som-atual'), bm = $('b-musica');
    if (sa) {
      var est = m && m.som, mudo = !!(m && m.mudo);
      sa.textContent = C.DEMO ? 'demonstração' : !on ? 'telão fechado' : !m ? 'telão conectado' :
        est === 'tocando' ? 'tocando' : est === 'bloqueado' ? 'bloqueada pelo navegador: aperte F no telão' : mudo ? 'desligada' : 'pronta, começa na primeira palavra do slide 3';
      sa.style.color = est === 'bloqueado' ? '#FFD0C2' : '';
      bm.textContent = mudo ? 'Ligar música' : 'Desligar música';
    }
  }
  function marcarPassagem() {
    var m = loja.palcoMeta, aberta = m && m.passagem;
    Array.prototype.forEach.call(document.querySelectorAll('#atual [data-ref]'), function (b) { b.classList.toggle('ativo', !!aberta && b.dataset.ref === aberta); });
  }
  function aviso(t, erro) { var a = $('aviso'); a.textContent = t; a.className = 'aviso' + (erro ? ' err' : ''); clearTimeout(a._t); a._t = setTimeout(function () { a.textContent = ''; }, 4000); }

  function pintarEstado() {
    var s = loja.sala;
    $('n-gotas').textContent = Object.keys(loja.jogadores).length;
    if (!s) { $('atual').innerHTML = '<p class="nota">O telão ainda não abriu esta sala. Abra o telão e entre com a chave.</p>'; return; }
    var sl = A.slides[s.slide] || {}, r = rotulo(sl, s.slide);
    $('atual').innerHTML = '<div class="kick">Slide ' + (s.slide + 1) + ' de ' + A.slides.length + ' · ' + esc(r.tipo) + '</div><h2>' + esc(r.texto) + '</h2>' +
      (sl.nota ? '<p class="nota-apr">' + esc(sl.nota) + '</p>' : '') +
      (sl.passagens && sl.passagens.length ? '<div class="passagens"><div class="kick">Passagens · abre em destaque no telão</div><div class="grade4">' +
        sl.passagens.map(function (p, i) { return '<button class="btn sec peq" type="button" data-p="' + i + '" data-ref="' + esc(p.ref) + '">' + esc(p.ref) + '</button>'; }).join('') +
        '</div><button class="btn peq" type="button" data-pf="1">Fechar passagem</button></div>' : '') +
      (s.etapa === 'quiz' ? '<p class="nota">Quiz: ' + (s.quiz_revelada ? 'resposta mostrada' : s.quiz_aberta_em ? 'valendo' : 'pronto para abrir') + '</p>' : '');
    Array.prototype.forEach.call($('lista').children, function (li) { li.classList.toggle('atual', +li.dataset.i === s.slide); });
    var at = $('lista').querySelector('.atual'); if (at && $('seguir').checked) at.scrollIntoView({ block: 'nearest' });
    marcarPassagem();
  }
  function montarLista() {
    $('lista').innerHTML = A.slides.map(function (s, i) {
      var r = rotulo(s, i);
      return '<li data-i="' + i + '"><span class="n">' + (i + 1) + '</span><span class="t"><b>' + esc(r.tipo) + '</b> ' + esc(r.texto.slice(0, 70)) + '</span>' + (s.opcional ? '<em>opcional</em>' : '') + '</li>';
    }).join('');
    Array.prototype.forEach.call($('lista').children, function (li) {
      li.addEventListener('click', function () { cmd('ir:' + li.dataset.i); });
    });
  }

  function mural() {
    loja.rpc('mural_pendentes', { p_chave: chave, p_sala: SALA }).then(function (r) {
      var l = (r && r.data) || [];
      var pend = l.filter(function (m) { return !m.aprovada && !m.oculta; }), apr = l.filter(function (m) { return m.aprovada && !m.oculta; });
      $('n-pend').textContent = pend.length;
      $('pend').innerHTML = pend.length ? pend.map(function (m) {
        return '<div class="m"><p>' + esc(m.texto) + '</p><div class="acoes"><button class="btn peq" data-a="aprovar" data-id="' + m.id + '">Aprovar</button><button class="btn sec peq" data-a="ocultar" data-id="' + m.id + '">Ocultar</button></div></div>';
      }).join('') : '<p class="nota">Nenhuma pergunta aguardando.</p>';
      $('apr').innerHTML = apr.length ? apr.sort(function (a, b) { return b.apoios - a.apoios; }).map(function (m) {
        return '<div class="m' + (m.respondida ? ' resp' : '') + '"><p><b>' + m.apoios + '</b> · ' + esc(m.texto) + '</p><div class="acoes"><button class="btn sec peq" data-a="respondida" data-id="' + m.id + '">' + (m.respondida ? 'Reabrir' : 'Respondida') + '</button><button class="btn sec peq" data-a="ocultar" data-id="' + m.id + '">Ocultar</button></div></div>';
      }).join('') : '<p class="nota">Nada aprovado ainda.</p>';
      Array.prototype.forEach.call(document.querySelectorAll('#pend button, #apr button'), function (b) {
        b.addEventListener('click', function () {
          var id = isNaN(+b.dataset.id) ? b.dataset.id : +b.dataset.id;
          loja.rpc('mural_moderar', { p_chave: chave, p_id: id, p_acao: b.dataset.a }).then(mural);
        });
      });
    });
  }

  function entrar(v) {
    loja.rpc('chave_valida', { p_chave: v }).then(function (r) {
      if (r && r.data === true) {
        chave = v; C.guardar('cat-chave', v); $('login').hidden = true; $('painel').hidden = false;
        $('link-telao').href = 'palco.html' + location.search + '#k=' + encodeURIComponent(v);
        if (!loja.sala) loja.rpc('sala_garantir', { p_chave: v, p_sala: SALA, p_aula: C.AULA_ID });
        var comMural = A.slides.some(function (x) { return x.tipo === 'mural'; });
        $('card-mural').style.display = comMural ? '' : 'none';
        if (comMural) { mural(); clearInterval(timerMural); timerMural = setInterval(mural, 4000); }
      } else { $('m-login').textContent = 'Chave incorreta.'; $('login').hidden = false; }
    });
  }

  function iniciar() {
    A = window.AULA;
    $('aula').textContent = A.titulo + ' · sala ' + SALA;
    $('link-telao').href = 'palco.html' + location.search;
    $('link-celular').href = 'index.html' + location.search;
    $('link-orador').href = 'orador.html' + location.search;
    loja = new C.Loja({ tabelas: ['jogadores'], intervalo: 8000, verPresenca: true });
    var geracaoVista = null;
    loja.ouvir(function (t) {
      if (t === 'sala') { var g = loja.geracao(); if (g != null && geracaoVista != null && g !== geracaoVista) loja.zerar(); if (g != null) geracaoVista = g; }
      if (t === 'sala' || t === 'carga' || t === 'jogadores') pintarEstado(); if (t === 'presenca' || t === 'carga') pintarPresenca(); });
    loja.iniciar().then(function () {
      montarLista(); pintarEstado();
      var salva = C.DEMO ? 'demo' : C.ler('cat-chave', '');
      if (salva) entrar(salva); else $('login').hidden = false;
    });
    $('login').addEventListener('submit', function (ev) { ev.preventDefault(); entrar($('w-chave').value.trim()); });
    $('b-voltar').addEventListener('click', function () { cmd('voltar'); });
    $('b-avancar').addEventListener('click', function () { cmd('avancar'); });
    $('b-qr').addEventListener('click', function () { cmd('qr'); });
    $('b-recarregar').addEventListener('click', function () { cmd('recarregar'); });
    Array.prototype.forEach.call(document.querySelectorAll('#formatos [data-f]'), function (b) {
      b.addEventListener('click', function () { cmd('formato:' + b.dataset.f).then(function (r) { if (r && !r.error) aviso('Formato enviado ao telão: ' + b.textContent + '.'); }); });
    });
    $('b-teste').addEventListener('click', function () { cmd('teste').then(function (r) { if (r && !r.error) aviso('Teste de tela alternado no telão.'); }); });
    $('atual').addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('button'); if (!b) return;
      if (b.dataset.pf) cmd('passagem:fechar').then(function (r) { if (r && !r.error) aviso('Passagem fechada no telão.'); });
      else if (b.dataset.p != null) cmd('passagem:' + b.dataset.p).then(function (r) { if (r && !r.error) aviso('Abrindo ' + b.dataset.ref + ' no telão.'); });
    });
    $('b-musica').addEventListener('click', function () { cmd('musica').then(function (r) { if (r && !r.error) aviso('Música alternada no telão.'); }); });
    $('b-encerrar').addEventListener('click', function () {
      if (!confirm('Apagar as selfies e as intenções desta sala? Os pontos continuam.')) return;
      loja.rpc('sala_encerrar', { p_chave: chave, p_sala: SALA }).then(function (r) {
        var d = r && r.data; aviso(d ? d.fotos_apagadas + ' fotos e ' + d.intencoes_apagadas + ' intenções apagadas.' : 'Falha ao encerrar.', !d);
      });
    });
    $('b-limpar').addEventListener('click', function () {
      if (!confirm('Recomeçar a sala? Os participantes, respostas e pontos vão para um arquivo, as fotos são apagadas e todos precisam entrar de novo.')) return;
      loja.rpc('sala_limpar', { p_chave: chave, p_sala: SALA }).then(function (r) {
        aviso(r && r.data ? 'Sala recomeçada: o telão voltou ao slide 1 e os celulares pedem cadastro novo.' : 'Falha ao recomeçar.', !(r && r.data));
      });
    });
    $('b-sair').addEventListener('click', function () { C.guardar('cat-chave', ''); location.reload(); });
  }

  C.carregarScript('aulas/' + C.AULA_ID + '/aula.js').then(iniciar).catch(function (e) { document.body.textContent = 'Erro: ' + e.message; });
})();
