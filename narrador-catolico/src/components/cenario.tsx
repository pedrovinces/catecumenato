// Objetos de cenário no traço da série (contorno grosso, sombra chapada).
import React from "react";
import { random } from "remotion";
import { CORES, DOURADO, TINTA, CONTORNO, escurecer, clarear } from "../lib/paleta";
import { Fiel, type TipoFiel } from "./Fiel";

/** Parede com listras suaves e piso. */
export const Ambiente: React.FC<{ cor: string; piso?: number; listras?: boolean; corPiso?: string }> = ({ cor, piso = 1560, listras = true, corPiso }) => (
  <g>
    <rect x={0} y={0} width={1080} height={1920} fill={cor} />
    {listras &&
      Array.from({ length: 9 }, (_, i) => <rect key={i} x={i * 130 + 30} y={0} width={58} height={piso} fill={escurecer(cor, 0.05)} />)}
    <rect x={0} y={piso} width={1080} height={1920 - piso} fill={corPiso ?? escurecer(cor, 0.22)} />
    <line x1={0} x2={1080} y1={piso} y2={piso} stroke={TINTA} strokeWidth={CONTORNO} />
  </g>
);

/** Espelho de corpo inteiro com moldura de madeira. O reflexo entra como children (recortado no vidro). */
export const Espelho: React.FC<{ x: number; y: number; largura?: number; altura?: number; children?: React.ReactNode }> = ({ x, y, largura = 320, altura = 940, children }) => {
  const id = `vidro-${x}-${y}`;
  return (
    <g>
      <rect x={x - largura / 2 - 26} y={y - altura - 26} width={largura + 52} height={altura + 52} rx={40} fill="#8D5B34" stroke={TINTA} strokeWidth={CONTORNO} />
      <rect x={x - largura / 2 - 12} y={y - altura - 12} width={largura + 24} height={altura + 24} rx={30} fill="#A9744A" />
      <defs>
        <clipPath id={id}>
          <rect x={x - largura / 2} y={y - altura} width={largura} height={altura} rx={24} />
        </clipPath>
      </defs>
      <rect x={x - largura / 2} y={y - altura} width={largura} height={altura} rx={24} fill="#CFE8EE" stroke={TINTA} strokeWidth={CONTORNO} />
      <g clipPath={`url(#${id})`}>
        {children}
        <path d={`M ${x - largura / 2 + 40} ${y - altura + 60} L ${x - largura / 2 + 120} ${y - altura + 20}`} stroke="#FFFFFF" strokeWidth={26} opacity={0.6} strokeLinecap="round" />
        <path d={`M ${x - largura / 2 + 30} ${y - altura + 170} L ${x - largura / 2 + 190} ${y - altura + 70}`} stroke="#FFFFFF" strokeWidth={14} opacity={0.5} strokeLinecap="round" />
      </g>
      <rect x={x - largura / 2} y={y - altura} width={largura} height={altura} rx={24} fill="none" stroke={TINTA} strokeWidth={CONTORNO} />
      {[-1, 1].map((l) => (
        <path key={l} d={`M ${x + (l * largura) / 2 + l * 20} ${y + 20} L ${x + (l * largura) / 2 + l * 70} ${y + 60}`} stroke={TINTA} strokeWidth={22} strokeLinecap="round" />
      ))}
    </g>
  );
};

