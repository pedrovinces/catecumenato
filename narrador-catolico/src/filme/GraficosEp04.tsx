// Grafismos do ep. 3, parte 2 ("Como se confessar (sem dar branco)", código ep04): suor na fila, o branco,
// os cinco passos, o caderno do exame, o bilhete do frango, DOR + PROPÓSITO, contrição perfeita e imperfeita,
// a lista da hora, o cavalete, o tribunal, a senha, a agenda, o medidor de susto, o ato de contrição na tela,
// a dúvida de quem assiste, a frase de Jesus (Jo 20,22-23), a corrente da sucessão, o sigilo e o pedido de mais frango.
// Coordenadas em px do quadro 1080 x 1920, medidas nas imagens; a área segura está em AREA.
import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { LEGENDA, SERIFA, TITULO } from "../lib/fontes";
import { pop } from "../lib/anim";
import { AREA } from "../components/motor/area";
import { useCena } from "../components/motor/contexto";
import { Balao, CarimboVermelho, saindo, Veus } from "./GraficosEp03";
import { Cadeado } from "./GraficosEp02";

const CREME = "#F6EBD3";
const OURO = "#EBCB86";
const OURO_FORTE = "#F2C14E";
const TINTA = "#1F2B5C";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const LARGURA = AREA.direita - AREA.esquerda;

/** Fundo desfocado e escurecido para cartões que ocupam a tela. */
const Desfoque: React.FC<{ de: number; ate: number; forca?: number }> = ({ de, ate, forca = 1 }) => {
  const { f } = useCena();
  if (f < de || f >= ate) return null;
  const op = Math.min(interpolate(f, [de, de + 8], [0, 1], clamp), interpolate(f, [ate - 6, ate], [1, 0], clamp));
  return <AbsoluteFill style={{ backdropFilter: `blur(${14 * forca}px)`, backgroundColor: `rgba(12,9,6,${0.42 * forca})`, opacity: op }} />;
};

/** Traço que se desenha (tique, X, círculo), por stroke-dashoffset. */
const Traco: React.FC<{ d: string; t: number; cor: string; largura?: number; comprimento?: number }> = ({ d, t, cor, largura = 9, comprimento = 400 }) => (
  <path d={d} fill="none" stroke={cor} strokeWidth={largura} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={comprimento} strokeDashoffset={comprimento * (1 - t)} />
);

