// Marca do Narrador Católico: quatro conceitos de símbolo (microfone de podcast + auréola) e o logotipo.
// Tudo em vetor (SVG): serve de avatar, marca-d'água e cartão final sem perder nitidez.
import React from "react";
import { LEGENDA, SERIFA } from "../lib/fontes";

export type Conceito = "classico" | "vitral" | "estola" | "traco";

export const OURO = "#E9B949";
export const OURO_CLARO = "#F7DB8A";
export const OURO_ESCURO = "#9C7420";
export const CREME = "#F6EBD3";
export const NOITE = "#14111C";

/** Defs comuns (gradientes e brilho). `id` evita colisão quando vários símbolos estão na mesma página. */
const Defs: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <linearGradient id={`${id}-ouro`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={OURO_CLARO} />
      <stop offset="0.5" stopColor={OURO} />
      <stop offset="1" stopColor={OURO_ESCURO} />
    </linearGradient>
    <linearGradient id={`${id}-corpo`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#2A2633" />
      <stop offset="0.45" stopColor="#4A4556" />
      <stop offset="1" stopColor="#1C1924" />
    </linearGradient>
    <radialGradient id={`${id}-luz`} cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor={OURO_CLARO} stopOpacity="0.55" />
      <stop offset="1" stopColor={OURO} stopOpacity="0" />
    </radialGradient>
    <filter id={`${id}-brilho`} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <pattern id={`${id}-grade`} width="9" height="9" patternUnits="userSpaceOnUse">
      <circle cx="4.5" cy="4.5" r="2.1" fill="#8D8799" />
    </pattern>
  </defs>
);

/** Auréola: anel elíptico de luz acima da cabeça do microfone. */
const Aureola: React.FC<{ id: string; cx: number; cy: number; rx: number; ry: number; espessura?: number }> = ({ id, cx, cy, rx, ry, espessura = 9 }) => (
  <g filter={`url(#${id}-brilho)`}>
    <ellipse cx={cx} cy={cy} rx={rx * 1.35} ry={ry * 2.6} fill={`url(#${id}-luz)`} />
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={`url(#${id}-ouro)`} strokeWidth={espessura} />
  </g>
);

/** Suporte em U (shock mount), haste e base: comum aos conceitos frontais. */
const Suporte: React.FC<{ id: string; cor?: string }> = ({ id, cor }) => {
  const c = cor ?? `url(#${id}-ouro)`;
  return (
    <g fill="none" stroke={c} strokeLinecap="round">
      <path d="M 126 196 L 126 236 C 126 282 160 304 200 304 C 240 304 274 282 274 236 L 274 196" strokeWidth={11} />
      <circle cx={126} cy={196} r={9} fill={c} stroke="none" />
      <circle cx={274} cy={196} r={9} fill={c} stroke="none" />
      <path d="M 200 304 L 200 338" strokeWidth={12} />
      <path d="M 158 346 L 242 346" strokeWidth={14} />
    </g>
  );
};

/** A · Clássico: microfone condensador com grade; a grade deixa uma cruz em vazio; auréola dourada. */
const Classico: React.FC<{ id: string }> = ({ id }) => (
  <g>
    <Aureola id={id} cx={200} cy={46} rx={68} ry={15} />
    <rect x={140} y={70} width={120} height={206} rx={60} fill={`url(#${id}-corpo)`} />
    <clipPath id={`${id}-cap`}>
      <rect x={148} y={78} width={104} height={190} rx={52} />
    </clipPath>
    <g clipPath={`url(#${id}-cap)`}>
      <rect x={140} y={70} width={120} height={206} fill={`url(#${id}-grade)`} />
      {/* cruz em vazio na grade */}
      <rect x={194} y={86} width={12} height={150} fill="#24202C" />
      <rect x={162} y={124} width={76} height={12} fill="#24202C" />
    </g>
    <rect x={140} y={70} width={120} height={206} rx={60} fill="none" stroke={`url(#${id}-ouro)`} strokeWidth={6} />
    <rect x={138} y={186} width={124} height={12} rx={6} fill={`url(#${id}-ouro)`} />
    <Suporte id={id} />
  </g>
);

/** B · Vitral: a cabeça do microfone é uma janela gótica em mosaico de losangos, com as cinco cores litúrgicas. */
const PALETA_VITRAL = ["#2E7D32", "#5E2B7E", "#F4EFE2", "#B71C1C", "#E78FB3", "#E9B949", "#3D8FB8"];
const Vitral: React.FC<{ id: string }> = ({ id }) => {
  const forma = "M 140 276 L 140 150 C 140 112 162 84 200 62 C 238 84 260 112 260 150 L 260 276 Z";
  const passo = 26;
  const pecas: React.ReactNode[] = [];
  for (let j = 0; j < 10; j++) {
    for (let i = -1; i < 7; i++) {
      const cx = 140 + i * passo + (j % 2 ? passo / 2 : 0);
      const cy = 60 + j * (passo / 2);
      const cor = PALETA_VITRAL[(i * 3 + j * 5 + 70) % PALETA_VITRAL.length];
      pecas.push(<polygon key={`${i}-${j}`} points={`${cx},${cy - passo / 2} ${cx + passo / 2},${cy} ${cx},${cy + passo / 2} ${cx - passo / 2},${cy}`} fill={cor} stroke={NOITE} strokeWidth={3.2} strokeLinejoin="round" />);
    }
  }
  return (
    <g>
      <Aureola id={id} cx={200} cy={36} rx={66} ry={14} />
      <clipPath id={`${id}-janela`}>
        <path d={forma} />
      </clipPath>
      <g clipPath={`url(#${id}-janela)`}>
        <rect x={136} y={56} width={130} height={226} fill={NOITE} />
        {pecas}
        <rect x={136} y={56} width={130} height={226} fill={`url(#${id}-vidro)`} />
        {/* cruz de chumbo dourado no centro do vitral */}
        <path d="M 200 92 L 200 172 M 176 118 L 224 118" stroke={NOITE} strokeWidth={13} strokeLinecap="round" />
        <path d="M 200 92 L 200 172 M 176 118 L 224 118" stroke={OURO_CLARO} strokeWidth={6} strokeLinecap="round" />
      </g>
      <path d={forma} fill="none" stroke={`url(#${id}-ouro)`} strokeWidth={7} strokeLinejoin="round" />
      <rect x={136} y={186} width={128} height={12} rx={6} fill={`url(#${id}-ouro)`} />
      <Suporte id={id} />
      <defs>
        <linearGradient id={`${id}-vidro`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.25" />
        </linearGradient>
      </defs>
    </g>
  );
};

export const CORES_ESTOLA: Record<string, string> = { verde: "#2E7D32", roxo: "#5E2B7E", branco: "#F4EFE2", vermelho: "#B71C1C", rosa: "#E78FB3" };

/** C · Estola: o microfone veste uma estola, cuja cor acompanha o tempo litúrgico do episódio. */
const Estola: React.FC<{ id: string; cor: string }> = ({ id, cor }) => {
  const sombra = "rgba(0,0,0,0.28)";
  const faixa = (lado: 1 | -1) => {
    const x0 = 200 + lado * 46;
    const pts = lado === 1
      ? `${x0 - 6},190 ${x0 + 24},190 ${x0 + 40},356 ${x0 + 6},356`
      : `${x0 + 6},190 ${x0 - 24},190 ${x0 - 40},356 ${x0 - 6},356`;
    const cx = x0 + lado * 23;
    return (
      <g>
        <polygon points={pts} fill={cor} stroke={`url(#${id}-ouro)`} strokeWidth={4} strokeLinejoin="round" />
        <polygon points={pts} fill={`url(#${id}-dobra)`} />
        <path d={`M ${cx} 306 L ${cx} 336 M ${cx - 10} 316 L ${cx + 10} 316`} stroke={`url(#${id}-ouro)`} strokeWidth={5} strokeLinecap="round" />
        {[0, 1, 2, 3, 4, 5].map((k) => {
          const xa = lado === 1 ? x0 + 6 + k * 6.8 : x0 - 6 - k * 6.8;
          return <line key={k} x1={xa} y1={357} x2={xa} y2={370} stroke={`url(#${id}-ouro)`} strokeWidth={3} strokeLinecap="round" />;
        })}
      </g>
    );
  };
  return (
    <g>
      <Aureola id={id} cx={200} cy={40} rx={66} ry={14} />
      <rect x={146} y={64} width={108} height={186} rx={54} fill={`url(#${id}-corpo)`} />
      <clipPath id={`${id}-cap`}>
        <rect x={154} y={72} width={92} height={170} rx={46} />
      </clipPath>
      <rect x={146} y={64} width={108} height={186} fill={`url(#${id}-grade)`} clipPath={`url(#${id}-cap)`} />
      <rect x={146} y={64} width={108} height={186} rx={54} fill="none" stroke={`url(#${id}-ouro)`} strokeWidth={6} />
      {/* haste e base atrás da estola */}
      <g stroke={`url(#${id}-ouro)`} strokeLinecap="round">
        <path d="M 200 250 L 200 350" strokeWidth={12} />
        <path d="M 168 352 L 232 352" strokeWidth={14} />
      </g>
      {faixa(-1)}
      {faixa(1)}
      {/* gola: a estola passa por trás da cabeça e cruza a frente na altura do anel */}
      <path d="M 146 194 C 170 214 230 214 254 194 L 254 180 C 230 200 170 200 146 180 Z" fill={cor} stroke={`url(#${id}-ouro)`} strokeWidth={4} strokeLinejoin="round" />
      <path d="M 146 194 C 170 214 230 214 254 194" fill="none" stroke={sombra} strokeWidth={3} />
      <defs>
        <linearGradient id={`${id}-dobra`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.25" />
          <stop offset="0.5" stopColor="#FFF" stopOpacity="0.12" />
          <stop offset="1" stopColor="#000" stopOpacity="0.25" />
        </linearGradient>
      </defs>
    </g>
  );
};

/** D · Traço (marca oficial): microfone de podcast em linha, cruz latina na cápsula e auréola. Uma cor só.
 * A mesma geometria está em marca/simbolo.svg (mantenha os dois iguais). */
export const TRACO = {
  aureola: { cx: 200, cy: 44, rx: 62, ry: 13 },
  capsula: { x: 146, y: 78, w: 108, h: 196 },
  cruz: "M 200 110 L 200 238 M 174 150 L 226 150",
  suporte: "M 126 198 L 126 236 C 126 282 160 304 200 304 C 240 304 274 282 274 236 L 274 198",
  haste: "M 200 304 L 200 340",
  base: "M 160 346 L 240 346",
  traco: 12,
};
const Traco: React.FC<{ id: string; cor?: string; brilho?: boolean }> = ({ id, cor = OURO, brilho }) => {
  const T = TRACO;
  return (
    <g fill="none" stroke={cor} strokeLinecap="round" strokeLinejoin="round" strokeWidth={T.traco}>
      <g filter={brilho ? `url(#${id}-brilho)` : undefined}>
        <ellipse cx={T.aureola.cx} cy={T.aureola.cy} rx={T.aureola.rx} ry={T.aureola.ry} strokeWidth={T.traco - 1} />
      </g>
      <rect x={T.capsula.x} y={T.capsula.y} width={T.capsula.w} height={T.capsula.h} rx={T.capsula.w / 2} />
      <path d={T.cruz} />
      <path d={T.suporte} />
      <circle cx={126} cy={198} r={8} fill={cor} stroke="none" />
      <circle cx={274} cy={198} r={8} fill={cor} stroke="none" />
      <path d={T.haste} />
      <path d={T.base} strokeWidth={T.traco + 2} />
    </g>
  );
};

export const CONCEITO_OFICIAL: Conceito = "traco";

export const Simbolo: React.FC<{ conceito: Conceito; tamanho: number; id: string; corTraco?: string; corEstola?: string; brilho?: boolean }> = ({ conceito, tamanho, id, corTraco, corEstola = CORES_ESTOLA.verde, brilho }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 400 400" style={{ overflow: "visible" }}>
    <Defs id={id} />
    {conceito === "classico" && <Classico id={id} />}
    {conceito === "vitral" && <Vitral id={id} />}
    {conceito === "estola" && <Estola id={id} cor={corEstola} />}
    {conceito === "traco" && <Traco id={id} cor={corTraco} brilho={brilho} />}
  </svg>
);

/** Logotipo horizontal: símbolo à esquerda, NARRADOR / CATÓLICO à direita. */
export const LogoHorizontal: React.FC<{ conceito: Conceito; altura: number; id: string; claro?: boolean }> = ({ conceito, altura, id, claro }) => (
  <div style={{ display: "flex", alignItems: "center", gap: altura * 0.08 }}>
    <Simbolo conceito={conceito} tamanho={altura} id={id} corTraco={claro ? OURO_ESCURO : OURO} />
    <div style={{ fontFamily: SERIFA, fontWeight: 700, lineHeight: 1.02 }}>
      <div style={{ fontSize: altura * 0.3, letterSpacing: "0.12em", color: claro ? NOITE : CREME }}>NARRADOR</div>
      <div style={{ fontSize: altura * 0.3, letterSpacing: "0.12em", color: claro ? OURO_ESCURO : OURO }}>CATÓLICO</div>
    </div>
  </div>
);

/** Logotipo empilhado (cartão final): símbolo em cima, nome embaixo e uma linha opcional (ex.: SIGA @...). */
export const LogoEmpilhado: React.FC<{ conceito?: Conceito; largura: number; id: string; linha?: string; claro?: boolean; brilho?: boolean }> = ({
  conceito = CONCEITO_OFICIAL,
  largura,
  id,
  linha,
  claro,
  brilho,
}) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <Simbolo conceito={conceito} tamanho={largura * 0.56} id={id} corTraco={claro ? OURO_ESCURO : OURO} brilho={brilho} />
    <div style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: largura * 0.1, letterSpacing: "0.14em", color: claro ? NOITE : CREME, marginTop: largura * 0.03, whiteSpace: "nowrap", lineHeight: 1.08, textAlign: "center", paddingLeft: "0.14em" }}>
      NARRADOR
      <br />
      <span style={{ color: claro ? OURO_ESCURO : OURO }}>CATÓLICO</span>
    </div>
    {linha && (
      <div style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: largura * 0.055, color: claro ? OURO_ESCURO : OURO_CLARO, letterSpacing: "0.08em", marginTop: largura * 0.035 }}>
        {linha}
      </div>
    )}
  </div>
);
