// Grafismos do ep. 2 ("O papa nunca erra?"): grupo da família no celular, etiquetas, cadeados do cofre,
// janela de atualização negada, contador de anos, placar das Copas, PEDRO → PEDRA e a resposta no grupo.
// Coordenadas em px do quadro 1080 x 1920; a área segura está em AREA.
import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { LEGENDA, SERIFA } from "../lib/fontes";
import { pop } from "../lib/anim";
import { AREA } from "../components/motor/area";
import { useCena } from "../components/motor/contexto";

const CREME = "#F6EBD3";
const OURO = "#EBCB86";
const OURO_FORTE = "#F2C14E";
const FUNDO = "rgba(18,13,10,0.82)";
const VERMELHO = "#C8302B";
const SOMBRA = "0 4px 22px rgba(0,0,0,0.6), 0 2px 3px rgba(0,0,0,0.55)";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const LARGURA = AREA.direita - AREA.esquerda;

/** Carimbo vermelho de impacto (entra grande e assenta). */
const CarimboVermelho: React.FC<{ texto: string; d: number; tam?: number; giro?: number; sub?: string }> = ({ texto, d, tam = 64, giro = -7, sub }) => {
  if (d < 0) return null;
  const e = interpolate(d, [0, 3, 6], [2.2, 0.94, 1], clamp);
  const op = interpolate(d, [0, 2], [0, 1], clamp);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `rotate(${giro}deg) scale(${e})`, opacity: op }}>
      <div
        style={{
          fontFamily: SERIFA,
          fontWeight: 700,
          fontSize: tam,
          letterSpacing: "0.08em",
          color: "#FFF4EC",
          backgroundColor: "rgba(150,22,18,0.9)",
          border: `5px double #FFD9CF`,
          padding: "8px 28px 6px",
          boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
          whiteSpace: "nowrap",
        }}
      >
        {texto}
      </div>
      {sub && <div style={{ marginTop: 10, fontFamily: SERIFA, fontWeight: 700, fontSize: 30, letterSpacing: "0.1em", color: OURO, backgroundColor: FUNDO, padding: "4px 14px", border: `2px solid ${OURO}` }}>{sub}</div>}
    </div>
  );
};

// ───────────────────────── 1. grupo da família (anexo do plano s01, preso à tela do celular)
/** Tela do celular na imagem s01: os quatro cantos medidos no quadro 1080 x 1920 (a tela está em perspectiva),
 * convertidos numa homografia que leva o retângulo 300 x 700 da conversa exatamente para dentro da tela. */
export const TELA_S01 = { l: 300, a: 700, matriz: "matrix3d(1.16489, -0.017786197, 0, 0.00015474048, 0.23746407, 1.0436434, 0, -1.1250624e-06, 0, 0, 1, 0, 291.9904, 534.7113, 0, 1)" };

const Bolha: React.FC<{ d: number; children: React.ReactNode; carimbo: number }> = ({ d, children, carimbo }) => {
  if (d < 0) return null;
  const e = pop(d, 0, 8);
  return (
    <div style={{ position: "relative", alignSelf: "flex-start", maxWidth: "88%", transform: `scale(${e})`, transformOrigin: "0% 100%" }}>
      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "4px 16px 16px 16px", padding: "8px 12px 10px", boxShadow: "0 1px 1px rgba(0,0,0,0.18)" }}>
        <div style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: 15, color: "#C2185B", marginBottom: 2 }}>Tia</div>
        {children}
      </div>
      {carimbo >= 0 && (
        <div style={{ position: "absolute", right: -26, bottom: -12 }}>
          <CarimboVermelho texto="DOGMA" d={carimbo} tam={15} giro={-12} />
        </div>
      )}
    </div>
  );
};