/** Cabide voando para fora do quadro. t = quadros desde que saiu. */
export const CabideVoando: React.FC<{ x: number; y: number; t: number; cor: string; dir?: number; semente?: string }> = ({ x, y, t, cor, dir = -1, semente = "c" }) => {
  if (t < 0 || t > 14) return null;
  // sai por cima e para o lado, longe dos rostos
  const vx = dir * (62 + random(semente) * 30);
  const vy = -78 + random(semente + "y") * 18;
  const px = x + vx * t;
  const py = y + vy * t + 4.5 * t * t;
  const rot = dir * t * 38;
  return (
    <g transform={`translate(${px} ${py}) rotate(${rot}) scale(0.55)`}>
      <path d="M 0 0 q 0 -34 22 -34 q 20 0 18 20" fill="none" stroke={TINTA} strokeWidth={9} strokeLinecap="round" />
      <path d="M -96 56 L 0 0 L 96 56 Z" fill="none" stroke={TINTA} strokeWidth={14} strokeLinejoin="round" />
      <path d="M -96 56 L 0 0 L 96 56 Z" fill="none" stroke="#B9875A" strokeWidth={7} strokeLinejoin="round" />
      <path d="M -92 58 Q -110 200 -80 280 Q 0 310 80 280 Q 110 200 92 58 Z" fill={cor} stroke={TINTA} strokeWidth={CONTORNO} strokeLinejoin="round" />
    </g>
  );
};

/** Mala de viagem com adesivos genéricos. */
export const Mala: React.FC<{ x: number; y: number; cor: string; largura?: number; altura?: number; deitada?: boolean }> = ({ x, y, cor, largura = 230, altura = 300, deitada }) => {
  const w = deitada ? altura : largura;
  const h = deitada ? largura * 0.7 : altura;
  return (
    <g>
      <rect x={x - w / 2 + 8} y={y - h + 10} width={w} height={h} rx={26} fill={TINTA} opacity={0.25} />
      {!deitada && <path d={`M ${x - 40} ${y - h} L ${x - 40} ${y - h - 70} L ${x + 40} ${y - h - 70} L ${x + 40} ${y - h}`} fill="none" stroke={TINTA} strokeWidth={14} strokeLinejoin="round" />}
      <rect x={x - w / 2} y={y - h} width={w} height={h} rx={26} fill={cor} stroke={TINTA} strokeWidth={CONTORNO} />
      {[0.33, 0.66].map((k) => (
        <line key={k} x1={x - w / 2 + w * k} x2={x - w / 2 + w * k} y1={y - h + 14} y2={y - 14} stroke={escurecer(cor, 0.25)} strokeWidth={8} />
      ))}
      <circle cx={x - w / 4} cy={y - h * 0.65} r={26} fill="#FFFFFF" stroke={TINTA} strokeWidth={5} />
      <rect x={x + w / 10} y={y - h * 0.42} width={56} height={38} rx={6} fill={DOURADO} stroke={TINTA} strokeWidth={5} transform={`rotate(-12 ${x + w / 10} ${y - h * 0.42})`} />
      {[-1, 1].map((l) => (
        <circle key={l} cx={x + (l * w) / 3} cy={y + 8} r={14} fill="#37474F" stroke={TINTA} strokeWidth={5} />
      ))}
    </g>
  );
};

/** Mesa simples com toalha. */
export const Mesa: React.FC<{ x: number; y: number; largura?: number; toalha?: string }> = ({ x, y, largura = 620, toalha = "#FFFDF5" }) => (
  <g>
    {[-1, 1].map((l) => (
      <rect key={l} x={x + (l * largura) / 2 - (l > 0 ? 60 : 0) - 0} y={y} width={60} height={300} fill="#7B4F2C" stroke={TINTA} strokeWidth={CONTORNO} />
    ))}
    <rect x={x - largura / 2 - 20} y={y - 40} width={largura + 40} height={60} rx={10} fill="#8D5B34" stroke={TINTA} strokeWidth={CONTORNO} />
    <path d={`M ${x - largura / 2 + 30} ${y - 42} L ${x + largura / 2 - 30} ${y - 42} L ${x + largura / 2 - 60} ${y + 110} L ${x - largura / 2 + 60} ${y + 110} Z`} fill={toalha} stroke={TINTA} strokeWidth={CONTORNO} strokeLinejoin="round" />
  </g>
);

