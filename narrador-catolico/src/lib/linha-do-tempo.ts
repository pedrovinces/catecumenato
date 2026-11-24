// Converte roteiro + tempos das palavras em quadros. Remotion, mixagem e SRT leem este mesmo resultado.
import { Roteiro, Timestamps, type RoteiroT, type TimestampsT, type CenaT } from "./esquema";
import { acharFrase, textoLegenda, tokenizar, type Token } from "./tokens";
import type { NomeCor } from "./paleta";

export const FPS = 30;
export const LARGURA = 1080;
export const ALTURA = 1920;

const PRE_ROLL = 0.3; // a cena entra 0,3 s antes da primeira palavra
const CAUDA_PADRAO = 0.25; // imagem que sobra depois da última palavra da cena
const CAUDA_FINAL = 1.0;
const INTERVALO_PADRAO = 0.55;
const CONGELA_MIN = 0.8;
const CONGELA_MAX = 1.5;
const CONGELA_PADRAO = 1.2;

export type Janela = { inicio: number; fim: number };
export type PalavraQ = { texto: string; inicio: number; fim: number };
export type TextoQ = {
  conteudo: string;
  entrada: "pop" | "desliza" | "carimbo" | "impacto" | "fade";
  posicao: "titulo" | "subtitulo" | "carimbo" | "letreiro" | "assinatura";
  inicio: number;
  fim: number;
};
export type CenaQ = {
  id: string;
  tipo: string;
  cor: NomeCor;
  inicio: number; // quadro absoluto
  fim: number;
  duracao: number;
  selo: { cor: string; tempo: string } | null;
  wipe: boolean;
  eventos: Record<string, number[]>; // quadros relativos à cena
  congelas: Janela[]; // relativos
  textos: TextoQ[]; // relativos
  palavras: PalavraQ[]; // relativos
  quadro?: unknown;
};
export type GrupoLegenda = { inicio: number; fim: number; cor: NomeCor; palavras: PalavraQ[] }; // absolutos
export type SfxQ = { arquivo: string; quadro: number; volume: number; cena: string };
export type SegmentoNarracao = { origemIni: number; origemFim: number; destino: number }; // segundos

export type Linha = {
  codigo: string;
  titulo: string;
  handle: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  destaque: "exata" | "clara";
  fonteTempos: string;
  narracao: { arquivo: string; segmentos: SegmentoNarracao[] };
  trilha: string | null;
  cenas: CenaQ[];
  legendas: GrupoLegenda[];
  sfx: SfxQ[];
  fala: Janela[]; // quadros absolutos com voz
  trilhaMuda: Janela[]; // quadros absolutos (congelamentos)
  avisos: string[];
};

const q = (s: number) => Math.round(s * FPS);

class ErroRoteiro extends Error {}

const FRACAS = new Set(
  "o a os as um uma uns umas de do da dos das em no na nos nas por pelo pela para pra que e ou se mais com ao aos nem sua seu suas seus".split(" "),
);
const normalizarSimples = (s: string) => s.toLowerCase().replace(/[^a-zà-ÿ]/g, "");

