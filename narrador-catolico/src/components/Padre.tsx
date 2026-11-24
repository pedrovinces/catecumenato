// O Padre: ~50 anos, grisalho ralo, rosto redondo, sobrancelhas expressivas.
// Alva branca e casula da cor da cena (ou estola sobre a alva). Coordenadas locais: pés em (0,0), y para cima negativo.
import React from "react";
import { ALVA, ALVA_SOMBRA, DOURADO, PELE, PELE_SOMBRA, TINTA, CONTORNO, escurecer, luminancia } from "../lib/paleta";
import { BracoTubo, misturarBraco, type Braco } from "./bracos";
import { BocaDesenho, ParOlhos, ParSobrancelhas, type Expressao } from "./rosto";

export type NomePose =
  | "neutro"
  | "sonolento"
  | "surpreso"
  | "solene"
  | "confiante"
  | "acenando"
  | "joinha"
  | "cabide"
  | "trocando"
  | "regando"
  | "torcedor"
  | "torcedor2"
  | "cumprimentando"
  | "desconfiado"
  | "tada"
  | "parado";

type Pose = { e: Braco; d: Braco; expr: Expressao; inclina?: number; maosPostas?: boolean; frente?: boolean }; // frente: braço direito por cima da cabeça

const BAIXO_E: Braco = { cot: [-172, -452], mao: [-182, -334], gesto: "aberta" };
const BAIXO_D: Braco = { cot: [172, -452], mao: [182, -334], gesto: "aberta" };

export const POSES: Record<NomePose, Pose> = {
  neutro: { e: BAIXO_E, d: BAIXO_D, expr: { olhos: "normal", sobrancelhas: "neutra", boca: "sorriso" } },
  parado: { e: BAIXO_E, d: BAIXO_D, expr: { olhos: "normal", sobrancelhas: "alta", boca: "reta", olhar: [0, 0] } },
  sonolento: {
    e: BAIXO_E,
    d: { cot: [182, -440], mao: [72, -515], gesto: "segura" },
    expr: { olhos: "sonolento", sobrancelhas: "triste", boca: "reta" },
    inclina: 7,
  },
  surpreso: {
    e: { cot: [-222, -545], mao: [-240, -690], gesto: "aberta" },
    d: { cot: [222, -545], mao: [240, -690], gesto: "aberta" },
    expr: { olhos: "arregalado", sobrancelhas: "alta", boca: "O" },
  },
  solene: {
    e: { cot: [-150, -462], mao: [-16, -548], gesto: "escondida" },
    d: { cot: [150, -462], mao: [16, -548], gesto: "escondida" },
    expr: { olhos: "fechado", sobrancelhas: "neutra", boca: "sorrisinho" },
    maosPostas: true,
  },
  confiante: {
    e: { cot: [-168, -462], mao: [96, -505], gesto: "escondida" },
    d: { cot: [168, -462], mao: [-96, -480], gesto: "escondida" },
    expr: { olhos: "semicerrado", sobrancelhas: "uma", boca: "confiante" },
  },
  acenando: {
    e: BAIXO_E,
    d: { cot: [238, -640], mao: [262, -806], gesto: "aberta" },
    expr: { olhos: "feliz", sobrancelhas: "alta", boca: "sorrisao" },
  },
  joinha: {
    e: BAIXO_E,
    d: { cot: [196, -470], mao: [118, -585], gesto: "joinha" },
    expr: { olhos: "feliz", sobrancelhas: "neutra", boca: "sorrisinho" },
  },
  cabide: {
    e: BAIXO_E,
    d: { cot: [232, -612], mao: [252, -770], gesto: "segura" },
    expr: { olhos: "arregalado", sobrancelhas: "alta", boca: "O" },
  },
  trocando: {
    e: { cot: [-206, -640], mao: [-118, -868], gesto: "segura" },
    d: { cot: [206, -640], mao: [118, -868], gesto: "segura" },
    expr: { olhos: "feliz", sobrancelhas: "alta", boca: "sorriso" },
  },
  regando: {
    e: BAIXO_E,
    d: { cot: [205, -470], mao: [236, -505], gesto: "segura" },
    expr: { olhos: "feliz", sobrancelhas: "neutra", boca: "sorriso", olhar: [6, 6] },
  },
  torcedor: {
    e: { cot: [-232, -622], mao: [-252, -796], gesto: "punho" },
    d: { cot: [178, -560], mao: [66, -684], gesto: "segura" },
    expr: { olhos: "feliz", sobrancelhas: "alta", boca: "aberta" },
    frente: true,
  },
  torcedor2: {
    e: { cot: [-236, -560], mao: [-262, -690], gesto: "punho" },
    d: { cot: [178, -560], mao: [66, -684], gesto: "segura" },
    expr: { olhos: "feliz", sobrancelhas: "alta", boca: "aberta" },
    frente: true,
  },
  cumprimentando: {
    e: BAIXO_E,
    d: { cot: [214, -470], mao: [304, -478], gesto: "aberta" },
    expr: { olhos: "feliz", sobrancelhas: "neutra", boca: "sorrisao" },
  },
  desconfiado: { e: BAIXO_E, d: BAIXO_D, expr: { olhos: "semicerrado", sobrancelhas: "uma", boca: "confiante", olhar: [4, 0] } },
  tada: {
    e: { cot: [-236, -566], mao: [-318, -650], gesto: "aberta" },
    d: { cot: [236, -566], mao: [318, -650], gesto: "aberta" },
    expr: { olhos: "feliz", sobrancelhas: "alta", boca: "sorrisao" },
  },
};