// ───────────────────────── abertura
const Suor: React.FC = () => {
  const { f, ev, pal } = useCena();
  const s = ev("suor");
  const fim = pal("chegou a vez") - 3;
  if (s === undefined || f < s || f >= fim) return null;
  const gotas = [
    [490, 450, 0],
    [520, 560, 6],
    [205, 500, 3],
    [470, 660, 11],
  ];
  return (
    <AbsoluteFill style={{ opacity: saindo(f, fim) }}>
      {gotas.map(([x, y, atraso], i) => {
        const d = f - s - atraso;
        if (d < 0) return null;
        const cai = ((d % 26) / 26) * 70;
        const op = interpolate(d % 26, [0, 4, 20, 26], [0, 1, 1, 0], clamp);
        return (
          <svg key={i} width={46} height={64} viewBox="0 0 46 64" style={{ position: "absolute", left: x - 23, top: y + cai, opacity: op, filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.4))" }}>
            <path d="M23 2 C 30 20, 44 32, 44 44 C 44 56, 34 62, 23 62 C 12 62, 2 56, 2 44 C 2 32, 16 20, 23 2 Z" fill="#8FD3FF" stroke="#2E7FBF" strokeWidth={3} />
            <ellipse cx={16} cy={42} rx={5} ry={8} fill="#FFFFFF" opacity={0.75} />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};

const Branco: React.FC = () => {
  const { f, ev, pal } = useCena();
  const fl = ev("flash");
  const c = ev("congela");
  const fim = Math.max(pal("Todo mundo") - 3, (c ?? 0) + 39); // o balão fica enquanto a imagem está congelada (1,3 s)
  if (fl === undefined || f < fl || f >= fim) return null;
  const flash = interpolate(f - (c ?? fl), [0, 2, 10], [0, 0.95, 0], clamp);
  return (
    <>
      {c !== undefined && f >= c && <Balao texto="…" cx={800} y={330} alvo={[610, 760]} d={f - c - 3} op={saindo(f, fim)} tam={90} />}
      <AbsoluteFill style={{ backgroundColor: "#FFFFFF", opacity: flash }} />
    </>
  );
};

const PASSOS = ["EXAME DE CONSCIÊNCIA", "ARREPENDIMENTO", "CONFISSÃO", "ATO DE CONTRIÇÃO", "ABSOLVIÇÃO E PENITÊNCIA"];
const CincoPassos: React.FC = () => {
  const { f, ev, pal, cena } = useCena();
  const ini = pal("Todo mundo") - 3;
  const p = ev("passos");
  return (
    <>
      <Desfoque de={ini} ate={cena.duracao} />
      {p !== undefined && f >= p && (
        <div style={{ position: "absolute", left: AREA.esquerda + 10, width: LARGURA - 20, top: 420, display: "flex", flexDirection: "column", gap: 22, opacity: saindo(f, cena.duracao) }}>
          {PASSOS.map((t, i) => {
            const d = f - p - i * 7;
            if (d < 0) return <div key={i} style={{ height: 108 }} />;
            const x = interpolate(d, [0, 7], [520, 0], { ...clamp, easing: Easing.out(Easing.back(1.3)) });
            const giro = interpolate(d, [0, 7], [8, i % 2 ? -1.2 : 1.2], clamp);
            return (
              <div key={i} style={{ height: 108, display: "flex", alignItems: "center", gap: 22, padding: "0 26px", backgroundColor: "rgba(24,17,10,0.9)", border: `3px solid ${OURO}`, borderRadius: 18, boxShadow: "0 12px 26px rgba(0,0,0,0.5)", transform: `translateX(${x}px) rotate(${giro}deg)` }}>
                <div style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: OURO_FORTE, color: "#1A1208", fontFamily: SERIFA, fontWeight: 700, fontSize: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                <div style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: t.length > 18 ? 36 : 44, letterSpacing: "0.04em", color: CREME, whiteSpace: "nowrap" }}>{t}</div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

// ───────────────────────── exame
const PERGUNTAS = [
  { n: "1º", t: "Amei a Deus acima de tudo?", ev: "q1", marca: "ok" },
  { n: "3º", t: "Faltei à missa de domingo sem motivo?", ev: "q2", marca: "ok" },
  { n: "4º", t: "Honrei pai e mãe?", ev: "q3", marca: "x" },
];
const Caderno: React.FC = () => {
  const { f, ev, pal } = useCena();
  const ini = pal("Amei a Deus") - 3;
  const fim = pal("O frango manda") - 3;
  if (f < ini - 8 || f >= fim) return null;
  const d0 = f - ini;
  const e = pop(d0, 0, 9);
  return (
    <>
      <Desfoque de={ini} ate={fim} />
      <div style={{ position: "absolute", left: 140, width: 800, top: 430, opacity: saindo(f, fim), transform: `rotate(-2deg) scale(${e})` }}>
        <div style={{ position: "relative", backgroundColor: "#FBF6E8", borderRadius: 10, padding: "40px 40px 34px 96px", boxShadow: "0 22px 50px rgba(0,0,0,0.55)", backgroundImage: "repeating-linear-gradient(180deg, transparent 0px, transparent 67px, #BFD3EA 67px, #BFD3EA 70px)" }}>
          <div style={{ position: "absolute", left: 70, top: 0, bottom: 0, width: 3, backgroundColor: "#E58C8C" }} />
          <div style={{ fontFamily: TITULO, fontSize: 46, color: TINTA, letterSpacing: "0.02em", marginBottom: 18 }}>EXAME DE CONSCIÊNCIA</div>
          {PERGUNTAS.map((q, i) => {
            const a = ev(q.ev);
            const prox = i < 2 ? ev(PERGUNTAS[i + 1].ev) : ev("xis");
            if (a === undefined || f < a) return <div key={i} style={{ height: 112 }} />;
            const escreve = interpolate(f - a, [0, 12], [0, 100], clamp);
            const marca = prox !== undefined ? interpolate(f - (prox - (i < 2 ? 6 : 0)), [0, 7], [0, 1], clamp) : 0;
            return (
              <div key={i} style={{ height: 112, display: "flex", alignItems: "center", gap: 18 }}>
                <svg width={64} height={64} viewBox="0 0 64 64" style={{ flexShrink: 0, overflow: "visible" }}>
                  <rect x={6} y={6} width={52} height={52} rx={6} fill="none" stroke={TINTA} strokeWidth={4} />
                  {q.marca === "ok" ? (
                    <Traco d="M14 34 L28 48 L58 6" t={marca} cor="#3B4A3F" comprimento={80} largura={8} />
                  ) : (
                    <>
                      <Traco d="M8 8 L58 58" t={marca} cor="#D0312D" comprimento={72} largura={10} />
                      <Traco d="M58 8 L8 58" t={interpolate(marca, [0.5, 1], [0, 1], clamp)} cor="#D0312D" comprimento={72} largura={10} />
                    </>
                  )}
                </svg>
                <div style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: 33, lineHeight: 1.1, color: TINTA, clipPath: `inset(0 ${100 - escreve}% 0 0)` }}>
                  <span style={{ color: "#8C3B2A" }}>{q.n}</span> {q.t}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

// ───────────────────────── arrependimento
const DorProposito: React.FC = () => {
  const { f, ev, pal } = useCena();
  const a = ev("dor");
  const fim = pal("Se a contrição") - 2;
  if (a === undefined || f < a || f >= fim) return null;
  const b = ev("proposito") ?? Infinity;
  const ease = { ...clamp, easing: Easing.out(Easing.back(1.5)) };
  const xa = interpolate(f - a, [0, 9], [-600, 0], ease);
  const xb = interpolate(f - b, [0, 9], [600, 0], ease);
  const mais = f >= b + 6 ? pop(f, b + 6, 7) : 0;
  const palavra: React.CSSProperties = { fontFamily: SERIFA, fontWeight: 700, fontSize: 76, letterSpacing: "0.06em", color: CREME, textShadow: "0 6px 22px rgba(0,0,0,0.75), 0 2px 3px rgba(0,0,0,0.6)" };
  return (
    <>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 44%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.45) 64%, rgba(0,0,0,0) 70%)", opacity: saindo(f, fim) }} />
      <div style={{ position: "absolute", left: AREA.esquerda - 40, width: LARGURA + 80, top: 950, display: "flex", justifyContent: "center", alignItems: "center", gap: 24, opacity: saindo(f, fim) }}>
        <span style={{ ...palavra, transform: `translateX(${xa}px)` }}>DOR</span>
        <span style={{ ...palavra, color: OURO_FORTE, transform: `scale(${mais})` }}>+</span>
        {f >= b && <span style={{ ...palavra, transform: `translateX(${xb}px)` }}>PROPÓSITO</span>}
      </div>
    </>
  );
};

const Coracao: React.FC<{ tam: number; cor: string }> = ({ tam, cor }) => (
  <svg width={tam} height={tam} viewBox="0 0 64 58">
    <path d="M32 56 C 6 38, 0 24, 6 12 C 12 0, 28 2, 32 14 C 36 2, 52 0, 58 12 C 64 24, 58 38, 32 56 Z" fill={cor} />
  </svg>
);

const Cartoes: React.FC = () => {
  const { f, ev, cena } = useCena();
  const p = ev("perfeita");
  if (p === undefined || f < p) return null;
  const im = ev("imperfeita") ?? Infinity;
  const js = ev("jaserve") ?? Infinity;
  const acesoE = f < im ? interpolate(f - p, [4, 10], [0, 1], clamp) : interpolate(f - im, [0, 6], [1, 0.35], clamp);
  const acesoD = interpolate(f - im, [0, 6], [0, 1], clamp);
  const cartao = (titulo: string, sub: string, ref: string, aceso: number, icone: React.ReactNode, d: number, selo: boolean) => (
    <div style={{ width: 380, minHeight: 470, borderRadius: 24, padding: "30px 24px", backgroundColor: aceso > 0.5 ? "rgba(36,26,12,0.95)" : "rgba(24,18,12,0.8)", border: `4px solid ${aceso > 0.5 ? OURO_FORTE : "#6E5A3A"}`, boxShadow: `0 16px 34px rgba(0,0,0,0.5), 0 0 ${40 * aceso}px rgba(242,193,78,${0.6 * aceso})`, opacity: 0.45 + 0.55 * Math.max(aceso, 0.2), display: "flex", flexDirection: "column", alignItems: "center", gap: 18, transform: `scale(${pop(d, 0, 9) * (0.94 + 0.06 * aceso)})`, position: "relative" }}>
      {icone}
      <div style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: 46, letterSpacing: "0.05em", color: aceso > 0.5 ? OURO_FORTE : CREME }}>{titulo}</div>
      <div style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: 31, lineHeight: 1.2, color: CREME, textAlign: "center" }}>{sub}</div>
      <div style={{ marginTop: "auto", fontFamily: SERIFA, fontWeight: 700, fontSize: 24, letterSpacing: "0.12em", color: OURO }}>{ref}</div>
      {selo && f >= js && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center" }}>
          <CarimboVermelho texto="JÁ SERVE" d={f - js} tam={44} giro={-10} />
        </div>
      )}
    </div>
  );
  return (
    <>
      <Desfoque de={p} ate={cena.duracao} />
      <div style={{ position: "absolute", left: AREA.esquerda - 30, width: LARGURA + 60, top: 520, display: "flex", justifyContent: "center", gap: 28, opacity: saindo(f, cena.duracao) }}>
        {cartao("PERFEITA", "nasce do amor a Deus", "CATECISMO 1452", acesoE, <Coracao tam={84} cor={acesoE > 0.5 ? OURO_FORTE : "#8A7550"} />, f - p, false)}
        {f >= im - 10 ? cartao("IMPERFEITA", "nasce do medo das consequências", "CATECISMO 1453", acesoD, <svg width={84} height={84} viewBox="0 0 84 84"><circle cx={42} cy={42} r={36} fill="none" stroke={acesoD > 0.5 ? OURO_FORTE : "#8A7550"} strokeWidth={8} /><path d="M42 20 L42 46" stroke={acesoD > 0.5 ? OURO_FORTE : "#8A7550"} strokeWidth={8} strokeLinecap="round" /><circle cx={42} cy={60} r={5} fill={acesoD > 0.5 ? OURO_FORTE : "#8A7550"} /></svg>, f - (im - 10), true) : <div style={{ width: 380 }} />}
      </div>
    </>
  );
};

// ───────────────────────── na hora
const MiniLista: React.FC = () => {
  const { f, ev, pal } = useCena();
  const fim = pal("Não é hora de explicar") - 3;
  const itens = [
    ["SINAL DA CRUZ", ev("l1")],
    ["ÚLTIMA CONFISSÃO", ev("l2")],
    ["OS PECADOS", ev("l3")],
  ] as const;
  if (f >= fim) return null;
  return (
    <div style={{ position: "absolute", left: AREA.esquerda, top: 400, display: "flex", flexDirection: "column", gap: 14, opacity: saindo(f, fim) }}>
      {itens.map(([t, e], i) =>
        e === undefined || f < e ? null : (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, transform: `scale(${pop(f, e, 8)})`, transformOrigin: "0 50%" }}>
            <div style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: OURO_FORTE, color: "#1A1208", fontFamily: SERIFA, fontWeight: 700, fontSize: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
            <div style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: 30, letterSpacing: "0.03em", color: CREME, backgroundColor: "rgba(18,13,10,0.82)", border: `2px solid ${OURO}`, borderRadius: 12, padding: "8px 16px", whiteSpace: "nowrap" }}>{t}</div>
          </div>
        ),
      )}
    </div>
  );
};

const NaoEHora: React.FC = () => {
  const { f, ev, pal } = useCena();
  const n = ev("naoehora");
  const fim = pal("Ali você") - 3;
  if (n === undefined || f < n || f >= fim) return null;
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: 560, display: "flex", justifyContent: "center", opacity: saindo(f, fim) }}>
      <CarimboVermelho texto="NÃO É HORA" d={f - n} tam={92} giro={-12} />
    </div>
  );
};

const Tribunal: React.FC = () => {
  const { f, ev, pal } = useCena();
  const ini = pal("Ali você") - 3;
  const fim = pal("E o Juiz") - 3;
  const pl = ev("placa");
  if (pl === undefined || f < pl || f >= fim) return null;
  const reu = ev("reu") ?? Infinity;
  const risco = interpolate(f - reu, [0, 6], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: Math.min(saindo(f, fim), interpolate(f, [ini, ini + 4], [0, 1], clamp)) }}>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1060, display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", transform: `scale(${pop(f, pl, 8)}) rotate(-2deg)`, padding: "14px 34px", background: "linear-gradient(180deg, #E9C987, #B98B3E)", border: "5px solid #6B4A1C", borderRadius: 10, boxShadow: "0 14px 30px rgba(0,0,0,0.55)" }}>
          <div style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: 50, letterSpacing: "0.06em", color: "#2A1B08", whiteSpace: "nowrap" }}>ADVOGADO DE DEFESA</div>
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <line x1={-2} y1={60} x2={-2 + 104 * risco} y2={40} stroke="#D0312D" strokeWidth={9} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>
      {f >= reu + 4 && (
        <div style={{ position: "absolute", left: 0, width: 1080, top: 880, display: "flex", justifyContent: "center" }}>
          <CarimboVermelho texto="RÉU CONFESSO" d={f - reu - 4} tam={78} giro={-8} />
        </div>
      )}
    </AbsoluteFill>
  );
};

