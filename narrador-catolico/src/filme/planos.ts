// Planos do filme: cada imagem/clipe começa numa palavra da narração e vai até o próximo plano.
import { Easing, interpolate } from "remotion";
import { z } from "zod";
import type { Janela, Linha } from "../lib/linha-do-tempo";
import { acharFrase } from "../lib/tokens";

const Ponto = z.object({ z: z.number().positive().default(1), x: z.number().default(0), y: z.number().default(0) });

export const PlanoJ = z.object({
  id: z.string().min(1), // nome da imagem (assets/img) e do clipe (assets/video)
  chave: z.string().optional(), // quando o mesmo id aparece duas vezes
  cena: z.string().min(1),
  palavra: z.string().optional(), // sem palavra: começa com a cena
  ocorrencia: z.number().int().positive().optional(),
  ancora: z.enum(["inicio", "fim"]).optional(),
  deslocamento: z.number().int().optional(), // quadros
  trecho: z.number().nonnegative().optional(), // segundos já usados do clipe
  camera: z.object({ de: Ponto, para: Ponto }).optional(),
  fusao: z.number().int().nonnegative().optional(), // quadros de fusão com o plano anterior
  anexo: z.string().optional(), // sobreposição presa à imagem (placa, graca, baloes)
});
export const PlanosJ = z.object({ planos: z.array(PlanoJ).min(1) });

type PontoT = { z: number; x: number; y: number };
export type PlanoQ = {
  chave: string;
  id: string;
  cena: string;
  inicio: number; // quadro absoluto do corte
  fim: number;
  fusao: number;
  trecho: number; // quadros do clipe pulados
  video: { duracao: number } | null; // segundos do clipe, se existe
  camera: { de: PontoT; para: PontoT };
  anexo?: string;
};

const FUSAO_ENTRE_CENAS = 6;
const PARADA: PontoT = { z: 1, x: 0, y: 0 };

export const resolverPlanos = (bruto: unknown, linha: Linha, clipes: Record<string, number>): PlanoQ[] => {
  const { planos } = PlanosJ.parse(bruto);
  const res: PlanoQ[] = [];
  planos.forEach((p, k) => {
    const cena = linha.cenas.find((c) => c.id === p.cena);
    if (!cena) throw new Error(`plano ${p.id}: cena "${p.cena}" não existe ou está inativa`);
    let inicio = cena.inicio;
    if (p.palavra) {
      const i = acharFrase(cena.palavras, p.palavra, p.ocorrencia ?? 1);
      if (i < 0) throw new Error(`plano ${p.id}: "${p.palavra}" não está na locução da cena ${p.cena}`);
      const n = p.palavra.split(/\s+/).filter(Boolean).length;
      inicio = cena.inicio + (p.ancora === "fim" ? cena.palavras[i + n - 1].fim : cena.palavras[i].inicio);
    }
    inicio += p.deslocamento ?? 0;
    const primeiroDaCena = !p.palavra && k > 0;
    const temVideo = clipes[p.id] !== undefined;
    res.push({
      chave: p.chave ?? p.id,
      id: p.id,
      cena: p.cena,
      inicio: Math.max(0, inicio),
      fim: 0,
      fusao: p.fusao ?? (primeiroDaCena ? FUSAO_ENTRE_CENAS : 0),
      trecho: Math.round((p.trecho ?? 0) * linha.fps),
      video: temVideo ? { duracao: clipes[p.id] } : null,
      camera: p.camera
        ? { de: { ...PARADA, ...p.camera.de }, para: { ...PARADA, ...p.camera.para } }
        : temVideo
          ? { de: PARADA, para: PARADA } // o clipe já tem movimento próprio
          : { de: PARADA, para: { z: 1.08, x: 0, y: 0 } }, // imagem parada: aproximação lenta
      anexo: p.anexo,
    });
  });
  res.sort((a, b) => a.inicio - b.inicio);
  res.forEach((p, k) => {
    p.fim = k + 1 < res.length ? res[k + 1].inicio : linha.duracao;
    if (p.fim <= p.inicio) throw new Error(`plano ${p.chave}: termina antes de começar (confira as palavras)`);
  });
  return res;
};

/** Transformação de câmera do plano no quadro absoluto f (zoom e deslocamento suaves). */
export const cameraNoQuadro = (p: PlanoQ, f: number) => {
  const a = p.inicio - p.fusao;
  const t = interpolate(f, [a, p.fim], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
  const { de, para } = p.camera;
  const z = de.z + (para.z - de.z) * t;
  const x = de.x + (para.x - de.x) * t;
  const y = de.y + (para.y - de.y) * t;
  return `translate(${x}px, ${y}px) scale(${z})`;
};

/** Janela de congelamento ativa no quadro absoluto f, se houver. */
export const janelaEm = (janelas: Janela[], f: number) => janelas.find((j) => f >= j.inicio && f < j.fim);