export type Adereco = "caneca" | "cabide" | "corneta" | "regador" | null;

export type PadreProps = {
  x: number;
  y: number;
  escala?: number;
  casula?: string | null; // cor da casula; null = só alva
  estola?: string | null; // estola visível sobre a alva
  cachecol?: string | null;
  pose?: NomePose;
  poseAnterior?: NomePose; // para trocas de pose em 2 a 4 quadros
  progresso?: number; // 0..1 entre poseAnterior e pose
  expressao?: Partial<Expressao>; // sobrescreve a da pose
  inclina?: number; // graus (cabeça)
  corpo?: number; // graus (corpo inteiro, a partir dos pés)
  espelhado?: boolean;
  adereco?: Adereco;
  corAdereco?: string; // ex.: cor da roupa no cabide
  vapor?: number; // quadro atual, anima o vapor da caneca
  sombra?: boolean;
  oculos?: React.ReactNode; // desenhado na altura dos olhos, acompanha a cabeça
  children?: React.ReactNode; // extras no espaço local do Padre
};

const CABELO = "#CFCFCF";
const CABELO_SOMBRA = "#A5A5A5";
const SOBRANCELHA = "#8A847E";
const OMBRO_E: [number, number] = [-122, -585];
const OMBRO_D: [number, number] = [122, -585];

export const CABECA = { cx: 0, cy: -762, olhos: -772 };

const Casula: React.FC<{ cor: string }> = ({ cor }) => {
  const sombra = escurecer(cor, 0.2);
  const galao = luminancia(cor) > 0.6 ? DOURADO : escurecer(cor, 0.32);
  const contorno = `M -118 -600 C -176 -592 -208 -522 -218 -420 L -208 -262 Q -110 -200 0 -186 Q 110 -200 208 -262 L 218 -420 C 208 -522 176 -592 118 -600 Q 0 -578 -118 -600 Z`;
  return (
    <g>
      <path d={contorno} fill={cor} />
      <path d="M 66 -594 C 150 -584 200 -520 212 -420 L 204 -264 Q 150 -232 96 -208 Q 82 -400 66 -594 Z" fill={sombra} />
      <path d="M -32 -590 L 32 -590 L 34 -190 Q 0 -186 -34 -190 Z" fill={galao} />
      <line x1={-32} y1={-590} x2={-34} y2={-192} stroke={DOURADO} strokeWidth={5} />
      <line x1={32} y1={-590} x2={34} y2={-192} stroke={DOURADO} strokeWidth={5} />
      <path d="M 0 -548 L 0 -436 M -30 -508 L 30 -508" stroke={DOURADO} strokeWidth={11} strokeLinecap="round" />
      <path d={contorno} fill="none" stroke={TINTA} strokeWidth={CONTORNO} strokeLinejoin="round" />
    </g>
  );
};