/** Coroa do Advento: guirlanda e quatro velas (três roxas e uma rosa). `acesas` liga as primeiras velas. */
export const CoroaAdvento: React.FC<{ x: number; y: number; escala?: number; acesas?: number; f?: number; faisca?: number }> = ({ x, y, escala = 1, acesas = 0, f = 0, faisca = -1 }) => {
  const velas = [
    { dx: -170, dy: -10, cor: CORES.roxo, h: 230 },
    { dx: -60, dy: -50, cor: CORES.roxo, h: 230 },
    { dx: 60, dy: -50, cor: CORES.rosa, h: 230 },
    { dx: 170, dy: -10, cor: CORES.roxo, h: 230 },
  ];
  // ordem de acender: 1ª roxa (esq.), 2ª roxa, rosa (Gaudete), última roxa
  const ordem = [0, 1, 2, 3];
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <ellipse cx={0} cy={30} rx={300} ry={92} fill="#2E6B30" stroke={TINTA} strokeWidth={CONTORNO} />
      <ellipse cx={0} cy={22} rx={190} ry={44} fill="#1E4620" stroke={TINTA} strokeWidth={CONTORNO - 2} />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <ellipse key={i} cx={Math.cos(a) * 250} cy={30 + Math.sin(a) * 70} rx={40} ry={18} transform={`rotate(${(a * 180) / Math.PI + 90} ${Math.cos(a) * 250} ${30 + Math.sin(a) * 70})`} fill="#43A047" stroke={TINTA} strokeWidth={4} />;
      })}
      {[-120, 0, 120].map((dx, i) => (
        <circle key={i} cx={dx} cy={96 - Math.abs(dx) * 0.1} r={16} fill="#C62828" stroke={TINTA} strokeWidth={4} />
      ))}
      {velas.map((v, i) => {
        const acesa = ordem.indexOf(i) < acesas;
        const pisca = 1 + Math.sin(f * 0.9 + i) * 0.08;
        return (
          <g key={i} transform={`translate(${v.dx} ${v.dy})`}>
            <rect x={-30} y={-v.h} width={60} height={v.h} rx={10} fill={v.cor} stroke={TINTA} strokeWidth={CONTORNO} />
            <rect x={-30} y={-v.h} width={18} height={v.h} fill={clarear(v.cor, 0.25)} opacity={0.6} />
            <line x1={0} x2={0} y1={-v.h} y2={-v.h - 20} stroke={TINTA} strokeWidth={6} />
            {acesa && (
              <g transform={`translate(0 ${-v.h - 20}) scale(${pisca})`}>
                <path d="M 0 -78 Q 34 -30 18 -6 Q 0 8 -18 -6 Q -34 -30 0 -78 Z" fill="#FFB300" stroke={TINTA} strokeWidth={5} />
                <path d="M 0 -48 Q 14 -22 8 -8 Q 0 0 -8 -8 Q -14 -22 0 -48 Z" fill="#FFF59D" />
              </g>
            )}
          </g>
        );
      })}
      {faisca >= 0 && faisca < 10 && (
        <g transform={`translate(${velas[0].dx} ${velas[0].dy - velas[0].h - 40})`} opacity={1 - faisca / 10}>
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const r = 30 + faisca * 12;
            return <line key={i} x1={Math.cos(a) * r * 0.5} y1={Math.sin(a) * r * 0.5} x2={Math.cos(a) * r} y2={Math.sin(a) * r} stroke="#FFD54F" strokeWidth={8} strokeLinecap="round" />;
          })}
        </g>
      )}
    </g>
  );
};

