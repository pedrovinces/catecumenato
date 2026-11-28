// Grafismos do ep. 3 ("A culpa é da serpente?"): chamados da mãe, balões de fala com rabicho apontado para a boca,
// fita rebobinando e pausada, papinho da serpente, REPRISE, barra de liberdade, força da serpente que some,
// serpente nanica no fecho e a seta CONTINUA NA PARTE 2.
// Coordenadas em px do quadro 1080 x 1920, medidas nos quadros reais dos clipes; a área segura está em AREA.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile } from "remotion";
import { LEGENDA, SERIFA, TITULO } from "../lib/fontes";
import { pop } from "../lib/anim";
import { AREA } from "../components/motor/area";
import { useCena } from "../components/motor/contexto";

const CREME = "#F6EBD3";
const OURO = "#EBCB86";
const OURO_FORTE = "#F2C14E";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ───────────────────────── balão de fala com rabicho até a boca
type Paleta = "creme" | "serpente";
const CORES_BALAO: Record<Paleta, { fundo: string; texto: string; borda: string }> = {
  creme: { fundo: "#FFF8EC", texto: "#1A1410", borda: "rgba(0,0,0,0)" },
  serpente: { fundo: "#E3F7CF", texto: "#123D1C", borda: "#2F8A3E" },
};

/** Balão centrado em cx, com o topo em y. O rabicho sai da borda mais próxima e aponta para `alvo` (boca),
 * parando antes dele. Largura e altura estimadas pela fonte (Montserrat ExtraBold em caixa alta). */