const Alva: React.FC = () => (
  <g>
    <path d="M -108 -600 L -156 -40 Q 0 -18 156 -40 L 108 -600 Z" fill={ALVA} stroke={TINTA} strokeWidth={CONTORNO} strokeLinejoin="round" />
    <path d="M 50 -598 L 70 -30 Q 120 -32 156 -40 L 108 -600 Z" fill={ALVA_SOMBRA} />
    <path d="M -40 -300 L -50 -36 M 40 -300 L 50 -34" stroke={ALVA_SOMBRA} strokeWidth={6} strokeLinecap="round" />
    <path d="M -108 -600 L -156 -40 Q 0 -18 156 -40 L 108 -600" fill="none" stroke={TINTA} strokeWidth={CONTORNO} strokeLinejoin="round" />
  </g>
);

const Estola: React.FC<{ cor: string }> = ({ cor }) => {
  const faixa = (l: number) => `M ${l * 22} -598 L ${l * 70} -598 L ${l * 80} -262 L ${l * 30} -262 Z`;
  return (
    <g>
      {[-1, 1].map((l) => (
        <g key={l}>
          <path d={faixa(l)} fill={cor} stroke={TINTA} strokeWidth={CONTORNO} strokeLinejoin="round" />
          <path d={`M ${l * 40} -300 L ${l * 64} -300 M ${l * 52} -318 L ${l * 52} -282`} stroke={DOURADO} strokeWidth={7} strokeLinecap="round" />
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1={l * (32 + i * 11)} x2={l * (32 + i * 11)} y1={-262} y2={-244} stroke={DOURADO} strokeWidth={4} />
          ))}
        </g>
      ))}
    </g>
  );
};

const Cachecol: React.FC<{ cor: string }> = ({ cor }) => (
  <g>
    <path d="M 30 -600 L 70 -600 L 92 -420 L 50 -416 Z" fill={cor} stroke={TINTA} strokeWidth={CONTORNO} strokeLinejoin="round" />
    {[0, 1, 2, 3].map((i) => (
      <line key={i} x1={54 + i * 11} x2={56 + i * 11} y1={-418} y2={-396} stroke={TINTA} strokeWidth={5} strokeLinecap="round" />
    ))}
    <ellipse cx={0} cy={-610} rx={96} ry={34} fill={cor} stroke={TINTA} strokeWidth={CONTORNO} />
    <path d="M -70 -616 Q 0 -592 70 -616" fill="none" stroke={escurecer(cor, 0.25)} strokeWidth={6} />
  </g>
);

