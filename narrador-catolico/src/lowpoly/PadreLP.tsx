// O Padre em low-poly: proporções realistas (~7 cabeças), facetas sem contorno, rosto simples.
// Coordenadas locais: pés em (0,0), topo da cabeça em y ≈ -1000.
import React from "react";
import { Dobras, Faceta, elipse, tom, type P } from "./geo";

export const PELE_LP = "#D9A77E";
const ALVA_LP = "#EDE8DC";
const CABELO_LP = "#B9B6B0";

export type Rosto = { boca?: "sorriso" | "leve" | "O" | "reta" | "aberta"; sobrancelha?: "neutra" | "alta" | "uma" | "franzida"; olhos?: "abertos" | "fechados" | "felizes" };

/** Braço: ângulos em graus (0 = para baixo; positivo gira para fora/para cima do lado do braço). */
export type BracoLP = { ombro: number; cotovelo: number };
export type PoseLP = { e: BracoLP; d: BracoLP; rosto: Rosto; maosPostas?: boolean; cabeca?: number };

export const POSES_LP: Record<string, PoseLP> = {
  // ângulos positivos abrem o braço para fora; cotovelo negativo dobra o antebraço para dentro
  neutro: { e: { ombro: 4, cotovelo: -24 }, d: { ombro: 4, cotovelo: -24 }, rosto: { boca: "leve" } },
  segurandoCabide: { e: { ombro: 4, cotovelo: -24 }, d: { ombro: 128, cotovelo: 30 }, rosto: { boca: "sorriso", sobrancelha: "uma" }, cabeca: 5 },
  solene: { e: { ombro: 12, cotovelo: -128 }, d: { ombro: 12, cotovelo: -128 }, rosto: { boca: "leve", olhos: "fechados" }, maosPostas: true },
  bracosCruzados: { e: { ombro: 14, cotovelo: -108 }, d: { ombro: 10, cotovelo: -122 }, rosto: { boca: "sorriso", sobrancelha: "uma" } },
  acolhendo: { e: { ombro: 4, cotovelo: -24 }, d: { ombro: 38, cotovelo: -18 }, rosto: { boca: "sorriso" } },
  celebrando: { e: { ombro: 150, cotovelo: 20 }, d: { ombro: 150, cotovelo: 20 }, rosto: { boca: "aberta", olhos: "felizes", sobrancelha: "alta" } },
};

const CORPO = {
  alva: [[-128, -345], [128, -345], [150, -40], [118, -6], [-118, -6], [-150, -40]] as P[],
  casula: [[-60, -842], [60, -842], [120, -828], [160, -800], [181, -750], [187, -650], [183, -520], [176, -400], [150, -338], [80, -310], [0, -300], [-80, -310], [-150, -338], [-176, -400], [-183, -520], [-187, -650], [-181, -750], [-160, -800], [-120, -828]] as P[],
  galao: [[-21, -836], [21, -836], [24, -302], [-24, -302]] as P[],
  gola: [[-56, -846], [56, -846], [44, -812], [0, -800], [-44, -812]] as P[],
  pescoco: [[-22, -880], [22, -880], [27, -838], [-27, -838]] as P[],
  sapatoE: [[-92, -16], [-30, -18], [-24, 0], [-98, 0]] as P[],
  sapatoD: [[30, -18], [92, -16], [98, 0], [24, 0]] as P[],
};

const ROSTO: P[] = [
  [0, -1004], [30, -998], [52, -978], [60, -948], [58, -915], [50, -890], [36, -872], [18, -862], [0, -859], [-18, -862], [-36, -872], [-50, -890], [-58, -915], [-60, -948], [-52, -978], [-30, -998],
];
const CABELO_E: P[] = [[-62, -965], [-48, -992], [-34, -1000], [-46, -982], [-56, -950], [-58, -915], [-66, -922]];
const CABELO_D: P[] = CABELO_E.map(([x, y]) => [-x, y]);
const NUCA: P[] = [[-60, -955], [-30, -1003], [0, -1010], [30, -1003], [60, -955], [64, -930], [-64, -930]];

const BRACO_SUP: P[] = [[-30, -6], [30, -6], [26, 196], [-24, 196]];
const BRACO_INF: P[] = [[-21, 0], [21, 0], [17, 168], [-17, 168]];
const MAO: P[] = [[-17, 0], [17, 0], [21, 26], [12, 50], [-6, 54], [-19, 34]];

const Braco: React.FC<{ lado: -1 | 1; b: BracoLP; casula: string; semente: string; segura?: React.ReactNode }> = ({ lado, b, casula, semente, segura }) => (
  <g transform={`translate(${lado * 134} -800) rotate(${-lado * b.ombro})`}>
    <Faceta curva pontos={BRACO_SUP} cor={casula} passo={26} semente={`${semente}s`} forca={0.22} />
    <g transform={`translate(0 192) rotate(${-lado * b.cotovelo})`}>
      <Faceta curva pontos={BRACO_INF} cor={ALVA_LP} passo={22} semente={`${semente}i`} forca={0.18} />
      <g transform="translate(0 164)">
        <Faceta curva pontos={MAO} cor={PELE_LP} passo={14} semente={`${semente}m`} forca={0.2} />
        {/* o objeto segurado não gira com o braço: pende pela gravidade */}
        {segura && <g transform={`rotate(${lado * (b.ombro + b.cotovelo)})`}>{segura}</g>}
      </g>
    </g>
  </g>
);