const agrupar = (tokens: Token[], min: number, max: number): number[][] => {
  const frases: number[][] = [];
  let atual: number[] = [];
  tokens.forEach((t, i) => {
    atual.push(i);
    if (t.pausa > 0 || /[.?!:;]$/.test(t.texto) || i === tokens.length - 1) {
      frases.push(atual);
      atual = [];
    }
  });
  // dentro de cada frase, partição ótima: grupos de min a max palavras, perto de 3,
  // sem terminar em artigo/preposição/conjunção, preferindo quebrar depois de vírgula
  const custoFim = (t: Token) => (/,$/.test(t.texto) ? -2 : FRACAS.has(normalizarSimples(t.texto)) ? 5 : 0);
  const grupos: number[][] = [];
  for (const f of frases) {
    if (f.length <= max) {
      grupos.push(f);
      continue;
    }
    const n = f.length;
    const melhor: number[] = Array(n + 1).fill(Infinity);
    const de: number[] = Array(n + 1).fill(-1);
    melhor[0] = 0;
    for (let i = 1; i <= n; i++) {
      for (let s = min; s <= max && s <= i; s++) {
        if (melhor[i - s] === Infinity) continue;
        const c = melhor[i - s] + (s - 3) ** 2 + (i < n ? custoFim(tokens[f[i - 1]]) : 0);
        if (c < melhor[i]) {
          melhor[i] = c;
          de[i] = i - s;
        }
      }
    }
    const cortes: number[] = [];
    for (let i = n; i > 0; i = de[i]) cortes.unshift(i);
    let ini = 0;
    for (const c of cortes) {
      grupos.push(f.slice(ini, c));
      ini = c;
    }
  }
  return grupos;
};

