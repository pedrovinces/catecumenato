// Cena 3: o Padre rega uma muda; o calendário folheia o ano litúrgico (quase tudo verde); a muda vira árvore;
// no último banco, uma medalha de ouro "TEMPO COMUM" cai no fiel; em "católico", festa com confete.
import React from "react";
import { Easing, interpolate, random } from "remotion";
import { useCena } from "../components/motor/contexto";
import { Camera, Tela } from "../components/motor/Camera";
import { Padre } from "../components/Padre";
import { Fiel } from "../components/Fiel";
import { Ambiente } from "../components/cenario";
import { Calendario } from "../components/Calendario";
import { CASULA, CORES, DOURADO, TINTA, CONTORNO, clarear, escurecer } from "../lib/paleta";
import { TITULO } from "../lib/fontes";
import { degrau } from "../lib/anim";

// Cor litúrgica predominante de cada dia do ano litúrgico 2026-2027 (Missal Romano; datas conferidas pelo cômputo da Páscoa)
const corDoDia = (ano: number, mes: number, dia: number): string => {
  const d = Date.UTC(ano, mes - 1, dia);
  const em = (a: string) => Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  const entre = (a: string, b: string) => d >= em(a) && d <= em(b);
  if (d === em("2026-12-13") || d === em("2027-03-07")) return "rosa"; // Gaudete e Laetare
  if (entre("2026-11-29", "2026-12-24")) return "roxo"; // Advento
  if (entre("2026-12-25", "2027-01-10")) return "branco"; // Natal até o Batismo do Senhor
  if (entre("2027-01-11", "2027-02-09")) return "verde";
  if (entre("2027-02-10", "2027-03-20")) return "roxo"; // Quaresma (Cinzas em 10/02)
  if (d === em("2027-03-21") || d === em("2027-03-26")) return "vermelho"; // Ramos e Sexta-feira Santa
  if (entre("2027-03-22", "2027-03-24")) return "roxo";
  if (entre("2027-03-25", "2027-05-15")) return "branco"; // Ceia do Senhor, Páscoa (28/03) e tempo pascal
  if (d === em("2027-05-16")) return "vermelho"; // Pentecostes
  if (entre("2027-05-17", "2027-11-27")) return "verde";
  return "roxo"; // Advento de 2027 (28/11)
};
const TOM_DIA: Record<string, string> = { verde: "#9CD49F", roxo: "#C3A7E0", branco: "#FFFFFF", vermelho: "#F2A3A3", rosa: "#F9C6DB" };
const MESES: [number, number][] = [
  [2026, 12], [2027, 1], [2027, 2], [2027, 3], [2027, 4], [2027, 5], [2027, 6], [2027, 7], [2027, 8], [2027, 9], [2027, 10], [2027, 11],
];

/** Muda no vaso que cresce até virar árvore (cresc 0..1). */
const Planta: React.FC<{ x: number; y: number; cresc: number }> = ({ x, y, cresc }) => {
  const h = 60 + 470 * cresc;
  const folhas = Math.floor(2 + 9 * cresc);
  return (
    <g>
      <path d={`M ${x - 18} ${y - 150} Q ${x - 10} ${y - 150 - h / 2} ${x} ${y - 150 - h}`} fill="none" stroke={TINTA} strokeWidth={22 + 14 * cresc} strokeLinecap="round" />
      <path d={`M ${x - 18} ${y - 150} Q ${x - 10} ${y - 150 - h / 2} ${x} ${y - 150 - h}`} fill="none" stroke="#7B5230" strokeWidth={10 + 14 * cresc} strokeLinecap="round" />
      {Array.from({ length: folhas }, (_, i) => {
        const yy = y - 170 - (i / Math.max(1, folhas)) * h;
        const lado = i % 2 ? 1 : -1;
        const tam = 34 + 26 * cresc;
        return (
          <ellipse key={i} cx={x + lado * tam * 0.8} cy={yy} rx={tam} ry={tam * 0.45} transform={`rotate(${lado * -28} ${x + lado * tam * 0.8} ${yy})`} fill={i % 3 ? "#43A047" : "#66BB6A"} stroke={TINTA} strokeWidth={5} />
        );
      })}
      {cresc > 0.65 &&
        [[-70, -40, 95], [70, -50, 90], [0, -110, 110], [-20, 10, 80], [40, 0, 85]].map(([dx, dy, r], i) => (
          <circle key={i} cx={x + dx} cy={y - 150 - h + dy} r={r * interpolate(cresc, [0.65, 1], [0.3, 1])} fill={i % 2 ? "#4CAF50" : "#388E3C"} stroke={TINTA} strokeWidth={CONTORNO} />
        ))}
      <path d={`M ${x - 110} ${y - 160} L ${x + 110} ${y - 160} L ${x + 80} ${y} L ${x - 80} ${y} Z`} fill="#C8693C" stroke={TINTA} strokeWidth={CONTORNO} strokeLinejoin="round" />
      <rect x={x - 124} y={y - 190} width={248} height={42} rx={10} fill="#D9824F" stroke={TINTA} strokeWidth={CONTORNO} />
    </g>
  );
};