const Rosto_: React.FC<{ r: Rosto; semente: string }> = ({ r, semente }) => {
  const boca = r.boca ?? "leve";
  const olhos = r.olhos ?? "abertos";
  const sob = r.sobrancelha ?? "neutra";
  const iris = "#4A3426";
  const linha = "#3A2A22";
  const sobY = sob === "alta" ? -7 : 0;
  const id = `ro-${semente}`;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-bo`}>
          <stop offset="0" stopColor="#D8826A" stopOpacity={0.45} />
          <stop offset="1" stopColor="#D8826A" stopOpacity={0} />
        </radialGradient>
        <filter id={`${id}-bl`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={3} />
        </filter>
      </defs>
      <Faceta curva pontos={NUCA} cor={CABELO_LP} forca={0.22} />
      {[-1, 1].map((l) => (
        <Faceta curva key={l} pontos={elipse(l * 59, -930, 10, 17, 10)} cor={tom(PELE_LP, -0.05)} forca={0.2} />
      ))}
      <Faceta curva pontos={ROSTO} cor={PELE_LP} forca={0.2} />
      {/* sombra da mandíbula e das têmporas */}
      <path d="M -50 -900 Q -40 -866 0 -860 Q 40 -866 50 -900 Q 30 -878 0 -874 Q -30 -878 -50 -900 Z" fill={tom(PELE_LP, -0.12)} opacity={0.55} filter={`url(#${id}-bl)`} />
      {[-1, 1].map((l) => (
        <ellipse key={`b${l}`} cx={l * 34} cy={-905} rx={17} ry={11} fill={`url(#${id}-bo)`} />
      ))}
      <Faceta curva pontos={CABELO_E} cor={CABELO_LP} forca={0.2} />
      <Faceta curva pontos={CABELO_D} cor={CABELO_LP} forca={0.2} />
      <g stroke="#E4E2DE" strokeWidth={1.5} opacity={0.7} fill="none">
        <path d="M -56 -960 Q -50 -985 -36 -996" />
        <path d="M 56 -960 Q 50 -985 36 -996" />
      </g>
      {/* sobrancelhas afinadas nas pontas */}
      {[-1, 1].map((l) => {
        const sobe = sob === "uma" && l === 1 ? -8 : 0;
        const inc = sob === "franzida" ? 6 : 0;
        const y = -957 + sobY + sobe;
        return (
          <path
            key={`s${l}`}
            d={`M ${l * 10} ${y + inc} Q ${l * 24} ${y - 7} ${l * 40} ${y - 2} Q ${l * 26} ${y - 2} ${l * 11} ${y + 4 + inc} Z`}
            fill="#8A847D"
          />
        );
      })}
      {/* olhos: branco, íris, pálpebra */}
      {[-1, 1].map((l) => {
        const cx = l * 24;
        if (olhos !== "abertos")
          return (
            <path
              key={`o${l}`}
              d={olhos === "felizes" ? `M ${cx - 10} -939 Q ${cx} -947 ${cx + 10} -939` : `M ${cx - 10} -942 Q ${cx} -937 ${cx + 10} -942`}
              fill="none"
              stroke={linha}
              strokeWidth={2.6}
              strokeLinecap="round"
            />
          );
        return (
          <g key={`o${l}`}>
            <path d={`M ${cx - 11} -941 Q ${cx} -949 ${cx + 11} -941 Q ${cx} -935 ${cx - 11} -941 Z`} fill="#F2EEE8" />
            <circle cx={cx + l * 0.5} cy={-941.5} r={4.3} fill={iris} />
            <circle cx={cx + l * 0.5} cy={-941.5} r={2} fill="#1C1410" />
            <circle cx={cx - 1} cy={-943} r={1} fill="#FFFFFF" />
            <path d={`M ${cx - 12} -941 Q ${cx} -950 ${cx + 12} -941`} fill="none" stroke={linha} strokeWidth={2.4} strokeLinecap="round" />
          </g>
        );
      })}
      {/* nariz: sombra lateral e asa */}
      <path d="M 3 -936 Q 9 -918 8 -905 Q 3 -901 -3 -903" fill="none" stroke={tom(PELE_LP, -0.16)} strokeWidth={3} strokeLinecap="round" opacity={0.75} />
      <ellipse cx={-1} cy={-903} rx={8} ry={4} fill={tom(PELE_LP, -0.1)} opacity={0.6} />
      {/* boca */}
      {boca === "O" && <ellipse cx={0} cy={-884} rx={6} ry={8} fill="#6A3029" />}
      {boca === "aberta" && (
        <g>
          <path d="M -17 -889 Q 0 -868 17 -889 Q 0 -884 -17 -889 Z" fill="#6A3029" />
          <path d="M -12 -887 Q 0 -884 12 -887 L 10 -884 Q 0 -882 -10 -884 Z" fill="#F4EFE8" />
        </g>
      )}
      {(boca === "sorriso" || boca === "leve" || boca === "reta") && (
        <g>
          <path
            d={boca === "sorriso" ? "M -16 -888 Q 0 -878 16 -888" : boca === "leve" ? "M -12 -885 Q 0 -880 12 -885" : "M -11 -884 L 11 -884"}
            fill="none"
            stroke="#8E4A3E"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <path d={boca === "sorriso" ? "M -9 -881 Q 0 -876 9 -881" : "M -7 -879 Q 0 -876 7 -879"} fill="none" stroke={tom(PELE_LP, -0.1)} strokeWidth={2.5} strokeLinecap="round" opacity={0.6} />
        </g>
      )}
    </g>
  );
};