export const ChatGrupo: React.FC = () => {
  const { f, ev } = useCena();
  const T = TELA_S01;
  const m1 = f - (ev("msg1") ?? Infinity);
  const m2 = f - (ev("msg2") ?? Infinity);
  const m3 = f - (ev("msg3") ?? Infinity);
  const dg = f - (ev("dogma") ?? Infinity);
  const texto: React.CSSProperties = { fontFamily: LEGENDA, fontWeight: 800, fontSize: 19, lineHeight: 1.2, color: "#1B1B1B", whiteSpace: "nowrap" };
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: T.l,
        height: T.a,
        transform: T.matriz,
        transformOrigin: "0 0",
        borderRadius: 26,
        overflow: "hidden",
        backgroundColor: "#ECE5DD",
        boxShadow: "inset 0 0 18px rgba(0,0,0,0.25)",
        filter: "saturate(0.95)",
      }}
    >
      <div style={{ height: 86, backgroundColor: "#075E54", display: "flex", alignItems: "flex-end", padding: "0 14px 12px", gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#F2C14E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🙏</div>
        <div>
          <div style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: 19, color: "#FFFFFF" }}>Família ❤️</div>
          <div style={{ fontFamily: LEGENDA, fontWeight: 500, fontSize: 13, color: "#CFE9E4" }}>Tia está digitando...</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "26px 14px" }}>
        <Bolha d={m1} carimbo={dg}>
          <div style={texto}>O PAPA DISSE!!! 🙏🙏</div>
        </Bolha>
        <Bolha d={m2} carimbo={dg - 4}>
          <div style={texto}>COMPARTILHEM!!! 🔥🔥</div>
        </Bolha>
        <Bolha d={m3} carimbo={dg - 8}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderLeft: "16px solid #54656F" }} />
            <svg width={120} height={26} viewBox="0 0 120 26">
              {Array.from({ length: 24 }).map((_, i) => {
                const h = 6 + 16 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6));
                return <rect key={i} x={i * 5} y={13 - h / 2} width={3} height={h} rx={1.5} fill="#8696A0" />;
              })}
            </svg>
            <div style={{ fontFamily: LEGENDA, fontWeight: 700, fontSize: 15, color: "#667781" }}>3:07</div>
          </div>
        </Bolha>
      </div>
    </div>
  );
};

