// Efeito-assinatura [CONGELA]: a imagem para, ganha sépia, granulação, vinheta e zoom de 105%.
// Volta à cor com corte seco. Os filhos em `tempoReal` (textos, selo) continuam no tempo real.
import React from "react";
import { AbsoluteFill, Freeze, useCurrentFrame } from "remotion";
import type { Janela } from "../../lib/linha-do-tempo";

export const Granulacao: React.FC<{ f: number; opacidade?: number }> = ({ f, opacidade = 0.28 }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: opacidade }}>
    <filter id={`grao-${f}`}>
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 97} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter={`url(#grao-${f})`} />
  </svg>
);

export const Vinheta: React.FC<{ forca?: number }> = ({ forca = 0.62 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(40,24,8,${forca}) 100%)` }} />
);

export const Congela: React.FC<{ janelas: Janela[]; children: React.ReactNode; tempoReal?: React.ReactNode }> = ({ janelas, children, tempoReal }) => {
  const f = useCurrentFrame();
  const j = janelas.find((w) => f >= w.inicio && f < w.fim);
  if (!j)
    return (
      <AbsoluteFill>
        {children}
        {tempoReal}
      </AbsoluteFill>
    );
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: "scale(1.05)", filter: "sepia(0.92) saturate(0.85) contrast(1.08) brightness(0.96)" }}>
        <Freeze frame={j.inicio}>{children}</Freeze>
        {tempoReal}
      </AbsoluteFill>
      <Granulacao f={f} />
      <Vinheta />
    </AbsoluteFill>
  );
};