export const Balao: React.FC<{
  texto: string;
  cx: number;
  y: number;
  alvo: [number, number];
  d: number; // quadros desde a entrada
  op?: number;
  tam?: number;
  paleta?: Paleta;
  treme?: number; // px de tremor (grito)
}> = ({ texto, cx, y, alvo, d, op = 1, tam = 40, paleta = "creme", treme = 0 }) => {
  if (d < 0 || op <= 0) return null;
  const c = CORES_BALAO[paleta];
  const linhas = texto.split("\n");
  const pad = Math.round(tam * 0.62);
  const larg = Math.max(...linhas.map((l) => l.length)) * tam * 0.68 + pad * 2;
  const alt = linhas.length * tam * 1.12 + pad * 0.9;
  const e = pop(d, 0, 8);
  const tx = treme > 0 ? (random(`b${texto}${Math.floor(d / 2)}`) - 0.5) * 2 * treme : 0;
  const ty = treme > 0 ? (random(`c${texto}${Math.floor(d / 2)}`) - 0.5) * 2 * treme : 0;
  // rabicho: base na borda de baixo (alvo abaixo) ou de cima (alvo acima), ponta a 55% do caminho (até 110 px)
  const embaixo = alvo[1] > y + alt / 2;
  const bx = Math.min(Math.max(alvo[0], cx - larg / 2 + 40), cx + larg / 2 - 40);
  const by = embaixo ? y + alt - 4 : y + 4;
  const dx = alvo[0] - bx;
  const dy = alvo[1] - by;
  const dist = Math.hypot(dx, dy);
  const k = Math.min(0.55, 110 / Math.max(dist, 1));
  const px = bx + dx * k;
  const py = by + dy * k;
  const meia = Math.max(14, tam * 0.36);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op, transform: `translate(${tx}px, ${ty}px)` }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${e})`, transformOrigin: `${px}px ${py}px` }}>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <polygon points={`${bx - meia},${by} ${bx + meia},${by} ${px},${py}`} fill={c.fundo} stroke={c.borda} strokeWidth={paleta === "serpente" ? 4 : 0} strokeLinejoin="round" />
        </svg>
        <div
          style={{
            position: "absolute",
            left: cx - larg / 2,
            top: y,
            width: larg,
            height: alt,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: c.fundo,
            border: paleta === "serpente" ? `4px solid ${c.borda}` : "none",
            borderRadius: Math.min(alt / 2, 46),
            boxShadow: "0 10px 26px rgba(0,0,0,0.42)",
            boxSizing: "border-box",
          }}
        >
          {linhas.map((l, i) => (
            <div key={i} style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: tam, lineHeight: 1.12, color: c.texto, whiteSpace: "nowrap" }}>
              {l}
            </div>
          ))}
        </div>
        {/* cobre a costura entre o rabicho e o balão */}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <polygon points={`${bx - meia + 3},${by + (embaixo ? -6 : 6)} ${bx + meia - 3},${by + (embaixo ? -6 : 6)} ${px + (bx - px) * 0.12},${py + (by - py) * 0.12}`} fill={c.fundo} />
        </svg>
      </div>
    </div>
  );
};

/** Opacidade de saída: some em 5 quadros antes de `fim`. */
export const saindo = (f: number, fim: number) => interpolate(f, [fim - 5, fim], [1, 0], clamp);

// ───────────────────────── 1. abertura: a mãe chama três vezes (s01)
const Chamados: React.FC = () => {
  const { f, ev, pal } = useCena();
  const fim = pal("Na terceira") - 3; // corte para s02
  if (f >= fim) return null;
  const op = saindo(f, fim);
  const boca: [number, number] = [625, 640];
  return (
    <>
      <Balao texto="LUCAS!" cx={262} y={330} alvo={boca} d={f - (ev("chama1") ?? Infinity)} op={op} tam={46} />
      <Balao texto="LUCAS!!" cx={790} y={322} alvo={boca} d={f - (ev("chama2") ?? Infinity)} op={op} tam={54} />
      <Balao texto={"LUCAAAS!!!\nA JANTA!"} cx={392} y={812} alvo={boca} d={f - (ev("chama3") ?? Infinity)} op={op} tam={66} treme={6} />
    </>
  );
};

// ───────────────────────── 2. abertura: "chamou a mãe de chata" (s03)
const Chata: React.FC = () => {
  const { f, ev, pal } = useCena();
  const fim = pal("e saiu batendo") - 2; // corte para a porta
  if (f >= fim) return null;
  return <Balao texto="VOCÊ É CHATA!" cx={384} y={862} alvo={[548, 520]} d={f - (ev("chata") ?? Infinity)} op={saindo(f, fim)} tam={52} treme={3} />;
};

// ───────────────────────── 3. abertura: a fita volta e pausa ("Todo mundo já foi o Lucas, né?")
const Fita: React.FC = () => {
  const { f, ev, cena } = useCena();
  const r = ev("rebobina");
  const c = ev("congela");
  if (r === undefined || c === undefined || f < r) return null;
  const pausado = f >= c;
  const op = saindo(f, cena.duracao);
  const piscando = pausado ? (Math.floor((f - c) / 15) % 2 === 0 ? 1 : 0.35) : 1;
  const icone = pausado ? (
    <div style={{ display: "flex", gap: 9 }}>
      <div style={{ width: 13, height: 40, backgroundColor: "#FFFFFF" }} />
      <div style={{ width: 13, height: 40, backgroundColor: "#FFFFFF" }} />
    </div>
  ) : (
    <svg width={62} height={40} viewBox="0 0 62 40">
      <polygon points="31,0 31,40 0,20" fill="#FFFFFF" />
      <polygon points="62,0 62,40 31,20" fill="#FFFFFF" />
    </svg>
  );
  // faixas de ruído correndo para cima enquanto rebobina
  const faixas = pausado
    ? []
    : Array.from({ length: 5 }).map((_, i) => {
        const yy = (1920 - (((f - r) * 140 + i * 397) % 2100)) | 0;
        return <div key={i} style={{ position: "absolute", left: 0, width: 1080, top: yy, height: 10 + (i % 3) * 8, background: "rgba(255,255,255,0.28)", filter: "blur(2px)" }} />;
      });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      {!pausado && <AbsoluteFill style={{ background: "repeating-linear-gradient(180deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 5px)", mixBlendMode: "multiply" }} />}
      {faixas}
      <div style={{ position: "absolute", left: 132, top: 304, display: "flex", alignItems: "center", gap: 16, opacity: piscando, filter: "drop-shadow(3px 3px 0 rgba(0,0,0,0.75)) drop-shadow(0 0 8px rgba(0,0,0,0.6))" }}>
        {icone}
        <div style={{ fontFamily: LEGENDA, fontWeight: 900, fontSize: 42, letterSpacing: "0.06em", color: "#FFFFFF" }}>{pausado ? "PAUSA" : "REBOBINANDO"}</div>
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── 4. quarto: o anjo sugere a leitura (s07)
const BalaoAnjo: React.FC = () => {
  const { f, ev, pal } = useCena();
  const fim = pal("O Lucas abre") - 3;
  if (f >= fim) return null;
  return <Balao texto={"QUE TAL\nLER UM POUCO?"} cx={725} y={566} alvo={[800, 430]} d={f - (ev("balaoAnjo") ?? Infinity)} op={saindo(f, fim)} tam={46} />;
};

// ───────────────────────── 5. serpente: o papinho de sempre (s10) e a REPRISE (s12)
const Papinho: React.FC = () => {
  const { f, ev, pal } = useCena();
  const fim = pal("Repara") - 3;
  if (f >= fim) return null;
  const falas = [
    { e: ev("s1"), t: "SUA MÃE\nMANDA DEMAIS…" },
    { e: ev("s2"), t: "VOCÊ É LIVRE!" },
    { e: ev("s3"), t: "FAZ O QUE\nDER VONTADE!" },
  ];
  return (
    <>
      {falas.map((x, i) => {
        const prox = falas[i + 1]?.e ?? fim;
        if (x.e === undefined || f < x.e || f >= prox) return null;
        return <Balao key={i} texto={x.t} cx={372} y={968} alvo={[410, 790]} d={f - x.e} op={saindo(f, prox)} tam={48} paleta="serpente" />;
      })}
    </>
  );
};

/** Carimbo vermelho de impacto (entra grande e assenta). */
export const CarimboVermelho: React.FC<{ texto: string; d: number; tam?: number; giro?: number }> = ({ texto, d, tam = 64, giro = -7 }) => {
  if (d < 0) return null;
  const e = interpolate(d, [0, 3, 6], [2.2, 0.94, 1], clamp);
  const op = interpolate(d, [0, 2], [0, 1], clamp);
  return (
    <div
      style={{
        transform: `rotate(${giro}deg) scale(${e})`,
        opacity: op,
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
  );
};

const Reprise: React.FC = () => {
  const { f, ev, cena } = useCena();
  const r = ev("roteiro");
  if (r === undefined || f < r) return null;
  return (
    <div style={{ position: "absolute", left: 600, width: 400, top: 720, display: "flex", justifyContent: "center", opacity: saindo(f, cena.duracao) }}>
      <CarimboVermelho texto="REPRISE" d={f - r} tam={56} giro={-9} />
    </div>
  );
};

// ───────────────────────── 6. liberdade: barra que enche (s18) e a força da serpente que some (s06-b)
const BarraLiberdade: React.FC = () => {
  const { f, ev, pal } = useCena();
  const h = ev("hud");
  if (h === undefined || f < h) return null;
  const fim = pal("A serpente ainda") - 3; // corte para o quarto
  if (f >= fim) return null;
  const x1 = ev("xp1") ?? Infinity;
  const x2 = ev("xp2") ?? Infinity;
  const ease = { ...clamp, easing: Easing.out(Easing.cubic) };
  const p = f < x1 ? 30 : f < x2 ? interpolate(f, [x1, x1 + 8], [30, 64], ease) : interpolate(f, [x2, x2 + 8], [64, 100], ease);
  const cheio = f >= x2 + 8;
  const brilho = cheio ? interpolate(f - x2 - 8, [0, 4, 18], [0, 1, 0.4], clamp) : 0;
  const mais = (e: number) => {
    const d = f - e;
    if (d < 0 || d > 22) return null;
    return (
      <div style={{ position: "absolute", left: 250 + (e === x2 ? 80 : 0), top: 86 - d * 2.6, opacity: interpolate(d, [0, 3, 16, 22], [0, 1, 1, 0], clamp), transform: `scale(${pop(d, 0, 6)})`, fontFamily: LEGENDA, fontWeight: 900, fontSize: 54, color: OURO_FORTE, textShadow: "3px 3px 0 #3A2A08, 0 0 14px rgba(0,0,0,0.6)" }}>
        +10
      </div>
    );
  };
  return (
    <div style={{ position: "absolute", left: 128, top: 300, width: 380, opacity: Math.min(interpolate(f, [h, h + 6], [0, 1], clamp), saindo(f, fim)), transform: `scale(${pop(f, h, 8)})`, transformOrigin: "0 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontFamily: LEGENDA, fontWeight: 900, fontSize: 34, letterSpacing: "0.06em", color: CREME, textShadow: "2px 2px 0 rgba(0,0,0,0.85), 0 0 10px rgba(0,0,0,0.5)" }}>
        <span>LIBERDADE</span>
        <span style={{ color: OURO_FORTE, fontSize: 28 }}>{cheio ? "NÍVEL 2" : "NÍVEL 1"}</span>
      </div>
      <div style={{ marginTop: 8, height: 36, borderRadius: 9, backgroundColor: "rgba(18,13,10,0.78)", border: `3px solid ${OURO}`, overflow: "hidden", boxShadow: `0 0 ${26 * brilho}px rgba(242,193,78,${brilho})` }}>
        <div style={{ width: `${p}%`, height: "100%", background: `linear-gradient(180deg, #FFE08A, ${OURO_FORTE} 55%, #C9952C)` }} />
      </div>
      {mais(x1)}
      {mais(x2)}
    </div>
  );
};