// ───────────────────────── 2. etiquetas do que não é infalível
const Etiquetas: React.FC = () => {
  const { f, ev, pal } = useCena();
  const fim = pal("O papa erra") - 2;
  if (f >= fim || ev("et1") === undefined || f < ev("et1")!) return null;
  const itens: [string, string][] = [
    ["🎤", "ENTREVISTA"],
    ["📖", "LIVRO"],
    ["📱", "POST"],
  ];
  const n = f - (ev("naoE") ?? Infinity);
  const saida = interpolate(f, [fim - 6, fim], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: AREA.esquerda - 40, width: LARGURA + 80, top: 1010, opacity: saida }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>
        {itens.map(([icone, texto], i) => {
          const e = ev(`et${i + 1}`);
          if (e === undefined || f < e) return <div key={texto} style={{ width: 0 }} />;
          return (
            <div
              key={texto}
              style={{
                transform: `scale(${pop(f, e, 8)})`,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: LEGENDA,
                fontWeight: 800,
                fontSize: 32,
                letterSpacing: "0.04em",
                color: CREME,
                backgroundColor: FUNDO,
                border: `2px solid ${OURO}`,
                borderRadius: 14,
                padding: "10px 16px",
                filter: n >= 0 ? "grayscale(0.6) brightness(0.8)" : undefined,
              }}
            >
              <span style={{ fontSize: 30 }}>{icone}</span>
              {texto}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: -14, display: "flex", justifyContent: "center" }}>
        <CarimboVermelho texto="NÃO É INFALÍVEL" d={n} tam={60} giro={-6} />
      </div>
    </div>
  );
};

// ───────────────────────── 3. cadeados do cofre
const Cadeado: React.FC<{ aberto: number; vermelho: number; tremor: number }> = ({ aberto, vermelho, tremor }) => {
  const cor = vermelho > 0 ? `rgb(${200 + 30 * vermelho},${150 - 100 * vermelho},${80 - 40 * vermelho})` : aberto > 0.5 ? OURO_FORTE : "#B79A5E";
  return (
    <svg width={96} height={112} viewBox="0 0 96 112" style={{ overflow: "visible", transform: `translateX(${tremor}px)` }}>
      <path d="M 26 54 L 26 34 C 26 12, 70 12, 70 34 L 70 54" fill="none" stroke={cor} strokeWidth={11} strokeLinecap="round" transform={`translate(0 ${-20 * aberto}) rotate(${-18 * aberto} 26 54)`} />
      <rect x={12} y={50} width={72} height={58} rx={12} fill={cor} />
      <circle cx={48} cy={74} r={8} fill="#2A1E10" />
      <rect x={44.5} y={76} width={7} height={18} rx={3} fill="#2A1E10" />
    </svg>
  );
};

const Cadeados: React.FC = () => {
  const { f, ev, cena, pal } = useCena();
  const c1 = ev("cadeado1");
  if (c1 === undefined || f < c1) return null;
  const faltou = (ev("faltou") ?? Infinity) + 6;
  const fechado = ev("fechado") ?? Infinity;
  const rotulos = ["QUEM FALA\n(OFICIAL)", "SOBRE O QUÊ\n(FÉ OU MORAL)", "COMO\n(DEFINITIVO)"];
  // some enquanto o Papa brinca com a bola (título próprio) e volta na terceira chave
  const bola = pal("Palpite");
  const volta3 = ev("cadeado3") ?? Infinity;
  const pausaBola = Math.max(interpolate(f, [bola - 6, bola], [1, 0], clamp), interpolate(f, [volta3 - 4, volta3 + 2], [0, 1], clamp));
  const entrada = interpolate(f, [c1, c1 + 8], [0, 1], clamp);
  const saida = interpolate(f, [cena.duracao - 8, cena.duracao], [1, 0], clamp);
  return (
    <>
      <div style={{ position: "absolute", left: AREA.esquerda - 30, width: LARGURA + 60, top: 720, display: "flex", justifyContent: "center", gap: 26, opacity: Math.min(entrada, saida, f >= bola - 6 ? pausaBola : 1) }}>
        {[1, 2, 3].map((k) => {
          const e = ev(`cadeado${k}`) ?? Infinity;
          const abre = interpolate(f, [e + 2, e + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
          const volta = interpolate(f, [faltou, faltou + 4], [0, 1], clamp);
          const aberto = Math.max(0, abre - volta);
          const vermelho = k === 3 ? interpolate(f, [faltou, faltou + 4], [0, 1], clamp) : 0;
          const tremor = k === 3 && f >= faltou && f < faltou + 12 ? Math.sin((f - faltou) * 2.6) * 9 * (1 - (f - faltou) / 12) : 0;
          const brilho = aberto > 0.5 ? `0 0 28px rgba(242,193,78,${0.55 * aberto})` : "none";
          return (
            <div key={k} style={{ width: 236, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ width: 150, height: 150, borderRadius: 75, backgroundColor: FUNDO, border: `3px solid ${vermelho > 0.5 ? "#E06A5A" : OURO}`, boxShadow: brilho, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <div style={{ position: "absolute", top: -14, left: -6, width: 44, height: 44, borderRadius: 22, backgroundColor: aberto > 0.5 ? OURO_FORTE : "#6E5A3A", color: "#1A1208", fontFamily: SERIFA, fontWeight: 700, fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>{k}</div>
                <Cadeado aberto={aberto} vermelho={vermelho} tremor={tremor} />
              </div>
              <div style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: 24, lineHeight: 1.15, letterSpacing: "0.02em", textAlign: "center", whiteSpace: "pre-line", color: f >= e ? CREME : "rgba(246,235,211,0.35)", textShadow: SOMBRA, backgroundColor: f >= e ? "rgba(18,13,10,0.55)" : "transparent", padding: "4px 10px", borderRadius: 8 }}>
                {rotulos[k - 1]}
              </div>
            </div>
          );
        })}
      </div>
      <Martelo />
      {f >= fechado && (
        <div style={{ position: "absolute", left: AREA.esquerda, width: LARGURA, top: 1060, display: "flex", justifyContent: "center", opacity: saida }}>
          <CarimboVermelho texto="COFRE FECHADO" d={f - fechado} tam={62} giro={-5} sub="CÂN. 749 §3" />
        </div>
      )}
    </>
  );
};

// ───────────────────────── 3b. martelo: "ele bate o martelo"
const Martelo: React.FC = () => {
  const { f, ev, pal } = useCena();
  const m = ev("martelo");
  if (m === undefined || f < m - 4) return null;
  const fim = pal("declara que aquilo") - 2;
  if (f >= fim) return null;
  const golpe = m + 7; // instante da batida (o efeito sonoro toca aqui)
  const giro = interpolate(f, [m - 4, m + 2, golpe], [-8, -48, 6], { ...clamp, easing: Easing.in(Easing.quad) });
  const assenta = f > golpe ? interpolate(f, [golpe, golpe + 4], [6, 0], clamp) : giro;
  const onda = f - golpe;
  const op = Math.min(interpolate(f, [m - 4, m], [0, 1], clamp), interpolate(f, [fim - 6, fim], [1, 0], clamp));
  const tremor = onda >= 0 && onda < 8 ? Math.sin(onda * 3) * 6 * (1 - onda / 8) : 0;
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: 330, height: 360, opacity: op, transform: `translateY(${tremor}px) scale(1.3)`, transformOrigin: "47% 70%" }}>
      <svg width={1080} height={360} viewBox="0 0 1080 360" style={{ overflow: "visible" }}>
        {/* base de madeira */}
        <ellipse cx={470} cy={300} rx={120} ry={22} fill="#3B2412" />
        <rect x={350} y={262} width={240} height={38} rx={10} fill="#6E4320" stroke={OURO} strokeWidth={3} />
        {/* ondas da batida */}
        {onda >= 0 && onda < 14 &&
          [0, 1].map((k) => (
            <ellipse key={k} cx={470} cy={262} rx={60 + (onda - k * 3) * 16} ry={12 + (onda - k * 3) * 4} fill="none" stroke={OURO_FORTE} strokeWidth={4} opacity={Math.max(0, 1 - (onda - k * 3) / 12)} />
          ))}
        {/* martelo: gira em torno da ponta do cabo (à direita) */}
        <g transform={`rotate(${assenta} 760 120)`}>
          <rect x={500} y={104} width={268} height={30} rx={14} fill="#8A5A2B" stroke="#3B2412" strokeWidth={3} />
          <rect x={385} y={52} width={170} height={130} rx={22} fill="#7A4A22" stroke="#3B2412" strokeWidth={4} />
          <rect x={372} y={60} width={26} height={114} rx={8} fill={OURO_FORTE} />
          <rect x={542} y={60} width={26} height={114} rx={8} fill={OURO_FORTE} />
        </g>
      </svg>
      {onda >= 2 && (
        <div style={{ position: "absolute", left: 600, top: 210 }}>
          <CarimboVermelho texto="DEFINITIVO" d={onda - 2} tam={46} giro={-8} />
        </div>
      )}
    </div>
  );
};

// ───────────────────────── 4. janela de atualização negada
const Atualizacao: React.FC = () => {
  const { f, ev, cena } = useCena();
  const u = ev("update");
  if (u === undefined || f < u) return null;
  const d = f - u;
  const neg = f - (ev("negado") ?? Infinity);
  const op = Math.min(interpolate(d, [0, 5], [0, 1], clamp), interpolate(f, [cena.duracao - 6, cena.duracao], [1, 0], clamp));
  const barra = neg >= 0 ? interpolate(ev("negado")! - u, [0, 30], [0, 62], clamp) : interpolate(d, [4, 34], [0, 62], { ...clamp, easing: Easing.out(Easing.cubic) });
  const tremor = neg >= 0 && neg < 10 ? Math.sin(neg * 2.8) * 12 * (1 - neg / 10) : 0;
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <AbsoluteFill style={{ backdropFilter: "blur(10px)", backgroundColor: "rgba(10,8,6,0.45)" }} />
      <div style={{ position: "absolute", left: 160, width: 760, top: 600, transform: `translateX(${tremor}px) scale(${pop(d, 0, 9)})` }}>
        <div style={{ backgroundColor: "#F7F5F1", borderRadius: 30, padding: "34px 36px 30px", boxShadow: "0 30px 70px rgba(0,0,0,0.55)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 70, height: 70, borderRadius: 18, background: "linear-gradient(160deg, #4C8DF6, #1F5FD0)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 44, fontFamily: LEGENDA, fontWeight: 800 }}>↻</div>
            <div>
              <div style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: 34, color: "#1C1C1E" }}>Atualização disponível</div>
              <div style={{ fontFamily: LEGENDA, fontWeight: 500, fontSize: 26, color: "#5E5E63" }}>Doutrina 2.0 · dogmas novos</div>
            </div>
          </div>
          <div style={{ marginTop: 28, height: 16, borderRadius: 8, backgroundColor: "#DADADF", overflow: "hidden" }}>
            <div style={{ width: `${barra}%`, height: "100%", backgroundColor: neg >= 0 ? "#C8302B" : "#2F6FE4" }} />
          </div>
          <div style={{ marginTop: 26, display: "flex", gap: 16, justifyContent: "flex-end" }}>
            <div style={{ fontFamily: LEGENDA, fontWeight: 700, fontSize: 26, color: "#2F6FE4", padding: "12px 20px" }}>Mais tarde</div>
            <div style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: 26, color: "#fff", backgroundColor: "#2F6FE4", borderRadius: 14, padding: "12px 24px" }}>Instalar</div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 70, display: "flex", justifyContent: "center" }}>
          <CarimboVermelho texto="NEGADO" d={neg} tam={92} giro={-9} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── 5. contador de anos e placar das Copas
