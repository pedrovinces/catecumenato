// Luz de cinema para o estilo low-poly: céu em degradê, raios de luz, brilhos, névoa, poeira e estrelinhas.
import React from "react";
import { random } from "remotion";

export const Degrade: React.FC<{ id: string; cores: [number, string][]; x?: number; y?: number; w?: number; h?: number; vertical?: boolean }> = ({ id, cores, x = 0, y = 0, w = 1080, h = 1920, vertical = true }) => (
  <g>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2={vertical ? "0" : "1"} y2={vertical ? "1" : "0"}>
        {cores.map(([o, c], i) => (
          <stop key={i} offset={o} stopColor={c} />
        ))}
      </linearGradient>
    </defs>
    <rect x={x} y={y} width={w} height={h} fill={`url(#${id})`} />
  </g>
);

/** Raios de luz saindo de uma origem, com borda difusa. */
export const Raios: React.FC<{ id: string; origem: [number, number]; alvos: [number, number, number][]; cor?: string; opacidade?: number; f?: number }> = ({ id, origem, alvos, cor = "#FFF6DA", opacidade = 0.35, f = 0 }) => (
  <g style={{ mixBlendMode: "screen" }} opacity={opacidade * (0.9 + 0.1 * Math.sin(f / 18))}>
    <defs>
      <filter id={`${id}-b`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation={14} />
      </filter>
      <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={origem[0]} y1={origem[1]} x2={alvos[0][0]} y2={alvos[0][1]}>
        <stop offset="0" stopColor={cor} stopOpacity={0.95} />
        <stop offset="1" stopColor={cor} stopOpacity={0} />
      </linearGradient>
    </defs>
    <g filter={`url(#${id}-b)`}>
      {alvos.map(([x, y, largura], i) => (
        <path key={i} d={`M ${origem[0] - 10} ${origem[1]} L ${origem[0] + 10} ${origem[1]} L ${x + largura / 2} ${y} L ${x - largura / 2} ${y} Z`} fill={`url(#${id}-g)`} />
      ))}
    </g>
  </g>
);

export const Brilho: React.FC<{ id: string; x: number; y: number; r: number; cor?: string; forca?: number }> = ({ id, x, y, r, cor = "#FFD98A", forca = 0.8 }) => (
  <g style={{ mixBlendMode: "screen" }}>
    <defs>
      <radialGradient id={id}>
        <stop offset="0" stopColor={cor} stopOpacity={forca} />
        <stop offset="0.35" stopColor={cor} stopOpacity={forca * 0.45} />
        <stop offset="1" stopColor={cor} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
  </g>
);

export const Nevoa: React.FC<{ id: string; cor: string; de?: number; ate?: number; forca?: number }> = ({ id, cor, de = 900, ate = 1920, forca = 0.45 }) => (
  <g>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={cor} stopOpacity={0} />
        <stop offset="1" stopColor={cor} stopOpacity={forca} />
      </linearGradient>
    </defs>
    <rect x={0} y={de} width={1080} height={ate - de} fill={`url(#${id})`} />
  </g>
);

export const VinhetaSuave: React.FC<{ id: string; forca?: number; cor?: string }> = ({ id, forca = 0.45, cor = "#0B0710" }) => (
  <g>
    <defs>
      <radialGradient id={id} cx="0.5" cy="0.45" r="0.75">
        <stop offset="0.55" stopColor={cor} stopOpacity={0} />
        <stop offset="1" stopColor={cor} stopOpacity={forca} />
      </radialGradient>
    </defs>
    <rect x={0} y={0} width={1080} height={1920} fill={`url(#${id})`} />
  </g>
);

/** Estrelinha de 4 pontas. */
export const Estrelinha: React.FC<{ x: number; y: number; r: number; cor?: string; opacidade?: number }> = ({ x, y, r, cor = "#FFF4D6", opacidade = 1 }) => (
  <path
    d={`M ${x} ${y - r} Q ${x + r * 0.12} ${y - r * 0.12} ${x + r} ${y} Q ${x + r * 0.12} ${y + r * 0.12} ${x} ${y + r} Q ${x - r * 0.12} ${y + r * 0.12} ${x - r} ${y} Q ${x - r * 0.12} ${y - r * 0.12} ${x} ${y - r} Z`}
    fill={cor}
    opacity={opacidade}
  />
);

/** Poeira dourada em suspensão e estrelinhas piscando. */
export const Particulas: React.FC<{ f: number; n?: number; area?: [number, number, number, number]; semente?: string; cor?: string; estrelas?: number }> = ({ f, n = 40, area = [0, 300, 1080, 1500], semente = "p", cor = "#FFE9B0", estrelas = 8 }) => {
  const [x0, y0, w, h] = area;
  return (
    <g style={{ mixBlendMode: "screen" }}>
      {Array.from({ length: n }, (_, i) => {
        const x = x0 + ((random(`${semente}x${i}`) * w + f * (0.3 + random(`${semente}v${i}`) * 0.6)) % w);
        const y = y0 + ((random(`${semente}y${i}`) * h - f * (0.4 + random(`${semente}u${i}`) * 0.5) + h * 10) % h);
        const op = 0.25 + 0.5 * Math.abs(Math.sin(f / (20 + random(`${semente}o${i}`) * 30) + i));
        return <circle key={i} cx={x} cy={y} r={1.5 + random(`${semente}r${i}`) * 2.5} fill={cor} opacity={op} />;
      })}
      {Array.from({ length: estrelas }, (_, i) => {
        const x = x0 + random(`${semente}ex${i}`) * w;
        const y = y0 + random(`${semente}ey${i}`) * h;
        const pulso = Math.max(0, Math.sin(f / 14 + i * 1.7));
        return <Estrelinha key={`e${i}`} x={x} y={y} r={6 + 10 * pulso} opacidade={0.3 + 0.7 * pulso} />;
      })}
    </g>
  );
};