export const resolverLinha = (roteiroBruto: unknown, tsBruto: unknown, opcoes: { narracaoReal?: boolean } = {}): Linha => {
  const roteiro: RoteiroT = Roteiro.parse(roteiroBruto);
  const ts: TimestampsT = Timestamps.parse(tsBruto);
  const avisos: string[] = [];

  const todas = roteiro.cenas;
  const ativas = todas.filter((c) => c.ativa);

  // 1. posição de cada cena no tempo final (pode inserir silêncio entre cenas: "cauda")
  type Plano = { cena: CenaT; tokens: Token[]; inicioOrig: number; fimOrig: number; T: number; S: number; palavrasOrig: TimestampsT["palavras"] };
  const planos: Plano[] = [];
  for (const cena of ativas) {
    const tc = ts.cenas.find((c) => c.id === cena.id);
    if (!tc) throw new ErroRoteiro(`cena "${cena.id}": não há tempos para ela em ${roteiro.codigo}-timestamps.json`);
    const tokens = tokenizar(cena.locucao);
    const palavrasOrig = ts.palavras.filter((p) => p.cena === cena.id).sort((a, b) => a.i - b.i);
    if (palavrasOrig.length !== tokens.length)
      throw new ErroRoteiro(
        `cena "${cena.id}": o roteiro tem ${tokens.length} palavras e os tempos têm ${palavrasOrig.length}; gere os tempos de novo`,
      );
    planos.push({ cena, tokens, inicioOrig: tc.inicio, fimOrig: tc.fim, T: 0, S: 0, palavrasOrig });
  }
  planos.forEach((p, k) => {
    if (k === 0) {
      p.T = p.inicioOrig;
      p.S = 0;
      return;
    }
    const a = planos[k - 1];
    const idxA = todas.indexOf(a.cena);
    const adjacentes = todas.indexOf(p.cena) === idxA + 1;
    const natural = adjacentes ? p.inicioOrig - a.fimOrig : INTERVALO_PADRAO;
    const preciso = (a.cena.cauda ?? CAUDA_PADRAO) + PRE_ROLL;
    p.T = a.T + (a.fimOrig - a.inicioOrig) + Math.max(natural, preciso);
    p.S = p.T - PRE_ROLL;
  });
  const ultimo = planos[planos.length - 1];
  const fimTotal = ultimo.T + (ultimo.fimOrig - ultimo.inicioOrig) + (ultimo.cena.cauda ?? CAUDA_FINAL);
  const duracao = q(fimTotal);

  // trechos da narração original que tocam e onde
  const segmentos: SegmentoNarracao[] = planos.map((p, k) => {
    const idx = todas.indexOf(p.cena);
    const antOrig = idx > 0 ? ts.cenas.find((c) => c.id === todas[idx - 1].id) : undefined;
    const proxOrig = idx < todas.length - 1 ? ts.cenas.find((c) => c.id === todas[idx + 1].id) : undefined;
    const origemIni = k === 0 && idx === 0 ? 0 : Math.max(antOrig ? (antOrig.fim + p.inicioOrig) / 2 : 0, p.inicioOrig - 0.3);
    const origemFim = Math.min(proxOrig ? (p.fimOrig + proxOrig.inicio) / 2 : ts.duracao, p.fimOrig + 0.4);
    return { origemIni, origemFim, destino: p.T + (origemIni - p.inicioOrig) };
  });

  // 2. cenas em quadros
  const cenas: CenaQ[] = [];
  const legendas: GrupoLegenda[] = [];
  const sfx: SfxQ[] = [];
  const falaAbs: Janela[] = [];

  planos.forEach((p, k) => {
    const { cena, tokens } = p;
    const inicio = q(p.S);
    const fim = k < planos.length - 1 ? q(planos[k + 1].S) : duracao;
    const absDe = (s: number) => q(p.T + (s - p.inicioOrig));
    const palavrasAbs = p.palavrasOrig.map((w, i) => ({ texto: tokens[i].texto, inicio: absDe(w.inicio), fim: Math.max(absDe(w.fim), absDe(w.inicio) + 2) }));
    const rel = (abs: number) => abs - inicio;
    const ondeFrase = (frase: string, ocorr?: number, campo = "palavra") => {
      const i = acharFrase(tokens, frase, ocorr ?? 1);
      if (i < 0) throw new ErroRoteiro(`cena "${cena.id}", ${campo} "${frase}": não aparece na locução`);
      return i;
    };
    const inicioDaFrase = (frase: string, ocorr?: number, campo?: string) => palavrasAbs[ondeFrase(frase, ocorr, campo)].inicio;

    const eventos: Record<string, number[]> = {};
    const congelas: Janela[] = [];
    for (const g of cena.gatilhos) {
      const f = rel(inicioDaFrase(g.palavra, g.ocorrencia)) + (g.deslocamento ?? 0);
      (eventos[g.evento] ??= []).push(f);
      if (g.evento === "congela") {
        let fimC = g.ate ? rel(inicioDaFrase(g.ate, undefined, "ate")) : f + q(g.duracao ?? CONGELA_PADRAO);
        if (!g.semLimite) {
          const dur = Math.min(Math.max(fimC - f, q(CONGELA_MIN)), q(CONGELA_MAX));
          if (dur !== fimC - f) avisos.push(`cena "${cena.id}": congelamento ajustado para ${(dur / FPS).toFixed(2)} s (faixa 0,8 a 1,5 s)`);
          fimC = f + dur;
        }
        congelas.push({ inicio: f, fim: Math.min(fimC, fim - inicio) });
      }
    }
    for (const lista of Object.values(eventos)) lista.sort((a, b) => a - b);

    const textos: TextoQ[] = cena.textos.map((t) => {
      const ini =
        t.inicio !== undefined
          ? q(t.inicio)
          : t.palavra
            ? rel(inicioDaFrase(t.palavra, t.ocorrencia, "texto.palavra")) + (t.deslocamento ?? 0)
            : 0;
      const f = t.ate
        ? rel(inicioDaFrase(t.ate, undefined, "texto.ate"))
        : t.duracao
          ? ini + q(t.duracao)
          : fim - inicio;
      return { conteudo: t.conteudo, entrada: t.entrada, posicao: t.posicao, inicio: ini, fim: Math.max(f, ini + 6) };
    });

    for (const s of cena.sfx) {
      let base: number;
      if (s.gatilho) base = inicioDaFrase(s.gatilho, s.ocorrencia, "sfx.gatilho");
      else if (s.evento) {
        const e = eventos[s.evento]?.[0];
        if (e === undefined) throw new ErroRoteiro(`cena "${cena.id}", sfx "${s.arquivo}": evento "${s.evento}" não existe`);
        base = inicio + e;
      } else base = inicio + q(s.inicio ?? 0);
      base += s.deslocamento ?? 0;
      const vol = s.volume ?? 0;
      if (s.repetir) {
        const ate = inicioDaFrase(s.repetir.ate, undefined, "sfx.repetir.ate");
        for (let f = base; f < ate; f += s.repetir.intervalo) sfx.push({ arquivo: s.arquivo, quadro: f, volume: vol, cena: cena.id });
      } else sfx.push({ arquivo: s.arquivo, quadro: base, volume: vol, cena: cena.id });
    }
    // todo congelamento leva record scratch, a não ser que já exista um no mesmo instante
    for (const c of congelas) {
      const abs = inicio + c.inicio;
      if (!sfx.some((s) => s.arquivo === "record-scratch" && Math.abs(s.quadro - abs) <= 3))
        sfx.push({ arquivo: "record-scratch", quadro: abs, volume: 0, cena: cena.id });
    }

    // legendas
    for (const grupo of agrupar(tokens, roteiro.legenda.minPalavras, roteiro.legenda.maxPalavras)) {
      const ps = grupo.map((i) => ({ ...palavrasAbs[i], texto: textoLegenda(tokens[i].texto) }));
      legendas.push({ inicio: ps[0].inicio, fim: ps[ps.length - 1].fim, cor: cena.cor, palavras: ps });
    }
    for (const w of palavrasAbs) falaAbs.push({ inicio: w.inicio, fim: w.fim });

    const corAnterior = k > 0 ? planos[k - 1].cena.cor : null;
    cenas.push({
      id: cena.id,
      tipo: cena.tipo ?? cena.id,
      cor: cena.cor,
      inicio,
      fim,
      duracao: fim - inicio,
      selo: cena.selo ?? null,
      wipe: cena.wipe ?? (corAnterior !== null && corAnterior !== cena.cor),
      eventos,
      congelas,
      textos,
      palavras: palavrasAbs.map((w) => ({ texto: w.texto, inicio: rel(w.inicio), fim: rel(w.fim) })),
      quadro: cena.quadro,
    });
  });

  // legenda fica até o próximo grupo se o intervalo for curto; some nas pausas longas
  legendas.forEach((g, i) => {
    const prox = legendas[i + 1];
    const folga = q(0.35);
    g.fim = prox && prox.inicio - g.fim <= folga ? prox.inicio : g.fim + Math.min(folga, prox ? prox.inicio - g.fim : folga);
  });

  // trechos com voz (para ducking e para a regra dos efeitos 10 dB abaixo)
  falaAbs.sort((a, b) => a.inicio - b.inicio);
  const fala: Janela[] = [];
  for (const w of falaAbs) {
    const u = fala[fala.length - 1];
    if (u && w.inicio - u.fim <= q(0.25)) u.fim = Math.max(u.fim, w.fim);
    else fala.push({ ...w });
  }

  const trilhaMuda = cenas.flatMap((c) => c.congelas.map((j) => ({ inicio: c.inicio + j.inicio, fim: c.inicio + j.fim })));

  sfx.sort((a, b) => a.quadro - b.quadro);
  if (fimTotal < 80 || fimTotal > 100) avisos.push(`duração ${fimTotal.toFixed(1)} s fora da faixa 80 a 100 s`);

  return {
    codigo: roteiro.codigo,
    titulo: roteiro.titulo,
    handle: roteiro.handle,
    fps: FPS,
    largura: LARGURA,
    altura: ALTURA,
    duracao,
    destaque: roteiro.legenda.destaque,
    fonteTempos: ts.fonte,
    narracao: { arquivo: opcoes.narracaoReal === false || ts.fonte === "guia-espeak" ? roteiro.audio.guia ?? roteiro.audio.narracao : roteiro.audio.narracao, segmentos },
    trilha: roteiro.audio.trilha ?? null,
    cenas,
    legendas,
    sfx,
    fala,
    trilhaMuda,
    avisos,
  };
};