const Contador: React.FC = () => {
  const { f, ev, pal } = useCena();
  const c = ev("contador");
  const placar = ev("placar") ?? Infinity;
  if (c === undefined || f < c || f >= placar) return null;
  const chega = pal("1950");
  const ano = Math.round(interpolate(f, [c + 4, chega], [1870, 1950], { ...clamp, easing: Easing.inOut(Easing.quad) }));
  const op = Math.min(interpolate(f, [c, c + 6], [0, 1], clamp), interpolate(f, [placar - 6, placar], [1, 0], clamp));
  const uma = f - (ev("uma") ?? Infinity);
  const pousou = f - chega;
  const brilho = pousou >= 0 ? interpolate(pousou, [0, 4, 20], [0, 1, 0.35], clamp) : 0;
  return (
    <div style={{ position: "absolute", left: AREA.esquerda, width: LARGURA, top: 960, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: op }}>
      <div style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: 30, letterSpacing: "0.3em", color: OURO, backgroundColor: FUNDO, border: `2px solid ${OURO}`, padding: "4px 12px 2px 18px" }}>DESDE 1870</div>
      <div style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: 150, lineHeight: 1, letterSpacing: "0.06em", color: pousou >= 0 ? OURO_FORTE : CREME, textShadow: `0 0 18px rgba(0,0,0,0.85), ${SOMBRA}, 0 0 ${40 * brilho}px rgba(242,193,78,${brilho})`, fontVariantNumeric: "tabular-nums" }}>
        {ano}
      </div>
      {uma >= 0 && (
        <div style={{ transform: `scale(${pop(uma, 0, 8)})`, fontFamily: LEGENDA, fontWeight: 800, fontSize: 32, letterSpacing: "0.08em", color: "#1A1208", backgroundColor: OURO_FORTE, borderRadius: 12, padding: "8px 20px" }}>
          {pousou >= 0 ? "ASSUNÇÃO · PIO XII" : "1 ÚNICA VEZ"}
        </div>
      )}
    </div>
  );
};

