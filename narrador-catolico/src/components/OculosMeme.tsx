// Óculos escuros em pixel art (desenho próprio). Descem em degraus de 3 quadros e encaixam com brilho.
// Desenhado centrado nos olhos (0,0) do personagem; largura ~ 300 unidades locais.
import React from "react";

const P = 17; // tamanho do pixel
// 1 = preto, 2 = brilho branco. 18 colunas x 5 linhas.
const MAPA = [
  "111111111111111111",
  "011222211112222110",
  "011211111112111110",
  "001111100001111100",
  "000111000000111000",
];

export const OculosMeme: React.FC<{ f: number; queda?: number; passos?: number; brilho?: boolean }> = ({ f, queda = 760, passos = 5, brilho = true }) => {
  // f = quadros desde o encaixe (negativo = ainda descendo)
  const descida = passos * 3;
  if (f < -descida) return null;
  const degrauAtual = Math.min(passos, Math.floor((f + descida) / 3));
  const dy = f >= 0 ? 0 : -queda * (1 - degrauAtual / passos);
  const largura = MAPA[0].length * P;
  const x0 = -largura / 2;
  const y0 = -2 * P + 4;
  const brilhoT = f >= 0 && f < 10 ? f / 10 : -1;
  return (
    <g transform={`translate(0 ${dy})`}>
      {MAPA.map((linha, r) =>
        linha.split("").map((c, k) =>
          c === "0" ? null : <rect key={`${r}-${k}`} x={x0 + k * P} y={y0 + r * P} width={P + 0.6} height={P + 0.6} fill={c === "2" ? "#FFFFFF" : "#0D0D0D"} />,
        ),
      )}
      {brilho && brilhoT >= 0 && (
        <g opacity={1 - brilhoT} transform={`translate(${x0 + largura * (0.15 + brilhoT * 0.7)} ${y0 + P})`}>
          <path d="M 0 -60 L 10 -10 L 60 0 L 10 10 L 0 60 L -10 10 L -60 0 L -10 -10 Z" fill="#FFFFFF" stroke="#0D0D0D" strokeWidth={4} />
        </g>
      )}
    </g>
  );
};