const SerpenteSome: React.FC = () => {
  const { f, ev, cena } = useCena();
  const a = ev("encolhe");
  if (a === undefined || f < a) return null;
  const b = ev("encolhe2") ?? Infinity;
  const puf = ev("puf") ?? Infinity;
  const CX = 846;
  const BASE = 1196;
  const ALT = 560;
  const ease = { ...clamp, easing: Easing.inOut(Easing.cubic) };
  const escala = f < b ? pop(f, a, 9) : f < puf ? interpolate(f, [b, b + 10], [1, 0.62], ease) : interpolate(f, [puf, puf + 5], [0.62, 0], { ...clamp, easing: Easing.in(Easing.back(2)) });
  const forca = f < b ? 100 : f < puf ? interpolate(f, [b, b + 12], [100, 34], ease) : interpolate(f, [puf, puf + 6], [34, 0], clamp);
  const opBarra = Math.min(interpolate(f, [a + 4, a + 10], [0, 1], clamp), f >= puf ? interpolate(f, [puf + 6, puf + 14], [1, 0], clamp) : 1);
  const topoSerpente = BASE - ALT * Math.max(escala, 0.62);
  const tremer = f >= b && f < b + 12 ? Math.sin((f - b) * 2.4) * 6 : 0;
  const dp = f - puf;
  return (
    <AbsoluteFill style={{ opacity: saindo(f, cena.duracao) }}>
      {/* serpente recortada, ancorada pela base */}
      {escala > 0.01 && (
        <Img
          src={staticFile("img/ep03/serpente-mini.png")}
          style={{
            position: "absolute",
            left: CX - (ALT * 600) / 1010 / 2,
            top: BASE - ALT,
            height: ALT,
            transform: `translateX(${tremer}px) scale(${escala})`,
            transformOrigin: "50% 100%",
            filter: `drop-shadow(0 18px 24px rgba(0,0,0,0.55)) saturate(${f >= b ? 0.7 : 1})`,
          }}
        />
      )}
      {/* barra de força em cima da cabeça */}
      <div style={{ position: "absolute", left: CX - 150, top: topoSerpente - 92, width: 300, opacity: opBarra }}>
        <div style={{ fontFamily: LEGENDA, fontWeight: 900, fontSize: 30, letterSpacing: "0.06em", color: "#FFD9CF", textShadow: "2px 2px 0 rgba(0,0,0,0.85)", textAlign: "center" }}>FORÇA DA SERPENTE</div>
        <div style={{ marginTop: 6, height: 28, borderRadius: 8, backgroundColor: "rgba(18,13,10,0.8)", border: "3px solid #E06A5A", overflow: "hidden" }}>
          <div style={{ width: `${forca}%`, height: "100%", background: "linear-gradient(180deg, #FF7A66, #C8302B)" }} />
        </div>
      </div>
      {/* puf: nuvem que se abre e some */}
      {dp >= 0 && dp < 22 && (
        <>
          {Array.from({ length: 9 }).map((_, i) => {
            const ang = (i / 9) * Math.PI * 2 + 0.3;
            const r = interpolate(dp, [0, 14], [10, 110 + (i % 3) * 22], { ...clamp, easing: Easing.out(Easing.cubic) });
            const t = interpolate(dp, [0, 4, 22], [30, 90, 70], clamp);
            return <div key={i} style={{ position: "absolute", left: CX + Math.cos(ang) * r - t / 2, top: BASE - 150 + Math.sin(ang) * r * 0.8 - t / 2, width: t, height: t, borderRadius: t / 2, backgroundColor: "rgba(240,240,235,0.92)", opacity: interpolate(dp, [0, 3, 14, 22], [0, 1, 0.9, 0], clamp), filter: "blur(1.5px)" }} />;
          })}
          <div style={{ position: "absolute", left: CX - 120, width: 240, top: BASE - 200, textAlign: "center", fontFamily: TITULO, fontSize: 92, color: "#FFFFFF", transform: `scale(${pop(dp, 0, 7)}) rotate(-8deg)`, opacity: interpolate(dp, [14, 22], [1, 0], clamp), textShadow: "4px 4px 0 #2A1E10" }}>
            PUF!
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

// ───────────────────────── 7. fecho: desculpa (s23), serpente nanica (s24) e CONTINUA (s26)
const Desculpa: React.FC = () => {
  const { f, ev, pal } = useCena();
  const fim = pal("e come o frango") - 3;
  if (f >= fim) return null;
  return <Balao texto="DESCULPA, MÃE." cx={372} y={740} alvo={[430, 540]} d={f - (ev("desculpa") ?? Infinity)} op={saindo(f, fim)} tam={46} />;
};

const SerpenteNanica: React.FC = () => {
  const { f, ev, pal } = useCena();
  const s = ev("serpMini");
  if (s === undefined || f < s) return null;
  const sai = pal("quem escolhe") + 2; // "mas quem escolhe é VOCÊ": a serpente vira fumaça
  const d = f - s;
  const ds = f - sai;
  if (ds > 18) return null;
  const ALT = 330;
  const escala = ds < 0 ? pop(d, 0, 8) : interpolate(ds, [0, 5], [1, 0], { ...clamp, easing: Easing.in(Easing.back(2)) });
  const tremor = ds < 0 ? Math.sin(d * 1.9) * 3 : 0;
  return (
    <>
      {escala > 0.01 && (
        <Img
          src={staticFile("img/ep03/serpente-mini.png")}
          style={{ position: "absolute", left: 124, top: 300, height: ALT, transform: `translateX(${tremor}px) scale(${escala})`, transformOrigin: "50% 100%", filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.5))" }}
        />
      )}
      {ds < 0 && <Balao texto={"RECLAMA\nDO FRANGO!"} cx={486} y={300} alvo={[300, 360]} d={d - 3} tam={38} paleta="serpente" treme={2.5} />}
      {ds >= 0 && ds < 18 && (
        <div style={{ position: "absolute", left: 120, width: 240, top: 360, textAlign: "center", fontFamily: TITULO, fontSize: 84, color: "#FFFFFF", transform: `scale(${pop(ds, 0, 6)}) rotate(-8deg)`, opacity: interpolate(ds, [10, 18], [1, 0], clamp), textShadow: "3px 3px 0 #2A1E10" }}>
          PUF!
        </div>
      )}
    </>
  );
};

const Continua: React.FC = () => {
  const { f, ev, pal } = useCena();
  const c = ev("continua");
  if (c === undefined || f < c) return null;
  const fim = pal("E foi assim") - 6;
  if (f >= fim) return null;
  const d = f - c;
  const x = interpolate(d, [0, 9], [-900, 0], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  return (
    <div style={{ position: "absolute", left: AREA.esquerda, top: 1090, transform: `translateX(${x}px)`, opacity: saindo(f, fim), filter: "drop-shadow(0 12px 22px rgba(0,0,0,0.55))" }}>
      <svg width={820} height={150} viewBox="0 0 820 150" style={{ position: "absolute", left: 0, top: 0 }}>
        <polygon points="0,0 712,0 820,75 712,150 0,150" fill="#2A1E10" stroke={OURO_FORTE} strokeWidth={6} />
      </svg>
      <div style={{ position: "relative", width: 740, height: 150, display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 36, boxSizing: "border-box" }}>
        <div style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: 38, letterSpacing: "0.26em", color: OURO }}>CONTINUA NA</div>
        <div style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: 68, letterSpacing: "0.08em", lineHeight: 1, color: OURO_FORTE }}>PARTE 2</div>
      </div>
    </div>
  );
};

// ───────────────────────── véus atrás de títulos fora da posição padrão
export const Veus: React.FC = () => {
  const { f, cena } = useCena();
  const t = cena.textos.find((t) => t.y !== undefined && t.posicao === "titulo" && f >= t.inicio && f < t.fim);
  if (!t) return null;
  const op = Math.min(interpolate(f, [t.inicio, t.inicio + 6], [0, 1], clamp), interpolate(f, [t.fim - 6, t.fim], [1, 0], clamp));
  if (t.y! < 700) return <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 22%, rgba(0,0,0,0) 34%)", opacity: op }} />;
  const a = ((t.y! - 120) / 1920) * 100;
  const b = ((t.y! + 200) / 1920) * 100;
  return <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,0) ${a}%, rgba(0,0,0,0.42) ${a + 6}%, rgba(0,0,0,0.42) ${b - 4}%, rgba(0,0,0,0) ${b + 2}%)`, opacity: op }} />;
};

export const GraficosEp03: React.FC = () => {
  const { cena } = useCena();
  return (
    <>
      <Veus />
      {cena.id === "abertura" && (
        <>
          <Chamados />
          <Chata />
          <Fita />
        </>
      )}
      {cena.id === "quarto" && <BalaoAnjo />}
      {cena.id === "serpente" && (
        <>
          <Papinho />
          <Reprise />
        </>
      )}
      {cena.id === "liberdade" && (
        <>
          <BarraLiberdade />
          <SerpenteSome />
        </>
      )}
      {cena.id === "fecho" && (
        <>
          <Desculpa />
          <SerpenteNanica />
          <Continua />
        </>
      )}
    </>
  );
};