const Placar: React.FC = () => {
  const { f, ev, cena } = useCena();
  const p = ev("placar");
  if (p === undefined || f < p) return null;
  const d = f - p;
  const op = interpolate(f, [cena.duracao - 6, cena.duracao], [1, 0], clamp);
  const linha = (rotulo: string, n: string, atraso: number) => {
    const k = d - atraso;
    if (k < 0) return null;
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, transform: `scale(${pop(k, 0, 8)})`, transformOrigin: "50% 50%" }}>
        <div style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: 29, lineHeight: 1.15, color: CREME, letterSpacing: "0.03em" }}>{rotulo}</div>
        <div style={{ minWidth: 104, textAlign: "center", fontFamily: SERIFA, fontWeight: 700, fontSize: 84, lineHeight: 1, color: OURO_FORTE, backgroundColor: "#0B0906", border: `2px solid #5A4520`, borderRadius: 12, padding: "6px 10px 2px", textShadow: "0 0 18px rgba(242,193,78,0.65)" }}>{n}</div>
      </div>
    );
  };
  return (
    <div style={{ position: "absolute", left: AREA.esquerda - 30, width: LARGURA + 60, top: 960, opacity: op }}>
      <div style={{ backgroundColor: "rgba(10,8,6,0.88)", border: `3px solid ${OURO}`, borderRadius: 20, padding: "18px 26px 22px", boxShadow: "0 18px 40px rgba(0,0,0,0.5)", transform: `scale(${pop(d, 0, 8)})` }}>
        <div style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: 26, letterSpacing: "0.3em", color: OURO, textAlign: "center", marginBottom: 12 }}>PLACAR</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {linha("COPAS DO MUNDO\nDO BRASIL".split("\n").join(" "), "5", 4)}
          {linha("DEFINIÇÕES EX CATHEDRA DESDE 1870", "1", 14)}
        </div>
      </div>
    </div>
  );
};

