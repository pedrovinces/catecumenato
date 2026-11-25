// Prancha de comparação dos conceitos de marca: avatar (recorte redondo do Instagram), leitura em
// tamanhos pequenos, versão em fundo claro e logotipo horizontal.
import React from "react";
import { AbsoluteFill } from "remotion";
import { carregarFontes, LEGENDA, SERIFA } from "../lib/fontes";
import { CORES_ESTOLA, CREME, LogoHorizontal, NOITE, OURO, Simbolo, type Conceito } from "./Marca";

carregarFontes();

const CONCEITOS: [Conceito, string, string][] = [
  ["classico", "A · Clássico", "Microfone condensador de podcast; a grade metálica deixa uma cruz em vazio. Auréola dourada flutuando."],
  ["vitral", "B · Vitral", "A cabeça do microfone vira janela gótica em mosaico de vitral, com as cores litúrgicas e uma cruz dourada."],
  ["estola", "C · Estola", "O microfone veste a estola; a cor muda com o tempo litúrgico de cada episódio (verde, roxo, branco, vermelho, rosa)."],
  ["traco", "D · Traço", "Versão em linha, uma cor só: lê bem em 32 px, serve de marca-d'água e de carimbo."],
];

const Avatar: React.FC<{ conceito: Conceito; d: number; id: string; fundo: string; cor?: string }> = ({ conceito, d, id, fundo, cor }) => (
  <div style={{ width: d, height: d, borderRadius: d / 2, backgroundColor: fundo, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.35)" }}>
    <Simbolo conceito={conceito} tamanho={d * 0.92} id={id} corEstola={cor} />
  </div>
);

export const PranchaMarca: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, #0E0C14 0%, #1B1726 100%)", padding: 60, gap: 28 }}>
    <div style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: 54, letterSpacing: "0.14em", color: CREME }}>
      NARRADOR <span style={{ color: OURO }}>CATÓLICO</span> · <span style={{ fontSize: 34 }}>CONCEITOS DE MARCA</span>
    </div>
    {CONCEITOS.map(([c, nome, ideia], k) => (
      <div key={c} style={{ display: "flex", alignItems: "center", gap: 44, padding: "26px 34px", borderRadius: 26, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(233,185,73,0.25)" }}>
        <Avatar conceito={c} d={330} id={`av-${k}`} fundo={NOITE} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <Avatar conceito={c} d={150} id={`cl-${k}`} fundo={CREME} />
          {c === "estola" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {Object.values(CORES_ESTOLA).map((cor, i) => (
                <Avatar key={i} conceito={c} d={56} id={`e${i}-${k}`} fundo={NOITE} cor={cor} />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <Avatar conceito={c} d={64} id={`p1-${k}`} fundo={NOITE} />
              <Avatar conceito={c} d={32} id={`p2-${k}`} fundo={NOITE} />
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, flex: 1 }}>
          <div style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: 44, color: OURO, letterSpacing: "0.08em" }}>{nome}</div>
          <div style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: 26, color: "#CFC6B4", lineHeight: 1.35, maxWidth: 820 }}>{ideia}</div>
          <LogoHorizontal conceito={c} altura={170} id={`lh-${k}`} />
        </div>
      </div>
    ))}
  </AbsoluteFill>
);
