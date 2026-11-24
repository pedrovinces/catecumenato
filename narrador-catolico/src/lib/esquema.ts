// Esquema do roteiro de episódio. Um erro aqui aponta a cena e o campo antes de qualquer render.
import { z } from "zod";

const palavra = z.string().min(1);

export const Gatilho = z.object({
  palavra,
  ocorrencia: z.number().int().positive().optional(),
  evento: z.string().min(1),
  deslocamento: z.number().int().optional(), // quadros (negativo adianta)
  duracao: z.number().positive().optional(), // segundos (congela)
  ate: z.string().optional(), // congela termina no início desta palavra
  semLimite: z.boolean().optional(), // congela fora da faixa 0,8 a 1,5 s (cartão final)
});

export const Texto = z.object({
  conteudo: z.string().min(1),
  entrada: z.enum(["pop", "desliza", "carimbo", "impacto", "fade"]).default("pop"),
  posicao: z.enum(["titulo", "subtitulo", "carimbo", "letreiro", "assinatura"]).default("titulo"),
  inicio: z.number().nonnegative().optional(), // segundos desde o começo da cena
  palavra: z.string().optional(),
  ocorrencia: z.number().int().positive().optional(),
  ancora: z.enum(["inicio", "fim"]).optional(), // conta do início (padrão) ou do fim da frase
  deslocamento: z.number().int().optional(),
  duracao: z.number().positive().optional(), // segundos
  ate: z.string().optional(), // some no início desta palavra
});

export const Sfx = z.object({
  arquivo: z.string().min(1), // nome em assets/sfx, sem extensão
  gatilho: z.string().optional(), // palavra
  ocorrencia: z.number().int().positive().optional(),
  ancora: z.enum(["inicio", "fim"]).optional(), // toca no início (padrão) ou no fim da frase
  evento: z.string().optional(), // ou o quadro de um evento da cena
  inicio: z.number().nonnegative().optional(), // ou segundos desde o começo da cena
  deslocamento: z.number().int().optional(),
  volume: z.number().optional(), // dB relativos ao nível padrão de efeitos
  repetir: z.object({ intervalo: z.number().int().positive(), ate: z.string() }).optional(),
});

export const Cena = z.object({
  id: z.string().min(1),
  tipo: z.string().optional(), // componente visual; padrão = id, ou "quadro" (cena genérica)
  cor: z.enum(["sepia", "verde", "roxo", "branco", "vermelho", "rosa", "escuro"]),
  ativa: z.boolean().default(true),
  wipe: z.boolean().optional(), // padrão: quando a cor muda
  selo: z.object({ cor: z.string(), tempo: z.string() }).nullable().optional(),
  cauda: z.number().nonnegative().optional(), // segundos de imagem depois da última palavra
  locucao: z.string().min(1),
  gatilhos: z.array(Gatilho).default([]),
  textos: z.array(Texto).default([]),
  sfx: z.array(Sfx).default([]),
  quadro: z.any().optional(), // descrição da cena genérica
});

export const Roteiro = z.object({
  episodio: z.number().int(),
  codigo: z.string().regex(/^ep\d{2,}$/),
  slug: z.string(),
  titulo: z.string(),
  handle: z.string().startsWith("@"),
  audio: z.object({ narracao: z.string(), guia: z.string().optional(), trilha: z.string().optional() }),
  legenda: z
    .object({
      destaque: z.enum(["exata", "clara"]).default("exata"),
      minPalavras: z.number().int().default(2),
      maxPalavras: z.number().int().default(4),
    })
    .default({}),
  glossario: z.array(z.string()).default([]),
  pronuncia: z.record(z.string()).default({}),
  cenas: z.array(Cena).min(1),
});

export type RoteiroT = z.infer<typeof Roteiro>;
export type CenaT = z.infer<typeof Cena>;

export const Timestamps = z.object({
  fonte: z.string(),
  duracao: z.number(),
  cenas: z.array(z.object({ id: z.string(), inicio: z.number(), fim: z.number() })),
  palavras: z.array(
    z.object({ cena: z.string(), i: z.number().int(), texto: z.string(), inicio: z.number(), fim: z.number() }),
  ),
});
export type TimestampsT = z.infer<typeof Timestamps>;
