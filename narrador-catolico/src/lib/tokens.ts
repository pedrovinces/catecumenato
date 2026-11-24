// Tokenização da locução. A mesma regra existe em scripts/guia_espeak.py; mudanças valem para os dois.

export type Token = {
  texto: string; // grafia do roteiro, com pontuação
  pausa: number; // segundos de pausa marcada depois da palavra
  direcao: string | null; // (seco), (sorrindo), (sussurrando)...
};

const PAUSAS: Record<string, number> = { pausa: 0.4, "pausa longa": 0.8 };

export const tokenizar = (locucao: string): Token[] => {
  const tokens: Token[] = [];
  let direcao: string | null = null;
  for (const parte of locucao.split(/(\[[^\]]*\]|\([^)]*\))/)) {
    if (!parte.trim()) continue;
    if (parte.startsWith("[")) {
      const nome = parte.slice(1, -1).trim().toLowerCase();
      if (tokens.length) tokens[tokens.length - 1].pausa = PAUSAS[nome] ?? 0.4;
      direcao = null;
    } else if (parte.startsWith("(")) {
      direcao = parte.slice(1, -1).trim().toLowerCase();
    } else {
      for (const w of parte.split(/\s+/).filter(Boolean)) tokens.push({ texto: w, pausa: 0, direcao });
    }
  }
  return tokens;
};

/** Forma de comparação: minúsculas, sem acento e sem pontuação. */
export const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Procura a sequência de palavras `frase` nos tokens; devolve o índice do primeiro token. */
export const acharFrase = (tokens: { texto: string }[], frase: string, ocorrencia = 1): number => {
  const alvo = frase.split(/\s+/).map(normalizar).filter(Boolean);
  const base = tokens.map((t) => normalizar(t.texto));
  let achados = 0;
  for (let i = 0; i + alvo.length <= base.length; i++) {
    if (alvo.every((a, k) => base[i + k] === a)) {
      achados++;
      if (achados === ocorrencia) return i;
    }
  }
  return -1;
};

/** Texto da legenda: caixa alta; some vírgula, ponto e dois-pontos; ficam ? ! e reticências. */
export const textoLegenda = (t: string) => {
  let s = t.toUpperCase();
  if (s.endsWith("...")) return s;
  s = s.replace(/[.,:;]+$/, "");
  return s;
};
