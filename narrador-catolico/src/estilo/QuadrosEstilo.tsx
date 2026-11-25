// Quadros de estilo low-poly para aprovação (arte original, no estilo geral de ilustração facetada).
import React from "react";
import { AbsoluteFill, random } from "remotion";
import { Faceta, Textura, elipse, ret, tom, type P } from "../lowpoly/geo";
import { PadreLP } from "../lowpoly/PadreLP";
import { FielLP } from "../lowpoly/FielLP";
import { Brilho, Degrade, Estrelinha, Nevoa, Particulas, Raios, VinhetaSuave } from "../lowpoly/atmosfera";
import { LegendaKaraoke, Rotulo, TituloCinema } from "../lowpoly/textos";
import { OculosMeme } from "../components/OculosMeme";
import { carregarFontes } from "../lib/fontes";

carregarFontes();

const CASULAS = { verde: "#2F7A3A", roxo: "#5B2F7D", branco: "#F1EDE2", vermelho: "#A8282A", rosa: "#D98AA8" };

const Tela: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);

/** Casula pendurada num cabide (prop). */
const CasulaNoCabide: React.FC<{ cor: string; s: string; escala?: number }> = ({ cor, s, escala = 1 }) => (
  <g transform={`scale(${escala})`}>
    <path d="M 0 0 q 0 -26 16 -26 q 14 0 12 14" fill="none" stroke="#3A3029" strokeWidth={5} strokeLinecap="round" />
    <path d="M -78 40 L 0 8 L 78 40" fill="none" stroke="#7A5A3A" strokeWidth={7} strokeLinejoin="round" />
    {/* casula: ombros caídos e barra em ogiva */}
    <Faceta curva pontos={[[-26, 14], [26, 14], [74, 36], [100, 110], [104, 250], [96, 360], [50, 400], [0, 412], [-50, 400], [-96, 360], [-104, 250], [-100, 110], [-74, 36]]} cor={cor} forca={0.24} />
    <Faceta curva pontos={[[-13, 16], [13, 16], [15, 408], [-15, 408]]} cor="#B9912C" forca={0.2} />
    <Faceta pontos={[[-26, 10], [26, 10], [16, 30], [-16, 30]]} cor="#F1EDE2" forca={0.1} />
  </g>
);

