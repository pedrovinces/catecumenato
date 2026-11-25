// Revelação da marca no fim do episódio, sincronizada com a vinheta "Amém" (4,8 s, acorde sustentado):
//   0,15 s       primeira nota: a tela escurece e a auréola acende
//   0,45 a 1,6 s entra o grave: cápsula, cruz (com brilho), suporte e base desenhados a traço de ouro
//   1,6 a 2,6 s  ápice do "mém": NARRADOR e CATÓLICO surgem letra a letra
//   2,6 s a fim  o acorde se desfaz: a auréola pulsa, um brilho atravessa o nome, entra a chamada
// `d` é o quadro desde o início da vinheta (pode ser negativo: a tela começa a escurecer antes).
import React from "react";
import { AbsoluteFill, Easing, interpolate, random } from "remotion";
import { LEGENDA, SERIFA } from "../lib/fontes";
import { CREME, OURO, OURO_CLARO, TRACO } from "./Marca";

const FPS = 30;
const c = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const s = (seg: number) => seg * FPS;
/** progresso 0..1 entre dois instantes (em segundos da vinheta) */
const prog = (d: number, a: number, b: number, easing = Easing.inOut(Easing.cubic)) => interpolate(d, [s(a), s(b)], [0, 1], { ...c, easing });

const Poeira: React.FC<{ d: number; opacidade: number }> = ({ d, opacidade }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: opacidade }}>
    {Array.from({ length: 46 }).map((_, i) => {
      const x = random(`px${i}`) * 1080;
      const y0 = 300 + random(`py${i}`) * 1300;
      const vel = 0.25 + random(`pv${i}`) * 0.6;
      const r = 1.2 + random(`pr${i}`) * 2.6;
      const brilho = 0.35 + 0.65 * Math.abs(Math.sin(d / (9 + random(`pt${i}`) * 14) + i));
      return <circle key={i} cx={x + Math.sin(d / 40 + i) * 12} cy={y0 - d * vel} r={r} fill={OURO_CLARO} opacity={brilho * 0.8} />;
    })}
  </svg>
);

/** Letras que surgem uma a uma, subindo e fechando o espaçamento. */
const Palavra: React.FC<{ texto: string; d: number; inicio: number; fim: number; cor: string; tamanho: number; brilhoX?: number }> = ({ texto, d, inicio, fim, cor, tamanho, brilhoX }) => {
  const letras = [...texto];
  const passo = (fim - inicio) / letras.length;
  return (
    <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
      {letras.map((l, i) => {
        const p = prog(d, inicio + i * passo, inicio + i * passo + 0.32, Easing.out(Easing.cubic));
        return (
          <span
            key={i}
            style={{
              fontFamily: SERIFA,
              fontWeight: 700,
              fontSize: tamanho,
              letterSpacing: `${0.14 + (1 - p) * 0.2}em`,
              display: "inline-block",
              opacity: p,
              transform: `translateY(${(1 - p) * 26}px)`,
              color: cor,
              backgroundImage: brilhoX !== undefined ? `linear-gradient(100deg, ${cor} ${brilhoX - 12}%, #FFF8E0 ${brilhoX}%, ${cor} ${brilhoX + 12}%)` : undefined,
              WebkitBackgroundClip: brilhoX !== undefined ? "text" : undefined,
              WebkitTextFillColor: brilhoX !== undefined ? "transparent" : undefined,
              textShadow: brilhoX !== undefined ? undefined : "0 4px 18px rgba(0,0,0,0.6)",
              filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.55))",
            }}
          >
            {l}
          </span>
        );
      })}
    </div>
  );
};

