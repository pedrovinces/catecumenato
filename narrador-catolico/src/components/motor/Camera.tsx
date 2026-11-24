import React from "react";
import { AbsoluteFill } from "remotion";

/** Enquadramento: zoom em torno de um foco e deslocamento (para cortes de plano e tremor). */
export const Camera: React.FC<{ zoom?: number; foco?: [number, number]; desloc?: [number, number]; children: React.ReactNode }> = ({
  zoom = 1,
  foco = [540, 960],
  desloc = [0, 0],
  children,
}) => (
  <AbsoluteFill style={{ overflow: "hidden" }}>
    <AbsoluteFill style={{ transform: `translate(${desloc[0]}px, ${desloc[1]}px) scale(${zoom})`, transformOrigin: `${foco[0]}px ${foco[1]}px` }}>{children}</AbsoluteFill>
  </AbsoluteFill>
);

/** SVG em tela cheia 1080 x 1920. */
export const Tela: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
    {children}
  </svg>
);