const Senha: React.FC = () => {
  const { f, ev, pal } = useCena();
  const s = ev("senha");
  const fim = pal("Quer conversar") - 3;
  if (s === undefined || f < s || f >= fim) return null;
  const troca = ev("senha2") ?? Infinity;
  const num = f >= troca ? "048" : "047";
  const pisca = f >= troca && f < troca + 12 ? (Math.floor((f - troca) / 3) % 2 ? 0.35 : 1) : 1;
  return (
    <div style={{ position: "absolute", left: 600, top: 300, opacity: saindo(f, fim), transform: `scale(${pop(f, s, 8)})`, transformOrigin: "100% 0" }}>
      <div style={{ backgroundColor: "#141414", border: "5px solid #4A4A4A", borderRadius: 14, padding: "10px 22px 12px", boxShadow: "0 12px 28px rgba(0,0,0,0.6)", textAlign: "center" }}>
        <div style={{ fontFamily: LEGENDA, fontWeight: 900, fontSize: 26, letterSpacing: "0.22em", color: "#D9D9D9" }}>SENHA</div>
        <div style={{ fontFamily: TITULO, fontSize: 96, lineHeight: 1, letterSpacing: "0.1em", color: "#FF4A3A", textShadow: "0 0 18px rgba(255,74,58,0.85)", opacity: pisca, fontVariantNumeric: "tabular-nums" }}>{num}</div>
      </div>
    </div>
  );
};

