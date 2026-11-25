// Sobreposições do filme no estilo cinema: rótulo do bloco, títulos em serifa, faixas, carimbos,
// letreiro, barras de carregamento, chips das festas e anexos presos à imagem (placa, rótulo, balões).
import React from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { fitText } from "@remotion/layout-utils";
import type { Janela, TextoQ } from "../lib/linha-do-tempo";
import { DESTAQUE, type NomeCor } from "../lib/paleta";
import { LEGENDA, SERIFA, TITULO } from "../lib/fontes";
import { pop } from "../lib/anim";
import { AREA } from "../components/motor/area";
import { useCena } from "../components/motor/contexto";
import { cameraNoQuadro, janelaEm, type PlanoQ } from "./planos";
import { LogoEmpilhado } from "../marca/Marca";

const CREME = "#F6EBD3";
const OURO = "#EBCB86";
const OURO_FORTE = "#F2C14E";
const FUNDO = "rgba(18,13,10,0.78)";
const SOMBRA = "0 4px 22px rgba(0,0,0,0.6), 0 2px 3px rgba(0,0,0,0.55)";
const LARGURA = AREA.direita - AREA.esquerda;

const corDaCena = (cor: NomeCor) => (cor === "branco" || cor === "sepia" || cor === "escuro" ? OURO_FORTE : DESTAQUE.clara[cor]);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Entrada e saída de um texto (escala, opacidade, deslocamento). */
const animar = (t: { inicio: number; fim: number; entrada: TextoQ["entrada"] }, f: number) => {
  const d = f - t.inicio;
  const saida = interpolate(f, [t.fim - 6, t.fim], [1, 0], clamp);
  switch (t.entrada) {
    case "pop":
      return { escala: pop(f, t.inicio, 9), opacidade: saida, dx: 0 };
    case "desliza":
      return { escala: 1, opacidade: Math.min(interpolate(d, [0, 5], [0, 1], clamp), saida), dx: interpolate(d, [0, 8], [-90, 0], { ...clamp, easing: Easing.out(Easing.cubic) }) };
    case "carimbo":
      return { escala: interpolate(d, [0, 3, 6], [1.8, 0.95, 1], clamp), opacidade: d < 0 ? 0 : saida, dx: 0 };
    case "impacto":
      return { escala: interpolate(d, [0, 4, 8], [2.4, 0.94, 1], clamp), opacidade: d < 0 ? 0 : saida, dx: 0 };
    default:
      return { escala: 1, opacidade: Math.min(interpolate(d, [0, 10], [0, 1], clamp), saida), dx: 0 };
  }
};

/** Título em serifa; o que vem depois de "=" ganha a cor da cena. */
const TituloSerifa: React.FC<{ texto: string; cor: NomeCor; max: number; destaqueTudo?: boolean; ouro?: boolean }> = ({ texto, cor, max, destaqueTudo, ouro }) => {
  const linhas = texto.split("\n");
  const tamanho = Math.min(max, ...linhas.map((l) => fitText({ text: l, withinWidth: LARGURA - 20, fontFamily: SERIFA, fontWeight: "700", letterSpacing: "0.06em" }).fontSize));
  return (
    <div style={{ textAlign: "center" }}>
      {linhas.map((l, i) => {
        const k = l.indexOf("=");
        const partes = destaqueTudo ? [["", l]] : k >= 0 ? [[l.slice(0, k), l.slice(k)]] : [[l, ""]];
        return (
          <div key={i} style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: tamanho, letterSpacing: "0.06em", lineHeight: 1.14, color: CREME, textShadow: SOMBRA, whiteSpace: "nowrap" }}>
            {partes[0][0]}
            {partes[0][1] && <span style={{ color: ouro ? OURO_FORTE : corDaCena(cor) }}>{partes[0][1]}</span>}
          </div>
        );
      })}
    </div>
  );
};

const Faixa: React.FC<{ texto: string }> = ({ texto }) => (
  <div style={{ display: "flex", justifyContent: "center" }}>
    <div
      style={{
        fontFamily: LEGENDA,
        fontWeight: 800,
        fontSize: 38,
        letterSpacing: "0.04em",
        color: CREME,
        backgroundColor: FUNDO,
        borderTop: `2px solid ${OURO}`,
        borderBottom: `2px solid ${OURO}`,
        padding: "12px 28px",
        whiteSpace: "pre-line",
        textAlign: "center",
      }}
    >
      {texto}
    </div>
  </div>
);