// ───────────────────────── 6. PEDRO → PEDRA
const PedroPedra: React.FC = () => {
  const { f, ev, pal } = useCena();
  const p = ev("pedra");
  if (p === undefined || f < p) return null;
  const fim = pal("E na mesma hora") - 2;
  if (f >= fim) return null;
  const d = f - p;
  const v = f - ((ev("vira") ?? Infinity) + 8);
  const giro = v < 0 ? 0 : interpolate(v, [0, 6, 12], [0, 90, 0], clamp);
  const letra = v >= 6 ? "A" : "O";
  const op = Math.min(interpolate(d, [0, 6], [0, 1], clamp), interpolate(f, [fim - 6, fim], [1, 0], clamp));
  const base: React.CSSProperties = { fontFamily: SERIFA, fontWeight: 700, fontSize: 168, lineHeight: 1, letterSpacing: "0.08em", color: CREME, textShadow: `${SOMBRA}, 0 0 30px rgba(0,0,0,0.5)` };
  return (
    <div style={{ position: "absolute", left: AREA.esquerda - 40, width: LARGURA + 80, top: 560, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: op }}>
      <div style={{ display: "flex", transform: `scale(${pop(d, 0, 10)})` }}>
        <span style={base}>PEDR</span>
        <span style={{ ...base, display: "inline-block", color: v >= 6 ? OURO_FORTE : CREME, transform: `perspective(600px) rotateX(${giro}deg)` }}>{letra}</span>
      </div>
      {v >= 6 && (
        <div style={{ transform: `scale(${pop(v - 6, 0, 8)})`, fontFamily: SERIFA, fontWeight: 700, fontSize: 34, letterSpacing: "0.16em", color: OURO, backgroundColor: FUNDO, border: `2px solid ${OURO}`, padding: "8px 18px 6px" }}>
          NO GREGO: PÉTROS · PÉTRA
        </div>
      )}
    </div>
  );
};

// ───────────────────────── 6b. sucessão: de Pedro a Leão XIV
const Sucessao: React.FC = () => {
  const { f, ev, pal } = useCena();
  const m = ev("missao");
  if (m === undefined || f < m) return null;
  const fim = pal("A infalibilidade") - 2;
  if (f >= fim) return null;
  const d = f - m;
  const op = Math.min(interpolate(d, [0, 6], [0, 1], clamp), interpolate(f, [fim - 6, fim], [1, 0], clamp));
  const linha = interpolate(d, [6, 30], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const n = Math.round(interpolate(d, [6, 30], [1, 267], { ...clamp, easing: Easing.inOut(Easing.cubic) }));
  const chegou = d >= 30;
  const X0 = 280;
  const L = 520;
  const medalha = (texto: string, sub: string, x: number, aceso: boolean, dEntrada: number) => (
    <div style={{ position: "absolute", left: x - 120, top: 0, width: 240, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transform: `scale(${pop(dEntrada, 0, 8)})` }}>
      <div style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: FUNDO, border: `4px solid ${aceso ? OURO_FORTE : OURO}`, boxShadow: aceso ? "0 0 26px rgba(242,193,78,0.7)" : "none", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIFA, fontWeight: 700, fontSize: 40, color: OURO_FORTE }}>✝</div>
      <div style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: 28, letterSpacing: "0.06em", color: CREME, textShadow: SOMBRA, whiteSpace: "nowrap" }}>{texto}</div>
      <div style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: 22, letterSpacing: "0.06em", color: OURO, textShadow: SOMBRA, whiteSpace: "nowrap" }}>{sub}</div>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: 860, height: 330, opacity: op }}>
      <div style={{ position: "absolute", left: 140, width: 800, top: -20, height: 320, borderRadius: 24, backgroundColor: "rgba(10,8,6,0.72)", border: `2px solid ${OURO}` }} />
      <div style={{ position: "absolute", left: X0, top: 48, width: L * linha, height: 4, background: `linear-gradient(90deg, ${OURO}, ${OURO_FORTE})` }} />
      {Array.from({ length: 9 }).map((_, i) => {
        const x = X0 + ((i + 1) / 10) * L;
        return linha * L >= x - X0 ? <div key={i} style={{ position: "absolute", left: x - 5, top: 45, width: 10, height: 10, borderRadius: 5, backgroundColor: OURO }} /> : null;
      })}
      {medalha("SÃO PEDRO", "1º PAPA", X0, false, d)}
      {d >= 28 && medalha("LEÃO XIV", "HOJE", X0 + L, chegou, d - 28)}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 172, display: "flex", justifyContent: "center" }}>
        <div style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: 64, letterSpacing: "0.04em", color: chegou ? OURO_FORTE : CREME, textShadow: SOMBRA, fontVariantNumeric: "tabular-nums" }}>
          {n}º PAPA
        </div>
      </div>
    </div>
  );
};