const Susto: React.FC = () => {
  const { f, ev, pal } = useCena();
  const s = ev("susto");
  const ini = pal("Fica tranquilo") - 3;
  if (s === undefined || f < s) return null;
  const fr = ev("frango") ?? Infinity;
  // o ponteiro nem se mexe: só um tremidinho de nada quando o frango aparece
  const tremido = f >= fr && f < fr + 14 ? Math.sin((f - fr) * 1.8) * 1.5 : 0;
  const ang = -82 + tremido;
  return (
    <div style={{ position: "absolute", left: AREA.esquerda, top: 720, opacity: Math.min(interpolate(f, [ini, ini + 4], [0, 1], clamp), 1), transform: `scale(${pop(f, s, 9)})`, transformOrigin: "0 50%" }}>
      <div style={{ width: 340, padding: "18px 18px 14px", backgroundColor: "rgba(18,13,10,0.88)", border: `3px solid ${OURO}`, borderRadius: 20, boxShadow: "0 14px 30px rgba(0,0,0,0.5)", textAlign: "center" }}>
        <div style={{ fontFamily: LEGENDA, fontWeight: 900, fontSize: 28, letterSpacing: "0.12em", color: CREME, marginBottom: 6 }}>MEDIDOR DE SUSTO</div>
        <svg width={300} height={170} viewBox="0 0 300 170">
          <path d="M30 150 A 120 120 0 0 1 270 150" fill="none" stroke="#3A3A3A" strokeWidth={26} />
          <path d="M30 150 A 120 120 0 0 1 90 46" fill="none" stroke="#4CAF50" strokeWidth={26} />
          <path d="M90 46 A 120 120 0 0 1 210 46" fill="none" stroke="#F2C14E" strokeWidth={26} />
          <path d="M210 46 A 120 120 0 0 1 270 150" fill="none" stroke="#D0312D" strokeWidth={26} />
          <g transform={`rotate(${ang} 150 150)`}>
            <line x1={150} y1={150} x2={150} y2={44} stroke={CREME} strokeWidth={8} strokeLinecap="round" />
          </g>
          <circle cx={150} cy={150} r={14} fill={CREME} />
        </svg>
        <div style={{ fontFamily: TITULO, fontSize: 40, color: "#7FD67F", letterSpacing: "0.06em" }}>0%</div>
      </div>
    </div>
  );
};

