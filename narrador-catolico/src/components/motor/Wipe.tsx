// Wipe da nova cor litúrgica, de baixo para cima, em 6 quadros.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CORES, DOURADO, TINTA, type NomeCor } from "../../lib/paleta";

export const QUADROS_WIPE = 6;

export const Wipe: React.FC<{ cor: NomeCor }> = ({ cor }) => {
  const f = useCurrentFrame(); // 0..5 dentro da Sequence
  const t = Math.min(1, (f + 1) / QUADROS_WIPE);
  const altura = 1920 * t;
  const borda = cor === "branco" ? DOURADO : "#FFFFFF";
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: altura, backgroundColor: CORES[cor] }} />
      {t < 1 && (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: altura - 4, height: 34, backgroundColor: borda }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: altura + 30, height: 10, backgroundColor: TINTA }} />
        </>
      )}
    </AbsoluteFill>
  );
};