// ---------------- 1. Abertura: sacristia ----------------
const Sacristia: React.FC<{ f: number }> = ({ f }) => {
  const armario: P[] = [[600, 500], [1050, 500], [1050, 1520], [600, 1520]];
  return (
    <>
      <Degrade id="s-par" cores={[[0, "#EADBC0"], [1, "#C6AA84"]]} />
      <Faceta pontos={ret(0, 0, 1080, 1520)} cor="#D8C3A1" passo={130} semente="s-parede" forca={0.12} variacao={0.04} opacidade={0.9} />
      <Faceta pontos={ret(0, 1180, 1080, 340)} cor="#7A5638" passo={80} semente="s-lambri" forca={0.16} />
      {/* janela em arco */}
      <Faceta pontos={[[90, 1150], [90, 560], [130, 470], [210, 420], [290, 470], [330, 560], [330, 1150]]} cor="#5E4330" passo={60} semente="s-jan-mold" />
      <Degrade id="s-ceu" cores={[[0, "#FFF6DE"], [1, "#F2D49A"]]} x={110} y={440} w={200} h={700} />
      <path d="M 210 440 L 210 1140 M 110 760 L 310 760 M 110 950 L 310 950" stroke="#5E4330" strokeWidth={12} />
      {/* armário de paramentos aberto */}
      <Faceta pontos={armario} cor="#5B3D27" passo={70} semente="s-arm" forca={0.18} />
      <Faceta pontos={ret(630, 540, 390, 950)} cor="#2E1F15" passo={80} semente="s-arm-dentro" forca={0.1} />
      <rect x={640} y={600} width={370} height={10} fill="#9C7A4C" />
      {(["verde", "roxo", "branco", "vermelho"] as const).map((c, i) => (
        <g key={c} transform={`translate(${690 + i * 92} 612)`}>
          <CasulaNoCabide cor={CASULAS[c]} s={`s-c${i}`} escala={0.44} />
        </g>
      ))}
      <Faceta pontos={[[600, 500], [520, 560], [520, 1470], [600, 1520]]} cor="#6E4A30" passo={60} semente="s-porta" forca={0.2} />
      {/* piso de tábuas */}
      <Faceta pontos={[[0, 1520], [1080, 1520], [1080, 1920], [0, 1920]]} cor="#8A6544" passo={90} semente="s-piso" forca={0.16} />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M ${540 + (i - 4) * 60} 1520 L ${540 + (i - 4) * 260} 1920`} stroke="#6E4E33" strokeWidth={3} opacity={0.6} />
      ))}
      <Raios id="s-raios" origem={[210, 700]} alvos={[[760, 1900, 420], [560, 1920, 240], [980, 1700, 300]]} opacidade={0.32} f={f} />
      <PadreLP x={380} y={1780} escala={1.05} casula={CASULAS.vermelho} pose="segurandoCabide" semente="pa1"
        segura={<g transform="translate(0 18)"><CasulaNoCabide cor={CASULAS.rosa} s="s-rosa" escala={0.62} /></g>} />
      <Particulas f={f} n={36} area={[120, 700, 900, 1100]} semente="s-p" estrelas={4} />
      <VinhetaSuave id="s-v" forca={0.45} />
    </>
  );
};

// ---------------- 2. Advento: coroa à noite ----------------
const Vela: React.FC<{ x: number; y: number; cor: string; h: number; s: string }> = ({ x, y, cor, h, s }) => (
  <g>
    <Faceta pontos={[[x - 28, y - h], [x + 28, y - h], [x + 28, y], [x - 28, y]]} cor={cor} passo={18} semente={s} forca={0.3} />
    <ellipse cx={x} cy={y - h} rx={28} ry={8} fill={tom(cor, 0.12)} />
    <line x1={x} x2={x} y1={y - h} y2={y - h - 16} stroke="#2B211C" strokeWidth={4} />
  </g>
);

const Advento: React.FC<{ f: number }> = ({ f }) => {
  const mesa = 1330;
  const verdes = ["#2E5A33", "#3B6E3F", "#264B2B", "#467C48"];
  const pisca = 1 + Math.sin(f / 3) * 0.05;
  return (
    <>
      <Degrade id="a-fundo" cores={[[0, "#120F26"], [0.6, "#2A1B42"], [1, "#1A1226"]]} />
      <Faceta pontos={ret(0, 0, 1080, 1340)} cor="#24193A" passo={140} semente="a-par" forca={0.1} variacao={0.05} opacidade={0.85} />
      {/* janela com céu noturno */}
      <Faceta pontos={[[120, 1000], [120, 560], [160, 480], [240, 440], [320, 480], [360, 560], [360, 1000]]} cor="#3A2A4E" passo={60} semente="a-jan" />
      <Degrade id="a-ceu" cores={[[0, "#0E1A3A"], [1, "#2B3F6B"]]} x={140} y={460} w={200} h={530} />
      {Array.from({ length: 14 }, (_, i) => (
        <Estrelinha key={i} x={150 + random(`ax${i}`) * 180} y={480 + random(`ay${i}`) * 480} r={4 + random(`ar${i}`) * 7} opacidade={0.4 + 0.6 * Math.abs(Math.sin(f / 15 + i))} />
      ))}
      <path d="M 240 460 L 240 1000 M 140 720 L 340 720" stroke="#3A2A4E" strokeWidth={12} />
      {/* Padre ao fundo, na penumbra */}
      <g opacity={0.92}>
        <PadreLP x={800} y={1560} escala={0.9} casula={CASULAS.roxo} pose="solene" semente="pa2" />
      </g>
      <rect x={0} y={0} width={1080} height={1920} fill="#0A0714" opacity={0.42} />
      {/* mesa */}
      <Faceta pontos={[[90, mesa], [990, mesa], [1040, mesa + 70], [40, mesa + 70]]} cor="#5A3B27" passo={60} semente="a-tampo" forca={0.2} />
      <Faceta pontos={[[60, mesa + 70], [1020, mesa + 70], [1000, 1920], [80, 1920]]} cor="#3E281A" passo={90} semente="a-mesa" forca={0.15} />
      {/* coroa: folhagem em volta de uma elipse */}
      {Array.from({ length: 26 }, (_, i) => {
        const a = (i / 26) * Math.PI * 2;
        const cx = 540 + Math.cos(a) * 300;
        const cy = mesa - 10 + Math.sin(a) * 70;
        return <Faceta key={i} pontos={elipse(cx, cy, 70, 34, 9, a)} cor={verdes[i % 4]} passo={20} semente={`a-f${i}`} forca={0.3} />;
      })}
      {[-180, -40, 120, 230].map((dx, i) => (
        <circle key={i} cx={540 + dx} cy={mesa + 48 - Math.abs(dx) * 0.1} r={12} fill="#9E2A2B" />
      ))}
      {/* velas: três roxas e uma rosa; a primeira acesa */}
      <Vela x={340} y={mesa - 40} cor={CASULAS.roxo} h={250} s="a-v1" />
      <Vela x={470} y={mesa - 80} cor={CASULAS.roxo} h={250} s="a-v2" />
      <Vela x={610} y={mesa - 80} cor={CASULAS.rosa} h={250} s="a-v3" />
      <Vela x={740} y={mesa - 40} cor={CASULAS.roxo} h={250} s="a-v4" />
      <Brilho id="a-luz-grande" x={340} y={mesa - 320} r={620} cor="#FFB45A" forca={0.42} />
      <g transform={`translate(340 ${mesa - 306}) scale(${pisca})`}>
        <path d="M 0 -70 Q 26 -30 14 -6 Q 0 6 -14 -6 Q -26 -30 0 -70 Z" fill="#FFB347" />
        <path d="M 0 -44 Q 11 -22 6 -8 Q 0 0 -6 -8 Q -11 -22 0 -44 Z" fill="#FFF1B8" />
      </g>
      <Brilho id="a-luz" x={340} y={mesa - 330} r={140} cor="#FFE2A0" forca={0.9} />
      <Particulas f={f} n={24} area={[150, 700, 800, 700]} semente="a-p" estrelas={3} cor="#FFD79A" />
      <VinhetaSuave id="a-v" forca={0.6} />
    </>
  );
};

// ---------------- 3. Festa do Tempo Comum: nave da igreja ----------------
const Nave: React.FC<{ f: number }> = ({ f }) => {
  const fx = 540;
  const fy = 900;
  return (
    <>
      <Degrade id="n-fundo" cores={[[0, "#E8D6B4"], [1, "#B79C76"]]} />
      {/* parede do fundo e abside */}
      <Faceta pontos={ret(370, 470, 340, 590)} cor="#D9C29C" passo={70} semente="n-fundo-p" forca={0.12} />
      <Faceta pontos={[[460, 760], [460, 600], [490, 540], [540, 515], [590, 540], [620, 600], [620, 760]]} cor="#FFF1CF" passo={40} semente="n-janela" forca={0.06} />
      <Faceta pontos={ret(440, 940, 200, 120)} cor="#F2EBDD" passo={30} semente="n-altar" />
      <Faceta pontos={ret(470, 960, 140, 100)} cor={CASULAS.verde} passo={24} semente="n-frontal" forca={0.2} />
      {/* paredes laterais em perspectiva */}
      {[-1, 1].map((l) => {
        const x0 = l < 0 ? 0 : 1080;
        const x1 = l < 0 ? 370 : 710;
        return (
          <g key={l}>
            <Faceta pontos={[[x0, 0], [x1, 470], [x1, 1060], [x0, 1920]]} cor="#BFA27C" passo={110} semente={`n-par${l}`} forca={0.16} />
            {[0, 1, 2].map((k) => {
              const t0 = 0.12 + k * 0.27;
              const t1 = t0 + 0.14;
              const xa = x0 + (x1 - x0) * t0;
              const xb = x0 + (x1 - x0) * t1;
              const ya = 470 * t0 + 260 * (1 - t0);
              const yb = 470 * t1 + 260 * (1 - t1);
              const hA = (1920 - 1060) * (1 - t0) * 0.45 + 300;
              const hB = (1920 - 1060) * (1 - t1) * 0.45 + 300;
              const vitral: P[] = [[xa, ya + 60], [xb, yb + 60], [xb, yb + hB], [xa, ya + hA]];
              return <Faceta key={k} pontos={vitral} cor={["#5D8FB8", "#C9A23F", "#6FA46A"][k]} passo={26} semente={`n-v${l}${k}`} forca={0.35} variacao={0.12} />;
            })}
          </g>
        );
      })}
      {/* piso e corredor */}
      <Faceta pontos={[[0, 1920], [370, 1060], [710, 1060], [1080, 1920]]} cor="#A88D6A" passo={90} semente="n-piso" forca={0.14} />
      <Faceta pontos={[[300, 1920], [500, 1060], [580, 1060], [780, 1920]]} cor="#8E3B34" passo={60} semente="n-tapete" forca={0.15} />
      {/* bancos recuando */}
      {Array.from({ length: 6 }, (_, k) => {
        const t = 1 - k * 0.15;
        const y = fy + 160 + (1500 - fy - 160) * t;
        const esc = 0.3 + 0.7 * t;
        return [-1, 1].map((l) => {
          const xin = fx + l * (60 + 160 * t);
          const xout = fx + l * (200 + 460 * t);
          return <Faceta key={`${k}${l}`} pontos={[[xin, y - 60 * esc], [xout, y - 60 * esc], [xout, y + 10 * esc], [xin, y + 10 * esc]]} cor="#5B3A24" passo={40} semente={`n-b${k}${l}`} forca={0.2} />;
        });
      })}
      <Raios id="n-raios" origem={[540, 600]} alvos={[[540, 1700, 520], [300, 1600, 260], [800, 1600, 260]]} opacidade={0.38} f={f} />
      {/* o fiel, festejando, com a medalha */}
      <FielLP x={540} y={1980} escala={1.3} tipo="homem" camisa="#3F79A6" bracos="celebra" boca="aberta" olhos="felizes" sobrancelha="alta" semente="fi1"
        noPeito={
          <g>
            <path d="M -40 -790 L 0 -640 L 40 -790" fill="none" stroke="#2F7A3A" strokeWidth={16} />
            <Faceta pontos={elipse(0, -610, 44, 44, 12)} cor="#D4A52C" passo={14} semente="medalha" forca={0.35} />
            <Estrelinha x={0} y={-612} r={22} cor="#FFF4C4" />
          </g>
        } />
      <Brilho id="n-med" x={540} y={1980 - 610 * 1.3} r={160} cor="#FFE08A" forca={0.6} />
      {/* último banco em primeiro plano */}
      <Faceta pontos={[[-20, 1560], [1100, 1560], [1100, 1630], [-20, 1630]]} cor="#6B4429" passo={50} semente="n-enc" forca={0.2} />
      <Faceta pontos={[[-20, 1630], [1100, 1630], [1100, 1920], [-20, 1920]]} cor="#4E3020" passo={70} semente="n-banco" forca={0.15} />
      {/* confete facetado */}
      {Array.from({ length: 70 }, (_, i) => {
        const x = random(`cx${i}`) * 1080;
        const y = 300 + ((random(`cy${i}`) * 1300 + f * (4 + random(`cv${i}`) * 4)) % 1300);
        const r = 10 + random(`cr${i}`) * 9;
        const a = random(`ca${i}`) * 6 + f * 0.1;
        const cor = [CASULAS.verde, CASULAS.roxo, "#FFFFFF", CASULAS.vermelho, CASULAS.rosa, "#E1B53E"][i % 6];
        return <path key={i} d={`M ${x + Math.cos(a) * r} ${y + Math.sin(a) * r} L ${x + Math.cos(a + 2.3) * r} ${y + Math.sin(a + 2.3) * r} L ${x + Math.cos(a + 4.1) * r * 0.7} ${y + Math.sin(a + 4.1) * r * 0.7} Z`} fill={cor} opacity={0.92} />;
      })}
      <Particulas f={f} n={30} area={[100, 500, 880, 1100]} semente="n-p" estrelas={10} />
      <VinhetaSuave id="n-v" forca={0.4} />
    </>
  );
};

// ---------------- 4. Os óculos: porta da igreja ao entardecer ----------------
const Fachada: React.FC<{ f: number }> = ({ f }) => (
  <>
    <Degrade id="f-ceu" cores={[[0, "#3B2A52"], [0.45, "#B9647E"], [0.75, "#F0A877"], [1, "#F6C890"]]} h={1100} />
    <Brilho id="f-sol" x={860} y={930} r={420} cor="#FFD7A0" forca={0.8} />
    <Faceta pontos={[[0, 1000], [180, 880], [380, 960], [600, 860], [820, 950], [1080, 870], [1080, 1100], [0, 1100]]} cor="#8E5E7E" passo={70} semente="f-morros" forca={0.15} opacidade={0.85} />
    {/* fachada */}
    <Faceta pontos={[[150, 1580], [150, 640], [540, 420], [930, 640], [930, 1580]]} cor="#C8A588" passo={90} semente="f-fach" forca={0.2} />
    <Faceta pontos={[[530, 520], [550, 520], [550, 640], [530, 640]]} cor="#9C7C62" passo={14} semente="f-cruz1" />
    <Faceta pontos={[[505, 555], [575, 555], [575, 573], [505, 573]]} cor="#9C7C62" passo={14} semente="f-cruz2" />
    <Faceta pontos={[[350, 1580], [350, 1110], [380, 1010], [450, 950], [540, 930], [630, 950], [700, 1010], [730, 1110], [730, 1580]]} cor="#2A1D1B" passo={50} semente="f-portal" forca={0.1} />
    <Faceta pontos={[[350, 1580], [350, 1120], [290, 1150], [290, 1610]]} cor="#6E4A30" passo={40} semente="f-porta-e" forca={0.2} />
    <Faceta pontos={[[730, 1580], [730, 1120], [790, 1150], [790, 1610]]} cor="#6E4A30" passo={40} semente="f-porta-d" forca={0.2} />
    <Faceta pontos={[[60, 1580], [1020, 1580], [1060, 1660], [20, 1660]]} cor="#B39377" passo={60} semente="f-deg1" forca={0.15} />
    <Faceta pontos={[[0, 1660], [1080, 1660], [1080, 1920], [0, 1920]]} cor="#9A7E66" passo={80} semente="f-chao" forca={0.15} />
    <Raios id="f-raios" origem={[1000, 900]} alvos={[[300, 1800, 500], [600, 1900, 380]]} opacidade={0.22} cor="#FFE2B8" f={f} />
    <FielLP x={850} y={1880} escala={1.02} tipo="senhora" bracos="maoNoPeito" boca="O" olhos="arregalados" sobrancelha="alta" semente="fi2" />
    <FielLP x={1010} y={1900} escala={1.06} tipo="homem" camisa="#5F7F5A" boca="O" olhos="arregalados" sobrancelha="alta" espelhado semente="fi3" />
    <PadreLP x={450} y={1860} escala={1.16} casula={CASULAS.rosa} pose="bracosCruzados" semente="pa4"
      oculos={<g transform="scale(0.42)"><OculosMeme f={6} /></g>} />
    <Particulas f={f} n={24} area={[100, 900, 880, 800]} semente="f-p" estrelas={5} cor="#FFE6C0" />
    <VinhetaSuave id="f-v" forca={0.4} />
  </>
);

export type PropsEstilo = { quadro: number; legendaY?: number };

export const QuadrosEstilo: React.FC<PropsEstilo> = ({ quadro, legendaY = 1200 }) => {
  const f = 40;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Tela>
        {quadro === 1 && <Sacristia f={f} />}
        {quadro === 2 && <Advento f={f} />}
        {quadro === 3 && <Nave f={f} />}
        {quadro === 4 && <Fachada f={f} />}
        <Textura opacidade={0.1} />
      </Tela>
      {quadro === 1 && (
        <>
          <TituloCinema y={310} linhas={[{ texto: "POR QUE O PADRE", tamanho: 74 }, { texto: "MUDA DE COR?", tamanho: 92, cor: "#F2C978" }]} />
          <LegendaKaraoke palavras={["VOCÊ", "JÁ", "SE", "PERGUNTOU"]} ativa={3} y={legendaY} />
        </>
      )}
      {quadro === 2 && (
        <>
          <Rotulo texto="ROXO · ADVENTO" />
          <TituloCinema y={400} linhas={[{ texto: "1º DOMINGO", tamanho: 96, cor: "#E9C77B" }, { texto: "DO ADVENTO · 29/11", tamanho: 44, espaco: 0.2 }]} />
          <LegendaKaraoke palavras={["E", "NESTE", "DOMINGO", "COMEÇA", "O", "ADVENTO"]} ativa={3} y={legendaY} />
        </>
      )}
      {quadro === 3 && (
        <>
          <Rotulo texto="VERDE · TEMPO COMUM" />
          <LegendaKaraoke palavras={["UM", "CATÓLICO", "DE", "TEMPO", "COMUM"]} ativa={1} y={legendaY} />
        </>
      )}
      {quadro === 4 && (
        <>
          <Rotulo texto="ROSA · GAUDETE E LAETARE" />
          <TituloCinema y={380} linhas={[{ texto: "É LITURGIA.", tamanho: 104 }]} />
          <LegendaKaraoke palavras={["ELE", "NÃO", "PERDEU", "UMA", "APOSTA"]} ativa={4} y={legendaY} />
        </>
      )}
    </AbsoluteFill>
  );
};