/** Medalha de ouro com fita verde. */
const Medalha: React.FC<{ x: number; y: number; fitaAte?: [number, number]; escala?: number; giro?: number }> = ({ x, y, fitaAte, escala = 1, giro = 0 }) => (
  <g>
    {fitaAte && (
      <g>
        <path d={`M ${fitaAte[0] - 70} ${fitaAte[1]} L ${x - 14} ${y - 40} L ${x + 14} ${y - 40} L ${fitaAte[0] + 70} ${fitaAte[1]}`} fill="none" stroke={TINTA} strokeWidth={40} strokeLinejoin="round" />
        <path d={`M ${fitaAte[0] - 70} ${fitaAte[1]} L ${x - 14} ${y - 40} L ${x + 14} ${y - 40} L ${fitaAte[0] + 70} ${fitaAte[1]}`} fill="none" stroke={CORES.verde} strokeWidth={26} strokeLinejoin="round" />
      </g>
    )}
    <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${escala})`}>
      <circle cx={6} cy={8} r={62} fill={TINTA} />
      <circle cx={0} cy={0} r={62} fill={DOURADO} stroke={TINTA} strokeWidth={CONTORNO} />
      <circle cx={0} cy={0} r={46} fill="#E3C04F" stroke="#8C6E12" strokeWidth={4} />
      <path d="M 0 -30 L 8 -10 L 30 -10 L 12 4 L 18 26 L 0 13 L -18 26 L -12 4 L -30 -10 L -8 -10 Z" fill="#FFF3B0" stroke="#8C6E12" strokeWidth={3} />
      <text x={0} y={44} textAnchor="middle" fontFamily={TITULO} fontSize={15} fill="#5D4600" letterSpacing={1}>
        TEMPO COMUM
      </text>
      <ellipse cx={-22} cy={-30} rx={14} ry={7} fill="#FFFFFF" opacity={0.6} transform="rotate(-30 -22 -30)" />
    </g>
  </g>
);

/** Confete em leque, saindo dos cantos de baixo (f = quadros desde o estouro). */
const Confete: React.FC<{ f: number }> = ({ f }) => {
  if (f < 0) return null;
  const cores = [CORES.verde, CORES.roxo, "#FFFFFF", CORES.vermelho, CORES.rosa, DOURADO, "#4FC3F7"];
  return (
    <g>
      {Array.from({ length: 90 }, (_, i) => {
        const lado = i % 2 ? 1 : -1;
        const x0 = lado > 0 ? 1080 : 0;
        const ang = (-55 - random(`a${i}`) * 50) * (Math.PI / 180);
        const v = 38 + random(`v${i}`) * 32;
        const t = f;
        const x = x0 - lado * Math.cos(ang) * v * t * 0.9;
        const y = 1500 + Math.sin(ang) * v * t + 1.15 * t * t;
        const rot = (random(`r${i}`) * 360 + t * (12 + random(`w${i}`) * 20)) % 360;
        return <rect key={i} x={x - 10} y={y - 5} width={20} height={10} fill={cores[i % cores.length]} stroke={TINTA} strokeWidth={2} transform={`rotate(${rot} ${x} ${y})`} />;
      })}
    </g>
  );
};

/** Raios de sol girando devagar: o fundo "feliz". */
const SolRadiante: React.FC<{ f: number }> = ({ f }) => (
  <g transform={`rotate(${f * 0.6} 540 980)`}>
    <rect x={-600} y={-600} width={2280} height={3120} fill="#FFF3B0" />
    {Array.from({ length: 18 }, (_, i) => {
      const a0 = (i / 18) * 2 * Math.PI;
      const a1 = a0 + Math.PI / 18;
      const r = 2000;
      return <path key={i} d={`M 540 980 L ${540 + r * Math.cos(a0)} ${980 + r * Math.sin(a0)} L ${540 + r * Math.cos(a1)} ${980 + r * Math.sin(a1)} Z`} fill="#A5D6A7" />;
    })}
  </g>
);

const Igreja: React.FC = () => {
  const parede = "#EDE3D1";
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={parede} />
      {[230, 850].map((x) => (
        <g key={x}>
          <path d={`M ${x - 90} 1000 L ${x - 90} 560 A 90 90 0 0 1 ${x + 90} 560 L ${x + 90} 1000 Z`} fill="#8FD19E" stroke={TINTA} strokeWidth={CONTORNO} />
          <path d={`M ${x} 470 L ${x} 1000 M ${x - 90} 760 L ${x + 90} 760`} stroke={TINTA} strokeWidth={6} />
          <circle cx={x} cy={620} r={34} fill="#FFF59D" stroke={TINTA} strokeWidth={5} />
        </g>
      ))}
      {/* altar ao fundo, com frontal verde */}
      <rect x={380} y={900} width={320} height={170} fill="#FFFDF5" stroke={TINTA} strokeWidth={CONTORNO} />
      <rect x={430} y={930} width={220} height={140} fill={CORES.verde} stroke={TINTA} strokeWidth={5} />
      <path d="M 540 950 L 540 1040 M 510 980 L 570 980" stroke={DOURADO} strokeWidth={10} strokeLinecap="round" />
      <path d="M 540 700 L 540 880 M 490 760 L 590 760" stroke={TINTA} strokeWidth={18} strokeLinecap="round" />
      <path d="M 540 700 L 540 880 M 490 760 L 590 760" stroke="#8D5B34" strokeWidth={8} strokeLinecap="round" />
      <rect x={0} y={1070} width={1080} height={850} fill="#B8A88F" />
      <line x1={0} x2={1080} y1={1070} y2={1070} stroke={TINTA} strokeWidth={CONTORNO} />
      {/* bancos da frente, em perspectiva */}
      {[0, 1].map((k) => (
        <rect key={k} x={60 - k * 30} y={1110 + k * 70} width={960 + k * 60} height={34} rx={8} fill={escurecer("#8D5B34", 0.1 * k)} stroke={TINTA} strokeWidth={5} />
      ))}
    </g>
  );
};

/** Encosto do último banco, por cima do fiel (parece sentado). */
const Banco: React.FC = () => (
  <g>
    <rect x={-20} y={1360} width={1120} height={70} rx={14} fill="#8D5B34" stroke={TINTA} strokeWidth={CONTORNO} />
    <rect x={-20} y={1430} width={1120} height={260} fill="#7B4F2C" stroke={TINTA} strokeWidth={CONTORNO} />
    {[180, 540, 900].map((x) => (
      <rect key={x} x={x - 60} y={1470} width={120} height={180} rx={10} fill="none" stroke={escurecer("#7B4F2C", 0.25)} strokeWidth={6} />
    ))}
  </g>
);

export const Verde: React.FC = () => {
  const { f, ev, desde, passou, pal } = useCena();
  const fundoClaro = clarear(CORES.verde, 0.62);

  // igreja: último banco, medalha e festa
  if (f >= pal("Se") - 3) {
    const dMed = desde("medalha");
    const dFesta = desde("festa");
    const festa = dFesta >= 0;
    const cabeca: [number, number] = [540, 1024 - 140];
    const pescoco: [number, number] = [540, 1180];
    let medalha: React.ReactNode = null;
    if (dMed >= 0) {
      const q = degrau(dMed, 2);
      let my: number;
      let fita: [number, number] | undefined;
      if (q < 8) my = interpolate(q, [0, 8], [-160, cabeca[1] - 40], { easing: Easing.in(Easing.quad) });
      else if (q < 14) my = cabeca[1] - 40 - Math.sin(((q - 8) / 6) * Math.PI) * 90;
      else {
        my = interpolate(q, [14, 20], [cabeca[1] - 40, pescoco[1] + 110], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.6)) });
        fita = pescoco;
      }
      const giro = q < 14 ? q * 26 : Math.sin(q * 0.5) * 6 * Math.max(0, 1 - (q - 14) / 30);
      medalha = <Medalha x={540} y={my} fitaAte={fita} giro={giro} escala={festa ? 1.15 : 1} />;
    }
    const expressao = festa
      ? { olhos: "feliz" as const, sobrancelhas: "alta" as const, boca: "sorrisao" as const }
      : dMed >= 8
        ? { olhos: "arregalado" as const, sobrancelhas: "alta" as const, boca: "O" as const, olhar: [0, 4] as [number, number] }
        : { olhos: "normal" as const, sobrancelhas: "neutra" as const, boca: "sorrisinho" as const, olhar: [0, -6] as [number, number] };
    const zoom = festa ? interpolate(dFesta, [0, 6], [1, 1.1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 1;
    return (
      <Camera zoom={zoom} foco={[540, 1050]}>
        <Tela>
          {festa ? <SolRadiante f={dFesta} /> : <Igreja />}
          <Fiel x={540} y={1760} escala={1.15} tipo="homem" roupa="#4FC3F7" bracos={festa ? "celebra" : "baixo"} expressao={expressao} />
          {medalha}
          <Banco />
          {festa && <Confete f={dFesta} />}
        </Tela>
      </Camera>
    );
  }

  // calendário folheando o ano litúrgico
  if (passou("calendario") && !passou("cresce")) {
    const pagina = Math.min(MESES.length - 1, Math.floor(desde("calendario") / 3));
    const [ano, mes] = MESES[pagina];
    return (
      <Tela>
        <Ambiente cor={fundoClaro} piso={1700} />
        <Calendario
          x={250}
          y={600}
          largura={580}
          ano={ano}
          mes={mes}
          corTopo={CORES.verde}
          coresDias={(dia) => TOM_DIA[corDoDia(ano, mes, dia)]}
        />
      </Tela>
    );
  }

  // Padre regando: a muda cresce em "esperança" (time-lapse em degraus de 4 quadros)
  const cresc = passou("cresce") ? interpolate(degrau(desde("cresce"), 4), [0, 60], [0.12, 1], { extrapolateRight: "clamp" }) : 0.08;
  const close = passou("cresce");
  const gotas = degrau(f, 3);
  return (
    <Camera zoom={close ? 1.18 : 1} foco={[640, 1250]}>
      <Tela>
        <Ambiente cor={fundoClaro} piso={1640} />
        <Planta x={760} y={1650} cresc={cresc} />
        {Array.from({ length: 6 }, (_, i) => {
          const t = ((gotas + i * 9) % 54) / 54;
          return <ellipse key={i} cx={705 + t * 30} cy={1185 + t * 300} rx={8} ry={13} fill="#4FC3F7" stroke={TINTA} strokeWidth={3} />;
        })}
        <Padre x={330} y={1700} escala={0.95} casula={CASULA.verde} pose="regando" adereco="regador" expressao={{ olhar: [8, 6] }} />
      </Tela>
    </Camera>
  );
};