// ───────────────────────── ato de contrição
const ATO =
  "Meu Deus, eu me arrependo, de todo coração de todos meus pecados e os detesto, porque pecando não só mereci as penas que justamente estabelecestes, mas principalmente porque Vos ofendi a Vós, sumo bem e digno de ser amado sobre todas as coisas. Por isso, proponho firmemente, com a ajuda da vossa graça, não mais pecar e fugir das ocasiões próximas de pecar. Amém.";
const AtoCartao: React.FC = () => {
  const { f, ev, cena } = useCena();
  const a = ev("ato");
  if (a === undefined || f < a - 8) return null;
  const sv = ev("salva") ?? Infinity;
  const pulso = f >= sv + 8 ? 1 + 0.05 * Math.max(0, Math.sin((f - sv - 8) * 0.35)) : 1;
  return (
    <>
      <Desfoque de={a - 4} ate={cena.duracao} />
      <div style={{ position: "absolute", left: 110, width: 860, top: 330, opacity: saindo(f, cena.duracao), transform: `scale(${pop(f, a, 10)})` }}>
        <div style={{ position: "relative", borderRadius: 18, padding: "38px 46px 34px", background: "radial-gradient(ellipse at 50% 40%, #F7ECCF 0%, #EAD7A8 70%, #D9BE82 100%)", boxShadow: "0 26px 60px rgba(0,0,0,0.6), inset 0 0 40px rgba(120,80,20,0.35)", border: "3px solid #B08A48" }}>
          <div style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: 52, letterSpacing: "0.08em", color: "#5A3410", textAlign: "center", marginBottom: 18 }}>ATO DE CONTRIÇÃO</div>
          <div style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: 33, lineHeight: 1.38, color: "#2E1C08", textAlign: "left" }}>{ATO}</div>
          <div style={{ marginTop: 16, fontFamily: SERIFA, fontWeight: 700, fontSize: 22, letterSpacing: "0.1em", color: "#7A5A2A" }}>FÓRMULA DIVULGADA PELA CNBB</div>
          {/* cantoneiras de captura de tela: aparecem no "print" */}
          {f >= sv && (
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: -14, width: "calc(100% + 28px)", height: "calc(100% + 28px)", overflow: "visible", opacity: interpolate(f - sv, [0, 3, 18, 26], [0, 1, 1, 0], clamp) }}>
              {["M0 8 V0 H8", "M92 0 H100 V8", "M100 92 V100 H92", "M8 100 H0 V92"].map((d, i) => (
                <path key={i} d={d} fill="none" stroke="#FFFFFF" strokeWidth={6} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
              ))}
            </svg>
          )}
        </div>
        {/* chamada para printar a tela */}
        {f >= sv && (
          <div style={{ marginTop: 26, display: "flex", justifyContent: "center", transform: `scale(${pop(f, sv, 8) * pulso})` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, backgroundColor: OURO_FORTE, borderRadius: 40, padding: "12px 30px 12px 22px", boxShadow: "0 12px 28px rgba(0,0,0,0.5)" }}>
              <svg width={46} height={46} viewBox="0 0 46 46">
                <rect x={11} y={4} width={24} height={38} rx={5} fill="none" stroke="#1A1208" strokeWidth={4} />
                <path d="M2 12 V2 H12 M34 2 H44 V12 M44 34 V44 H34 M12 44 H2 V34" fill="none" stroke="#1A1208" strokeWidth={4} strokeLinecap="round" />
              </svg>
              <div style={{ fontFamily: LEGENDA, fontWeight: 900, fontSize: 38, letterSpacing: "0.03em", color: "#1A1208", whiteSpace: "nowrap" }}>PRINTE A TELA E LEVE NA FILA</div>
            </div>
          </div>
        )}
      </div>
      {/* clarão do print */}
      {f >= sv && f < sv + 8 && <AbsoluteFill style={{ backgroundColor: "#FFFFFF", opacity: interpolate(f - sv, [0, 1, 8], [0, 0.8, 0], clamp) }} />}
    </>
  );
};