export const RevelacaoMarca: React.FC<{ d: number; chamada: string }> = ({ d, chamada }) => {
  const T = TRACO;
  // tela: escurece no quadro congelado
  const veu = interpolate(d, [-6, s(0.45)], [0, 0.94], c);
  const poeira = interpolate(d, [s(0.2), s(1.0)], [0, 1], c);
  // traços
  const pAureola = prog(d, 0.15, 0.8);
  const pCapsula = prog(d, 0.5, 1.12);
  const pCruzV = prog(d, 1.05, 1.22);
  const pCruzH = prog(d, 1.2, 1.32);
  const pSuporte = prog(d, 1.1, 1.42);
  const pHaste = prog(d, 1.36, 1.5);
  const pBase = prog(d, 1.44, 1.6);
  const botoes = prog(d, 1.36, 1.46, Easing.out(Easing.back(2)));
  // brilhos
  const flashCruz = interpolate(d, [s(1.32), s(1.42), s(1.95)], [0, 1, 0], c);
  const pulso = interpolate(d, [s(2.62), s(2.8), s(3.6)], [0, 1, 0.35], c);
  const brilhoNome = interpolate(d, [s(2.7), s(3.5)], [-20, 120], c);
  const chamadaOp = prog(d, 2.95, 3.4, Easing.out(Easing.cubic));
  const zoom = interpolate(d, [0, s(4.9)], [0.95, 1.02], c);
  const glow = 6 + 10 * pulso + 4 * prog(d, 0.06, 0.6);

  const tracejado = (p: number) => ({ pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: `rgba(9,7,13,${veu})` }} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 36%, rgba(233,185,73,${0.16 * poeira + 0.14 * pulso}) 0%, rgba(233,185,73,0) 42%)` }} />
      <Poeira d={d} opacidade={poeira} />
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "50% 45%" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", justifyContent: "center" }}>
          <svg width={600} height={600} viewBox="0 0 400 400" style={{ overflow: "visible" }}>
            <defs>
              <filter id="rev-brilho" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation={glow / 2} result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="rev-flash" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="10" />
              </filter>
            </defs>
            <g fill="none" stroke={OURO} strokeLinecap="round" strokeLinejoin="round" strokeWidth={T.traco} filter="url(#rev-brilho)">
              <ellipse cx={T.aureola.cx} cy={T.aureola.cy} rx={T.aureola.rx} ry={T.aureola.ry} strokeWidth={T.traco - 1} stroke={pulso > 0 ? OURO_CLARO : OURO} {...tracejado(pAureola)} />
              <rect x={T.capsula.x} y={T.capsula.y} width={T.capsula.w} height={T.capsula.h} rx={T.capsula.w / 2} {...tracejado(pCapsula)} />
              <path d="M 200 110 L 200 238" {...tracejado(pCruzV)} />
              <path d="M 174 150 L 226 150" {...tracejado(pCruzH)} />
              <path d={T.suporte} {...tracejado(pSuporte)} />
              <path d={T.haste} {...tracejado(pHaste)} />
              <path d={T.base} strokeWidth={T.traco + 2} {...tracejado(pBase)} />
              <circle cx={126} cy={198} r={8 * botoes} fill={OURO} stroke="none" />
              <circle cx={274} cy={198} r={8 * botoes} fill={OURO} stroke="none" />
            </g>
            {/* brilho da cruz na batida */}
            <g opacity={flashCruz} filter="url(#rev-flash)" stroke="#FFF6D8" strokeWidth={18} strokeLinecap="round">
              <path d="M 200 110 L 200 238 M 174 150 L 226 150" />
            </g>
            {/* anel de luz que sobe da auréola no acorde final */}
            <ellipse cx={T.aureola.cx} cy={T.aureola.cy - 10 * pulso} rx={T.aureola.rx * (1 + 0.5 * pulso)} ry={T.aureola.ry * (1 + 0.5 * pulso)} fill="none" stroke={OURO_CLARO} strokeWidth={3} opacity={pulso * 0.6} />
          </svg>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1000, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <Palavra texto="NARRADOR" d={d} inicio={1.6} fim={2.05} cor={CREME} tamanho={92} brilhoX={brilhoNome > -20 && brilhoNome < 120 ? brilhoNome : undefined} />
          <Palavra texto="CATÓLICO" d={d} inicio={2.05} fim={2.5} cor={OURO} tamanho={92} brilhoX={brilhoNome > -20 && brilhoNome < 120 ? brilhoNome - 15 : undefined} />
          <div style={{ marginTop: 34, opacity: chamadaOp, transform: `translateY(${(1 - chamadaOp) * 16}px)`, fontFamily: LEGENDA, fontWeight: 800, fontSize: 40, letterSpacing: "0.08em", color: OURO_CLARO }}>
            {chamada}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
