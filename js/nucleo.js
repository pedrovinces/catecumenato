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
      var s = document.createElement('script'), v = (window.CATEQUESE_CFG || {}).versao; s.src = src + (v && src.indexOf('?') < 0 ? '?v=' + v : ''); s.onload = ok; s.onerror = function () { falha(new Error('Falha ao carregar ' + src)); };
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
        s.palcoOnline = false; s.palcoMeta = null;
        Object.keys(st).forEach(function (k) { (st[k] || []).forEach(function (m) { if (m.papel === 'palco') { s.palcoOnline = true; s.palcoMeta = m; } }); });
        s.avisar('presenca');
      });
      pres.subscribe(function (status) { if (status === 'SUBSCRIBED' && s.opts.presenca) s.anunciar(true); });
      s.canalPresenca = pres;
    }
    setInterval(function () { s._carregar(false); }, s.opts.intervalo || 10000);
  };

  /* publica na presença o papel e os dados extras deste aparelho (o telão informa o formato da tela) */
  Loja.prototype.anunciar = function (jaConectado) {
    var s = this, pres = s.canalPresenca;
    if (s.demo) {
      if (s._ponte && s.opts.presenca) { try { s._ponte.postMessage({ tipo: 'presenca', meta: Object.assign({ papel: s.opts.presenca }, s.opts.dadosPresenca ? s.opts.dadosPresenca() : {}) }); } catch (e) {} }
      return;
    }
    if (!pres || !s.opts.presenca || (!jaConectado && pres.state !== 'joined')) return;
    var extra = s.opts.dadosPresenca ? s.opts.dadosPresenca() : {};
    try { var r = pres.track(Object.assign({ papel: s.opts.presenca }, extra)); if (r && r.catch) r.catch(function () {}); } catch (e) {}
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
    /* no modo demonstração, telão, painel e celular abertos no mesmo navegador conversam entre si */
    ponte: function (s) {
      if (!window.BroadcastChannel) return;
      var bc; try { bc = new BroadcastChannel('catequese-demo-' + SALA); } catch (e) { return; }
      s._ponte = bc;
      bc.onmessage = function (ev) {
        var m = ev.data || {};
        if (m.tipo === 'sala' && m.sala) { var antes = Object.assign({}, s.sala); Object.assign(s.sala, m.sala); s.avisar('sala', { antes: antes }); }
        else if (m.tipo === 'presenca' && m.meta && s.opts.verPresenca) { s.palcoOnline = true; s.palcoMeta = m.meta; s.avisar('presenca'); }
        else if (m.tipo === 'saiu' && s.opts.verPresenca) { s.palcoOnline = false; s.palcoMeta = null; s.avisar('presenca'); }
        else if (m.tipo === 'quem' && s.opts.presenca) s.anunciar(true);
      };
      if (s.opts.verPresenca) setTimeout(function () { try { bc.postMessage({ tipo: 'quem' }); } catch (e) {} }, 60);
      if (s.opts.presenca) {
        setTimeout(function () { s.anunciar(true); }, 120);
        window.addEventListener('pagehide', function () { try { bc.postMessage({ tipo: 'saiu' }); } catch (e) {} });
      }
    },
    espalhar: function (s) { if (s._ponte) { try { s._ponte.postMessage({ tipo: 'sala', sala: s.sala }); } catch (e) {} } },
    iniciar: function (s) {
      s.online = true; s.demo = true;
      Demo.ponte(s);
      s.sala = { id: SALA, aula: AULA_ID, slide: 0, etapa: 'espera', item: 0, quiz_ordem: null, quiz_aberta_em: null, quiz_tempo: 20, quiz_revelada: false, quiz_correta: null, comando_seq: 0 };
      s.perguntas = (window.DEMO_QUIZ || []).slice();
      var D = window.DEMO_DADOS || {};
      if (s.opts.semDadosDemo) { setTimeout(function () { s.avisar('carga'); }, 0); return Promise.resolve(); }
      var n = 0;
      /* cinco já entraram; os demais chegam aos poucos, como na sala */
      Demo.nomes.forEach(function (nome, i) {
        var ap = 'demo-' + i, j = { aparelho: ap, apelido: nome, cor: i % 8, foto: null, criado: new Date(Date.now() - (40 - i) * 1000).toISOString() };
        if (i < 5) s.jogadores[ap] = j;
        else setTimeout(function () { j.criado = new Date().toISOString(); s.jogadores[ap] = j; s.avisar('jogadores'); }, 2500 + (i - 5) * 1300);
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
      function aviso() { Demo.espalhar(s); setTimeout(function () { s.avisar('sala', {}); }, 0); }
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
          var mm = (Demo.minhas || {})[sala.quiz_ordem], acertei = mm != null && mm === sala.quiz_correta;
          return { data: { posicao: 4, total: 2380, bonus: 250, acertos: 3, jogadores: Object.keys(s.jogadores).length || 28, respondeu: mm != null, ultima: sala.quiz_revelada && mm != null ? (acertei ? 846 : 0) : null } };
        case 'jogador_entrar':
          s.jogadores[APARELHO] = { aparelho: APARELHO, apelido: compacto(a.p_apelido), foto: a.p_foto, cor: 3, criado: new Date().toISOString() };
          setTimeout(function () { s.avisar('jogadores', s.jogadores[APARELHO]); }, 0);
          return { data: { ok: true, apelido: compacto(a.p_apelido), cor: 3 } };
        case 'quiz_responder': Demo.minhas = Demo.minhas || {}; Demo.minhas[sala.quiz_ordem] = a.p_opcao != null ? a.p_opcao : a.p_valor; return { data: { ok: true } };
        case 'comandar':
          sala.comando = a.p_comando; sala.comando_seq = Math.max((sala.comando_seq || 0) + 1, Date.now()); aviso(); return { data: sala.comando_seq };
        case 'orador_roteiro':
          return fetch('aulas/' + AULA_ID + '/roteiro.local.json', { cache: 'no-store' })
            .then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { return { data: d }; }).catch(function () { return { data: null }; });
        case 'orador_gabarito':
          return { data: s.perguntas.map(function (q) {
            var g = (window.DEMO_GABARITO || {})[q.ordem] || {};
            return { ordem: q.ordem, correta: g.correta != null ? g.correta : (q.tipo === 'multipla' ? 0 : null), valor: g.valor != null ? g.valor : null, comentario: g.comentario || 'Gabarito de demonstração: o verdadeiro fica no banco.', fonte: g.fonte || '' };
          }) };
        case 'orador_monitor': return { data: Demo.monitor(s) };
        case 'mural_pendentes': return { data: s.mural.concat([{ id: 'p1', texto: 'Meu avô já recebeu uma vez; pode receber de novo?', aprovada: false, oculta: false, respondida: false, apoios: 0, criado: new Date().toISOString() }]) };
        case 'mural_moderar': return { data: null };
        case 'sala_encerrar': return { data: { fotos_apagadas: 0, intencoes_apagadas: s.intencoes.length } };
        case 'sala_limpar': return { data: SALA + '-arq-demo' };
        default: return { data: null };
      }
    }
  };

  /* monitor do orador simulado: respostas chegando aos poucos depois que a pergunta abre */
  Demo.monitor = function (s) {
    var sala = s.sala, js = s.listaJogadores(), nj = js.length, resp = [], q = sala.quiz_ordem != null ? s.pergunta(sala.quiz_ordem) : null;
    var g = q ? ((window.DEMO_GABARITO || {})[q.ordem] || {}) : {}, correta = g.correta != null ? g.correta : 0, nop = q && q.opcoes ? q.opcoes.length : 4;
    if (q && sala.quiz_aberta_em) {
      var k = sala.quiz_revelada ? nj - 2 : Math.min(nj - 2, Math.floor((Date.now() - new Date(sala.quiz_aberta_em).getTime()) / 450));
      for (var i = 0; i < k; i++) {
        var ok = (i * 7 + q.ordem * 3) % 5 < 3, o = ok ? correta : (correta + 1 + (i % (nop - 1))) % nop;
        if (q.tipo === 'numero') resp.push({ a: js[i].aparelho, o: null, v: 1960 + (i * 7) % 25, ms: 900 + i * 450, pts: 0, ok: false });
        else resp.push({ a: js[i].aparelho, o: o, v: null, ms: 900 + i * 450, pts: ok ? 1000 - i * 18 : 0, ok: ok });
      }
    }
    var rank = js.map(function (j, i) {
      var b = 50 * (3 + (i % 4)), pq = j._pq || 0;
      return { a: j.aparelho, apelido: j.apelido, cor: j.cor, total: pq + b, quiz: pq, bonus: b, acertos: Math.round(pq / 760), respondidas: Object.keys(Demo.pontos).length };
    }).sort(function (x, y) { return y.total - x.total; }).slice(0, 12);
    rank.forEach(function (r, i) { r.pos = i + 1; });
    return { ordem: sala.quiz_ordem, tipo: q ? q.tipo : null, correta: q && q.tipo === 'multipla' ? correta : null, valor: g.valor != null ? g.valor : null,
      comentario: g.comentario || 'Gabarito de demonstração: o verdadeiro fica no banco.', fonte: g.fonte || '',
      aberta_em: sala.quiz_aberta_em, tempo: sala.quiz_tempo, revelada: sala.quiz_revelada, jogadores: nj, respostas: resp, ranking: rank,
      historico: Object.keys(Demo.pontos).map(function (o) { return { ordem: +o, n: nj - 2, ok: Math.round((nj - 2) * 0.6) }; }) };
  };

  /* ---------- silhueta para o mapa do corpo (viewBox 400 x 1000) ---------- */
  /* figura humana de frente, posição anatômica (palmas para a frente), viewBox 400x1000.
     Os pontos tocados são guardados de 0 a 1 nessa mesma caixa; os alvos abaixo seguem o desenho. */
  var ALVOS_CORPO = {
    fronte: [[200, 70]], maos: [[70, 622], [330, 622]],
    sentidos: [[180, 104], [220, 104], [140, 117], [260, 117], [200, 132], [200, 153], [70, 622], [330, 622], [163, 968], [237, 968]]
  };
  var CORPO_MIOLO = '<defs><g id="cp-formas"><path d="M200 26 C236 26 258 52 259 90 C260 112 257 130 251 146 C243 166 223 182 200 182 C177 182 157 166 149 146 C143 130 140 112 141 90 C142 52 164 26 200 26 Z"/><path d="M139 96 C135 44 165 18 200 18 C235 18 265 44 261 96 C257 79 250 66 239 59 C226 51 213 49 200 49 C187 49 174 51 161 59 C150 66 143 79 139 96 Z"/><path d="M147 100 C140 95 133 100 133 110 C133 122 138 132 148 134 Z"/><path d="M 253 100 C 260 95 267 100 267 110 C 267 122 262 132 252 134 Z"/><path d="M177 160 C178 182 176 198 172 210 L228 210 C224 198 222 182 223 160 Z"/><path d="M200 198 L176 202 C162 214 134 220 112 226 C94 231 84 246 84 266 C84 280 94 294 106 302 C110 330 112 356 116 380 C120 410 132 432 134 452 C136 476 124 500 122 522 C121 540 128 556 138 566 C160 578 186 582 200 584 C214 582 240 578 262 566 C272 556 279 540 278 522 C276 500 264 476 266 452 C268 432 280 410 284 380 C288 356 290 330 294 302 C306 294 316 280 316 266 C316 246 306 231 288 226 C266 220 238 214 224 202 L200 198 Z"/><path d="M102 234 C82 244 74 268 74 296 C73 334 71 372 70 404 C70 430 66 470 63 510 C61 532 58 550 58 566 C52 574 44 588 41 602 C39 611 46 615 51 608 C54 602 57 597 60 594 C58 612 58 634 62 652 C64 663 73 667 79 659 C85 640 89 616 88 596 C88 584 88 572 86 562 C86 530 90 480 94 440 C96 420 100 404 104 392 C108 360 112 330 112 306 C112 290 116 270 118 252 Z"/><path d="M 298 234 C 318 244 326 268 326 296 C 327 334 329 372 330 404 C 330 430 334 470 337 510 C 339 532 342 550 342 566 C 348 574 356 588 359 602 C 361 611 354 615 349 608 C 346 602 343 597 340 594 C 342 612 342 634 338 652 C 336 663 327 667 321 659 C 315 640 311 616 312 596 C 312 584 312 572 314 562 C 314 530 310 480 306 440 C 304 420 300 404 296 392 C 292 360 288 330 288 306 C 288 290 284 270 282 252 Z"/><path d="M124 512 C120 560 122 610 128 660 C132 700 138 730 140 756 C136 786 130 820 134 856 C138 890 148 912 152 926 C148 940 138 958 138 972 C138 984 148 990 160 990 C172 990 184 988 188 980 C190 970 186 950 182 930 C182 910 180 890 182 860 C184 830 186 800 184 770 C182 752 180 736 182 716 C186 670 194 620 198 584 L200 540 Z"/><path d="M 276 512 C 280 560 278 610 272 660 C 268 700 262 730 260 756 C 264 786 270 820 266 856 C 262 890 252 912 248 926 C 252 940 262 958 262 972 C 262 984 252 990 240 990 C 228 990 216 988 212 980 C 210 970 214 950 218 930 C 218 910 220 890 218 860 C 216 830 214 800 216 770 C 218 752 220 736 218 716 C 214 670 206 620 202 584 L 200 540 Z"/></g><clipPath id="cp-clip"><path d="M200 26 C236 26 258 52 259 90 C260 112 257 130 251 146 C243 166 223 182 200 182 C177 182 157 166 149 146 C143 130 140 112 141 90 C142 52 164 26 200 26 Z"/><path d="M139 96 C135 44 165 18 200 18 C235 18 265 44 261 96 C257 79 250 66 239 59 C226 51 213 49 200 49 C187 49 174 51 161 59 C150 66 143 79 139 96 Z"/><path d="M147 100 C140 95 133 100 133 110 C133 122 138 132 148 134 Z"/><path d="M 253 100 C 260 95 267 100 267 110 C 267 122 262 132 252 134 Z"/><path d="M177 160 C178 182 176 198 172 210 L228 210 C224 198 222 182 223 160 Z"/><path d="M200 198 L176 202 C162 214 134 220 112 226 C94 231 84 246 84 266 C84 280 94 294 106 302 C110 330 112 356 116 380 C120 410 132 432 134 452 C136 476 124 500 122 522 C121 540 128 556 138 566 C160 578 186 582 200 584 C214 582 240 578 262 566 C272 556 279 540 278 522 C276 500 264 476 266 452 C268 432 280 410 284 380 C288 356 290 330 294 302 C306 294 316 280 316 266 C316 246 306 231 288 226 C266 220 238 214 224 202 L200 198 Z"/><path d="M102 234 C82 244 74 268 74 296 C73 334 71 372 70 404 C70 430 66 470 63 510 C61 532 58 550 58 566 C52 574 44 588 41 602 C39 611 46 615 51 608 C54 602 57 597 60 594 C58 612 58 634 62 652 C64 663 73 667 79 659 C85 640 89 616 88 596 C88 584 88 572 86 562 C86 530 90 480 94 440 C96 420 100 404 104 392 C108 360 112 330 112 306 C112 290 116 270 118 252 Z"/><path d="M 298 234 C 318 244 326 268 326 296 C 327 334 329 372 330 404 C 330 430 334 470 337 510 C 339 532 342 550 342 566 C 348 574 356 588 359 602 C 361 611 354 615 349 608 C 346 602 343 597 340 594 C 342 612 342 634 338 652 C 336 663 327 667 321 659 C 315 640 311 616 312 596 C 312 584 312 572 314 562 C 314 530 310 480 306 440 C 304 420 300 404 296 392 C 292 360 288 330 288 306 C 288 290 284 270 282 252 Z"/><path d="M124 512 C120 560 122 610 128 660 C132 700 138 730 140 756 C136 786 130 820 134 856 C138 890 148 912 152 926 C148 940 138 958 138 972 C138 984 148 990 160 990 C172 990 184 988 188 980 C190 970 186 950 182 930 C182 910 180 890 182 860 C184 830 186 800 184 770 C182 752 180 736 182 716 C186 670 194 620 198 584 L200 540 Z"/><path d="M 276 512 C 280 560 278 610 272 660 C 268 700 262 730 260 756 C 264 786 270 820 266 856 C 262 890 252 912 248 926 C 252 940 262 958 262 972 C 262 984 252 990 240 990 C 228 990 216 988 212 980 C 210 970 214 950 218 930 C 218 910 220 890 218 860 C 216 830 214 800 216 770 C 218 752 220 736 218 716 C 214 670 206 620 202 584 L 200 540 Z"/></clipPath><mask id="cp-fora" maskUnits="userSpaceOnUse" x="-20" y="-20" width="440" height="1040"><rect x="-20" y="-20" width="440" height="1040" fill="#fff"/><use href="#cp-formas" fill="#000"/></mask><radialGradient id="cp-luz" cx=".5" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".6" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><g opacity=".16"><use href="#cp-formas" fill="#FFF4E8"/></g><rect width="400" height="1000" fill="url(#cp-luz)" clip-path="url(#cp-clip)"/><g mask="url(#cp-fora)"><use href="#cp-formas" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="5.5" stroke-linejoin="round"/></g><g clip-path="url(#cp-clip)" fill="none" stroke="#fff" stroke-opacity=".32" stroke-width="1.7" stroke-linecap="round"><path d="M176 214 C160 223 138 226 120 231"/><path d="M 224 214 C 240 223 262 226 280 231"/><path d="M128 334 C146 352 176 354 196 342"/><path d="M 272 334 C 254 352 224 354 204 342"/><path d="M200 246 L200 334"/><path d="M200 372 L200 520"/><path d="M140 520 C160 540 182 556 196 568"/><path d="M 260 520 C 240 540 218 556 204 568"/><path d="M150 742 C156 752 168 752 174 742"/><path d="M 250 742 C 244 752 232 752 226 742"/><path d="M86 424 C90 430 96 430 100 426"/><path d="M 314 424 C 310 430 304 430 300 426"/><path d="M66 624 L67 652"/><path d="M 334 624 L 333 652"/><path d="M73 626 L74 656"/><path d="M 327 626 L 326 656"/><path d="M80 624 L80 650"/><path d="M 320 624 L 320 650"/><path d="M150 976 L150 988"/><path d="M 250 976 L 250 988"/><path d="M160 978 L160 990"/><path d="M 240 978 L 240 990"/><path d="M171 978 L171 989"/><path d="M 229 978 L 229 989"/><path d="M150 930 C156 934 170 934 180 930"/><path d="M 250 930 C 244 934 230 934 220 930"/><ellipse cx="200" cy="448" rx="3.2" ry="4.5" fill="none"/></g><path d="M139 96 C135 44 165 18 200 18 C235 18 265 44 261 96 C257 79 250 66 239 59 C226 51 213 49 200 49 C187 49 174 51 161 59 C150 66 143 79 139 96 Z" fill="#5E1617" fill-opacity=".6"/><path d="M142 106 C138 112 139 122 144 127" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/><path d="M 258 106 C 262 112 261 122 256 127" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/><path d="M165 91 C171 85 184 84 193 89" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="3.2" stroke-linecap="round"/><path d="M 235 91 C 229 85 216 84 207 89" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="3.2" stroke-linecap="round"/><path d="M167 105 C173 97 187 97 193 105 C187 111 173 111 167 105 Z" fill="#FFF8EE" fill-opacity=".95"/><path d="M 233 105 C 227 97 213 97 207 105 C 213 111 227 111 233 105 Z" fill="#FFF8EE" fill-opacity=".95"/><circle fill="#5E1617" cx="180" cy="104.5" r="4.6"/><circle fill="#5E1617" cx="220" cy="104.5" r="4.6"/><circle fill="#fff" cx="181.6" cy="102.8" r="1.4"/><circle fill="#fff" cx="221.6" cy="102.8" r="1.4"/><path d="M166 104 C173 95 187 95 194 104" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1.8" stroke-linecap="round"/><path d="M 234 104 C 227 95 213 95 206 104" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1.8" stroke-linecap="round"/><path d="M195 113 C194 121 192 126 189 130 C187 135 190 138 194 136" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="1.8" stroke-linecap="round"/><path d="M 205 113 C 206 121 208 126 211 130 C 213 135 210 138 206 136" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="1.8" stroke-linecap="round"/><path d="M194 136 C197 139 203 139 206 136" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="1.8" stroke-linecap="round"/><path d="M183 152 C189 147 195 148 200 150 C205 148 211 147 217 152 C210 155 190 155 183 152 Z" fill="#EFA9A0" fill-opacity=".9"/><path d="M185 153 C191 161 209 161 215 153 C207 155 193 155 185 153 Z" fill="#EFA9A0" fill-opacity=".9"/><path d="M183 152 C192 155 208 155 217 152" fill="none" stroke="#8E2526" stroke-opacity=".75" stroke-width="1.4" stroke-linecap="round"/>';
  function corpoSVG(extra, cls) {
    return '<svg class="corpo ' + (cls || '') + '" viewBox="0 0 400 1000" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Figura de uma pessoa de frente, com rosto, mãos e pés">' +
      '<defs><radialGradient id="calor"><stop offset="0" stop-color="#F8D94A" stop-opacity=".75"/><stop offset=".55" stop-color="#F2A652" stop-opacity=".35"/><stop offset="1" stop-color="#F2A652" stop-opacity="0"/></radialGradient></defs>' +
      CORPO_MIOLO + (extra || '') + '</svg>';
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