// ───────────────────────── absolvição
const Duvida: React.FC = () => {
  const { f, ev, pal } = useCena();
  const d = ev("duvida");
  const fim = pal("Porque Jesus quis") - 3;
  if (d === undefined || f < d || f >= fim) return null;
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: 1060, display: "flex", justifyContent: "center", opacity: saindo(f, fim), transform: `scale(${pop(f, d, 9)})`, transformOrigin: "50% 100%" }}>
      <div style={{ position: "relative" }}>
        <div style={{ fontFamily: LEGENDA, fontWeight: 900, fontSize: 48, color: "#2C2C2C", backgroundColor: "#E3E3E3", borderRadius: 40, padding: "16px 34px", boxShadow: "0 10px 26px rgba(0,0,0,0.45)", whiteSpace: "nowrap" }}>POR QUE UM PADRE?</div>
        <div style={{ position: "absolute", left: "50%", bottom: -24, marginLeft: -16, width: 0, height: 0, borderLeft: "16px solid transparent", borderRight: "16px solid transparent", borderTop: "28px solid #E3E3E3" }} />
      </div>
    </div>
  );
};

const FraseJo: React.FC = () => {
  const { f, ev, pal } = useCena();
  const a = ev("f1");
  const fim = pal("Essa missão") - 3;
  if (a === undefined || f < a || f >= fim) return null;
  const linhas = [
    ["“Recebei o Espírito Santo.", ev("f1")],
    ["A quem perdoardes os pecados, ser-lhes-ão perdoados;", ev("f2")],
    ["a quem os retiverdes, ser-lhes-ão retidos.”", ev("f3")],
  ] as const;
  return (
    <AbsoluteFill style={{ opacity: saindo(f, fim) }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 28%, rgba(10,7,4,0.72) 38%, rgba(10,7,4,0.72) 66%, rgba(0,0,0,0) 74%)", opacity: interpolate(f - a, [0, 10], [0, 1], clamp) }} />
      <div style={{ position: "absolute", left: AREA.esquerda, width: LARGURA, top: 650, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        {linhas.map(([t, e], i) =>
          e === undefined || f < e ? null : (
            <div key={i} style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: i === 0 ? 58 : 46, lineHeight: 1.2, letterSpacing: "0.02em", color: i === 0 ? OURO_FORTE : CREME, textAlign: "center", textShadow: "0 4px 18px rgba(0,0,0,0.8)", opacity: interpolate(f - e, [0, 10], [0, 1], clamp), transform: `translateY(${interpolate(f - e, [0, 10], [16, 0], clamp)}px)` }}>
              {t}
            </div>
          ),
        )}
        {ev("f3") !== undefined && f >= ev("f3")! + 8 && (
          <div style={{ marginTop: 8, fontFamily: SERIFA, fontWeight: 700, fontSize: 30, letterSpacing: "0.2em", color: OURO, opacity: interpolate(f - ev("f3")! - 8, [0, 8], [0, 1], clamp) }}>JO 20,22-23</div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const Corrente: React.FC = () => {
  const { f, ev, pal } = useCena();
  const c1 = ev("c1");
  const fim = pal("Quem perdoa") - 3;
  if (c1 === undefined || f < c1 - 6 || f >= fim) return null;
  const elos = [
    ["APÓSTOLOS", ev("c1")],
    ["BISPOS", ev("c2")],
    ["PADRES", ev("c3")],
  ] as const;
  return (
    <div style={{ position: "absolute", left: AREA.esquerda - 40, width: LARGURA + 80, top: 1040, display: "flex", justifyContent: "center", alignItems: "center", gap: 10, opacity: saindo(f, fim) }}>
      {elos.map(([t, e], i) => {
        const aceso = e === undefined ? 0 : interpolate(f - e, [0, 6], [0, 1], clamp);
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <svg width={52} height={40} viewBox="0 0 52 40" style={{ opacity: 0.4 + 0.6 * aceso }}>
                <path d="M4 20 H40 M30 8 L44 20 L30 32" fill="none" stroke={aceso > 0.5 ? OURO_FORTE : "#8A7550"} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <div style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: 36, letterSpacing: "0.06em", color: aceso > 0.5 ? "#1A1208" : CREME, backgroundColor: aceso > 0.5 ? OURO_FORTE : "rgba(18,13,10,0.85)", border: `3px solid ${OURO}`, borderRadius: 40, padding: "10px 20px 8px", boxShadow: `0 10px 24px rgba(0,0,0,0.5), 0 0 ${30 * aceso}px rgba(242,193,78,${0.7 * aceso})`, transform: `scale(${0.92 + 0.08 * aceso})` }}>
              {t}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

const Sigilo: React.FC = () => {
  const { f, ev, pal } = useCena();
  const c = ev("cadeado");
  const fim = pal("Depois, é cumprir") - 3;
  if (c === undefined || f < c || f >= fim) return null;
  const d = f - c;
  const cai = interpolate(d, [0, 6], [-160, 0], { ...clamp, easing: Easing.out(Easing.bounce) });
  const tremor = d >= 6 && d < 14 ? Math.sin(d * 2.6) * 5 : 0;
  return (
    <div style={{ position: "absolute", left: 760, width: 240, top: 520, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: saindo(f, fim), transform: `translateY(${cai}px) scale(1.5)`, transformOrigin: "50% 0" }}>
      <div style={{ filter: "drop-shadow(0 0 18px rgba(242,193,78,0.8)) drop-shadow(0 10px 14px rgba(0,0,0,0.6))" }}>
        <Cadeado aberto={0} vermelho={0} tremor={tremor} />
      </div>
      <div style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: 26, letterSpacing: "0.2em", color: "#1A1208", backgroundColor: OURO_FORTE, borderRadius: 8, padding: "4px 12px 2px" }}>SIGILO</div>
    </div>
  );
};

// ───────────────────────── fecho
const MaisFrango: React.FC = () => {
  const { f, ev, pal } = useCena();
  const fim = pal("Moral") - 2;
  if (f >= fim) return null;
  return <Balao texto={"TEM MAIS\nFRANGO, MÃE?"} cx={370} y={320} alvo={[330, 860]} d={f - (ev("mais") ?? Infinity)} op={saindo(f, fim)} tam={46} />;
};

// ───────────────────────── anexos presos à imagem (acompanham a câmera do plano)
export const AnexoEp04: React.FC<{ nome: string }> = ({ nome }) => {
  const { f, ev } = useCena();
  if (nome === "ep04-frango") {
    const l = ev("lembrancas");
    if (l === undefined || f < l) return null;
    const e = pop(f, l, 8);
    return (
      <div style={{ position: "absolute", left: 520, top: 1040, transform: `scale(${e}) rotate(6deg)`, transformOrigin: "20px 260px" }}>
        <div style={{ position: "absolute", left: 16, top: 40, width: 8, height: 220, backgroundColor: "#D9B77A", borderRadius: 4, boxShadow: "1px 1px 2px rgba(0,0,0,0.4)" }} />
        <div style={{ position: "absolute", left: 22, top: 30, padding: "10px 16px 8px", backgroundColor: "#FFFDF4", border: "2px solid #C9B48A", boxShadow: "0 4px 10px rgba(0,0,0,0.35)", fontFamily: TITULO, fontSize: 40, color: "#B3261E", whiteSpace: "nowrap", transform: "rotate(-4deg)" }}>LEMBRANÇAS!</div>
      </div>
    );
  }
  if (nome === "ep04-cavalete") {
    return (
      <div style={{ position: "absolute", left: 46, top: 880, width: 270, transform: "rotate(-3deg)", fontFamily: TITULO, color: "#1F3A8A", lineHeight: 1.05, opacity: 0.92 }}>
        <div style={{ fontSize: 40 }}>POR QUE EU</div>
        <div style={{ fontSize: 40 }}>DERRUBEI</div>
        <div style={{ fontSize: 40 }}>O COPO:</div>
        <div style={{ fontSize: 30, color: "#B3261E", marginTop: 4 }}>UMA ANÁLISE</div>
        <svg width={230} height={150} viewBox="0 0 230 150" style={{ marginTop: 14 }}>
          <path d="M10 140 H220 M10 140 V10" stroke="#1F3A8A" strokeWidth={5} fill="none" strokeLinecap="round" />
          <rect x={30} y={90} width={36} height={50} fill="#B3261E" />
          <rect x={86} y={55} width={36} height={85} fill="#1F3A8A" />
          <rect x={142} y={20} width={36} height={120} fill="#2E7D32" />
          <path d="M30 80 L100 50 L170 14" stroke="#F2A900" strokeWidth={5} fill="none" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  if (nome === "ep04-agenda") {
    const c = ev("circulo");
    if (c === undefined || f < c) return null;
    const t = interpolate(f - c, [0, 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    return (
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <ellipse cx={610} cy={1170} rx={92} ry={62} fill="none" stroke={OURO_FORTE} strokeWidth={10} strokeLinecap="round" strokeDasharray={520} strokeDashoffset={520 * (1 - t)} transform="rotate(-8 610 1170)" style={{ filter: "drop-shadow(0 0 10px rgba(242,193,78,0.9))" }} />
      </svg>
    );
  }
  return null;
};

export const GraficosEp04: React.FC = () => {
  const { cena } = useCena();
  return (
    <>
      <Veus />
      {cena.id === "abertura" && (
        <>
          <Suor />
          <Branco />
          <CincoPassos />
        </>
      )}
      {cena.id === "exame" && <Caderno />}
      {cena.id === "arrependimento" && (
        <>
          <DorProposito />
          <Cartoes />
        </>
      )}
      {cena.id === "na-hora" && (
        <>
          <MiniLista />
          <NaoEHora />
          <Tribunal />
          <Senha />
          <Susto />
        </>
      )}
      {cena.id === "ato" && <AtoCartao />}
      {cena.id === "absolvicao" && (
        <>
          <Duvida />
          <FraseJo />
          <Corrente />
          <Sigilo />
        </>
      )}
      {cena.id === "fecho" && <MaisFrango />}
    </>
  );
};