// ───────────────────────── 7. resposta no grupo (fechamento)
const RespostaGrupo: React.FC = () => {
  const { f, ev, pal } = useCena();
  const r = ev("resposta");
  if (r === undefined || f < r) return null;
  const fim = pal("Mas quando") - 2;
  if (f >= fim) return null;
  const d1 = f - (r + 6);
  const d2 = f - ((ev("emoji") ?? Infinity) + 10);
  const op = interpolate(f, [fim - 6, fim], [1, 0], clamp);
  const bolha = (texto: string, d: number, minha: boolean) =>
    d < 0 ? null : (
      <div style={{ alignSelf: minha ? "flex-end" : "flex-start", transform: `scale(${pop(d, 0, 8)})`, transformOrigin: minha ? "100% 100%" : "0% 100%", maxWidth: "86%" }}>
        <div style={{ backgroundColor: minha ? "#D9FDD3" : "#FFFFFF", borderRadius: minha ? "22px 6px 22px 22px" : "6px 22px 22px 22px", padding: "12px 18px 14px", boxShadow: "0 6px 18px rgba(0,0,0,0.35)" }}>
          <div style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: 26, color: minha ? "#1F7A55" : "#C2185B", marginBottom: 2 }}>{minha ? "Padre" : "Tia"}</div>
          <div style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: 46, lineHeight: 1.18, color: "#1B1B1B" }}>{texto}</div>
        </div>
      </div>
    );
  return (
    <div style={{ position: "absolute", left: AREA.esquerda - 20, width: LARGURA + 40, top: 900, display: "flex", flexDirection: "column", gap: 16, opacity: op }}>
      {bolha("Tia, nem tudo é dogma 😉", d1, true)}
      {bolha("kkkkk 🙈 entendi, padre", d2, false)}
    </div>
  );
};

/** Véu suave atrás de títulos baixos (y personalizado), para ler sobre qualquer imagem. */
const VeuBaixo: React.FC = () => {
  const { f, cena } = useCena();
  const t = cena.textos.find((t) => t.y !== undefined && t.posicao === "titulo" && f >= t.inicio && f < t.fim);
  if (!t) return null;
  const op = Math.min(interpolate(f, [t.inicio, t.inicio + 6], [0, 1], clamp), interpolate(f, [t.fim - 6, t.fim], [1, 0], clamp));
  return <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 44%, rgba(0,0,0,0.42) 52%, rgba(0,0,0,0.42) 62%, rgba(0,0,0,0) 66%)", opacity: op }} />;
};

export const GraficosEp02: React.FC = () => {
  const { cena } = useCena();
  return (
    <>
      <VeuBaixo />
      {cena.id === "nao-e" && <Etiquetas />}
      {cena.id === "cofre" && <Cadeados />}
      {cena.id === "nada-novo" && <Atualizacao />}
      {cena.id === "quantas" && (
        <>
          <Contador />
          <Placar />
        </>
      )}
      {cena.id === "porque" && (
        <>
          <PedroPedra />
          <Sucessao />
        </>
      )}
      {cena.id === "fecho" && <RespostaGrupo />}
    </>
  );
};