/** Arquibancada genérica com torcida em cores neutras (sem escudo, nome ou cores de clube). */
export const Arquibancada: React.FC<{ cor: string; f: number; degraus?: number }> = ({ cor, f, degraus = 6 }) => {
  const tipos: TipoFiel[] = ["homem", "moca", "jovem", "senhora", "idoso", "homem", "jovem", "moca"];
  const roupas = ["#90A4AE", "#BCAAA4", "#B0BEC5", "#D7CCC8", "#A1887F", "#CFD8DC", "#9E9E9E", "#E0E0E0"];
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill={escurecer(cor, 0.1)} />
      {/* holofotes */}
      {[180, 900].map((x, i) => (
        <g key={i}>
          <rect x={x - 70} y={120} width={140} height={90} rx={12} fill="#ECEFF1" stroke={TINTA} strokeWidth={CONTORNO} />
          {[0, 1, 2].map((k) => (
            <circle key={k} cx={x - 40 + k * 40} cy={165} r={14} fill="#FFF59D" stroke={TINTA} strokeWidth={4} />
          ))}
          <line x1={x} x2={x} y1={210} y2={420} stroke={TINTA} strokeWidth={12} />
        </g>
      ))}
      {Array.from({ length: degraus }, (_, i) => {
        const y = 520 + i * 200;
        return (
          <g key={i}>
            <rect x={0} y={y} width={1080} height={200} fill={i % 2 ? escurecer(cor, 0.28) : escurecer(cor, 0.2)} />
            <rect x={0} y={y} width={1080} height={26} fill={clarear(cor, 0.12)} stroke={TINTA} strokeWidth={5} />
          </g>
        );
      })}
      {/* torcida ao fundo: só cabeça e ombros, braços para cima alternando */}
      {Array.from({ length: 2 }, (_, linha) =>
        Array.from({ length: 6 }, (_, i) => {
          const x = 60 + i * 190 + (linha % 2) * 95;
          const y = 760 + linha * 200;
          const sobe = Math.floor((f + i * 3 + linha * 5) / 6) % 2 === 0;
          return (
            <Fiel
              key={`${linha}-${i}`}
              x={x}
              y={y + 330}
              escala={0.5}
              tipo={tipos[(i + linha * 3) % tipos.length]}
              roupa={roupas[(i + linha) % roupas.length]}
              bracos={sobe ? "celebra" : "baixo"}
              expressao={{ olhos: "feliz", boca: "aberta" }}
            />
          );
        }),
      )}
    </g>
  );
};

/** Sino de igreja balançando com linhas de som. f = quadros desde que tocou. */
export const SinoIgreja: React.FC<{ x: number; y: number; f: number; escala?: number }> = ({ x, y, f, escala = 1 }) => {
  if (f < 0) return null;
  const ang = Math.sin(f * 0.6) * 24 * Math.max(0, 1 - f / 40);
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <rect x={-90} y={-30} width={180} height={30} rx={8} fill="#6D4C41" stroke={TINTA} strokeWidth={CONTORNO} />
      <g transform={`rotate(${ang})`}>
        <path d="M 0 0 C -60 0 -70 60 -76 120 C -80 160 -96 180 -120 196 L 120 196 C 96 180 80 160 76 120 C 70 60 60 0 0 0 Z" fill={DOURADO} stroke={TINTA} strokeWidth={CONTORNO} strokeLinejoin="round" />
        <path d="M -40 30 Q -56 80 -58 140" fill="none" stroke="#F3DC8B" strokeWidth={12} strokeLinecap="round" />
        <circle cx={0} cy={212} r={22} fill="#8C6E12" stroke={TINTA} strokeWidth={CONTORNO} />
      </g>
      {f < 30 &&
        [1, -1].map((l) => (
          <g key={l} fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" opacity={1 - f / 30}>
            <path d={`M ${l * 150} 60 Q ${l * 180} 110 ${l * 150} 160`} />
            <path d={`M ${l * 196} 30 Q ${l * 236} 110 ${l * 196} 190`} />
          </g>
        ))}
    </g>
  );
};

