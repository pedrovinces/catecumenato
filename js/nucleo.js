/* Motor de catequese interativa · núcleo compartilhado (telão, celular e painel).
   Camada de dados herdada da sessão "IA na Terapia Intensiva", generalizada por aula e sala. */
(function () {
  'use strict';

  var CFG = window.CATEQUESE_CFG || {};
  var params = new URLSearchParams(location.search);
  function limpar(v) { return String(v || '').toLowerCase().replace(/[^a-z0-9-]/g, ''); }
  var AULA_ID = limpar(params.get('a')) || CFG.aulaPadrao || 'uncao';
  var SALA = (limpar(params.get('s')) || AULA_ID).slice(0, 20);
  var DEMO = params.get('demo') === '1' || window.FORCAR_DEMO === true;

  /* ---------- armazenamento local tolerante ---------- */
  function guardar(k, v) { try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch (e) {} }
  function ler(k, padrao) {
    try { var v = localStorage.getItem(k); if (v == null) return padrao; try { return JSON.parse(v); } catch (e) { return v; } }
    catch (e) { return padrao; }
  }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16);
    });
  }
  /* chave do apresentador no link (#k=...): guardada neste aparelho e apagada do endereço na hora.
     O trecho depois do # não sai do navegador, nem para o servidor do site. */
  (function () {
    try {
      var m = location.hash.replace(/^#/, '').match(/(?:^|&)(?:k|chave)=([^&]+)/);
      if (m) { guardar('cat-chave', decodeURIComponent(m[1])); history.replaceState(null, '', location.pathname + location.search); }
    } catch (e) {}
  })();
  var APARELHO = ler('cat-aparelho', null);
  if (!APARELHO || !/^[0-9a-f-]{36}$/.test(APARELHO)) { APARELHO = uuid(); guardar('cat-aparelho', APARELHO); }

  /* ---------- texto: normalização e moderação (o banco repete as mesmas regras) ---------- */
  var BLOQUEIO = ['porra','caralho','merda','bosta','foda','fodase','fodasse','puta','puto','putaria','cacete','buceta','boceta','cu','cuzao','viado','veado','fdp','pqp','vsf','tnc','krl','otario','idiota','imbecil','babaca','arrombado','desgraca','desgracado','piroca','pau','rola','corno','vagabundo','vagabunda','safado','safada','xoxota','xereca','retardado','bicha','sapatao','macaco'];
  var RE_BLOQUEIO = new RegExp('(^|[^a-z])(' + BLOQUEIO.join('|') + ')([^a-z]|$)');
  function semAcento(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function norm(s) { return semAcento(String(s || '').toLowerCase()); }
  function palavrao(s) { return RE_BLOQUEIO.test(norm(s)); }
  function compacto(s) { return String(s || '').trim().replace(/\s+/g, ' '); }
  function palavras(s) { return compacto(s).split(' ').filter(Boolean).length; }

  function validarPalavra(raw) {
    var w = compacto(raw);
    if (w.length < 2) return 'Digite uma palavra.';
    if (w.length > 24) return 'Use até 24 caracteres.';
    if (/[0-9@\/]|http|www/i.test(w)) return 'Sem números ou links, apenas palavras.';
    if (palavras(w) > 3) return 'Use até 3 palavras.';
    if (palavrao(w)) return 'Palavra não aceita.';
    return '';
  }
  function validarApelido(raw) {
    var a = compacto(raw);
    if (a.length < 2 || a.length > 16) return 'Use de 2 a 16 caracteres.';
    if (!/^[a-z0-9 '.-]+$/.test(norm(a))) return 'Use letras e números.';
    if (palavrao(a)) return 'Apelido não aceito.';
    return '';
  }
  function validarFrase(raw) {
    var t = compacto(raw);
    if (t.length < 5) return 'Escreva um pouco mais.';
    if (t.length > 240) return 'Use até 240 caracteres.';
    if (/(http|www\.|:\/\/)/i.test(t)) return 'Sem links, por favor.';
    if (palavrao(t)) return 'Texto não aceito.';
    return '';
  }
  function validarNome(raw) {
    var t = compacto(raw);
    if (t.length < 2 || t.length > 30) return 'Use de 2 a 30 letras.';
    if (!/^[a-z' -]+$/.test(norm(t))) return 'Use somente letras.';
    if (palavras(t) > 3) return 'Somente o primeiro nome.';
    if (palavrao(t)) return 'Texto não aceito.';
    return '';
  }
  function traduzErro(msg) {
    msg = String(msg || '');
    if (/nao aceit|não aceit/.test(msg)) return 'Texto não aceito.';
    if (/muitos/.test(msg)) return 'Muitos envios em seguida. Espere um minuto.';
    if (/limite de toques/.test(msg)) return 'Você já usou os 3 toques.';
    if (/tamanho/.test(msg)) return 'Tamanho inválido.';
    if (/somente letras/.test(msg)) return 'Use somente letras.';
    if (/foreign key|violates/.test(msg)) return 'O encontro ainda não começou.';
    if (/duplicate|unique/.test(msg)) return 'Já registrado.';
    return 'Não foi possível enviar. Tente de novo.';
  }

  /* chave para agrupar palavras parecidas na nuvem (plural, acento, caixa) */
  function chave(w) {
    var k = norm(w).trim().replace(/[^a-z\s-]/g, '').replace(/\s+/g, ' ');
    if (k.length > 4 && /s$/.test(k) && !/ss$/.test(k)) k = k.replace(/oes$/, 'ao').replace(/aes$/, 'ao').replace(/s$/, '');
    return k;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function carregarScript(src) {
    return new Promise(function (ok, falha) {
      var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { falha(new Error('Falha ao carregar ' + src)); };
      document.head.appendChild(s);
    });
  }

  /* ---------- avatar: a gota de óleo com rosto ou iniciais ---------- */
  var CORES_GOTA = [
    ['#F8D94A', '#E9762B'], ['#F2A652', '#C9452A'], ['#FBE7A1', '#E0A33A'], ['#F5C66B', '#B8331F'],
    ['#FFE08A', '#D9531E'], ['#F7B267', '#9E2A1E'], ['#FCEFC7', '#E9A23B'], ['#F9CB5B', '#C0392B']
  ];
  var GOTA_D = 'M50 3 C50 3 11 55 11 85 A39 39 0 0 0 89 85 C89 55 50 3 50 3 Z';
  var gotaSeq = 0;
  function iniciais(nome) {
    var p = compacto(nome).split(' ').filter(Boolean);
    if (!p.length) return '?';
    var s = p[0].charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : (p[0].charAt(1) || ''));
    return s.toUpperCase();
  }
  function gotaSVG(j, cls) {
    j = j || {};
    var id = 'gt' + (++gotaSeq), c = CORES_GOTA[(j.cor || 0) % CORES_GOTA.length];
    var corpo;
    if (j.foto) {
      corpo = '<path d="' + GOTA_D + '" fill="' + c[1] + '"/>' +
        '<image href="' + esc(j.foto) + '" x="6" y="24" width="88" height="102" preserveAspectRatio="xMidYMid slice" clip-path="url(#' + id + 'c)"/>';
    } else {
      corpo = '<path d="' + GOTA_D + '" fill="url(#' + id + 'f)"/>' +
        '<text x="50" y="97" text-anchor="middle" font-family="Jost, sans-serif" font-size="30" font-weight="500" fill="#5E1617">' + esc(iniciais(j.apelido)) + '</text>';
    }
    return '<svg class="gota ' + (cls || '') + '" viewBox="0 0 100 126" role="img" aria-label="' + esc(j.apelido || 'participante') + '">' +
      '<defs><clipPath id="' + id + 'c"><path d="' + GOTA_D + '"/></clipPath>' +
      '<linearGradient id="' + id + 'f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient></defs>' +
      corpo +
      '<path d="' + GOTA_D + '" fill="none" stroke="#F8D464" stroke-width="3.2"/>' +
      '<ellipse cx="33" cy="66" rx="5" ry="11" fill="#fff" opacity=".38" transform="rotate(24 33 66)"/></svg>';
  }

  /* ---------- QR Code ---------- */
  function urlPublica() {
    var base = 'https://' + (CFG.dominio || location.host) + '/';
    var q = [];
    if (AULA_ID !== (CFG.aulaPadrao || 'uncao')) q.push('a=' + AULA_ID);
    if (SALA !== AULA_ID) q.push('s=' + SALA);
    return base + (q.length ? '?' + q.join('&') : '');
  }
  function urlCurta() { return (CFG.dominio || location.host) + (SALA !== AULA_ID || AULA_ID !== (CFG.aulaPadrao || 'uncao') ? urlPublica().replace(/^https:\/\/[^/]+\//, '/') : ''); }
  function qrSvg(texto, cor) {
    var q = window.qrcode(0, 'M'); q.addData(texto); q.make();
    var n = q.getModuleCount(), d = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + c + ' ' + r + 'h1v1h-1z';
    return '<svg viewBox="-2 -2 ' + (n + 4) + ' ' + (n + 4) + '" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QR Code para ' + esc(texto) + '"><rect x="-2" y="-2" width="' + (n + 4) + '" height="' + (n + 4) + '" fill="#fff"/><path d="' + d + '" fill="' + (cor || '#5E1617') + '"/></svg>';
  }

  /* ---------- nuvem de palavras: espiral com checagem de colisão ---------- */
  function desenharNuvem(el, itens, opt) {
    opt = opt || {};
    var W = el.clientWidth, H = el.clientHeight; if (!W || !H) return;
    itens = itens.slice(0, opt.limite || 45);
    var max = itens.length ? itens[0].n : 1, min = itens.length ? itens[itens.length - 1].n : 1;
    var maxF = opt.maxF || Math.min(W, H) * 0.2, minF = opt.minF || Math.max(18, maxF * 0.22);
    if (itens.length <= 3) maxF = Math.min(maxF, H * 0.22);
    var ocupado = [], existentes = {};
    Array.prototype.forEach.call(el.children, function (c) { existentes[c.dataset.k] = c; });
    itens.forEach(function (it, i) {
      var t = max === min ? 1 : (it.n - min) / (max - min), f = minF + (maxF - minF) * Math.pow(t, 0.75);
      var sp = existentes[it.k], novo = !sp;
      if (!sp) { sp = document.createElement('span'); sp.dataset.k = it.k; el.appendChild(sp); }
      sp.textContent = it.label; sp.style.fontSize = f.toFixed(1) + 'px';
      var cls = t > 0.66 ? 'k1' : t > 0.33 ? 'k2' : 'k3';
      var extra = opt.classe ? opt.classe(it) : '';
      if (extra) cls += ' ' + extra;
      if (novo && opt.animar) cls += ' novo';
      sp.className = cls;
      var w = sp.offsetWidth + f * 0.3, h = f * 1.08;
      var a = 0, r = 0, x = W / 2, y = H / 2, ok = false, passo = 0;
      while (passo < 2600) {
        x = W / 2 + r * Math.cos(a) * 1.7; y = H / 2 + r * Math.sin(a);
        var bx = x - w / 2, by = y - h / 2;
        if (bx >= 0 && by >= 0 && bx + w <= W && by + h <= H) {
          ok = true;
          for (var j = 0; j < ocupado.length; j++) { var p = ocupado[j]; if (bx < p.x + p.w && bx + w > p.x && by < p.y + p.h && by + h > p.y) { ok = false; break; } }
          if (ok) break;
        }
        a += 0.32; r += 0.75 + i * 0.012; passo++;
      }
      delete existentes[it.k];
      if (!ok) { sp.style.opacity = 0; return; }
      sp.style.opacity = '';
      ocupado.push({ x: x - w / 2, y: y - h / 2, w: w, h: h });
      sp.style.left = x.toFixed(1) + 'px'; sp.style.top = y.toFixed(1) + 'px';
    });
    Object.keys(existentes).forEach(function (k) { existentes[k].remove(); });
  }

  /* ---------- Loja: estado ao vivo da sala ---------- */
  var TABELAS_ID = { palavras: 1, votos: 1, regua: 1, mapa: 1, toques: 1, mural: 1, intencoes: 1 };

  function Loja(opts) {
    this.opts = opts || {};
    this.tabelas = this.opts.tabelas || [];
    this.sala = null; this.jogadores = {};
    this.palavras = []; this.votos = []; this.regua = []; this.mapa = []; this.toques = [];
    this.mural = []; this.intencoes = []; this.perguntas = [];
    this.vistos = {}; this.ouvintes = []; this.online = false; this.offset = 0;
    this.cliente = null; this.demo = DEMO;
  }
  Loja.prototype.ouvir = function (fn) { this.ouvintes.push(fn); };
  Loja.prototype.avisar = function (tipo, linha) {
    var s = this; this.ouvintes.forEach(function (f) { try { f(tipo, linha, s); } catch (e) { console.error(e); } });
  };
  Loja.prototype.agora = function () { return Date.now() + this.offset; };
  Loja.prototype._add = function (tabela, linha) {
    if (linha.id != null) { var k = tabela + ':' + linha.id; if (this.vistos[k]) return false; this.vistos[k] = 1; }
    this[tabela].push(linha); return true;
  };
  Loja.prototype._substituir = function (tabela, linha) {
    var lista = this[tabela];
    for (var i = 0; i < lista.length; i++) if (lista[i].id === linha.id) { lista[i] = linha; return; }
    this._add(tabela, linha);
  };
  Loja.prototype._jogador = function (l) {
    var atual = this.jogadores[l.aparelho] || {};
    var novo = Object.assign({}, atual, l);
    if (!('foto' in l) && 'foto' in atual) novo.foto = atual.foto;
    var eraNovo = !this.jogadores[l.aparelho];
    this.jogadores[l.aparelho] = novo;
    return eraNovo;
  };

  Loja.prototype.iniciar = function () {
    var s = this;
    if (DEMO) { return Demo.iniciar(s); }
    if (!window.supabase) { s.online = false; s.avisar('conexao'); return Promise.resolve(); }
    s.cliente = window.supabase.createClient(CFG.url, CFG.chavePublica, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 30 } }
    });
    var t0 = Date.now();
    return s.cliente.rpc('agora').then(function (r) {
      if (r.data) { var t1 = Date.now(); s.offset = new Date(r.data).getTime() - (t0 + t1) / 2; }
    }).catch(function () {}).then(function () {
      return s._carregar(true);
    }).then(function () { s._assinar(); });
  };

  Loja.prototype._carregar = function (primeira) {
    var s = this, c = s.cliente, T = s.tabelas, tarefas = [];
    tarefas.push(c.from('salas').select('*').eq('id', SALA).maybeSingle().then(function (r) {
      if (r.error) throw r.error;
      s.sala = r.data || null;
    }));
    if (primeira) {
      tarefas.push(c.from('quiz_perguntas').select('ordem,tipo,texto,opcoes,tempo,numero_min,numero_max').eq('aula', AULA_ID).order('ordem').then(function (r) {
        s.perguntas = r.data || [];
      }));
    }
    if (T.indexOf('jogadores') >= 0) {
      var cols = primeira && s.opts.fotos ? 'aparelho,apelido,cor,criado,foto' : 'aparelho,apelido,cor,criado';
      tarefas.push(c.from('jogadores').select(cols).eq('sala', SALA).order('criado').limit(1000).then(function (r) {
        var faltam = [];
        (r.data || []).forEach(function (l) { s._jogador(l); if (s.opts.fotos && s.jogadores[l.aparelho].foto === undefined) faltam.push(l.aparelho); });
        if (faltam.length) return s._buscarFotos(faltam);
      }));
    }
    Object.keys(TABELAS_ID).forEach(function (t) {
      if (T.indexOf(t) < 0) return;
      var q = c.from(t).select('*').eq('sala', SALA).order('id', { ascending: true }).limit(5000);
      tarefas.push(q.then(function (r) {
        if (t === 'mural') { s.mural = r.data || []; return; }
        if (t === 'intencoes') { s.intencoes = (r.data || []); return; }
        (r.data || []).forEach(function (l) { s._add(t, l); });
      }));
    });
    return Promise.all(tarefas).then(function () {
      s.online = true; s.avisar('carga');
    }).catch(function (e) { console.warn(e); s.online = false; s.avisar('conexao'); });
  };

  Loja.prototype._buscarFotos = function (ids) {
    var s = this, lotes = [];
    for (var i = 0; i < ids.length; i += 40) lotes.push(ids.slice(i, i + 40));
    return Promise.all(lotes.map(function (lote) {
      return s.cliente.from('jogadores').select('aparelho,foto').eq('sala', SALA).in('aparelho', lote).then(function (r) {
        (r.data || []).forEach(function (l) { s._jogador(l); });
      });
    })).then(function () { s.avisar('jogadores'); });
  };

  Loja.prototype._assinar = function () {
    var s = this, c = s.cliente, filtro = 'sala=eq.' + SALA;
    var ch = c.channel('sala-' + SALA + '-' + Math.random().toString(36).slice(2, 7));
    ch.on('postgres_changes', { event: '*', schema: 'public', table: 'salas', filter: 'id=eq.' + SALA }, function (p) {
      if (p.new && p.new.id) { var antes = s.sala; s.sala = p.new; s.avisar('sala', { antes: antes }); }
    });
    s.tabelas.forEach(function (t) {
      ch.on('postgres_changes', { event: '*', schema: 'public', table: t, filter: filtro }, function (p) {
        var l = p.new; if (!l || (!l.id && t !== 'jogadores')) return;
        if (t === 'jogadores') { s._jogador(l); s.avisar('jogadores', l); return; }
        if (p.eventType === 'UPDATE' && (t === 'mural' || t === 'intencoes')) { s._substituir(t, l); s.avisar(t, l); return; }
        if (s._add(t, l)) s.avisar(t, l);
      });
    });
    ch.subscribe(function (st) { s.online = st === 'SUBSCRIBED'; s.avisar('conexao'); });
    s.canal = ch;
    if (s.opts.presenca || s.opts.verPresenca) {
      var pres = c.channel('presenca-' + SALA, { config: { presence: { key: (s.opts.presenca || 'obs') + '-' + Math.random().toString(36).slice(2, 8) } } });
      pres.on('presence', { event: 'sync' }, function () {
        var st = pres.presenceState();
        s.palcoOnline = Object.keys(st).some(function (k) { return (st[k] || []).some(function (m) { return m.papel === 'palco'; }); });
        s.avisar('presenca');
      });
      pres.subscribe(function (status) { if (status === 'SUBSCRIBED' && s.opts.presenca) pres.track({ papel: s.opts.presenca }); });
      s.canalPresenca = pres;
    }
    setInterval(function () { s._carregar(false); }, s.opts.intervalo || 10000);
  };

  Loja.prototype.enviar = function (tabela, dados) {
    var s = this;
    dados.sala = SALA; dados.aparelho = APARELHO;
    if (s.demo || !s.cliente) {
      var l = Object.assign({ id: 'local' + Math.random() }, dados, { criado: new Date().toISOString() });
      s._add(tabela, l); s.avisar(tabela, l);
      return Promise.resolve({ ok: true });
    }
    return s.cliente.from(tabela).insert(dados).then(function (r) {
      if (r.error) return { ok: false, erro: r.error.message || 'erro', msg: traduzErro(r.error.message) };
      return { ok: true };
    }).catch(function () { return { ok: false, erro: 'sem conexão', msg: 'Sem conexão. Tente de novo.' }; });
  };

  Loja.prototype.rpc = function (nome, args) {
    var s = this;
    if (s.demo) return Promise.resolve(Demo.rpc(s, nome, args || {}));
    if (!s.cliente) return Promise.resolve({ error: { message: 'sem conexão' } });
    return s.cliente.rpc(nome, args || {}).then(function (r) { return r; }).catch(function (e) { return { error: { message: String(e) } }; });
  };

  /* ---------- agregados ---------- */
  function ultimoPorAparelho(lista, filtro, campo) {
    var m = {};
    lista.forEach(function (l) { if (filtro(l)) m[l.aparelho] = l[campo]; });
    return Object.keys(m).map(function (k) { return m[k]; });
  }
  Loja.prototype.nuvem = function (interacao, grupos) {
    var m = {};
    this.palavras.forEach(function (p) {
      if (p.interacao !== interacao) return;
      var k = chave(p.palavra); if (!k) return;
      var e = m[k] || (m[k] = { k: k, n: 0, rotulos: {} });
      e.n++; var r = String(p.palavra).toLowerCase().trim(); e.rotulos[r] = (e.rotulos[r] || 0) + 1;
    });
    return Object.keys(m).map(function (k) {
      var e = m[k], best = null, bn = -1;
      Object.keys(e.rotulos).forEach(function (r) { if (e.rotulos[r] > bn) { bn = e.rotulos[r]; best = r; } });
      return { k: k, label: best, n: e.n, grupo: grupoDe(k, grupos) };
    }).sort(function (a, b) { return b.n - a.n || a.k.localeCompare(b.k); });
  };
  function grupoDe(k, grupos) {
    if (!grupos) return null;
    for (var g in grupos) {
      var ws = grupos[g];
      for (var i = 0; i < ws.length; i++) if (k === ws[i] || k.indexOf(ws[i]) === 0) return g;
    }
    return null;
  }
  Loja.prototype.contarVotos = function (interacao, item, nOpcoes) {
    var c = []; for (var i = 0; i < (nOpcoes || 2); i++) c.push(0);
    ultimoPorAparelho(this.votos, function (v) { return v.interacao === interacao && +v.item === +item; }, 'opcao')
      .forEach(function (o) { if (c[o] != null) c[o]++; });
    return c;
  };
  Loja.prototype.valoresRegua = function (interacao) {
    return ultimoPorAparelho(this.regua, function (v) { return v.interacao === interacao; }, 'valor').map(Number);
  };
  Loja.prototype.pontosMapa = function (interacao) {
    return this.mapa.filter(function (p) { return p.interacao === interacao; });
  };
  Loja.prototype.contarToques = function (interacao, n) {
    var c = []; for (var i = 0; i < n; i++) c.push(0);
    var vis = {}, pessoas = {};
    this.toques.forEach(function (t) {
      if (t.interacao !== interacao) return;
      var k = t.aparelho + ':' + t.item; if (vis[k]) return; vis[k] = 1; pessoas[t.aparelho] = 1;
      if (c[t.item] != null) c[t.item]++;
    });
    return { porItem: c, pessoas: Object.keys(pessoas).length };
  };
  Loja.prototype.participantesDe = function (tabela, interacao) {
    var p = {}; this[tabela].forEach(function (l) { if (!interacao || l.interacao === interacao) p[l.aparelho] = 1; });
    return Object.keys(p).length;
  };
  Loja.prototype.listaJogadores = function () {
    var s = this;
    return Object.keys(s.jogadores).map(function (k) { return s.jogadores[k]; })
      .sort(function (a, b) { return String(a.criado || '').localeCompare(String(b.criado || '')); });
  };
  Loja.prototype.pergunta = function (ordem) {
    for (var i = 0; i < this.perguntas.length; i++) if (+this.perguntas[i].ordem === +ordem) return this.perguntas[i];
    return null;
  };

  /* ---------- modo demonstração (sem banco) ---------- */
  var Demo = {
    nomes: ['Ana Paula', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabi', 'Helena', 'Igor', 'Júlia', 'Lucas', 'Marta', 'Nina', 'Otávio', 'Paula', 'Rafael', 'Sílvia', 'Tiago', 'Vera', 'Wagner', 'Zé Carlos', 'Rita', 'Márcio', 'Lúcia', 'Beto', 'Denise', 'Henrique', 'Simone'],
    iniciar: function (s) {
      s.online = true; s.demo = true;
      s.sala = { id: SALA, aula: AULA_ID, slide: 0, etapa: 'espera', item: 0, quiz_ordem: null, quiz_aberta_em: null, quiz_tempo: 20, quiz_revelada: false, quiz_correta: null, comando_seq: 0 };
      s.perguntas = (window.DEMO_QUIZ || []).slice();
      var D = window.DEMO_DADOS || {};
      if (s.opts.semDadosDemo) { setTimeout(function () { s.avisar('carga'); }, 0); return Promise.resolve(); }
      var n = 0;
      Demo.nomes.forEach(function (nome, i) {
        var ap = 'demo-' + i;
        s.jogadores[ap] = { aparelho: ap, apelido: nome, cor: i % 8, foto: null, criado: new Date(Date.now() - (40 - i) * 1000).toISOString() };
      });
      function dev() { return 'demo-' + (n++ % Demo.nomes.length); }
      Object.keys(D.palavras || {}).forEach(function (inter) {
        var mapa = D.palavras[inter];
        Object.keys(mapa).forEach(function (w) { for (var i = 0; i < mapa[w]; i++) s.palavras.push({ id: 'd' + Math.random(), interacao: inter, palavra: w, aparelho: dev() }); });
      });
      (D.votos || []).forEach(function (v) {
        v.contagem.forEach(function (q, op) { for (var i = 0; i < q; i++) s.votos.push({ interacao: v.interacao, item: v.item, opcao: op, aparelho: 'v' + v.item + '-' + op + '-' + i }); });
      });
      (D.regua || []).forEach(function (r) { r.valores.forEach(function (val, i) { s.regua.push({ interacao: r.interacao, valor: val, aparelho: 'r' + i }); }); });
      (D.mapa || []).forEach(function (m) { m.pontos.forEach(function (p, i) { s.mapa.push({ id: 'm' + i, interacao: m.interacao, x: p[0], y: p[1], aparelho: 'm' + (i % 20) }); }); });
      (D.toques || []).forEach(function (t) { t.contagem.forEach(function (q, it) { for (var i = 0; i < q; i++) s.toques.push({ interacao: t.interacao, item: it, aparelho: 't' + i }); }); });
      (D.mural || []).forEach(function (m, i) { s.mural.push({ id: 'mu' + i, texto: m[0], apoios: m[1], aprovada: true, oculta: false, respondida: false, criado: new Date().toISOString() }); });
      (D.intencoes || []).forEach(function (nome, i) { s.intencoes.push({ id: 'in' + i, nome: nome, criado: new Date().toISOString() }); });
      setTimeout(function () { s.avisar('carga'); }, 0);
      return Promise.resolve();
    },
    pontos: {},
    rpc: function (s, nome, a) {
      var sala = s.sala;
      function aviso() { setTimeout(function () { s.avisar('sala', {}); }, 0); }
      switch (nome) {
        case 'agora': return { data: new Date().toISOString() };
        case 'chave_valida': return { data: true };
        case 'sala_garantir': return { data: sala };
        case 'mudar':
          if (a.p_slide != null) sala.slide = a.p_slide;
          if (a.p_etapa != null) sala.etapa = a.p_etapa;
          if (a.p_item != null) sala.item = a.p_item;
          aviso(); return { data: null };
        case 'quiz_preparar':
          Object.assign(sala, { etapa: 'quiz', slide: a.p_slide, item: 0, quiz_ordem: a.p_ordem, quiz_aberta_em: null, quiz_revelada: false, quiz_correta: null, quiz_comentario: null });
          var p = s.pergunta(a.p_ordem); sala.quiz_tempo = p ? p.tempo : 20; aviso(); return { data: null };
        case 'quiz_abrir':
          sala.quiz_aberta_em = new Date().toISOString(); sala.quiz_revelada = false; aviso();
          return { data: sala.quiz_aberta_em };
        case 'quiz_revelar':
          var g = (window.DEMO_GABARITO || {})[sala.quiz_ordem] || { correta: 0, comentario: 'Gabarito disponível somente no banco.' };
          sala.quiz_revelada = true; sala.quiz_correta = g.correta; sala.quiz_valor = g.valor; sala.quiz_comentario = g.comentario;
          if (!Demo.pontos[sala.quiz_ordem]) {
            Demo.pontos[sala.quiz_ordem] = 1;
            Object.keys(s.jogadores).forEach(function (k, i) {
              var j = s.jogadores[k]; j._pq = (j._pq || 0) + ((i * 7 + sala.quiz_ordem * 3) % 5 < 3 ? 520 + ((i * 37 + sala.quiz_ordem * 11) % 470) : 0);
            });
          }
          aviso(); return { data: g };
        case 'quiz_painel':
          var pq = s.pergunta(sala.quiz_ordem), nop = pq && pq.opcoes ? pq.opcoes.length : 4, nj = Object.keys(s.jogadores).length;
          var aberta = sala.quiz_aberta_em ? Math.min(nj, Math.floor((Date.now() - new Date(sala.quiz_aberta_em).getTime()) / 450)) : 0;
          var cont = null;
          if (sala.quiz_revelada && pq && pq.tipo === 'multipla') {
            cont = []; for (var i = 0; i < nop; i++) cont.push(i === sala.quiz_correta ? Math.round(nj * 0.55) : Math.round(nj * 0.15) - i);
          }
          return { data: { ordem: sala.quiz_ordem, respostas: sala.quiz_revelada ? nj - 2 : aberta, contagem: cont, jogadores: nj } };
        case 'ranking':
          var lista = Object.keys(s.jogadores).map(function (k, i) {
            var j = s.jogadores[k], bonus = 50 * (3 + (i % 4)), pq2 = j._pq || 0;
            return { aparelho: j.aparelho, apelido: j.apelido, foto: j.foto, cor: j.cor, pontos_quiz: pq2, bonus: bonus, total: pq2 + bonus, acertos: Math.round(pq2 / 760) };
          }).sort(function (x, y) { return y.total - x.total; });
          lista.forEach(function (l, i) { l.posicao = i + 1; });
          return { data: lista.slice(0, a.p_limite || 10) };
        case 'meu_placar':
          return { data: { posicao: 4, total: 2380, bonus: 250, acertos: 3, jogadores: Object.keys(s.jogadores).length || 28, respondeu: false, ultima: sala.quiz_revelada ? 846 : null } };
        case 'jogador_entrar':
          s.jogadores[APARELHO] = { aparelho: APARELHO, apelido: compacto(a.p_apelido), foto: a.p_foto, cor: 3, criado: new Date().toISOString() };
          setTimeout(function () { s.avisar('jogadores', s.jogadores[APARELHO]); }, 0);
          return { data: { ok: true, apelido: compacto(a.p_apelido), cor: 3 } };
        case 'quiz_responder': return { data: { ok: true } };
        case 'comandar':
          sala.comando = a.p_comando; sala.comando_seq = (sala.comando_seq || 0) + 1; aviso(); return { data: sala.comando_seq };
        case 'mural_pendentes': return { data: s.mural.concat([{ id: 'p1', texto: 'Meu avô já recebeu uma vez; pode receber de novo?', aprovada: false, oculta: false, respondida: false, apoios: 0, criado: new Date().toISOString() }]) };
        case 'mural_moderar': return { data: null };
        case 'sala_encerrar': return { data: { fotos_apagadas: 0, intencoes_apagadas: s.intencoes.length } };
        case 'sala_limpar': return { data: SALA + '-arq-demo' };
        default: return { data: null };
      }
    }
  };

  /* ---------- silhueta para o mapa do corpo (viewBox 400 x 1000) ---------- */
  var ALVOS_CORPO = {
    fronte: [[200, 60]], maos: [[52, 600], [348, 600]],
    sentidos: [[180, 92], [220, 92], [138, 100], [262, 100], [200, 110], [200, 130], [52, 600], [348, 600], [160, 972], [240, 972]]
  };
  function corpoSVG(extra, cls) {
    var cor = 'rgba(255,255,255,.16)';
    return '<svg class="corpo ' + (cls || '') + '" viewBox="0 0 400 1000" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Silhueta de uma pessoa, de frente">' +
      '<defs><radialGradient id="calor"><stop offset="0" stop-color="#F8D94A" stop-opacity=".75"/><stop offset=".55" stop-color="#F2A652" stop-opacity=".35"/><stop offset="1" stop-color="#F2A652" stop-opacity="0"/></radialGradient></defs>' +
      '<g fill="' + cor + '" stroke="rgba(255,255,255,.55)" stroke-width="2">' +
      '<circle cx="200" cy="96" r="58"/>' +
      '<rect x="178" y="148" width="44" height="40" rx="14"/>' +
      '<path d="M118 196 Q200 172 282 196 Q300 210 302 236 L298 340 Q294 470 272 566 L128 566 Q106 470 102 340 L98 236 Q100 210 118 196 Z"/>' +
      '<path d="M112 212 Q78 260 70 340 Q62 440 56 548 L84 552 Q96 446 108 352 Q116 292 130 250 Z"/>' +
      '<path d="M288 212 Q322 260 330 340 Q338 440 344 548 L316 552 Q304 446 292 352 Q284 292 270 250 Z"/>' +
      '<ellipse cx="52" cy="600" rx="30" ry="46"/><ellipse cx="348" cy="600" rx="30" ry="46"/>' +
      '<path d="M132 560 L196 560 L190 930 Q186 950 170 952 L152 952 Q142 948 142 932 Z"/>' +
      '<path d="M268 560 L204 560 L210 930 Q214 950 230 952 L248 952 Q258 948 258 932 Z"/>' +
      '<ellipse cx="160" cy="972" rx="30" ry="18"/><ellipse cx="240" cy="972" rx="30" ry="18"/>' +
      '</g>' + (extra || '') + '</svg>';
  }
  /* formas das alternativas do quiz: gota, cruz, círculo, quadrado */
  var FORMAS = [
    '<path d="M50 6 C50 6 16 50 16 70 A34 34 0 0 0 84 70 C84 50 50 6 50 6 Z" fill="currentColor"/>',
    '<path d="M40 8 H60 V40 H92 V60 H60 V92 H40 V60 H8 V40 H40 Z" fill="currentColor"/>',
    '<circle cx="50" cy="50" r="40" fill="currentColor"/>',
    '<rect x="14" y="14" width="72" height="72" rx="6" fill="currentColor"/>'
  ];
  function formaSVG(i, cls) { return '<svg class="' + (cls || 'forma') + '" viewBox="0 0 100 100" aria-hidden="true">' + FORMAS[i % 4] + '</svg>'; }

  window.Catequese = {
    corpoSVG: corpoSVG, ALVOS_CORPO: ALVOS_CORPO, formaSVG: formaSVG,
    CFG: CFG, AULA_ID: AULA_ID, SALA: SALA, DEMO: DEMO, APARELHO: APARELHO,
    Loja: Loja, guardar: guardar, ler: ler, esc: esc, chave: chave, norm: norm, compacto: compacto,
    validarPalavra: validarPalavra, validarApelido: validarApelido, validarFrase: validarFrase, validarNome: validarNome,
    traduzErro: traduzErro, gotaSVG: gotaSVG, iniciais: iniciais, qrSvg: qrSvg, urlPublica: urlPublica, urlCurta: urlCurta,
    desenharNuvem: desenharNuvem, carregarScript: carregarScript, params: params
  };
})();