export type PadreLPProps = {
  x: number;
  y: number;
  escala?: number;
  casula?: string | null;
  estola?: string | null;
  pose?: keyof typeof POSES_LP | PoseLP;
  rosto?: Rosto;
  espelhado?: boolean;
  segura?: React.ReactNode; // objeto na mão direita
  oculos?: React.ReactNode; // desenhado na altura dos olhos
  semente?: string;
};

export const PadreLP: React.FC<PadreLPProps> = ({ x, y, escala = 1, casula = "#2E7D32", estola = null, pose = "neutro", rosto, espelhado, segura, oculos, semente = "padre" }) => {
  const p = typeof pose === "string" ? POSES_LP[pose] : pose;
  const r = { ...p.rosto, ...rosto };
  const corCasula = casula ?? ALVA_LP;
  return (
    <g transform={`translate(${x} ${y}) scale(${escala * (espelhado ? -1 : 1)} ${escala})`}>
      <ellipse cx={0} cy={-4} rx={190} ry={22} fill="#000" opacity={0.22} />
      <Faceta curva pontos={CORPO.alva} cor={ALVA_LP} passo={42} semente={`${semente}al`} forca={0.2} />
      <Dobras id={`${semente}-da`} opacidade={0.16} largura={9} caminhos={["M -70 -330 Q -80 -180 -95 -20", "M -20 -320 Q -24 -170 -30 -12", "M 30 -320 Q 34 -170 40 -12", "M 80 -330 Q 92 -180 104 -20"]} />
      <Faceta curva pontos={CORPO.sapatoE} cor="#2A2420" passo={20} semente={`${semente}se`} />
      <Faceta curva pontos={CORPO.sapatoD} cor="#2A2420" passo={20} semente={`${semente}sd`} />
      {casula ? (
        <>
          <Faceta curva pontos={CORPO.casula} cor={casula} passo={40} semente={`${semente}ca`} forca={0.26} variacao={0.05} />
          <Dobras id={`${semente}-dc`} opacidade={0.22} largura={12} caminhos={["M -120 -800 Q -150 -600 -120 -360", "M -70 -780 Q -90 -560 -78 -320", "M 70 -780 Q 92 -560 80 -320", "M 125 -800 Q 152 -600 126 -360", "M -40 -330 Q 0 -318 40 -330"]} />
          <Faceta curva pontos={CORPO.galao} cor="#B9912C" passo={22} semente={`${semente}ga`} forca={0.2} />
          <Faceta curva pontos={[[-6, -760], [6, -760], [6, -640], [-6, -640]]} cor="#F3DC8B" passo={10} semente={`${semente}cr1`} />
          <Faceta curva pontos={[[-28, -722], [28, -722], [28, -710], [-28, -710]]} cor="#F3DC8B" passo={10} semente={`${semente}cr2`} />
        </>
      ) : (
        <>
          <Faceta curva pontos={[[-130, -830], [130, -830], [140, -345], [-140, -345]]} cor={ALVA_LP} passo={40} semente={`${semente}ac`} forca={0.2} />
          {estola &&
            [-1, 1].map((l) => (
              <Faceta curva key={l} pontos={[[l * 18, -836], [l * 58, -836], [l * 64, -470], [l * 26, -470]]} cor={estola} passo={20} semente={`${semente}es${l}`} forca={0.25} />
            ))}
        </>
      )}
      <Faceta curva pontos={CORPO.pescoco} cor={tom(PELE_LP, -0.06)} passo={14} semente={`${semente}pe`} />
      <Faceta curva pontos={CORPO.gola} cor={ALVA_LP} passo={14} semente={`${semente}go`} />
      <Braco lado={-1} b={p.e} casula={corCasula} semente={`${semente}be`} />
      <Braco lado={1} b={p.d} casula={corCasula} semente={`${semente}bd`} segura={segura} />
      {p.maosPostas && <Faceta curva pontos={[[-17, -650], [0, -712], [17, -650], [13, -606], [-13, -606]]} cor={PELE_LP} passo={12} semente={`${semente}mp`} />}
      <g transform={`rotate(${p.cabeca ?? 0} 0 -860)`}>
        <Rosto_ r={r} semente={semente} />
        {oculos && <g transform="translate(0 -942)">{oculos}</g>}
      </g>
    </g>
  );
};