/** Manjedoura vazia com palha. */
export const Manjedoura: React.FC<{ x: number; y: number; escala?: number }> = ({ x, y, escala = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${escala})`}>
    {[-1, 1].map((l) => (
      <g key={l}>
        <line x1={l * 150} y1={0} x2={l * 60} y2={-200} stroke={TINTA} strokeWidth={34} strokeLinecap="round" />
        <line x1={l * 150} y1={0} x2={l * 60} y2={-200} stroke="#8D5B34" strokeWidth={20} strokeLinecap="round" />
      </g>
    ))}
    <path d="M -190 -230 L 190 -230 L 150 -110 L -150 -110 Z" fill="#A9744A" stroke={TINTA} strokeWidth={CONTORNO} strokeLinejoin="round" />
    {Array.from({ length: 14 }, (_, i) => (
      <line key={i} x1={-170 + i * 26} y1={-226} x2={-150 + i * 26 + (i % 3) * 8} y2={-266 - (i % 4) * 8} stroke="#F2C94C" strokeWidth={8} strokeLinecap="round" />
    ))}
    <line x1={-150} y1={-170} x2={150} y2={-170} stroke="#7B4F2C" strokeWidth={8} />
  </g>
);

/** Porta da igreja: arco de pedra, portas de madeira abertas e interior escuro. */
export const PortaIgreja: React.FC<{ x: number; y: number; largura?: number; altura?: number; corParede?: string }> = ({ x, y, largura = 620, altura = 1000, corParede = "#EDE3D1" }) => {
  const r = largura / 2;
  return (
    <g>
      <rect x={0} y={0} width={1080} height={y} fill={corParede} />
      {Array.from({ length: 12 }, (_, i) =>
        Array.from({ length: 9 }, (_, j) => (
          <rect key={`${i}${j}`} x={(j % 2 ? -60 : 0) + j * 0 + (i % 2 ? 60 : 0) + (j * 120)} y={i * 130} width={118} height={128} fill="none" stroke={escurecer(corParede, 0.12)} strokeWidth={4} />
        )),
      )}
      <path d={`M ${x - r - 50} ${y} L ${x - r - 50} ${y - altura + r} A ${r + 50} ${r + 50} 0 0 1 ${x + r + 50} ${y - altura + r} L ${x + r + 50} ${y} Z`} fill="#BDB5A6" stroke={TINTA} strokeWidth={CONTORNO} />
      <path d={`M ${x - r} ${y} L ${x - r} ${y - altura + r} A ${r} ${r} 0 0 1 ${x + r} ${y - altura + r} L ${x + r} ${y} Z`} fill="#2A1E1A" stroke={TINTA} strokeWidth={CONTORNO} />
      {/* luz do interior e bancos */}
      <path d={`M ${x - 120} ${y} L ${x - 60} ${y - altura + r + 60} L ${x + 60} ${y - altura + r + 60} L ${x + 120} ${y} Z`} fill="#4A3A2E" />
      {/* luz do interior baixa, longe da cabeça de quem está na porta (não pode parecer auréola) */}
      {[-1, 1].map((l) => (
        <g key={l}>
          <rect x={x + l * 170 - 14} y={y - 420} width={28} height={90} rx={6} fill="#F5F0E6" stroke={TINTA} strokeWidth={4} />
          <path d={`M ${x + l * 170} ${y - 470} q 14 22 0 40 q -14 -18 0 -40 Z`} fill="#FFB300" stroke={TINTA} strokeWidth={3} />
        </g>
      ))}
      {[-1, 1].map((l) => (
        <path key={l} d={`M ${x + l * r} ${y} L ${x + l * (r + 30)} ${y + 20} L ${x + l * (r + 30)} ${y - altura + r + 30} L ${x + l * r} ${y - altura + r}`} fill="#8D5B34" stroke={TINTA} strokeWidth={CONTORNO} strokeLinejoin="round" />
      ))}
      <rect x={0} y={y} width={1080} height={1920 - y} fill="#9E9384" />
      <line x1={0} x2={1080} y1={y} y2={y} stroke={TINTA} strokeWidth={CONTORNO} />
      {[1, 2].map((k) => (
        <rect key={k} x={x - r - 50 - k * 40} y={y + (k - 1) * 40} width={largura + 100 + k * 80} height={40} fill={escurecer("#BDB5A6", k * 0.06)} stroke={TINTA} strokeWidth={5} />
      ))}
    </g>
  );
};
