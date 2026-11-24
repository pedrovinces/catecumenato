// Barra de carregamento em estilo de celular. Avança até `alvo` e trava (o cursor pisca).
import React from "react";
import { Easing, interpolate } from "remotion";
import { TINTA } from "../lib/paleta";
import { LEGENDA } from "../lib/fontes";

export const BarraDeCarregamento: React.FC<{
  x: number;
  y: number;
  largura?: number;
  f: number; // quadros desde que a barra entrou
  de?: number; // % inicial
  alvo: number; // % final
  rotulo?: string;
  cor?: string;
  duracao?: number;
}> = ({ x, y, largura = 760, f, de = 0, alvo, rotulo = "CARREGANDO...", cor = "#4CAF50", duracao = 24 }) => {
  if (f < 0) return null;
  const pct = interpolate(f, [4, 4 + duracao], [de, alvo], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const travou = f > 4 + duracao;
  const pisca = travou && Math.floor(f / 8) % 2 === 0;
  const entrada = interpolate(f, [0, 5], [0.6, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
  const alt = 86;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: largura, transform: `scale(${entrada})`, transformOrigin: "50% 50%" }}>
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: `7px solid ${TINTA}`,
          borderRadius: 30,
          padding: "20px 24px 24px",
          boxShadow: `9px 10px 0 ${TINTA}`,
        }}
      >
        <div style={{ fontFamily: LEGENDA, fontWeight: 900, fontSize: 38, color: TINTA, marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
          <span>{rotulo}</span>
          <span style={{ opacity: travou && !pisca ? 0.35 : 1 }}>{Math.round(pct)}%</span>
        </div>
        <div style={{ height: alt, border: `6px solid ${TINTA}`, borderRadius: alt / 2, overflow: "hidden", backgroundColor: "#ECEFF1", position: "relative" }}>
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              backgroundColor: cor,
              backgroundImage: "repeating-linear-gradient(135deg, rgba(255,255,255,0.28) 0 18px, rgba(255,255,255,0) 18px 36px)",
              borderRight: pct > 0 ? `6px solid ${TINTA}` : undefined,
            }}
          />
        </div>
      </div>
    </div>
  );
};