const Cabeca: React.FC<{ expr: Expressao }> = ({ expr }) => {
  const { cx, cy } = CABECA;
  const rugas = expr.sobrancelhas === "alta" || expr.sobrancelhas === "uma";
  return (
    <g>
      {/* orelhas */}
      {[-1, 1].map((l) => (
        <g key={l}>
          <ellipse cx={cx + l * 148} cy={cy + 8} rx={26} ry={38} fill={PELE} stroke={TINTA} strokeWidth={CONTORNO} />
          <path d={`M ${cx + l * 150} ${cy - 10} Q ${cx + l * 160} ${cy + 8} ${cx + l * 148} ${cy + 26}`} fill="none" stroke={PELE_SOMBRA} strokeWidth={6} strokeLinecap="round" />
        </g>
      ))}
      {/* cabelo de trás (laterais grisalhas) */}
      {[-1, 1].map((l) => (
        <path
          key={l}
          d={`M ${cx + l * 112} ${cy - 92} Q ${cx + l * 172} ${cy - 70} ${cx + l * 160} ${cy - 18} Q ${cx + l * 150} ${cy - 40} ${cx + l * 132} ${cy - 30} Q ${cx + l * 140} ${cy - 62} ${cx + l * 112} ${cy - 92} Z`}
          fill={CABELO}
          stroke={TINTA}
          strokeWidth={CONTORNO - 1}
          strokeLinejoin="round"
        />
      ))}
      {/* rosto */}
      <ellipse cx={cx} cy={cy} rx={150} ry={142} fill={PELE} stroke={TINTA} strokeWidth={CONTORNO} />
      <path d={`M ${cx - 120} ${cy + 60} Q ${cx} ${cy + 160} ${cx + 120} ${cy + 60} Q ${cx + 110} ${cy + 120} ${cx} ${cy + 140} Q ${cx - 110} ${cy + 120} ${cx - 120} ${cy + 60} Z`} fill={PELE_SOMBRA} opacity={0.45} />
      {/* fios ralos no alto e brilho da careca */}
      <ellipse cx={cx - 52} cy={cy - 104} rx={34} ry={14} fill="#FFFFFF" opacity={0.45} />
      <path d={`M ${cx - 70} ${cy - 124} Q ${cx - 20} ${cy - 158} ${cx + 40} ${cy - 132}`} fill="none" stroke={CABELO_SOMBRA} strokeWidth={6} strokeLinecap="round" />
      <path d={`M ${cx - 36} ${cy - 132} Q ${cx + 16} ${cy - 160} ${cx + 74} ${cy - 120}`} fill="none" stroke={CABELO_SOMBRA} strokeWidth={6} strokeLinecap="round" />
      {/* rugas da testa */}
      {rugas && (
        <g stroke={PELE_SOMBRA} strokeWidth={6} fill="none" strokeLinecap="round">
          <path d={`M ${cx - 54} ${cy - 92} Q ${cx} ${cy - 104} ${cx + 54} ${cy - 92}`} />
          <path d={`M ${cx - 36} ${cy - 76} Q ${cx} ${cy - 86} ${cx + 36} ${cy - 76}`} />
        </g>
      )}
      <ParOlhos cx={cx} cy={CABECA.olhos} dx={55} tipo={expr.olhos} olhar={expr.olhar} pele={PELE} />
      {(expr.olhos === "feliz" || expr.boca === "sorrisao") &&
        [-1, 1].map((l) => (
          <path key={l} d={`M ${cx + l * 92} ${cy - 22} l ${l * 16} -6 M ${cx + l * 92} ${cy - 10} l ${l * 17} 2`} stroke={PELE_SOMBRA} strokeWidth={5} strokeLinecap="round" />
        ))}
      <ParSobrancelhas cx={cx} cy={cy - 52} dx={55} tipo={expr.sobrancelhas} cor={SOBRANCELHA} />
      {/* bochechas e nariz */}
      {[-1, 1].map((l) => (
        <circle key={l} cx={cx + l * 94} cy={cy + 44} r={24} fill="#E8896F" opacity={0.42} />
      ))}
      <ellipse cx={cx} cy={cy + 30} rx={27} ry={22} fill={PELE_SOMBRA} stroke={TINTA} strokeWidth={CONTORNO - 1} />
      <ellipse cx={cx - 8} cy={cy + 22} rx={8} ry={5} fill="#FFFFFF" opacity={0.6} />
      <BocaDesenho cx={cx} cy={cy + 86} tipo={expr.boca} />
      {/* papada */}
      <path d={`M ${cx - 56} ${cy + 130} Q ${cx} ${cy + 152} ${cx + 56} ${cy + 130}`} fill="none" stroke={PELE_SOMBRA} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

const AderecoNaMao: React.FC<{ tipo: Adereco; p: [number, number]; cor?: string; vapor?: number }> = ({ tipo, p, cor = "#2E7D32", vapor = 0 }) => {
  const [x, y] = p;
  if (tipo === "caneca") {
    const v = Math.floor(vapor / 4) % 2;
    return (
      <g>
        <g fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" opacity={0.9}>
          <path d={`M ${x - 14} ${y - 60} q ${v ? 12 : -12} -20 0 -40 q ${v ? -12 : 12} -20 0 -40`} />
          <path d={`M ${x + 14} ${y - 64} q ${v ? -12 : 12} -18 0 -36`} />
        </g>
        <path d={`M ${x + 36} ${y - 34} q 32 4 22 34 q -6 16 -22 14`} fill="none" stroke={TINTA} strokeWidth={CONTORNO + 6} />
        <path d={`M ${x + 36} ${y - 34} q 32 4 22 34 q -6 16 -22 14`} fill="none" stroke="#E9E2D0" strokeWidth={6} />
        <rect x={x - 40} y={y - 50} width={80} height={92} rx={12} fill="#E9E2D0" stroke={TINTA} strokeWidth={CONTORNO} />
        <path d={`M ${x - 22} ${y - 22} l 12 0 m 8 0 l 18 0`} stroke="#B07A3B" strokeWidth={8} strokeLinecap="round" />
      </g>
    );
  }
  if (tipo === "cabide") {
    return (
      <g>
        <path d={`M ${x} ${y + 6} q 0 -34 22 -34 q 20 0 18 20`} fill="none" stroke={TINTA} strokeWidth={9} strokeLinecap="round" />
        <path d={`M ${x - 96} ${y + 70} L ${x} ${y + 14} L ${x + 96} ${y + 70} Z`} fill="none" stroke={TINTA} strokeWidth={12} strokeLinejoin="round" />
        <path d={`M ${x - 96} ${y + 70} L ${x} ${y + 14} L ${x + 96} ${y + 70} Z`} fill="none" stroke="#B9875A" strokeWidth={6} strokeLinejoin="round" />
        <path d={`M ${x - 92} ${y + 72} Q ${x - 110} ${y + 220} ${x - 80} ${y + 300} Q ${x} ${y + 330} ${x + 80} ${y + 300} Q ${x + 110} ${y + 220} ${x + 92} ${y + 72} Z`} fill={cor} stroke={TINTA} strokeWidth={CONTORNO} strokeLinejoin="round" />
        <path d={`M ${x} ${y + 76} L ${x} ${y + 300}`} stroke={DOURADO} strokeWidth={8} />
      </g>
    );
  }
  if (tipo === "corneta") {
    return (
      <g transform={`translate(${x},${y}) rotate(-38)`}>
        <path d="M -20 -14 L 150 -52 L 150 52 L -20 14 Z" fill="#F4C430" stroke={TINTA} strokeWidth={CONTORNO} strokeLinejoin="round" />
        <ellipse cx={150} cy={0} rx={16} ry={52} fill="#E0A800" stroke={TINTA} strokeWidth={CONTORNO} />
        <path d="M 20 -18 L 120 -40" stroke="#FFF3B0" strokeWidth={6} strokeLinecap="round" />
      </g>
    );
  }
  if (tipo === "regador") {
    return (
      <g>
        <path d={`M ${x + 40} ${y + 10} L ${x + 150} ${y - 40}`} stroke={TINTA} strokeWidth={26} strokeLinecap="round" />
        <path d={`M ${x + 40} ${y + 10} L ${x + 150} ${y - 40}`} stroke="#4FA3A5" strokeWidth={14} strokeLinecap="round" />
        <rect x={x - 70} y={y - 10} width={120} height={100} rx={18} fill="#4FA3A5" stroke={TINTA} strokeWidth={CONTORNO} />
        <path d={`M ${x - 60} ${y - 6} Q ${x - 10} ${y - 70} ${x + 30} ${y - 6}`} fill="none" stroke={TINTA} strokeWidth={12} />
      </g>
    );
  }
  return null;
};

export const Padre: React.FC<PadreProps> = ({
  x,
  y,
  escala = 1,
  casula = null,
  estola = null,
  cachecol = null,
  pose = "neutro",
  poseAnterior,
  progresso = 1,
  expressao,
  inclina,
  corpo = 0,
  espelhado = false,
  adereco = null,
  corAdereco,
  vapor = 0,
  sombra = true,
  oculos,
  children,
}) => {
  const p1 = POSES[pose];
  const p0 = poseAnterior ? POSES[poseAnterior] : p1;
  const t = poseAnterior ? progresso : 1;
  const e = misturarBraco(p0.e, p1.e, t);
  const d = misturarBraco(p0.d, p1.d, t);
  const expr: Expressao = { ...(t < 0.5 ? p0.expr : p1.expr), ...expressao };
  const inc = inclina ?? (t < 0.5 ? p0.inclina : p1.inclina) ?? 0;
  const maosPostas = t >= 0.5 ? p1.maosPostas : p0.maosPostas;
  const manga = casula ?? ALVA;
  const cruzado = pose === "confiante" && t >= 0.5;
  const frente = (t >= 0.5 ? p1.frente : p0.frente) ?? false;
  const maoD = d.mao;

  return (
    <g transform={`translate(${x},${y}) scale(${escala * (espelhado ? -1 : 1)},${escala})`}>
      {sombra && <ellipse cx={0} cy={-6} rx={190} ry={26} fill="#000000" opacity={0.16} />}
      <g transform={`rotate(${corpo} 0 0)`}>
        {/* sapatos */}
        {[-1, 1].map((l) => (
          <ellipse key={l} cx={l * 58} cy={-24} rx={50} ry={25} fill="#2B2B2B" stroke={TINTA} strokeWidth={CONTORNO} />
        ))}
        <Alva />
        {estola && !casula && <Estola cor={estola} />}
        {casula && <Casula cor={casula} />}
        {cachecol && <Cachecol cor={cachecol} />}
        {/* gola da alva */}
        {!cachecol && <path d="M -70 -604 Q 0 -560 70 -604 Q 0 -586 -70 -604 Z" fill={ALVA} stroke={TINTA} strokeWidth={CONTORNO - 1} />}
        {estola && !casula && <path d="M -70 -600 Q 0 -630 70 -600" fill="none" stroke={estola} strokeWidth={22} />}
        {/* braços: no cruzado, o direito passa por cima */}
        {cruzado ? (
          <>
            <BracoTubo ombro={OMBRO_D} braco={d} manga={manga} pele={PELE} lado={1} />
            <BracoTubo ombro={OMBRO_E} braco={e} manga={manga} pele={PELE} lado={-1} />
            {[-1, 1].map((l) => (
              <ellipse key={l} cx={l * 118} cy={-500 + (l > 0 ? -6 : 18)} rx={26} ry={22} fill={PELE} stroke={TINTA} strokeWidth={CONTORNO} />
            ))}
          </>
        ) : (
          <>
            <BracoTubo ombro={OMBRO_E} braco={e} manga={manga} pele={PELE} lado={-1} />
            {!frente && <BracoTubo ombro={OMBRO_D} braco={d} manga={manga} pele={PELE} lado={1} />}
          </>
        )}
        {maosPostas && (
          <g>
            <path d="M -30 -520 Q -34 -600 0 -640 Q 34 -600 30 -520 Z" fill={PELE} stroke={TINTA} strokeWidth={CONTORNO} strokeLinejoin="round" />
            <line x1={0} y1={-630} x2={0} y2={-524} stroke={TINTA} strokeWidth={4} />
          </g>
        )}
        {adereco && !frente && <AderecoNaMao tipo={adereco} p={maoD} cor={corAdereco} vapor={vapor} />}
        {/* cabeça (gira no pescoço) */}
        <g transform={`rotate(${inc} 0 -620)`}>
          <Cabeca expr={expr} />
          {oculos && <g transform={`translate(0 ${CABECA.olhos})`}>{oculos}</g>}
        </g>
        {frente && adereco && <AderecoNaMao tipo={adereco} p={maoD} cor={corAdereco} vapor={vapor} />}
        {frente && <BracoTubo ombro={OMBRO_D} braco={d} manga={manga} pele={PELE} lado={1} />}
        {children}
      </g>
    </g>
  );
};
