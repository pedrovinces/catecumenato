/* Telão · renderiza a aula, conduz as dinâmicas e sincroniza os celulares */
(function () {
  'use strict';
  var C = window.Catequese, esc = C.esc;
  var A, slides, loja, palco, tela, chaveApr = null, somenteExibir = false;
  var indice = -1, atual = null, elAtual = null, ultimoSeq = null;
  var hudTimer = null;

  /* ---------- utilitários ---------- */
  function $(sel, raiz) { return (raiz || document).querySelector(sel); }
  function tit(t) { return (Array.isArray(t) ? t : [t]).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join(''); }
  function img(f) { return A.img + f; }
  function fmt(n) { return Number(n || 0).toLocaleString('pt-BR'); }
  function pct(a, b) { return b ? Math.round(a * 100 / b) : 0; }
  function mediana(v) {
    if (!v.length) return null; v = v.slice().sort(function (a, b) { return a - b; });
    var m = v.length >> 1; return v.length % 2 ? v[m] : Math.round((v[m - 1] + v[m]) / 2 - 0.01);
  }
  function rpcApr(nome, args) {
    args = args || {};
    if (!chaveApr && !C.DEMO) return Promise.resolve({ error: { message: 'sem chave' } });
    args.p_chave = chaveApr || 'demo'; args.p_sala = C.SALA;
    return loja.rpc(nome, args).then(function (r) {
      if (r && r.error && /chave invalida/.test(r.error.message || '')) { chaveApr = null; C.guardar('cat-chave', ''); mostrarLogin('A chave foi recusada. Digite de novo.'); }
      return r;
    });
  }
  function miniQR() {
    return '<div class="mini-qr"><div class="q">' + C.qrSvg(C.urlPublica()) + '</div></div>';
  }
  function cab(kicker, pergunta) {
    return '<div class="cab">' + (kicker ? '<div class="kicker">' + esc(kicker) + '</div>' : '') + '<h2>' + esc(pergunta) + '</h2></div>';
  }
  function gruposDe(id) {
    for (var i = 0; i < slides.length; i++) if (slides[i].tipo === 'nuvem' && slides[i].id === id && slides[i].grupos) return slides[i].grupos;
    return null;
  }
  function etapaDo(sl) {
    var t = sl.tipo;
    if (t === 'entrada' || t === 'mural' || t === 'ranking' || t === 'podio' || t === 'intencoes' || t === 'quiz-intro' || t === 'eclesial') return t;
    if (t === 'nuvem' || t === 'mito' || t === 'regua' || t === 'mapa' || t === 'caca') return t + ':' + sl.id;
    if (t === 'quiz') return 'quiz';
    return 'espera';
  }

  /* ---------- gotas: disposição em espiral (filotaxia) ---------- */
  function dispor(cont, lista, R, opt) {
    opt = opt || {};
    var N = lista.length, existentes = {}, novos = 0;
    Array.prototype.forEach.call(cont.querySelectorAll('.g'), function (d) { existentes[d.dataset.ap] = d; });
    var cx = opt.cx != null ? opt.cx : R, cy = opt.cy != null ? opt.cy : R, tam, pos = [];
    if (opt.aneis) {
      var r0 = opt.r0 || 210, esp = opt.esp || 92, k = 0, anel = 0;
      tam = Math.max(46, Math.min(96, esp * 0.95));
      while (k < N) {
        var r = r0 + anel * esp, cap = Math.max(6, Math.floor(2 * Math.PI * r / (tam * 0.92)));
        var nesse = Math.min(cap, N - k);
        for (var i = 0; i < nesse; i++) { var th = -Math.PI / 2 + (i / nesse) * 2 * Math.PI + anel * 0.35; pos.push([cx + r * Math.cos(th), cy + r * Math.sin(th)]); }
        k += nesse; anel++;
        if (r0 + anel * esp > R - tam * 0.4) { esp *= 0.86; tam *= 0.86; }
      }
    } else {
      var c = N ? (R * 0.84) / Math.sqrt(N + 0.5) : 0;
      tam = Math.max(38, Math.min(150, c * 1.5));
      for (var j = 0; j < N; j++) { var rr = c * Math.sqrt(j + 0.5), tt = j * 2.399963; pos.push([cx + rr * Math.cos(tt), cy + rr * Math.sin(tt)]); }
    }
    lista.forEach(function (jg, i) {
      var d = existentes[jg.aparelho];
      var assinatura = (jg.foto ? 'f' + jg.foto.length : 'n') + '|' + jg.apelido + '|' + jg.cor;
      var novo = false;
      if (!d) {
        novo = true;
        var atraso = novos++ * (opt.boca ? 0.2 : 0.14);
        d = document.createElement('div'); d.className = 'g' + (opt.semQueda ? '' : opt.boca ? ' mergulho' : ' caindo'); d.dataset.ap = jg.aparelho;
        d.style.animationDelay = opt.boca ? atraso + 's, ' + (atraso + 1.8 + Math.random() * 2).toFixed(2) + 's' : atraso + 's';
        d._chegada = Date.now() + (atraso + (opt.boca ? 1.8 : 1.1)) * 1000;
        if (opt.boca) setTimeout(function () { opt.boca.respingo(); }, (atraso + 0.8) * 1000);
        else if (opt.aoPousar && !opt.semQueda) setTimeout(opt.aoPousar, (atraso + 0.78) * 1000);
        cont.appendChild(d);
      }
      if (d.dataset.assin !== assinatura) { d.innerHTML = C.gotaSVG(jg); d.dataset.assin = assinatura; }
      d.style.left = pos[i][0].toFixed(1) + 'px'; d.style.top = pos[i][1].toFixed(1) + 'px'; d.style.width = tam.toFixed(1) + 'px';
      if (novo && opt.boca) {
        d.style.setProperty('--dx', (opt.boca.x - pos[i][0]).toFixed(1) + 'px');
        d.style.setProperty('--dy', (opt.boca.y - pos[i][1]).toFixed(1) + 'px');
        d.style.setProperty('--sy', (opt.boca.nivel - pos[i][1]).toFixed(1) + 'px');
      }
      delete existentes[jg.aparelho];
    });
    Object.keys(existentes).forEach(function (k) { existentes[k].remove(); });
  }

  /* ---------- renderizadores ---------- */
  var R = {};

  R.capa = function (sl, el) {
    el.innerHTML = '<div class="capa"><div class="logo"><img src="img/logo-catecumenato.jpg" alt="Catecumenato, Iniciação Cristã de Adultos, Paróquia São Judas Tadeu"></div>' +
      '<div class="lado"><div class="kicker">' + esc(sl.kicker) + '</div><h1 class="titulo">' + tit(sl.titulo) + '</h1>' +
      '<div class="divisor"></div><div class="sub">' + esc(sl.subtitulo) + '</div>' +
      (sl.imagem ? '<div class="foto-circ"><img src="' + img(sl.imagem) + '" alt=""></div>' : '') +
      '<div class="rodape">' + esc(sl.rodape || '') + '</div></div></div>';
    return {};
  };

  /* ---------- frasco de vidro cheio de óleo (slide de entrada) ----------
     viewBox 800x1000: corpo redondo (centro 400,600, raio 370) e gargalo aberto em cima */
  var FR = { cx: 400, cy: 600, r: 370, g0: 318, g1: 482, topo: 72 };
  function frascoSVG() {
    var a = (FR.cy - Math.sqrt(FR.r * FR.r - Math.pow(FR.cx - FR.g0, 2))).toFixed(1);
    var corpo = 'M' + FR.g0 + ',' + FR.topo + ' L' + FR.g0 + ',' + a + ' A' + FR.r + ',' + FR.r + ' 0 1 0 ' + FR.g1 + ',' + a + ' L' + FR.g1 + ',' + FR.topo + ' Z';
    var onda = function (y, amp) {
      var d = 'M0,' + y; for (var x = 0; x < 1600; x += 400) d += ' Q' + (x + 100) + ',' + (y - amp) + ' ' + (x + 200) + ',' + y + ' Q' + (x + 300) + ',' + (y + amp) + ' ' + (x + 400) + ',' + y;
      return d + ' L1600,1000 L0,1000 Z';
    };
    var bolhas = '';
    [[250, 7, 11, 0], [520, 5, 14, 3], [380, 9, 17, 6], [610, 6, 12, 8], [190, 4, 15, 10], [450, 5, 13, 2]].forEach(function (b) {
      bolhas += '<circle class="bolha" cx="' + b[0] + '" cy="955" r="' + b[1] + '" style="animation-duration:' + b[2] + 's;animation-delay:-' + b[3] + 's"/>';
    });
    return '<svg class="frasco-svg" viewBox="0 0 800 1000" aria-hidden="true"><defs>' +
      '<clipPath id="fr-clip"><path d="' + corpo + '"/></clipPath>' +
      '<linearGradient id="fr-oleo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8D464" stop-opacity=".80"/><stop offset=".5" stop-color="#E3A83C" stop-opacity=".64"/><stop offset="1" stop-color="#B8752A" stop-opacity=".78"/></linearGradient>' +
      '<radialGradient id="fr-vidro" cx=".34" cy=".36" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".65" stop-color="#fff" stop-opacity=".03"/><stop offset="1" stop-color="#fff" stop-opacity=".16"/></radialGradient></defs>' +
      '<ellipse cx="400" cy="986" rx="260" ry="13" fill="#000" opacity=".28"/>' +
      '<path d="' + corpo + '" fill="url(#fr-vidro)"/>' +
      '<g clip-path="url(#fr-clip)"><g class="oleo"><path class="onda o2" d="' + onda(296, 9) + '" fill="#F8D464" opacity=".28"/><path class="onda" d="' + onda(304, 11) + '" fill="url(#fr-oleo)"/>' + bolhas + '</g></g>' +
      '<path d="' + corpo + '" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="5"/>' +
      '<path d="M96,560 A306,306 0 0 1 236,318" fill="none" stroke="#fff" stroke-opacity=".34" stroke-width="16" stroke-linecap="round"/>' +
      '<path d="M90,640 A310,310 0 0 1 88,604" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="16" stroke-linecap="round"/>' +
      '<path d="M640,860 A300,300 0 0 0 700,760" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="10" stroke-linecap="round"/>' +
      '<rect x="338" y="104" width="11" height="118" rx="5.5" fill="#fff" opacity=".3"/>' +
      '<rect x="302" y="50" width="196" height="30" rx="13" fill="rgba(255,255,255,.08)" stroke="#fff" stroke-opacity=".7" stroke-width="5"/>' +
      '<rect x="318" y="150" width="164" height="12" rx="6" fill="#F8D464" opacity=".85"/>' +
      '</svg>';
  }

  R.entrada = function (sl, el) {
    el.innerHTML = '<div class="entrada"><div class="esq">' +
      '<div class="qr-cartao chamar">' + C.qrSvg(C.urlPublica()) + '</div>' +
      '<h1 class="chamada">' + esc(sl.titulo) + '</h1>' +
      '<div class="texto-g">' + esc(sl.texto).replace(/\s(\S+)$/, ' <span class="fim">$1 <span class="seta">→</span></span>') + '</div></div>' +
      '<div class="dir"><div class="frasco">' + frascoSVG() + '<div class="gotas"></div><div class="respingos"></div>' +
      '<div class="vazio">Sua gota aparece aqui</div></div>' +
      '<div class="contador"><b>0</b><span>participantes</span></div></div></div>';
    var fr = $('.frasco', el), cont = $('.gotas', el), resp = $('.respingos', el), num = $('.contador b', el), vazio = $('.vazio', el);
    var vistos = null, fila = [], timerFila = null, k = 1, nivel = 304;
    var boca = {
      respingo: function () {
        var r = document.createElement('i'); r.className = 'respingo';
        r.style.left = (400 * k) + 'px'; r.style.top = (boca.nivel) + 'px';
        resp.appendChild(r); setTimeout(function () { r.remove(); }, 1200);
        if (sl.somGota && slides[indice] === sl) Gota.tocar(0.6);
      }
    };
    function atualizar() {
      var lista = loja.listaJogadores(), chegaram = [];
      if (vistos === null) { vistos = {}; lista.forEach(function (j) { vistos[j.aparelho] = 1; }); }
      else lista.forEach(function (j) { if (!vistos[j.aparelho]) { vistos[j.aparelho] = 1; chegaram.push(j); } });
      k = (fr.offsetWidth || 760) / 800;
      nivel = 304 - Math.min(64, lista.length * 2.2);         /* o óleo sobe um pouco a cada participante */
      fr.style.setProperty('--nivel', (nivel - 304).toFixed(1) + 'px');   /* unidades do desenho */
      boca.x = 400 * k; boca.y = 30 * k; boca.nivel = nivel * k;
      dispor(cont, lista, 318 * k, { cx: 400 * k, cy: 648 * k, boca: boca });
      num.textContent = fmt(lista.length);
      num.nextElementSibling.textContent = lista.length === 1 ? 'participante' : 'participantes';
      vazio.hidden = lista.length > 0;
      chegaram.forEach(function (j) { fila.push(j); });
      processar();
    }
    /* quem acabou de entrar: a gota cresce, brilha e mostra o apelido, uma de cada vez */
    function processar() {
      if (timerFila || !fila.length) return;
      var j = fila.shift(), muitos = fila.length > 5;
      destacar(j, muitos ? 1700 : 2700);
      timerFila = setTimeout(function () { timerFila = null; processar(); }, muitos ? 550 : 1150);
    }
    function destacar(j, dura) {
      var d = null;
      Array.prototype.some.call(cont.querySelectorAll('.g'), function (x) { if (x.dataset.ap === j.aparelho) { d = x; return true; } return false; });
      if (!d) return;
      setTimeout(function () {
        if (!d.isConnected) return;
        var acima = parseFloat(d.style.top) > fr.offsetHeight * 0.6;
        var t = document.createElement('span'); t.className = 'nome-chegada' + (acima ? ' acima' : ''); t.textContent = j.apelido;
        d.appendChild(t); d.classList.add('chegou');
        setTimeout(function () { d.classList.remove('chegou'); t.classList.add('sai'); setTimeout(function () { t.remove(); }, 700); }, dura);
      }, Math.max(0, (d._chegada || 0) - Date.now()));
    }
    return { entrar: atualizar, atualizar: function (t) { if (t === 'jogadores' || t === 'carga') atualizar(); },
      sair: function () { clearTimeout(timerFila); fila = []; } };
  };

  R.nuvem = function (sl, el) {
    var grupos = sl.grupos || gruposDe(sl.comparar);
    var passos = (sl.passos || ['Coleta']).length, foco = 0;
    el.innerHTML = cab(sl.kicker, sl.pergunta) + miniQR() + '<div class="nuvem"></div>' +
      '<div class="rodape-dados"><b class="np">0</b> palavras · <b class="pp">0</b> pessoas</div><div class="legenda-foco"></div>';
    var nv = $('.nuvem', el), leg = $('.legenda-foco', el);
    function desenhar(animar) {
      var itens = loja.nuvem(sl.id, grupos);
      C.desenharNuvem(nv, itens, { animar: animar, maxF: 180, minF: 26, classe: function (it) { return it.grupo ? 'g-' + it.grupo : ''; } });
      var total = loja.palavras.filter(function (p) { return p.interacao === sl.id; }).length;
      $('.np', el).textContent = fmt(total);
      musicaPorResposta(sl, total);
      $('.pp', el).textContent = fmt(loja.participantesDe('palavras', sl.id));
    }
    function aplicar() {
      nv.classList.toggle('foco-fim', foco === 1);
      nv.classList.toggle('foco-forca', foco === 2);
      leg.innerHTML = foco === 1 ? '<span class="fim">Palavras de fim</span>' : foco === 2 ? '<span class="forca">Palavras de força</span>' : '';
    }
    return {
      entrar: function () { setTimeout(function () { desenhar(false); }, 60); },
      atualizar: function (t) { if (t === 'palavras' || t === 'carga') desenhar(true); },
      passo: function () { return { p: foco, n: passos }; },
      avancar: function () { if (foco < passos - 1) { foco++; aplicar(); return true; } return false; },
      voltar: function () { if (foco > 0) { foco--; aplicar(); return true; } return false; }
    };
  };

  R.foto = function (sl, el) {
    el.classList.add('trans-' + (sl.transicao || 'suave'));
    var temTexto = sl.legenda || sl.kicker;
    el.innerHTML = '<div class="foto-full' + (sl.ajuste === 'contain' ? ' contain' : '') + '" style="background-image:url(\'' + img(sl.imagem) + '\');transform-origin:' + (sl.origem || '50% 50%') + '"></div>' +
      (sl.transicao === 'portas' ? '<div class="portas"><i></i><i></i></div>' : '') +
      (temTexto ? '<div class="foto-sombra"></div><div class="foto-texto">' + (sl.kicker ? '<div class="kicker">' + esc(sl.kicker) + '</div>' : '') +
        (sl.legenda ? '<div class="leg">' + esc(sl.legenda) + '</div>' : '') + '</div>' : '');
    return {};
  };

  R.sacramentos = function (sl, el) {
    el.innerHTML = '<div class="sacr"><div class="lista"><h1 class="titulo medio">' + tit(sl.titulo) + '</h1><ol>' +
      sl.lista.map(function (n, i) { return '<li class="' + (sl.destaque.indexOf(i) >= 0 ? 'dest' : '') + '">' + esc(n) + '</li>'; }).join('') +
      '<div class="chave-cura"><i></i><span>' + esc(sl.rotulo).replace(' de ', '<br>de ') + '</span></div></ol></div>' +
      '<div><div class="circ-foto"><div class="circ forte"></div><div class="img" style="background-image:url(\'' + img(sl.imagem) + '\')"></div></div></div></div>';
    return {
      entrar: function () {
        var d = el.querySelectorAll('li.dest'), ch = $('.chave-cura', el);
        if (!d.length) { ch.hidden = true; return; }
        var top = d[0].offsetTop, fim = d[d.length - 1].offsetTop + d[d.length - 1].offsetHeight;
        ch.style.top = top + 'px'; ch.style.height = (fim - top) + 'px'; ch.querySelector('i').style.height = (fim - top - 16) + 'px';
      }
    };
  };

  R.texto = function (sl, el) {
    var imgs = sl.imagens || (sl.imagem ? [sl.imagem] : []);
    el.innerHTML = '<div class="txt' + (imgs.length ? '' : ' sem-img') + '"><div class="col">' +
      (sl.kicker ? '<div class="kicker">' + esc(sl.kicker) + '</div>' : '') +
      '<h1 class="titulo medio">' + tit(sl.titulo) + '</h1><ul>' +
      (sl.itens || []).map(function (t) { return '<li><span>' + esc(t) + '</span></li>'; }).join('') + '</ul></div>' +
      (imgs.length ? '<div class="imgs' + (imgs.length === 1 ? ' uma' : '') + '">' + imgs.map(function (f) { return '<div class="im" style="background-image:url(\'' + img(f) + '\')"></div>'; }).join('') + '</div>' : '') +
      '</div>';
    return {};
  };

  R.citacao = function (sl, el) {
    el.innerHTML = '<div class="circ" style="width:1500px;height:1500px;right:-700px;top:-210px"></div>' +
      '<div class="cit"><div class="aspas">“</div><blockquote>' + esc(sl.texto) + '</blockquote><div class="autor">' + esc(sl.autor) + '</div>' +
      (sl.complemento ? '<div class="compl">' + esc(sl.complemento) + '</div>' : '') + '</div>';
    return {};
  };

  R.titulo = function (sl, el) {
    el.innerHTML = '<div class="circ" style="width:1300px;height:1300px;left:-500px;bottom:-650px"></div>' +
      '<div class="tit">' + (sl.kicker ? '<div class="kicker">' + esc(sl.kicker) + '</div>' : '') +
      '<h1 class="titulo">' + tit(sl.titulo) + '</h1>' + (sl.texto ? '<div class="texto-g">' + esc(sl.texto) + '</div>' : '') + '</div>';
    return {};
  };

  R.regua = function (sl, el) {
    var n = sl.pontos.length, revelado = false;
    el.innerHTML = cab(sl.kicker, sl.pergunta) + miniQR() +
      '<div class="regua"><div class="linha-base"></div>' + sl.pontos.map(function (p, i) {
        return '<div class="col" data-i="' + i + '"><div class="num">0</div><div class="barra" style="height:0"></div><div class="rot">' + esc(p) + '</div></div>';
      }).join('') + '</div>' +
      '<div class="marcador-cic"><div class="chama-barra"></div><div>' + esc(sl.marcador) + '<div class="fonte">' + esc(sl.fonte) + '</div></div></div>' +
      '<div class="rodape-dados"><b class="pp">0</b> respostas</div>';
    var cols = el.querySelectorAll('.regua .col');
    function atualizar() {
      var v = loja.valoresRegua(sl.id), c = []; for (var i = 0; i < n; i++) c.push(0);
      v.forEach(function (x) { if (c[x] != null) c[x]++; });
      var max = Math.max.apply(null, c.concat([1])), med = mediana(v);
      Array.prototype.forEach.call(cols, function (col, i) {
        col.querySelector('.barra').style.height = Math.round(360 * c[i] / max) + 'px';
        col.querySelector('.num').textContent = c[i];
        var m = col.querySelector('.mediana');
        if (med === i && v.length) { if (!m) { m = document.createElement('div'); m.className = 'mediana'; m.textContent = 'Mediana da sala'; col.insertBefore(m, col.firstChild); } }
        else if (m) m.remove();
      });
      $('.pp', el).textContent = fmt(v.length);
      if (!revelado) musicaPorResposta(sl, v.length);
    }
    function aplicar() {
      /* a música acompanha a coleta; ao mostrar o Catecismo ela sai para a fala */
      if (sl.musica) { if (revelado) Som.parar(2500); else musicaPorResposta(sl, loja.valoresRegua(sl.id).length); }
      Array.prototype.forEach.call(cols, function (col, i) { col.classList.toggle('certo', revelado && sl.certo.indexOf(i) >= 0); });
      $('.marcador-cic', el).classList.toggle('on', revelado);
      $('.rodape-dados', el).style.opacity = revelado ? 0 : 1;
    }
    return {
      entrar: atualizar, atualizar: function (t) { if (t === 'regua' || t === 'carga') atualizar(); },
      passo: function () { return { p: revelado ? 1 : 0, n: 2 }; },
      avancar: function () { if (!revelado) { revelado = true; aplicar(); return true; } return false; },
      voltar: function () { if (revelado) { revelado = false; aplicar(); return true; } return false; }
    };
  };

  R.mito = function (sl, el, ctx) {
    var p = 0, total = sl.itens.length * 2;
    el.innerHTML = '<div class="mito"><div class="kicker">' + esc(sl.kicker) + '</div><div class="contagem-item"></div><div class="afirm"></div>' +
      '<div class="barras">' + sl.opcoes.map(function (o, i) { return '<div class="op" data-o="' + i + '"><div class="enche"></div><span class="r">' + esc(o) + '</span><span class="p">0%</span></div>'; }).join('') + '</div>' +
      '<div class="exp"></div><div class="carimbo"></div></div>' + miniQR() + '<div class="rodape-dados"><b class="pp">0</b> votos</div>';
    var raiz = $('.mito', el);
    function item() { return Math.floor(p / 2); }
    function render(mudouItem) {
      var it = sl.itens[item()], rev = p % 2 === 1;
      $('.contagem-item', el).textContent = (item() + 1) + ' / ' + sl.itens.length;
      $('.afirm', el).textContent = it.t;
      raiz.classList.toggle('revelado', rev);
      Array.prototype.forEach.call(el.querySelectorAll('.op'), function (op, i) { op.classList.toggle('certa', i === it.r); });
      $('.carimbo', el).textContent = sl.opcoes[it.r];
      $('.exp', el).innerHTML = esc(it.exp) + ' <span class="fonte">' + esc(it.fonte || '') + '</span>';
      contar();
      if (mudouItem) ctx.sincronizar(item(), rev ? 'fim' : null);
    }
    function contar() {
      var c = loja.contarVotos(sl.id, item(), sl.opcoes.length), t = c.reduce(function (a, b) { return a + b; }, 0);
      Array.prototype.forEach.call(el.querySelectorAll('.op'), function (op, i) {
        op.querySelector('.enche').style.width = pct(c[i], t) + '%';
        op.querySelector('.p').textContent = pct(c[i], t) + '%';
      });
      $('.pp', el).textContent = fmt(t);
    }
    /* som por afirmação: pergunta nova com vinheta e trilha; resposta revelada em silêncio */
    var comSom = !!(sl.efeitoPorItem && (sl.musica || sl.efeito));
    function som(direcao) {
      if (!comSom) return;
      if (p % 2 === 1) silenciarPergunta();
      else trilhaDaPergunta(sl, direcao === 'frente');
    }
    return {
      item: 0,
      entrar: function () { render(false); som(ctx.paraFrente ? 'frente' : 'tras'); },
      atualizar: function (t) { if (t === 'votos' || t === 'carga') contar(); },
      passo: function () { return { p: p, n: total }; },
      avancar: function () { if (p < total - 1) { p++; render(true); som('frente'); return true; } return false; },
      voltar: function () { if (p > 0) { p--; render(true); som('tras'); return true; } return false; }
    };
  };

  R.tres = function (sl, el) {
    el.innerHTML = '<div class="tres"><div class="topo"><h1 class="titulo medio">' + tit(sl.titulo) + '</h1>' +
      (sl.imagem ? '<div class="im" style="background-image:url(\'' + img(sl.imagem) + '\')"></div>' : '') + '</div>' +
      '<div class="cols">' + sl.colunas.map(function (c) {
        return '<div class="c"><h3>' + esc(c.t) + '</h3>' + c.itens.map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') + '</div>';
      }).join('') + '</div><div class="fonte">' + esc(sl.fonte || '') + '</div></div>';
    return {};
  };

  R.mapa = function (sl, el) {
    var passo = 0, alvos = C.ALVOS_CORPO;
    function marcas(lista, cls, r) {
      return lista.map(function (p) {
        return '<g class="ponto-alvo ' + cls + '" transform="translate(' + p[0] + ' ' + p[1] + ')"><circle r="' + (r + Math.round(r * 0.6)) + '" fill="none" stroke="#F8D464" stroke-width="' + (r < 12 ? 2.5 : 3) + '"/>' +
          '<path d="M0 ' + (-r) + ' C0 ' + (-r) + ' ' + (-r * 0.7) + ' ' + (-r * 0.1) + ' ' + (-r * 0.7) + ' ' + (r * 0.3) + ' A' + (r * 0.7) + ' ' + (r * 0.7) + ' 0 0 0 ' + (r * 0.7) + ' ' + (r * 0.3) + ' C' + (r * 0.7) + ' ' + (-r * 0.1) + ' 0 ' + (-r) + ' 0 ' + (-r) + 'Z" fill="#F8D464"/></g>';
      }).join('');
    }
    var extra = '<g class="calor" style="mix-blend-mode:screen"></g>' + marcas(alvos.sentidos, 'antigo', 9) + marcas(alvos.fronte, 'atual', 12) + marcas(alvos.maos, 'atual', 16);
    el.innerHTML = '<div class="mapa"><div class="figura">' + C.corpoSVG(extra) + '</div><div class="lado">' +
      '<div class="kicker">' + esc(sl.kicker) + '</div><h2>' + esc(sl.pergunta) + '</h2>' +
      '<div class="resposta r-atual"><b>' + esc(sl.atual.texto) + '</b><span class="fonte">' + esc(sl.atual.fonte) + '</span></div>' +
      '<div class="resposta r-antigo">' + esc(sl.antigo.texto) + '</div>' +
      '<div class="rodape-dados" style="position:static"><b class="np">0</b> toques · <b class="pp">0</b> pessoas</div></div></div>' + miniQR();
    var calor = $('.calor', el), desenhados = 0;
    function atualizar() {
      var pts = loja.pontosMapa(sl.id);
      if (pts.length < desenhados) { calor.innerHTML = ''; desenhados = 0; }
      var frag = '';
      for (var i = desenhados; i < pts.length; i++) frag += '<circle cx="' + (pts[i].x * 400).toFixed(1) + '" cy="' + (pts[i].y * 1000).toFixed(1) + '" r="34" fill="url(#calor)"/>';
      if (frag) calor.insertAdjacentHTML('beforeend', frag);
      desenhados = pts.length;
      $('.np', el).textContent = fmt(pts.length);
      $('.pp', el).textContent = fmt(loja.participantesDe('mapa', sl.id));
      if (passo === 0) musicaPorResposta(sl, pts.length);
    }
    function aplicar() {
      Array.prototype.forEach.call(el.querySelectorAll('.ponto-alvo.atual'), function (g) { g.classList.toggle('on', passo >= 1); });
      Array.prototype.forEach.call(el.querySelectorAll('.ponto-alvo.antigo'), function (g) { g.classList.toggle('on', passo >= 2); });
      $('.r-atual', el).classList.toggle('on', passo >= 1);
      $('.r-antigo', el).classList.toggle('on', passo >= 2);
      calor.style.opacity = passo >= 1 ? 0.45 : 1;
      /* a música acompanha a coleta e sai quando a resposta aparece */
      if (sl.musica) { if (passo >= 1) Som.parar(2500); else musicaPorResposta(sl, loja.pontosMapa(sl.id).length); }
    }
    return {
      entrar: atualizar, atualizar: function (t) { if (t === 'mapa' || t === 'carga') atualizar(); },
      passo: function () { return { p: passo, n: 3 }; },
      avancar: function () { if (passo < 2) { passo++; aplicar(); return true; } return false; },
      voltar: function () { if (passo > 0) { passo--; aplicar(); return true; } return false; }
    };
  };

  var ICONES = {
    gota: '<svg viewBox="0 0 100 100"><defs><linearGradient id="icg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8D94A"/><stop offset=".6" stop-color="#F2A652"/><stop offset="1" stop-color="#D06C38"/></linearGradient></defs><path d="M50 6 C50 6 18 48 18 68 A32 32 0 0 0 82 68 C82 48 50 6 50 6 Z" fill="url(#icg)"/></svg>',
    cruz: '<svg viewBox="0 0 100 100" fill="#fff"><path d="M46 8 h8 l3 4 v24 h24 l4 -3 v8 l-4 -3 h-24 v46 l3 4 h-14 l3 -4 v-46 h-24 l-4 3 v-8 l4 3 h24 v-24 z"/><circle cx="50" cy="44" r="40" fill="none" stroke="#fff" stroke-width="2"/></svg>',
    estola: '<svg viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M33 12 Q50 34 67 12" stroke="#F8D464" stroke-width="9"/><path d="M33 12 L31 88 M67 12 L69 88" stroke="#F8D464" stroke-width="9"/><path d="M31 70 v10 M26 75 h10 M69 70 v10 M64 75 h10" stroke="#fff" stroke-width="3"/></svg>'
  };
  R.rito = function (sl, el) {
    var ic = ['gota', 'cruz', 'estola'];
    el.innerHTML = '<div class="rito"><h1 class="titulo medio">' + tit(sl.titulo) + '</h1><div class="blocos">' +
      sl.blocos.map(function (b, i) {
        return '<div class="b">' + ICONES[ic[i]] + '<h3>' + esc(b.t) + '</h3><p>' + esc(b.d) + '</p>' + (b.citacao ? '<q>' + esc(b.citacao) + '</q>' : '') + '</div>';
      }).join('') + '</div><div class="fonte">' + esc(sl.fonte) + '</div></div>';
    return {};
  };

  R.caca = function (sl, el, ctx) {
    var revelado = false;
    el.innerHTML = cab(sl.kicker, sl.pergunta) + miniQR() + '<div class="caca">' + sl.itens.map(function (t, i) {
      var intr = sl.intrusos.indexOf(i) >= 0;
      return '<div class="l' + (intr ? ' intruso' : '') + '"><div class="enche"></div><span class="tx">' + esc(t) + '</span>' +
        '<span class="tag">' + (intr ? 'Intruso' : esc((sl.fontes || [])[i] || 'Efeito')) + '</span><span class="n">0</span></div>';
    }).join('') + '</div><div class="rodape-dados"><b class="pp">0</b> pessoas caçando</div>';
    var raiz = $('.caca', el), linhas = el.querySelectorAll('.caca .l');
    function atualizar() {
      var c = loja.contarToques(sl.id, sl.itens.length);
      Array.prototype.forEach.call(linhas, function (l, i) {
        l.querySelector('.enche').style.width = pct(c.porItem[i], c.pessoas) + '%';
        l.querySelector('.n').textContent = c.porItem[i];
      });
      $('.pp', el).textContent = fmt(c.pessoas);
    }
    /* mesma lógica do mito ou verdade: vinheta e trilha na coleta, silêncio ao mostrar os intrusos */
    var comSom = !!(sl.efeitoPorItem && (sl.musica || sl.efeito));
    return {
      entrar: function () { atualizar(); if (comSom) trilhaDaPergunta(sl, ctx.paraFrente); },
      atualizar: function (t) { if (t === 'toques' || t === 'carga') atualizar(); },
      passo: function () { return { p: revelado ? 1 : 0, n: 2 }; },
      avancar: function () { if (!revelado) { revelado = true; raiz.classList.add('revelado'); ctx.sincronizar(0, 'fim'); if (comSom) silenciarPergunta(); return true; } return false; },
      voltar: function () { if (revelado) { revelado = false; raiz.classList.remove('revelado'); ctx.sincronizar(0, null); if (comSom) trilhaDaPergunta(sl, false); return true; } return false; }
    };
  };

  R.efeitos = function (sl, el) {
    el.innerHTML = '<div class="efe"><div class="col"><h1 class="titulo medio">' + tit(sl.titulo) + '</h1><div class="grade">' +
      sl.itens.map(function (x) { return '<div class="it"><h3>' + esc(x.t) + '</h3><p>' + esc(x.d) + '</p><div class="fonte">' + esc(x.f) + '</div></div>'; }).join('') +
      '</div></div><div class="im" style="background-image:url(\'' + img(sl.imagem) + '\')"></div></div>';
    return {};
  };

  R.eclesial = function (sl, el) {
    el.innerHTML = '<div class="ecl"><div class="col"><div class="kicker">' + esc(sl.fonte) + '</div><h1 class="titulo medio">' + tit(sl.titulo) + '</h1>' +
      '<div class="texto-g">' + esc(sl.texto) + '</div><div class="leg">' + esc(sl.legenda) + '</div></div>' +
      '<div><div class="poco grande"><div class="circ forte"></div>' +
      '<svg viewBox="0 0 100 126" style="position:absolute;left:50%;top:50%;width:200px;transform:translate(-50%,-52%)"><defs><linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8D94A"/><stop offset=".6" stop-color="#F2A652"/><stop offset="1" stop-color="#D06C38"/></linearGradient></defs>' +
      '<path d="M50 3 C50 3 11 55 11 85 A39 39 0 0 0 89 85 C89 55 50 3 50 3 Z" fill="url(#gc)"/><path d="M47 62 h6 v14 h14 v6 h-14 v26 h-6 v-26 h-14 v-6 h14 z" fill="#fff"/></svg>' +
      '<div class="gotas"></div></div></div></div>';
    var cont = $('.gotas', el);
    function atualizar() {
      var R0 = (cont.offsetWidth || 960) / 2;
      dispor(cont, loja.listaJogadores(), R0, { aneis: true, r0: R0 * 0.4, esp: R0 * 0.2, semQueda: false,
        aoPousar: sl.somGota ? function () { if (slides[indice] === sl) Gota.tocar(0.5); } : null });
    }
    return { entrar: atualizar, atualizar: function (t) { if (t === 'jogadores' || t === 'carga') atualizar(); } };
  };

  R.testemunho = function (sl, el) {
    var f = sl.fotos || [];
    el.innerHTML = '<div class="test"><div class="fotos' + (f.length === 1 ? ' uma' : '') + '">' + f.map(function (x, i) {
      return '<div class="f' + (/-pb\./.test(x) ? ' pb' : '') + '" style="background-image:url(\'' + img(x) + '\')"></div>';
    }).join('') + '</div><div class="col"><div class="kicker">' + esc(sl.kicker) + '</div><blockquote>“' + esc(sl.citacao) + '”</blockquote>' +
      '<div class="autor">' + esc(sl.autor) + '</div><div class="papel">' + esc([sl.papel, sl.data].filter(Boolean).join(' · ')) + '</div></div></div>';
    return {};
  };

  /* relato longo: título, texto em parágrafos e autor à esquerda; fotos em faixa à direita.
     Com paginas: [[...], [...]] o texto é dividido em páginas, viradas com avançar e voltar. */
  R.relato = function (sl, el) {
    var f = sl.fotos || [], paginas = sl.paginas || [sl.paragrafos || []], pg = 0, aspas = sl.aspas !== false;
    el.innerHTML = '<div class="relato' + (sl.variante ? ' ' + esc(sl.variante) : '') + '"><div class="col">' +
      '<div class="topo-relato">' + (sl.kicker ? '<div class="kicker">' + esc(sl.kicker) + '</div>' : '') +
      (paginas.length > 1 ? '<div class="pagina"></div>' : '') + '</div>' +
      '<h1 class="titulo">' + tit(sl.titulo) + '</h1>' + (sl.epigrafe ? '<div class="epigrafe">' + esc(sl.epigrafe) + '</div>' : '') +
      '<div class="texto"></div><div class="rodape-relato"></div></div>' +
      '<div class="fotos' + (f.length === 1 ? ' uma' : '') + '">' + f.map(function (x) {
        return '<div class="f' + (/-pb\./.test(x) ? ' pb' : '') + '" style="background-image:url(\'' + img(x) + '\')"></div>';
      }).join('') + '</div></div>';
    var tx = $('.texto', el), rod = $('.rodape-relato', el), num = $('.pagina', el);
    function render() {
      var ps = paginas[pg], ultima = pg === paginas.length - 1;
      tx.innerHTML = ps.map(function (t, i) {
        return '<p>' + (aspas && pg === 0 && i === 0 ? '<span class="aspa">“</span>' : '') + esc(t) + (aspas && ultima && i === ps.length - 1 ? '”' : '') + '</p>';
      }).join('');
      rod.innerHTML = ultima ? '<div class="autor">' + esc(sl.autor || '') + '</div><div class="papel">' + esc([sl.papel, sl.data].filter(Boolean).join(' · ')) + '</div>'
        : '<div class="continua">continua <span>→</span></div>';
      if (num) num.textContent = (pg + 1) + ' / ' + paginas.length;
    }
    function virar(d) {
      tx.classList.add('virando');
      setTimeout(function () { pg += d; render(); tx.classList.remove('virando'); if (loja) loja.anunciar(); }, 260);
    }
    render();
    return {
      passo: function () { return { p: pg, n: paginas.length }; },
      avancar: function () { if (pg < paginas.length - 1) { virar(1); return true; } return false; },
      voltar: function () { if (pg > 0) { virar(-1); return true; } return false; }
    };
  };

  R.comparar = function (sl, el) {
    var grupos = gruposDe(sl.a);
    el.innerHTML = '<div class="comp"><div class="kicker">' + esc(sl.titulo) + '</div><div class="duas">' +
      ['a', 'b'].map(function (k) {
        return '<div class="lado-n"><h3>' + (k === 'a' ? 'Na abertura' : 'Agora') + '</h3><div class="caixa"><div class="nuvem n-' + k + '"></div></div>' +
          '<div class="stats s-' + k + '"></div></div>';
      }).join('') + '</div></div>';
    function lado(k) {
      var id = sl[k], itens = loja.nuvem(id, grupos), tot = 0, fim = 0, forca = 0;
      itens.forEach(function (it) { tot += it.n; if (it.grupo === 'fim') fim += it.n; if (it.grupo === 'forca') forca += it.n; });
      C.desenharNuvem($('.n-' + k, el), itens, { maxF: 110, minF: 20, limite: 30, classe: function (it) { return it.grupo ? 'g-' + it.grupo : ''; } });
      $('.s-' + k, el).innerHTML = '<div class="fim"><b>' + pct(fim, tot) + '%</b>falam de fim</div><div class="forca"><b>' + pct(forca, tot) + '%</b>falam de força</div>';
    }
    function atualizar() { lado('a'); lado('b'); }
    return { entrar: function () { setTimeout(atualizar, 60); }, atualizar: function (t) { if (t === 'palavras' || t === 'carga') atualizar(); } };
  };

  R.mural = function (sl, el) {
    el.innerHTML = '<div class="cab"><div class="kicker">Mural</div><h2>' + esc(sl.titulo) + '</h2></div>' + miniQR() + '<div class="mural"></div>';
    var box = $('.mural', el);
    function atualizar() {
      var l = loja.mural.filter(function (m) { return m.aprovada && !m.oculta; })
        .sort(function (a, b) { return (a.respondida - b.respondida) || (b.apoios - a.apoios) || String(a.criado).localeCompare(String(b.criado)); }).slice(0, 8);
      box.innerHTML = l.length ? l.map(function (m) {
        return '<div class="card' + (m.respondida ? ' resp' : '') + '"><div class="ap">' + m.apoios + '<small>apoios</small></div><div>' + esc(m.texto) + '</div></div>';
      }).join('') : '<div class="vazio">As perguntas aprovadas aparecem aqui. Toque em “Pergunte” no celular.</div>';
    }
    return { entrar: atualizar, atualizar: function (t) { if (t === 'mural' || t === 'carga') atualizar(); } };
  };

  R['quiz-intro'] = function (sl, el) {
    el.innerHTML = '<div class="qi"><div class="col"><div class="kicker">Quiz final</div><h1 class="titulo medio">' + tit(sl.titulo) + '</h1>' +
      '<div class="texto-g" style="font-size:38px">' + esc(sl.texto) + '</div><ol>' + sl.regras.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ol></div>' +
      '<div class="lado-qr"><div class="qr-cartao" style="width:420px">' + C.qrSvg(C.urlPublica()) + '</div><div class="url" style="text-align:center"><small>Ainda não entrou?</small>Aponte a câmera</div></div></div>';
    return {};
  };

  R.quiz = function (sl, el, ctx) {
    var p = loja.pergunta(sl.ordem), estado = 'preparada', abertaEm = null, tempo = 20, raf = null, ultPoll = 0, revelando = false, autoTimer = null;
    var multiplas = loja.perguntas.filter(function (q) { return q.tipo === 'multipla'; }).length;
    if (!p) {
      el.innerHTML = '<div class="tit"><div class="kicker">Quiz</div><h1 class="titulo menor"><span>Pergunta ' + sl.ordem + ' não encontrada</span></h1><div class="texto-g">Confira se o quiz desta aula foi carregado no banco.</div></div>';
      return {};
    }
    tempo = p.tempo || 20;
    var num = p.tipo === 'numero' ? 'Desempate' : 'Pergunta ' + sl.ordem + ' de ' + multiplas;
    el.classList.add('escuro');
    el.innerHTML = '<div class="quiz"><div class="topo"><div class="num">' + num + '</div><div class="estado"></div>' +
      '<div class="relogio"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="6"/>' +
      '<circle class="arco" cx="50" cy="50" r="45" fill="none" stroke="#F8D464" stroke-width="6" stroke-linecap="round" stroke-dasharray="282.74" stroke-dashoffset="0"/></svg><b>' + tempo + '</b></div></div>' +
      '<div class="perg">' + esc(p.texto) + '</div>' +
      (p.tipo === 'numero' ? '<div class="numero-resp">?</div>' :
        '<div class="ops">' + p.opcoes.map(function (o, i) {
          return '<div class="op op-' + i + '" data-i="' + i + '"><div class="enche"></div>' + C.formaSVG(i) + '<span class="tx">' + esc(o) + '</span><span class="n">0</span></div>';
        }).join('') + '</div>') +
      '<div class="base"><div class="coment"></div><div class="resp"><b class="nr">0</b> de <b class="nj">0</b> responderam</div></div></div>';
    var raiz = $('.quiz', el), arco = $('.arco', el), rel = $('.relogio b', el), est = $('.estado', el);

    function painel() {
      return loja.rpc('quiz_painel', { p_sala: C.SALA }).then(function (r) {
        var d = r && r.data; if (!d || +d.ordem !== +sl.ordem) return d;
        $('.nr', el).textContent = fmt(d.respostas); $('.nj', el).textContent = fmt(d.jogadores);
        if (d.contagem && p.tipo === 'multipla') {
          var t = d.contagem.reduce(function (a, b) { return a + b; }, 0);
          Array.prototype.forEach.call(el.querySelectorAll('.op'), function (op, i) {
            op.querySelector('.n').textContent = d.contagem[i] || 0;
            op.querySelector('.enche').style.height = pct(d.contagem[i] || 0, t) + '%';
          });
        }
        if (estado === 'aberta' && d.jogadores > 0 && d.respostas >= d.jogadores) agendarRevelar(900);
        return d;
      });
    }
    function tick() {
      if (estado !== 'aberta') return;
      var rest = Math.max(0, tempo - (loja.agora() - abertaEm) / 1000);
      arco.setAttribute('stroke-dashoffset', (282.74 * (1 - rest / tempo)).toFixed(1));
      rel.textContent = Math.ceil(rest);
      if (Date.now() - ultPoll > 1000) { ultPoll = Date.now(); painel(); }
      if (rest <= 0) { estado = 'encerrada'; est.textContent = 'Tempo esgotado'; if (loja) loja.anunciar(); agendarRevelar(1700); return; }
      raf = setTimeout(tick, 100);
    }
    function agendarRevelar(ms) { if (autoTimer || revelando || estado === 'revelada') return; autoTimer = setTimeout(revelar, ms); }
    function abrir() {
      estado = 'aberta'; est.textContent = 'Valendo!'; if (loja) setTimeout(function () { loja.anunciar(); }, 0);
      return rpcApr('quiz_abrir', {}).then(function (r) {
        abertaEm = r && r.data ? new Date(r.data).getTime() : loja.agora();
        raf = setTimeout(tick, 50);
      });
    }
    function revelar() {
      if (revelando || estado === 'revelada') return; revelando = true;
      clearTimeout(autoTimer); clearTimeout(raf);
      return rpcApr('quiz_revelar', {}).then(function (r) {
        var g = (r && r.data) || {};
        mostrarRevelada(g.correta, g.valor, g.comentario, g.fonte);
        setTimeout(painel, 300);
      });
    }
    function mostrarRevelada(correta, valor, comentario, fonte) {
      if (sl.musica && estado !== 'revelada') silenciarPergunta();
      estado = 'revelada'; revelando = false; est.textContent = 'Resposta'; if (loja) setTimeout(function () { loja.anunciar(); }, 0);
      raiz.classList.add('revelada'); arco.setAttribute('stroke-dashoffset', '282.74'); rel.textContent = '0';
      if (p.tipo === 'numero') { $('.numero-resp', el).textContent = valor != null ? valor : '?'; }
      Array.prototype.forEach.call(el.querySelectorAll('.op'), function (op, i) { op.classList.toggle('certa', i === +correta); });
      $('.coment', el).innerHTML = esc(comentario || '') + (fonte ? '<span class="fonte">' + esc(fonte) + '</span>' : '');
    }
    return {
      quiz: true,
      passo: function () { return { p: estado === 'preparada' ? 0 : estado === 'revelada' ? 2 : 1, n: 3, q: estado }; },
      abrirSePronta: function () { if (estado === 'preparada') abrir(); },
      revelarSeAberta: function () { if (estado === 'aberta' || estado === 'encerrada') revelar(); },
      entrar: function () {
        var s = loja.sala;
        if (s && +s.quiz_ordem === +sl.ordem && s.etapa === 'quiz') {
          if (s.quiz_revelada) { mostrarRevelada(s.quiz_correta, s.quiz_valor, s.quiz_comentario); painel(); return; }
          if (s.quiz_aberta_em) { abertaEm = new Date(s.quiz_aberta_em).getTime(); estado = 'aberta'; est.textContent = 'Valendo!'; raf = setTimeout(tick, 50); return; }
        }
        est.textContent = 'Prepare-se';
        rpcApr('quiz_preparar', { p_ordem: sl.ordem, p_slide: ctx.indice }).then(painel);
      },
      avancar: function () {
        if (estado === 'preparada') { abrir(); return true; }
        if (estado === 'aberta' || estado === 'encerrada') { revelar(); return true; }
        return false;
      },
      sair: function () { clearTimeout(raf); clearTimeout(autoTimer); }
    };
  };

  R.ranking = function (sl, el) {
    var lim = sl.limite || 5, timer = null;
    el.innerHTML = '<div class="rank"><div class="kicker">' + esc(sl.titulo) + '</div><div class="linhas"></div></div>';
    var box = $('.linhas', el), cache = {};
    function render(lista) {
      var max = lista.length ? Math.max(1, lista[0].total) : 1, vistos = {};
      lista.forEach(function (j, i) {
        var d = cache[j.aparelho];
        if (!d) {
          d = document.createElement('div'); d.className = 'lin'; d.style.top = (i * 150 + 40) + 'px'; d.style.opacity = 0;
          box.appendChild(d); cache[j.aparelho] = d;
          d.innerHTML = '<div class="pos"></div><div class="av"></div><div class="nome"><b></b><i style="width:0"></i></div><div class="pts"><span></span><small>pontos</small></div>';
        }
        d.querySelector('.pos').textContent = j.posicao + 'º';
        var assin = (j.foto ? j.foto.length : 0) + j.apelido;
        if (d.dataset.assin !== assin) { d.querySelector('.av').innerHTML = C.gotaSVG(j); d.dataset.assin = assin; }
        d.querySelector('.nome b').textContent = j.apelido;
        d.querySelector('.pts span').textContent = fmt(j.total);
        (function (dd, top, w) { setTimeout(function () { dd.style.top = top + 'px'; dd.style.opacity = 1; dd.querySelector('.nome i').style.width = w + '%'; }, 30); })(d, i * 150, Math.round(100 * j.total / max));
        vistos[j.aparelho] = 1;
      });
      Object.keys(cache).forEach(function (k) { if (!vistos[k]) { cache[k].remove(); delete cache[k]; } });
      if (!lista.length) box.innerHTML = '<div class="texto-g" style="color:var(--texto-suave)">O placar aparece depois das primeiras respostas.</div>';
    }
    function buscar() { loja.rpc('ranking', { p_sala: C.SALA, p_limite: lim }).then(function (r) { render((r && r.data) || []); }); }
    return {
      entrar: function () { buscar(); timer = setInterval(buscar, 4000); },
      sair: function () { clearInterval(timer); }
    };
  };

  R.podio = function (sl, el) {
    var passo = 0, dados = [];
    el.classList.add('escuro');
    el.innerHTML = '<div class="podio"><div class="kicker">' + esc(sl.titulo) + '</div><div class="degraus">' +
      [2, 1, 3].map(function (pos) { return '<div class="d p' + pos + '" data-p="' + pos + '"><div class="av"></div><div class="nm"></div><div class="pt"></div>' + (pos === 1 ? '<div class="premio">Prêmio</div>' : '') + '<div class="bloco">' + pos + '</div></div>'; }).join('') +
      '</div></div>';
    function preencher() {
      [1, 2, 3].forEach(function (pos) {
        var j = dados[pos - 1], d = $('.d.p' + pos, el);
        if (!j) { d.style.visibility = 'hidden'; return; }
        d.style.visibility = ''; d.querySelector('.av').innerHTML = C.gotaSVG(j);
        d.querySelector('.nm').textContent = j.apelido; d.querySelector('.pt').textContent = fmt(j.total) + ' pontos';
      });
    }
    function confete() {
      var cores = ['#F8D464', '#FFFFFF', '#F2A652', '#F8D94A'];
      for (var i = 0; i < 90; i++) {
        var c = document.createElement('i'); c.className = 'confete';
        c.style.left = (Math.random() * (palco.offsetWidth || 1920)) + 'px'; c.style.background = cores[i % 4];
        c.style.animationDuration = (2.8 + Math.random() * 2.6) + 's'; c.style.animationDelay = (Math.random() * 1.2) + 's';
        el.appendChild(c);
      }
    }
    function aplicar() {
      var ordem = [3, 2, 1];
      ordem.forEach(function (pos, k) { $('.d.p' + pos, el).classList.toggle('on', passo > k); });
      if (passo === 3) confete();
    }
    return {
      entrar: function () { loja.rpc('ranking', { p_sala: C.SALA, p_limite: 3 }).then(function (r) { dados = (r && r.data) || []; preencher(); }); },
      passo: function () { return { p: passo, n: 4 }; },
      avancar: function () { if (passo < 3) { passo++; aplicar(); return true; } return false; },
      voltar: function () { if (passo > 0) { passo--; aplicar(); return true; } return false; }
    };
  };

  R.intencoes = function (sl, el) {
    var fila = [], vistos = {}, k = 0, timer = null, atrasoInicial = 0;
    setTimeout(function () { atrasoInicial = 0; }, 100);
    el.classList.add('escuro');
    el.innerHTML = '<div class="int"><div class="topo"><div class="kicker">Oração pelos enfermos</div><h1 class="titulo menor"><span>' + esc(sl.titulo) + '</span></h1>' +
      '<div class="texto-g">' + esc(sl.texto) + '</div></div><div class="nomes"></div><div class="chama-centro"></div></div>' + miniQR();
    var box = $('.nomes', el);
    function soltar(nome) {
      var s = document.createElement('div'); s.className = 'nome'; s.textContent = nome;
      s.style.left = (8 + Math.random() * 78) + '%'; var dur = 17 + Math.random() * 6; s.style.animationDuration = dur + 's';
      box.appendChild(s); setTimeout(function () { s.remove(); }, dur * 1000 + 200);
    }
    function atualizar() {
      loja.intencoes.forEach(function (i) {
        if (!i.nome || vistos[i.id]) return; vistos[i.id] = 1; fila.push(i.nome);
        var atraso = (atrasoInicial++) * 1300; setTimeout(function () { soltar(i.nome); }, atraso);
      });
    }
    return {
      entrar: function () {
        atualizar(); var primeiro = fila.length; atrasoInicial = 0; k = 0;
        setTimeout(function () { timer = setInterval(function () { if (fila.length) soltar(fila[k++ % fila.length]); }, 2600); }, primeiro * 1300);
      },
      atualizar: function (t) { if (t === 'intencoes' || t === 'carga') atualizar(); },
      sair: function () { clearInterval(timer); }
    };
  };

  /* papel picado: rajadas dos cantos de baixo e chuva contínua, nas cores do confete da foto */
  function papelPicado(cv) {
    var ctx = cv.getContext('2d'), W = 0, H = 0, pecas = [], vivo = true, ult = 0, acc = 0, proxRajada = 0, t = 0;
    var CORES = [['#FFFFFF', '#DCE6EF'], ['#FFFFFF', '#DCE6EF'], ['#D6ECF8', '#A9CBE0'], ['#8CC8EE', '#5C9FCB'], ['#4A9FE0', '#2F78B4'],
      ['#2F6FD1', '#1F4F9C'], ['#5CC6C8', '#3C9799'], ['#F8D464', '#C9A43D'], ['#F8D464', '#C9A43D'], ['#F2A652', '#C27E36']];
    function medir() { var w = cv.offsetWidth || 1920, h = cv.offsetHeight || 560; if (w !== W || h !== H) { W = cv.width = w; H = cv.height = h; } }
    function peca(x, y, vx, vy) {
      var c = CORES[Math.floor(Math.random() * CORES.length)], forma = Math.random();
      var k = 1.7 + Math.random() * 1.1;
      pecas.push({ x: x, y: y, vx: vx, vy: vy, k: k, g: 190 + Math.random() * 110,
        w: forma < .55 ? 13 + Math.random() * 11 : forma < .8 ? 10 + Math.random() * 6 : 6 + Math.random() * 3,
        h: forma < .55 ? 9 + Math.random() * 7 : forma < .8 ? 10 + Math.random() * 6 : 22 + Math.random() * 12,
        redondo: forma >= .55 && forma < .8, c: c, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 9,
        fl: Math.random() * 6.28, vf: 4 + Math.random() * 7, ba: Math.random() * 6.28, vb: 1.2 + Math.random() * 2.2, amp: 10 + Math.random() * 34 });
    }
    function rajada(lado, n) {
      var x0 = lado < 0 ? -10 : W + 10;
      for (var i = 0; i < n; i++) {
        var ang = 0.2 + Math.random() * 0.6, vel = 900 + Math.random() * 700;
        peca(x0, H + 10, -lado * Math.sin(ang) * vel, -Math.cos(ang) * vel);
      }
    }
    function quadro(agora) {
      if (!vivo) return;
      requestAnimationFrame(quadro);
      if (!ult) { ult = agora; medir(); rajada(-1, 130); rajada(1, 130); proxRajada = 14; }
      var dt = Math.min(0.05, (agora - ult) / 1000); ult = agora; t += dt;
      if (document.hidden) return;
      medir();
      acc += dt * 30;
      while (acc >= 1 && pecas.length < 420) { acc -= 1; peca(Math.random() * W, -20 - Math.random() * 40, (Math.random() - .5) * 40, 40 + Math.random() * 60); }
      if (acc >= 1) acc = 0;
      if (t >= proxRajada) { rajada(Math.random() < .5 ? -1 : 1, 70); proxRajada = t + 12 + Math.random() * 6; }
      ctx.clearRect(0, 0, W, H);
      for (var i = pecas.length - 1; i >= 0; i--) {
        var p = pecas[i];
        p.vx -= p.vx * p.k * dt; p.vy += (p.g - p.vy * p.k) * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.fl += p.vf * dt; p.ba += p.vb * dt;
        if (p.y > H + 40) { pecas.splice(i, 1); continue; }
        var vira = Math.cos(p.fl);
        ctx.save();
        ctx.translate(p.x + Math.sin(p.ba) * p.amp, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.max(0.08, Math.abs(vira)));
        ctx.fillStyle = vira >= 0 ? p.c[0] : p.c[1];
        ctx.globalAlpha = 0.95;
        if (p.redondo) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, 6.2832); ctx.fill(); }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    }
    requestAnimationFrame(quadro);
    return { parar: function () { vivo = false; pecas = []; }, rajada: function () { rajada(-1, 110); rajada(1, 110); } };
  }

  R.final = function (sl, el) {
    el.innerHTML = '<div class="fim-slide"><div class="im"><div class="foto" style="background-image:url(\'' + img(sl.imagem) + '\')"></div>' +
      (sl.confete === false ? '' : '<canvas class="papel-picado" aria-hidden="true"></canvas>') + '</div>' +
      '<div class="baixo"><div><h1 class="titulo"><span>' + esc(sl.titulo) + '</span></h1>' + (sl.legenda ? '<div class="kicker" style="margin-top:20px">' + esc(sl.legenda) + '</div>' : '') + '</div>' +
      '<img src="img/logo-catecumenato-p.jpg" alt="Catecumenato"></div></div>';
    var cv = el.querySelector('canvas.papel-picado'), festa = cv ? papelPicado(cv) : null;
    return { sair: function () { if (festa) festa.parar(); } };
  };

  /* ---------- navegação ---------- */
  /* sufixo 'fim': a resposta já está no telão; os celulares saem da votação e mostram a tela de espera */
  function sincronizar(n, item, sufixo) {
    var sl = slides[n]; if (!sl || sl.tipo === 'quiz') return;
    rpcApr('mudar', { p_slide: n, p_etapa: etapaDo(sl) + (sufixo ? ':' + sufixo : ''), p_item: item || 0 });
  }
  function ir(n, inicial) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === indice && !inicial) return;
    var sl = slides[n], velho = elAtual, ctlVelho = atual, slVelho = slides[indice], paraFrente = !inicial && n > indice;
    var el = document.createElement('div'); el.className = 'slide';
    var ctx = { indice: n, paraFrente: paraFrente, sincronizar: function (item, sufixo) { sincronizar(n, item, sufixo); } };
    if (sl.tipo === 'capa' || sl.tipo === 'final') el.classList.add('liso');
    var ctl = (R[sl.tipo] || R.titulo)(sl, el, ctx) || {};
    ligarPassagens(el, sl);
    fecharPassagem(true); esconderDica();
    palco.appendChild(el);
    if (velho) {
      if (sl.transicao === 'entrar' && slVelho && slVelho.tipo === 'foto') velho.classList.add('saindo-entrar');
      velho.classList.remove('on');
      setTimeout(function () { velho.remove(); }, 1100);
      if (ctlVelho && ctlVelho.sair) ctlVelho.sair();
    }
    indice = n; elAtual = el; atual = ctl;
    setTimeout(function () { el.classList.add('on'); }, 30);
    musicaDoSlide(sl, paraFrente);
    if (ctl.entrar) ctl.entrar();
    if (!inicial || !loja.sala || loja.sala.slide !== n || sl.tipo !== 'quiz') sincronizar(n, ctl.item || 0);
    atualizarHud();
    qrFlutuante(sl);
    pintarSom();
    if (loja) loja.anunciar();
  }
  function avancar() { if (atual && atual.avancar && atual.avancar()) { if (loja) loja.anunciar(); return; } ir(indice + 1); }
  function voltar() { if (atual && atual.voltar && atual.voltar()) { if (loja) loja.anunciar(); return; } ir(indice - 1); }

  function executar(cmd) {
    if (cmd === 'avancar') avancar();
    else if (cmd === 'voltar') voltar();
    else if (cmd === 'qr') { qrManual = !qrManual; qrFlutuante(slides[indice]); if (loja) loja.anunciar(); }
    else if (cmd === 'recarregar') location.reload();
    else if (cmd === 'teste') alternarTeste();
    else if (cmd === 'musica') Som.alternarMudo();
    else if (cmd === 'passagem:fechar') fecharPassagem();
    else if (/^passagem:\d+$/.test(cmd)) abrirPassagem(+cmd.slice(9));
    else if (/^formato:/.test(cmd)) definirFormato(cmd.slice(8));
    else if (/^ir:\d+$/.test(cmd)) ir(+cmd.slice(3));
    else if (cmd === 'preto') alternarPreto();
    else if (cmd === 'mudo:1') { if (!Som.mudo()) Som.alternarMudo(); }
    else if (cmd === 'mudo:0') { if (Som.mudo()) Som.alternarMudo(); }
    else if (/^volume:\d+$/.test(cmd)) Som.volume(+cmd.slice(7));
    else if (/^ajuste:/.test(cmd)) definirAjuste(cmd.slice(7));
    else if (cmd === 'quiz:abrir') { if (atual && atual.abrirSePronta) atual.abrirSePronta(); }
    else if (cmd === 'quiz:revelar') { if (atual && atual.revelarSeAberta) atual.revelarSeAberta(); }
  }
  function alternarPreto() { $('#preto').hidden = !$('#preto').hidden; if (loja) loja.anunciar(); }
  /* sala zerada pelo painel: o telão esquece participantes e respostas e volta ao slide 1, sem recarregar
     (recarregar perderia o som já liberado com o clique) */
  var geracaoVista = null;
  function verGeracao() {
    var g = loja.geracao(); if (g == null) return;
    if (geracaoVista == null) { geracaoVista = g; return; }
    if (g === geracaoVista) return;
    geracaoVista = g; qrManual = false; fecharPassagem(true);
    loja.zerar().then(function () { indice = -1; ir(0, true); avisoTela('Encontro', 'recomeçado do zero'); });
  }
  function verComando() {
    var s = loja.sala; if (!s) return;
    var seq = s.comando_seq || 0;
    if (ultimoSeq === null) { ultimoSeq = seq; return; }
    if (seq > ultimoSeq) { ultimoSeq = seq; executar(s.comando); }
  }

  var qrManual = false;
  function qrFlutuante(sl) {
    var box = $('#qr-flutuante');
    var auto = sl && ['quiz-intro', 'entrada', 'capa', 'foto', 'final', 'podio', 'ranking', 'quiz', 'testemunho', 'citacao'].indexOf(sl.tipo) < 0 && etapaDo(sl) === 'espera';
    box.hidden = !qrManual;
    if (!box.innerHTML) box.innerHTML = C.qrSvg(C.urlPublica());
    return auto;
  }

  /* ---------- música de fundo ----------
     um slide declara musica: 'arquivo.mp3' (pasta aulas/<aula>/audio/), volume (0 a 1) e
     musicaQuando: 'resposta' (começa na primeira resposta) ou omitido (começa ao abrir o slide) */
  function aud(f) {
    var v = (window.CATEQUESE_CFG || {}).versao;
    return (A.audio || 'aulas/' + C.AULA_ID + '/audio/') + f + (v ? '?v=' + v : '');
  }
  /* Todo o som passa pelo Web Audio: um único clique (ou tecla) no telão destrava o contexto de áudio e,
     daí em diante, vinhetas, trilhas e gotas tocam sozinhas, inclusive no Safari, que bloqueia cada
     elemento de áudio separadamente. As trilhas são decodificadas na abertura do telão. */
  var Som = (function () {
    var ctx = null, buffers = {}, pedidos = {}, faixa = null;
    var fonte = null, alvo = 0.6, quer = false, estado = 'parado', vez = 0;
    var mudo = false;   /* a música sempre entra ao abrir o telão; silenciar vale até recarregar a página */
    var mestre = Math.max(0, Math.min(150, +C.ler('cat-volume', '100') || 0)) / 100;
    if (C.ler('cat-volume', '') === '') mestre = 1;
    function nivel(v) { return Math.max(0, Math.min(1, v * mestre)); }
    function contexto() {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
        try { ctx = new AC(); } catch (e) { return null; }
        ctx.onstatechange = function () {
          if (ctx.state === 'running') {
            var ini = document.getElementById('inicio-som'); if (ini) ini.hidden = true;
            if (quer && !faixa && !mudo) api.tocar(fonte, alvo);
          } else if (quer && !mudo) mudar('bloqueado');
          pintarSom(); if (loja) loja.anunciar();
        };
      }
      return ctx;
    }
    function carregar(src) {
      if (buffers[src]) return Promise.resolve(buffers[src]);
      if (pedidos[src]) return pedidos[src];
      var c = contexto(); if (!c) return Promise.reject(new Error('sem áudio'));
      pedidos[src] = fetch(src).then(function (r) { if (!r.ok) throw new Error('áudio ' + r.status); return r.arrayBuffer(); })
        .then(function (b) { return new Promise(function (ok, falha) { c.decodeAudioData(b, ok, falha); }); })
        .then(function (buf) { buffers[src] = buf; return buf; })
        .catch(function (e) { delete pedidos[src]; throw e; });
      return pedidos[src];
    }
    function rampa(g, valor, seg) {
      var t = ctx.currentTime;
      try { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(valor, t + Math.max(0.03, seg)); }
      catch (e) { g.gain.value = valor; }
    }
    function soltarFaixa(seg) {
      var f = faixa; faixa = null; if (!f) return;
      try { rampa(f.ganho, 0, seg); f.no.stop(ctx.currentTime + seg + 0.05); } catch (e) {}
    }
    function mudar(e) { if (estado === e) return; estado = e; pintarSom(); if (loja) loja.anunciar(); }
    var api = {
      contexto: contexto,
      bloqueado: function () { return !!ctx && ctx.state !== 'running'; },
      preparar: function (src) { carregar(src).catch(function () {}); },
      tocar: function (src, vol, doInicio) {
        fonte = src; quer = true; alvo = vol || 0.6;
        if (mudo) { mudar('mudo'); return; }
        var c = contexto(); if (!c) return;
        if (c.state !== 'running') { try { c.resume(); } catch (e) {} }
        if (faixa && faixa.src === src && !doInicio) { rampa(faixa.ganho, nivel(alvo), 1.2); if (c.state === 'running') mudar('tocando'); return; }
        var meu = ++vez;
        carregar(src).then(function (buf) {
          if (meu !== vez || !quer || fonte !== src || mudo) return;
          if (c.state !== 'running') { mudar('bloqueado'); return; }   /* o clique no telão retoma daqui */
          soltarFaixa(doInicio ? 0.4 : 0.8);
          var g = c.createGain(); g.gain.value = 0; g.connect(c.destination);
          var n = c.createBufferSource(); n.buffer = buf; n.loop = true; n.connect(g); n.start();
          faixa = { src: src, no: n, ganho: g };
          rampa(g, nivel(alvo), doInicio ? 1.2 : 3.5);
          mudar('tocando');
        }).catch(function () { if (meu === vez) mudar('parado'); });
      },
      parar: function (ms) {
        quer = false; vez++;
        if (faixa) soltarFaixa((ms || 2500) / 1000);
        mudar('parado');
      },
      alternarMudo: function () {
        mudo = !mudo;
        if (mudo) { vez++; if (faixa) soltarFaixa(0.7); mudar(quer ? 'mudo' : 'parado'); }
        else if (quer) { estado = 'parado'; api.tocar(fonte, alvo); }
        else mudar('parado');
        avisoTela('Música', mudo ? 'desligada' : 'ligada');
        pintarSom(); if (loja) loja.anunciar();
      },
      /* chamado em todo clique, toque ou tecla no telão: destrava o áudio (Safari pede também um som mudo no gesto) */
      liberar: function () {
        var c = contexto(); if (!c) return;
        if (c.state !== 'running') { try { var r = c.resume(); if (r && r.catch) r.catch(function () {}); } catch (e) {} }
        try { var sil = c.createBufferSource(); sil.buffer = c.createBuffer(1, 1, 22050); sil.connect(c.destination); sil.start(0); } catch (e) {}
        if (quer && !faixa && !mudo && c.state === 'running') api.tocar(fonte, alvo);
      },
      /* toca um som curto por cima de tudo; aoMeio é chamado na metade dele (ou já, se não puder tocar) */
      efeito: function (src, vol, aoMeio) {
        var feito = false, disparar = function () { if (!feito) { feito = true; if (aoMeio) aoMeio(); } };
        if (mudo) { disparar(); return; }
        var c = contexto(); if (!c) { disparar(); return; }
        if (c.state !== 'running') { try { c.resume(); } catch (e) {} }
        var limite = setTimeout(disparar, 2500);   /* se o arquivo demorar, a trilha entra mesmo assim */
        carregar(src).then(function (buf) {
          clearTimeout(limite);
          if (feito) return;
          if (c.state !== 'running') { disparar(); return; }
          var g = c.createGain(); g.gain.value = nivel(vol == null ? 1 : vol); g.connect(c.destination);
          var n = c.createBufferSource(); n.buffer = buf; n.connect(g); n.start();
          setTimeout(disparar, buf.duration * 500);
        }).catch(function () { clearTimeout(limite); disparar(); });
      },
      aquecer: function () { api.liberar(); },
      preCarregar: function (src) { carregar(src).catch(function () {}); },
      estado: function () { return estado; },
      mudo: function () { return mudo; },
      mestre: function () { return mestre; },
      volume: function (pc) {
        mestre = Math.max(0, Math.min(150, pc)) / 100; C.guardar('cat-volume', String(Math.round(mestre * 100)));
        if (faixa) rampa(faixa.ganho, nivel(alvo), 0.4);
        avisoTela('Volume', Math.round(mestre * 100) + '%');
        if (loja) loja.anunciar();
      },
      fonte: function () { return quer ? fonte : null; }
    };
    return api;
  })();
  function pintarSom() {
    var sl = slides && slides[indice], gotaPresa = !!(sl && sl.somGota && Gota.bloqueado());
    var b = $('#som-bloqueado'); if (b) b.hidden = !(Som.estado() === 'bloqueado' || gotaPresa);
    if (slides) atualizarHud();
  }
  /* efeito: 'vinheta.mp3' toca na transição para a frente; a música do slide entra na metade dela */
  function musicaDoSlide(sl, paraFrente) {
    var m = sl.musica ? aud(sl.musica) : null;
    seqPergunta++;
    if (Som.fonte() && Som.fonte() !== m) Som.parar(2500);
    if (sl.efeitoPorItem) return;          /* o próprio slide toca a vinheta a cada pergunta */
    if (sl.efeito && paraFrente) {
      var meu = seqPergunta;
      Som.efeito(aud(sl.efeito), sl.efeitoVolume, function () {
        if (m && meu === seqPergunta && slides[indice] === sl && sl.musicaQuando !== 'resposta') Som.tocar(m, sl.volume, true);
      });
      return;
    }
    if (!m) return;
    if (sl.musicaQuando === 'resposta') Som.preparar(m);
    else Som.tocar(m, sl.volume);
  }
  /* a cada nova pergunta: vinheta e trilha do começo, entrando na metade da vinheta; ao revelar, silêncio */
  var seqPergunta = 0;
  function trilhaDaPergunta(sl, comVinheta) {
    var m = sl.musica ? aud(sl.musica) : null, meu = ++seqPergunta;
    if (comVinheta && sl.efeito) Som.efeito(aud(sl.efeito), sl.efeitoVolume, function () { if (meu === seqPergunta && slides[indice] === sl && m) Som.tocar(m, sl.volume, true); });
    else if (m) Som.tocar(m, sl.volume);
  }
  function silenciarPergunta(ms) { seqPergunta++; if (Som.fonte()) Som.parar(ms || 2000); }
  function musicaPorResposta(sl, total) {
    if (sl.musica && sl.musicaQuando === 'resposta' && total > 0 && slides[indice] === sl) Som.tocar(aud(sl.musica), sl.volume);
  }

  /* ---------- sonoplastia de gota ----------
     um slide com somGota: true toca o som quando cada gota cai (audio/gota.mp3, altura variada) */
  var Gota = (function () {
    var buf = null, carregando = null, ultimo = 0;
    function carregar() {
      if (carregando) return carregando;
      var c = Som.contexto(); if (!c) return Promise.reject(new Error('sem áudio'));
      var v = (window.CATEQUESE_CFG || {}).versao;
      carregando = fetch('audio/gota.mp3' + (v ? '?v=' + v : '')).then(function (r) { return r.arrayBuffer(); })
        .then(function (b) { return new Promise(function (ok, falha) { c.decodeAudioData(b, ok, falha); }); })
        .then(function (b) { buf = b; }).catch(function (e) { carregando = null; throw e; });
      return carregando;
    }
    return {
      preparar: function () { carregar().catch(function () {}); },
      bloqueado: function () { return Som.bloqueado(); },
      liberar: function () { Som.liberar(); },
      tocar: function (vol) {
        if (Som.mudo()) return;
        var c = Som.contexto(); if (!c) return;
        if (!buf) { carregar().catch(function () {}); return; }
        if (c.state !== 'running') { try { c.resume(); } catch (e) {} return; }
        var agora = c.currentTime; if (agora - ultimo < 0.04) return; ultimo = agora;
        var src = c.createBufferSource(), g = c.createGain();
        src.buffer = buf; src.playbackRate.value = 0.8 + Math.random() * 0.45;
        g.gain.value = Math.min(1, (vol == null ? 0.6 : vol) * (0.7 + Math.random() * 0.3) * Som.mestre());
        src.connect(g); g.connect(c.destination); src.start();
      }
    };
  })();

  /* ---------- passagens bíblicas ----------
     um slide declara passagens: [{ ref: 'Mt 10,8', texto: '...' }]; cada citação no texto do slide
     mostra o versículo ao passar o mouse e abre em destaque pelo clique ou pelo painel */
  var LIVROS = { Mt: 'Mateus', Mc: 'Marcos', Lc: 'Lucas', Jo: 'João', At: 'Atos', Rm: 'Romanos', Hb: 'Hebreus', Tg: 'Tiago', Sl: 'Salmo', Is: 'Isaías' };
  var passagemAberta = null, dicaTimer = null;
  function nomeRef(ref) { var m = String(ref).match(/^(\S+)\s+(.+)$/); return m && LIVROS[m[1]] ? LIVROS[m[1]] + ' ' + m[2] : ref; }
  function ligarPassagens(el, sl) {
    var ps = sl.passagens; if (!ps || !ps.length) return;
    var refs = ps.map(function (p) { return p.ref; }).sort(function (a, b) { return b.length - a.length; });
    var re = new RegExp('(' + refs.map(function (r) { return r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')(?![\\d-])');
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nos = [];
    while (w.nextNode()) if (re.test(w.currentNode.nodeValue)) nos.push(w.currentNode);
    nos.forEach(function (no) {
      var frag = document.createDocumentFragment();
      no.nodeValue.split(re).forEach(function (parte, k) {
        if (!parte) return;
        if (k % 2) {
          var i = -1; ps.some(function (p, j) { if (p.ref === parte) { i = j; return true; } return false; });
          var sp = document.createElement('span'); sp.className = 'cita'; sp.dataset.p = i; sp.textContent = parte; frag.appendChild(sp);
        } else frag.appendChild(document.createTextNode(parte));
      });
      no.parentNode.replaceChild(frag, no);
    });
  }
  function semQuebrarHifen(t) { return esc(t).replace(/(\S*\w-\w\S*)/g, '<span class="sem-quebra">$1</span>'); }
  function passagemDoSlide(i) { var sl = slides && slides[indice]; return sl && sl.passagens ? sl.passagens[i] : null; }
  function marcarCitas() {
    if (!elAtual) return;
    Array.prototype.forEach.call(elAtual.querySelectorAll('.cita'), function (c) {
      var p = passagemDoSlide(+c.dataset.p); c.classList.toggle('ativa', !!(p && p.ref === passagemAberta));
    });
  }
  function abrirPassagem(i) {
    var p = passagemDoSlide(i); if (!p) return;
    esconderDica();
    var box = $('#passagem');
    $('#passagem blockquote').innerHTML = semQuebrarHifen(p.texto);
    $('#passagem .quem').textContent = nomeRef(p.ref);
    box.hidden = false; box.classList.remove('on', 'saindo'); void box.offsetWidth; box.classList.add('on');
    passagemAberta = p.ref; marcarCitas();
    if (loja) loja.anunciar();
  }
  function fecharPassagem(ja) {
    var box = $('#passagem'); if (box.hidden) return;
    passagemAberta = null; marcarCitas();
    if (ja) { box.hidden = true; box.classList.remove('on', 'saindo'); }
    else {
      box.classList.remove('on'); box.classList.add('saindo');
      setTimeout(function () { if (!passagemAberta) { box.hidden = true; box.classList.remove('saindo'); } }, 340);
    }
    if (loja) loja.anunciar();
  }
  function mostrarDica(c) {
    var p = passagemDoSlide(+c.dataset.p); if (!p || passagemAberta || !c.isConnected) return;
    var d = $('#dica');
    d.innerHTML = '<b>' + esc(nomeRef(p.ref)) + '</b>' + semQuebrarHifen(p.texto);
    d.classList.remove('on', 'abaixo'); d.hidden = false;
    var pr = palco.getBoundingClientRect(), sx = pr.width / palco.offsetWidth, sy = pr.height / palco.offsetHeight;
    var r = c.getBoundingClientRect(), W = palco.offsetWidth;
    var cx = (r.left + r.width / 2 - pr.left) / sx, topo = (r.top - pr.top) / sy, base = (r.bottom - pr.top) / sy;
    var dw = d.offsetWidth, dh = d.offsetHeight, esq = Math.max(30, Math.min(W - dw - 30, cx - dw / 2));
    var acima = topo - dh - 26 > 20;
    d.style.left = esq + 'px'; d.style.top = (acima ? topo - dh - 26 : base + 26) + 'px';
    d.style.setProperty('--seta', (cx - esq) + 'px'); d.classList.toggle('abaixo', !acima);
    void d.offsetWidth; d.classList.add('on');
  }
  function esconderDica() { clearTimeout(dicaTimer); var d = $('#dica'); d.classList.remove('on'); d.hidden = true; }
  /* clique no telão: fecha a passagem aberta (fora do cartão ou no X) ou abre a citação clicada */
  function cliquePassagem(alvo) {
    if (!alvo || !alvo.closest) return false;
    if (passagemAberta) { if (alvo.closest('#passagem .fechar') || !alvo.closest('#passagem .cartao')) fecharPassagem(); return true; }
    var c = alvo.closest('.cita');
    if (c) { abrirPassagem(+c.dataset.p); return true; }
    return false;
  }

  /* ---------- formato da tela: 16:9 ou 4:3 ---------- */
  /* auto: decide pela proporção da janela; 169: palco 1920x1080; 43: palco 1440x1080 com faixas pretas;
     43c: palco 1440x1080 esticado na horizontal para compensar datashow que achata a imagem em 4:3 */
  var FORMATOS = { auto: 'Automático', '169': '16:9', '43': '4:3 com faixas pretas', '43c': '4:3 compensado' };
  var ORDEM_FORMATOS = ['auto', '169', '43', '43c'];
  var formato = 'auto', layout43 = null, avisoTimer = null;
  /* ajuste fino para encaixar a imagem na área projetada: zoom em % e deslocamento em % da janela */
  var ajuste = (function () {
    var m = String(C.ler('cat-ajuste', '100:0:0')).match(/^(\d{2,3}):(-?\d{1,2}):(-?\d{1,2})$/);
    return m ? { z: +m[1], x: +m[2], y: +m[3] } : { z: 100, x: 0, y: 0 };
  })();
  function definirAjuste(t) {
    var m = String(t).match(/^(\d{2,3}):(-?\d{1,2}):(-?\d{1,2})$/); if (!m) return;
    ajuste = { z: Math.max(60, Math.min(110, +m[1])), x: Math.max(-20, Math.min(20, +m[2])), y: Math.max(-20, Math.min(20, +m[3])) };
    C.guardar('cat-ajuste', ajuste.z + ':' + ajuste.x + ':' + ajuste.y);
    escalar();
    avisoTela('Ajuste da imagem', 'tamanho ' + ajuste.z + '% · horizontal ' + (ajuste.x > 0 ? '+' : '') + ajuste.x + ' · vertical ' + (ajuste.y > 0 ? '+' : '') + ajuste.y);
  }
  function lerFormato() {
    var f = String(C.params.get('formato') || '').replace(/[^0-9a-z]/gi, '').toLowerCase();
    if (FORMATOS[f]) { C.guardar('cat-formato', f); return f; }
    f = C.ler('cat-formato', 'auto');
    return FORMATOS[f] ? f : 'auto';
  }
  function escalar() {
    var W = window.innerWidth, H = window.innerHeight;
    var em43 = formato === '43' || formato === '43c' || (formato === 'auto' && W / H < 1.55);
    var LW = em43 ? 1440 : 1920, sx, sy;
    if (formato === '43c') { sx = W / LW; sy = H / 1080; }
    else { sx = sy = Math.min(W / LW, H / 1080); }
    var z = ajuste.z / 100, dx = W * ajuste.x / 100, dy = H * ajuste.y / 100;
    sx *= z; sy *= z;
    palco.classList.toggle('f43', em43);
    palco.style.transform = 'translate(' + (-LW / 2 * sx + dx) + 'px,' + (-540 * sy + dy) + 'px) scale(' + sx + ',' + sy + ')';
    var mudou = layout43 !== null && layout43 !== em43;
    layout43 = em43;
    if (mudou) refazer();
    if (loja) loja.anunciar();
  }
  function refazer() { if (indice < 0 || !slides) return; var n = indice; indice = -1; ir(n, true); }
  function definirFormato(f) {
    if (!FORMATOS[f]) return;
    formato = f; C.guardar('cat-formato', f);
    escalar(); avisoFormato();
  }
  function nomeFormato() { return FORMATOS[formato] + (formato === 'auto' ? ' (agora ' + (layout43 ? '4:3' : '16:9') + ')' : ''); }
  function avisoTela(rotulo, texto) {
    var a = $('#aviso-formato');
    a.innerHTML = '<small>' + esc(rotulo) + '</small><b>' + esc(texto) + '</b>';
    a.hidden = false; clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () { a.hidden = true; }, 3200);
  }
  function avisoFormato() {
    avisoTela('Formato do telão', nomeFormato());
    if (!$('#teste-tela').hidden) desenharTeste();
  }
  function desenharTeste() {
    var t = $('#teste-tela');
    t.innerHTML = '<i class="canto c1"></i><i class="canto c2"></i><i class="canto c3"></i><i class="canto c4"></i>' +
      '<div class="eixo h"></div><div class="eixo v"></div><div class="quadro"><div class="bola"></div></div>' +
      '<div class="info"><b>Teste de tela</b><span>' + esc(nomeFormato()) + ' · palco ' + (layout43 ? '1440 × 1080' : '1920 × 1080') + '</span></div>' +
      '<ol class="passos"><li>A moldura dourada deve encostar nas quatro bordas da tela.</li>' +
      '<li>O círculo deve ficar redondo: largura igual à altura.</li>' +
      '<li>Alto e estreito: datashow achatando. Use 4:3 compensado.</li>' +
      '<li>Largo e baixo: datashow esticando. No menu dele, proporção Automático ou Normal.</li></ol>' +
      '<div class="teclas">T troca o formato · G fecha o teste</div>';
  }
  function alternarTeste() {
    var t = $('#teste-tela');
    if (t.hidden) { desenharTeste(); t.hidden = false; } else t.hidden = true;
    if (loja) loja.anunciar();
  }

  /* ---------- HUD e login ---------- */
  function atualizarHud() {
    var h = $('#hud');
    h.classList.toggle('online', !!loja && loja.online);
    var n = loja ? Object.keys(loja.jogadores).length : 0;
    h.innerHTML = '<i></i><span>' + (C.DEMO ? 'demonstração' : (loja && loja.online ? 'ao vivo' : 'sem conexão')) + '</span><span>' + n + (n === 1 ? ' participante' : ' participantes') + '</span><span>slide ' + (indice + 1) + '/' + slides.length + '</span>' +
      '<span>' + (chaveApr || C.DEMO ? 'celulares sincronizados' : 'sem chave: celulares não acompanham') + '</span><span>tela ' + esc(nomeFormato()) + '</span><span>música ' + ({ tocando: 'tocando', bloqueado: 'bloqueada', mudo: 'desligada', parado: Som.mudo() ? 'desligada' : 'pronta' })[Som.estado()] + '</span><span>sala ' + esc(C.SALA) + '</span>';
  }
  function mostrarHud() {
    var h = $('#hud'); h.classList.add('on'); tela.classList.remove('sem-cursor');
    clearTimeout(hudTimer); hudTimer = setTimeout(function () { h.classList.remove('on'); tela.classList.add('sem-cursor'); }, 2600);
  }
  function mostrarLogin(msg) {
    var l = $('#login'); l.hidden = false; $('#login .erro').textContent = msg || '';
    setTimeout(function () { $('#login input').focus(); }, 50);
  }
  function configurarLogin() {
    $('#login form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = $('#login input').value.trim(); if (!v) return;
      loja.rpc('chave_valida', { p_chave: v }).then(function (r) {
        if (r && r.data === true) {
          chaveApr = v; C.guardar('cat-chave', v); $('#login').hidden = true;
          rpcApr('sala_garantir', { p_aula: C.AULA_ID }).then(function () { sincronizar(indice, atual && atual.item); atualizarHud(); });
        } else $('#login .erro').textContent = 'Chave incorreta.';
      });
    });
    $('#login .sec').addEventListener('click', function () { somenteExibir = true; $('#login').hidden = true; atualizarHud(); });
  }

  function dadosPresenca() {
    var ps = atual && atual.passo ? atual.passo() : { p: 0, n: 1 };
    return { formato: formato, layout: layout43 ? '43' : '169', teste: !$('#teste-tela').hidden, som: Som.estado(), mudo: Som.mudo(), passagem: passagemAberta,
      vol: Math.round(Som.mestre() * 100), gota: Gota.bloqueado() ? 'bloqueada' : 'ok', inicio: !$('#inicio-som').hidden,
      geracao: loja ? loja.geracao() : null, ajuste: ajuste.z + ':' + ajuste.x + ':' + ajuste.y, cheia: !!document.fullscreenElement, preto: !$('#preto').hidden,
      i: indice, p: ps.p, n: ps.n, q: ps.q || null, qr: qrManual, chave: !!chaveApr };
  }
  var pulsoTimer = null, ultimoPulso = 0;
  function pulsar() {
    if (C.DEMO || !chaveApr || !loja) return;
    clearTimeout(pulsoTimer);
    pulsoTimer = setTimeout(function () {
      ultimoPulso = Date.now();
      rpcApr('palco_pulso', { p_meta: dadosPresenca() });
    }, Math.max(0, 1000 - (Date.now() - ultimoPulso)));
  }

  /* ---------- um clique ao abrir o telão libera todo o som da apresentação ----------
     O navegador só deixa tocar som depois de um clique ou tecla no próprio telão. Esse clique vale até
     recarregar a página: depois dele, todas as músicas e gotas entram sozinhas. Com o atalho do Chrome
     em modo quiosque (--autoplay-policy=no-user-gesture-required), o som já nasce liberado e este aviso não aparece. */
  function somLiberado() { var c = Som.contexto(); return !c || c.state === 'running'; }
  function iniciarSom() {
    var box = $('#inicio-som'); if (box.hidden) return;
    box.hidden = true;
    Som.liberar(); Gota.liberar(); Som.aquecer();
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {});
    pintarSom(); if (loja) loja.anunciar();
  }

  function teclado(ev) {
    if (!$('#login').hidden) return;
    Som.liberar(); Gota.liberar();
    if (!$('#inicio-som').hidden) { var k0 = ev.key; iniciarSom(); if (k0 === 'f' || k0 === 'F') return; }
    var k = ev.key;
    if (passagemAberta && /^(Escape|ArrowRight|ArrowLeft|PageDown|PageUp| |Enter|Backspace)$/.test(k)) { ev.preventDefault(); fecharPassagem(); return; }
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter') { ev.preventDefault(); avancar(); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { ev.preventDefault(); voltar(); }
    else if (k === 'Home') ir(0);
    else if (k === 'End') ir(slides.length - 1);
    else if (k === 'f' || k === 'F') { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(function () {}); else document.exitFullscreen(); }
    else if (k === 'q' || k === 'Q') { qrManual = !qrManual; qrFlutuante(slides[indice]); if (loja) loja.anunciar(); }
    else if (k === 'b' || k === 'B' || k === '.') alternarPreto();
    else if (k === 't' || k === 'T') definirFormato(ORDEM_FORMATOS[(ORDEM_FORMATOS.indexOf(formato) + 1) % ORDEM_FORMATOS.length]);
    else if (k === 'g' || k === 'G') alternarTeste();
    else if (k === 'm' || k === 'M') Som.alternarMudo();
  }

  function preCarregar() {
    if (slides.some(function (s) { return s.somGota; })) Gota.preparar();
    var vistos = {};
    slides.forEach(function (s) {
      if (s.efeito && !vistos[s.efeito]) { vistos[s.efeito] = 1; Som.preCarregar(aud(s.efeito), true); }
      if (s.musica && !vistos[s.musica]) { vistos[s.musica] = 1; Som.preCarregar(aud(s.musica)); }
    });
    slides.forEach(function (s) {
      [s.imagem].concat(s.imagens || [], s.fotos || []).forEach(function (f) { if (f) { var i = new Image(); i.src = img(f); } });
    });
  }

  function iniciar() {
    A = window.AULA; slides = A.slides;
    if (A.somQuiz) slides.forEach(function (s) {
      if (s.tipo !== 'quiz') return;
      Object.keys(A.somQuiz).forEach(function (k) { if (s[k] == null) s[k] = A.somQuiz[k]; });
    });
    tela = $('#tela'); palco = $('#palco');
    formato = lerFormato();
    escalar(); window.addEventListener('resize', escalar);
    document.addEventListener('keydown', teclado);
    document.addEventListener('mousemove', mostrarHud);
    /* toque e deslize: celular, tablet ou clique do mouse */
    var tx = null, ty = null, ultimoToque = 0;
    function navegarPor(x) { if (x > window.innerWidth * 0.35) avancar(); else voltar(); }
    var noSom = function (ev) { return ev.target && ev.target.closest && ev.target.closest('#som-bloqueado'); };
    $('#som-bloqueado').addEventListener('click', function (ev) { ev.stopPropagation(); Som.liberar(); Gota.liberar(); });
    tela.addEventListener('touchstart', function (ev) {
      if (!$('#login').hidden || noSom(ev)) return;
      var t = ev.changedTouches[0]; tx = t.clientX; ty = t.clientY;
    }, { passive: true });
    tela.addEventListener('touchend', function (ev) {
      Gota.liberar();
      if (tx === null) return;
      var t = ev.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty;
      tx = null; ultimoToque = Date.now(); mostrarHud();
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { if (passagemAberta) { fecharPassagem(); return; } if (dx < 0) avancar(); else voltar(); return; }
      if (Math.abs(dx) < 14 && Math.abs(dy) < 14) { if (cliquePassagem(ev.target)) return; navegarPor(t.clientX); }
    }, { passive: true });
    tela.addEventListener('click', function (ev) {
      Gota.liberar();
      if (Date.now() - ultimoToque < 700 || !$('#login').hidden || noSom(ev)) return;
      if (cliquePassagem(ev.target)) return;
      navegarPor(ev.clientX);
    });
    palco.addEventListener('mouseover', function (ev) {
      var c = ev.target.closest && ev.target.closest('.cita'); if (!c) return;
      clearTimeout(dicaTimer); dicaTimer = setTimeout(function () { mostrarDica(c); }, 120);
    });
    palco.addEventListener('mouseout', function (ev) {
      var c = ev.target.closest && ev.target.closest('.cita'); if (!c || (ev.relatedTarget && c.contains(ev.relatedTarget))) return;
      clearTimeout(dicaTimer); dicaTimer = setTimeout(esconderDica, 160);
    });
    configurarLogin();
    preCarregar();
    if (!somLiberado()) $('#inicio-som').hidden = false;
    $('#inicio-som').addEventListener('click', function (ev) { ev.stopPropagation(); iniciarSom(); });
    document.title = A.titulo + ' · telão';
    loja = new C.Loja({ tabelas: ['jogadores', 'palavras', 'votos', 'regua', 'mapa', 'toques', 'mural', 'intencoes'], fotos: true, intervalo: 9000, presenca: 'palco',
      dadosPresenca: dadosPresenca });
    /* além da presença em tempo real, o telão grava um pulso no banco: o painel sabe que ele está aberto mesmo se a presença falhar */
    var anunciarOriginal = loja.anunciar;
    loja.anunciar = function (j) { anunciarOriginal.call(loja, j); pulsar(); };
    setInterval(pulsar, 8000);
    document.addEventListener('fullscreenchange', function () { if (loja) loja.anunciar(); });
    chaveApr = C.DEMO ? 'demo' : (C.ler('cat-chave', '') || null);
    loja.ouvir(function (tipo) {
      if (tipo === 'sala') { verGeracao(); verComando(); return; }
      if (tipo === 'conexao' || tipo === 'jogadores') atualizarHud();
      if (atual && atual.atualizar) atual.atualizar(tipo);
    });
    loja.iniciar().then(function () {
      verGeracao();
      verComando();
      var inicio = +(C.params.get('slide') || 0) || (loja.sala && loja.sala.slide) || 0;
      if (chaveApr && !C.DEMO) {
        loja.rpc('chave_valida', { p_chave: chaveApr }).then(function (r) {
          if (!(r && r.data === true)) { chaveApr = null; mostrarLogin('Digite a chave do apresentador.'); }
          else rpcApr('sala_garantir', { p_aula: C.AULA_ID });
        });
      } else if (!C.DEMO) mostrarLogin();
      ir(inicio, true);
      mostrarHud();
    });
  }

  C.carregarScript('aulas/' + C.AULA_ID + '/aula.js')
    .then(function () { return C.DEMO ? C.carregarScript('aulas/' + C.AULA_ID + '/demo.js').catch(function () {}) : null; })
    .then(iniciar)
    .catch(function (e) { document.body.innerHTML = '<p style="color:#fff;font:20px sans-serif;padding:40px">Não foi possível carregar a aula: ' + esc(e.message) + '</p>'; });
})();