const Carimbo: React.FC<{ texto: string }> = ({ texto }) => (
  <div style={{ display: "flex", justifyContent: "center" }}>
    <div
      style={{
        fontFamily: SERIFA,
        fontWeight: 700,
        fontSize: 52,
        letterSpacing: "0.08em",
        color: OURO_FORTE,
        backgroundColor: FUNDO,
        border: `4px double ${OURO}`,
        padding: "10px 30px 8px",
        transform: "rotate(-5deg)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </div>
  </div>
);

/** Rótulo do bloco litúrgico (cor e tempo), discreto no topo da área segura. */
const RotuloBloco: React.FC<{ cor: string; tempo: string; opacidade: number }> = ({ cor, tempo, opacidade }) => (
  <div style={{ position: "absolute", left: AREA.esquerda, width: LARGURA, top: AREA.topo + 8, display: "flex", justifyContent: "center", opacity: opacidade }}>
    <div style={{ fontFamily: SERIFA, fontWeight: 600, fontSize: 28, letterSpacing: "0.24em", color: OURO, backgroundColor: FUNDO, border: `2px solid #A8832E`, padding: "8px 18px 8px 26px", whiteSpace: "nowrap" }}>
      {cor} · {tempo}
    </div>
  </div>
);

const Y_TITULO = (temSelo: boolean) => (temSelo ? AREA.topo + 92 : AREA.topo + 40);

const TextoFilme: React.FC<{ t: TextoQ; f: number; cor: NomeCor; temSelo: boolean }> = ({ t, f, cor, temSelo }) => {
  if (f < t.inicio || f >= t.fim) return null;
  const a = animar(t, f);
  const base: React.CSSProperties = { position: "absolute", left: AREA.esquerda, width: LARGURA, opacity: a.opacidade, transform: `translateX(${a.dx}px) scale(${a.escala})` };
  if (t.posicao === "titulo" && t.entrada === "impacto") {
    // assinatura de fecho: em duas linhas, na faixa da legenda (livre no congelamento final), longe do rosto
    const palavras = t.conteudo.split(/\s+/);
    const meio = Math.ceil(palavras.length / 3);
    const texto = t.conteudo.includes("\n") || palavras.length < 3 ? t.conteudo : `${palavras.slice(0, meio).join(" ")}\n${palavras.slice(meio).join(" ")}`;
    return (
      <div style={{ ...base, top: 1240, filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.75))" }}>
        <TituloSerifa texto={texto} cor={cor} max={118} destaqueTudo ouro />
      </div>
    );
  }
  if (t.posicao === "titulo")
    return (
      <div style={{ ...base, top: Y_TITULO(temSelo) }}>
        <TituloSerifa texto={t.conteudo} cor={cor} max={74} />
      </div>
    );
  if (t.posicao === "subtitulo")
    return (
      <div style={{ ...base, top: 600 }}>
        <Faixa texto={t.conteudo} />
      </div>
    );
  if (t.posicao === "carimbo")
    return (
      <div style={{ ...base, top: 640 }}>
        <Carimbo texto={t.conteudo} />
      </div>
    );
  if (t.posicao === "letreiro")
    return (
      <div style={{ ...base, top: 820, filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.75))" }}>
        <TituloSerifa texto={t.conteudo} cor={cor} max={132} destaqueTudo ouro />
      </div>
    );
  if (t.posicao === "assinatura") {
    // cartão final: a imagem congelada escurece e entra a marca com o convite para seguir
    const d = f - t.inicio;
    const veu = interpolate(d, [4, 16], [0, 0.8], clamp);
    const logo = interpolate(d, [10, 24], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{ backgroundColor: `rgba(12,10,18,${veu})` }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", opacity: logo, transform: `translateY(${(1 - logo) * 30}px) scale(${0.94 + 0.06 * logo})` }}>
          <LogoEmpilhado largura={700} id="cartao-final" linha={t.conteudo} brilho />
        </div>
      </AbsoluteFill>
    );
  }
  return null;
};

/** Barra de carregamento elegante (modo preparação). */
const Carregando: React.FC<{ rotulo: string; de: number; para: number; f: number; inicio: number; fim: number }> = ({ rotulo, de, para, f, inicio, fim }) => {
  if (f < inicio || f >= fim) return null;
  const d = f - inicio;
  const p = interpolate(d, [6, 34], [de, para], { ...clamp, easing: Easing.out(Easing.cubic) });
  const op = Math.min(interpolate(d, [0, 6], [0, 1], clamp), interpolate(f, [fim - 6, fim], [1, 0], clamp));
  return (
    <div style={{ position: "absolute", left: AREA.esquerda + 40, width: LARGURA - 80, top: 1060, opacity: op }}>
      <div style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: 30, letterSpacing: "0.12em", color: CREME, textShadow: SOMBRA, display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span>{rotulo}</span>
        <span style={{ color: OURO_FORTE }}>{Math.round(p)}%</span>
      </div>
      <div style={{ height: 22, borderRadius: 11, backgroundColor: "rgba(18,13,10,0.7)", border: `2px solid ${OURO}`, overflow: "hidden" }}>
        <div style={{ width: `${p}%`, height: "100%", background: `linear-gradient(90deg, #A8832E, ${OURO_FORTE})` }} />
      </div>
    </div>
  );
};

/** Chips que acendem a cada festa citada. */
const Chips: React.FC<{ itens: { texto: string; em: number | undefined }[]; f: number; ate: number | undefined }> = ({ itens, f, ate }) => {
  if (ate !== undefined && f >= ate) return null;
  return (
    <div style={{ position: "absolute", left: AREA.esquerda, width: LARGURA, top: 600, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
      {itens.map(({ texto, em }) =>
        em === undefined || f < em ? null : (
          <div
            key={texto}
            style={{
              transform: `scale(${pop(f, em, 8)})`,
              fontFamily: SERIFA,
              fontWeight: 700,
              fontSize: 34,
              letterSpacing: "0.1em",
              color: CREME,
              backgroundColor: FUNDO,
              border: `2px solid ${OURO}`,
              padding: "8px 18px 6px",
              whiteSpace: "nowrap",
            }}
          >
            {texto}
          </div>
        ),
      )}
    </div>
  );
};

/** Escurecimento suave atrás dos títulos do topo, para ler sobre qualquer imagem. */
const VeuTopo: React.FC<{ opacidade: number }> = ({ opacidade }) => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 30%, rgba(0,0,0,0) 46%)", opacity: opacidade }} />
);

// Anexos: desenhados no sistema de coordenadas da imagem, acompanham a câmera do plano.
const Placa: React.FC<{ op: number }> = ({ op }) => (
  <>
    <div style={{ position: "absolute", left: 252, top: 692, width: 220, height: 366, backgroundColor: "#242424", border: "5px solid #CFCFCF", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
      <div style={{ fontFamily: LEGENDA, fontWeight: 900, fontSize: 34, color: "#FFFFFF", letterSpacing: "0.04em" }}>EXTINTOR</div>
      {["1. PUXE", "2. MIRE", "3. APERTE"].map((l) => (
        <div key={l} style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: 26, color: "#E8E8E8", width: 160, borderTop: "2px solid #8A8A8A", paddingTop: 10 }}>
          {l}
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", left: 588, top: 636, width: 250, opacity: op, transform: `rotate(-2deg) scale(${0.9 + 0.1 * op})`, textAlign: "center", fontFamily: TITULO, fontSize: 84, lineHeight: 0.98, color: "#3A2313", textShadow: "0 1px 0 rgba(255,240,210,0.5)" }}>
      NÃO É<br />ESSE<br />FOGO
    </div>
  </>
);

/** Balão de fala ancorado pela borda direita (para não invadir os 120 px dos botões do Instagram). */
const Balao: React.FC<{ texto: string; direita: number; y: number; op: number; cauda: number }> = ({ texto, direita, y, op, cauda }) => (
  <div style={{ position: "absolute", right: 1080 - direita, top: y, opacity: op, transform: `scale(${0.6 + 0.4 * op})`, transformOrigin: `calc(100% - ${cauda}px) 100%` }}>
    <div style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: 38, color: "#1A1410", backgroundColor: "#FFF8EC", borderRadius: 34, padding: "14px 26px", boxShadow: "0 8px 22px rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}>{texto}</div>
    <div style={{ position: "absolute", right: cauda, bottom: -18, width: 0, height: 0, borderLeft: "13px solid transparent", borderRight: "13px solid transparent", borderTop: "22px solid #FFF8EC" }} />
  </div>
);

const Graca: React.FC<{ op: number; caixa: { x: number; y: number; l: number } }> = ({ op, caixa }) => (
  <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.l, textAlign: "center", opacity: op, transform: `scale(${interpolate(op, [0, 1], [1.6, 1])})` }}>
    <div style={{ fontFamily: TITULO, fontSize: 92, color: "#1F4FA8", WebkitTextStroke: "8px #FFFFFF", paintOrder: "stroke fill", letterSpacing: 2, lineHeight: 1 }}>GRAÇA</div>
    <div style={{ fontFamily: LEGENDA, fontWeight: 900, fontSize: 28, color: "#C9A227", letterSpacing: "0.18em" }}>DE DEUS</div>
  </div>
);

/** Posição da palavra GRAÇA sobre a caixa do comercial no quadro congelado (calibrada no clipe). */
export const CAIXA_GRACA = { x: 640, y: 1010, l: 330 };

export const Sobreposicoes: React.FC<{ planos: PlanoQ[]; janelas: Janela[] }> = ({ planos, janelas }) => {
  const { cena, f, ev, pal } = useCena();
  const fAbs = cena.inicio + f;
  const temSelo = !!cena.selo;
  const opSelo = Math.min(interpolate(f, [4, 12], [0, 1], clamp), interpolate(f, [cena.duracao - 8, cena.duracao], [1, 0], clamp));
  const tituloNaTela = cena.textos.some((t) => t.posicao === "titulo" && t.entrada !== "impacto" && f >= t.inicio && f < t.fim);
  const opVeu = temSelo || tituloNaTela ? (tituloNaTela ? 1 : 0.55) : 0;

  // anexos: plano visível nesta cena com sobreposição presa à imagem
  const p = planos.find((q) => q.cena === cena.id && q.anexo && fAbs >= q.inicio && fAbs < q.fim);
  let anexo: React.ReactNode = null;
  if (p) {
    const j = janelaEm(janelas, fAbs);
    const fCam = j ? j.inicio : fAbs;
    const transform = `${j ? "scale(1.05) " : ""}${cameraNoQuadro(p, fCam)}`;
    let conteudo: React.ReactNode = null;
    if (p.anexo === "placa") conteudo = <Placa op={interpolate(f, [ev("placa") ?? Infinity, (ev("placa") ?? Infinity) + 6], [0, 1], clamp)} />;
    if (p.anexo === "graca") {
      const g = ev("congela") ?? Infinity;
      conteudo = <Graca op={interpolate(f, [g, g + 5], [0, 1], clamp)} caixa={CAIXA_GRACA} />;
    }
    if (p.anexo === "baloes") {
      const a = pal("vir o padre");
      conteudo = (
        <>
          <Balao texto="PERDEU APOSTA?" direita={952} y={312} cauda={60} op={interpolate(f, [a, a + 6], [0, 1], clamp)} />
          <Balao texto="MUDOU DE TIME?" direita={940} y={440} cauda={40} op={interpolate(f, [a + 14, a + 20], [0, 1], clamp)} />
        </>
      );
    }
    anexo = <AbsoluteFill style={{ transform, transformOrigin: "50% 50%" }}>{conteudo}</AbsoluteFill>;
  }

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {anexo}
      <VeuTopo opacidade={opVeu} />
      {cena.selo && p?.anexo !== "baloes" && <RotuloBloco cor={cena.selo.cor} tempo={cena.selo.tempo} opacidade={opSelo} />}
      {cena.id === "roxo" && ev("loading") !== undefined && <Carregando rotulo="MODO PREPARAÇÃO" de={0} para={25} f={f} inicio={ev("loading")!} fim={cena.duracao} />}
      {cena.id === "rosa" && ev("loading") !== undefined && <Carregando rotulo="FALTA POUCO" de={25} para={75} f={f} inicio={ev("loading")!} fim={ev("porta") ?? cena.duracao} />}
      {cena.id === "branco" && (
        <Chips
          f={f}
          ate={ev("pergaminho")}
          itens={[
            { texto: "NATAL", em: ev("iconeNatal") },
            { texto: "PÁSCOA", em: ev("iconePascoa") },
            { texto: "NOSSA SENHORA", em: ev("iconeMaria") },
            { texto: "SANTOS NÃO MÁRTIRES", em: ev("iconeSantos") },
          ]}
        />
      )}
      {cena.textos.map((t, i) => (
        <TextoFilme key={i} t={t} f={f} cor={cena.cor} temSelo={temSelo} />
      ))}
    </AbsoluteFill>
  );
};
