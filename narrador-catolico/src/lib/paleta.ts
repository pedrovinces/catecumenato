// Paleta litúrgica e utilitários de cor do Narrador Católico.

export const TINTA = "#1A1A1A"; // contorno de todos os desenhos
export const CONTORNO = 7; // espessura do traço (6 a 8 px pela direção de arte)
export const DOURADO = "#C9A227";
export const PELE = "#F2C9A0";
export const PELE_SOMBRA = "#DDA97E";
export const ALVA = "#FBFAF5";
export const ALVA_SOMBRA = "#DCD8CC";

export type NomeCor = "sepia" | "verde" | "roxo" | "branco" | "vermelho" | "rosa" | "escuro";

export const CORES: Record<NomeCor, string> = {
  sepia: "#E8DCC4",
  verde: "#2E7D32",
  roxo: "#5E2B7E",
  branco: "#F7F3E8",
  vermelho: "#B71C1C",
  rosa: "#E78FB3",
  escuro: "#141018",
};

// Cor da palavra falada na legenda.
// "exata" segue o documento (cor da cena; no branco, dourado).
// "clara" usa um tom claro da mesma cor, para ler melhor sobre fundo da mesma cor.
export const DESTAQUE: Record<"exata" | "clara", Record<NomeCor, string>> = {
  exata: {
    sepia: DOURADO,
    verde: CORES.verde,
    roxo: CORES.roxo,
    branco: DOURADO,
    vermelho: CORES.vermelho,
    rosa: CORES.rosa,
    escuro: DOURADO,
  },
  clara: {
    sepia: "#F2C94C",
    verde: "#8EE592",
    roxo: "#CDA5F2",
    branco: "#F2C94C",
    vermelho: "#FF8A80",
    rosa: "#FFC4DD",
    escuro: "#F2C94C",
  },
};

// Casula de cada cor (o branco ganha um tom marfim para não sumir sobre a alva).
export const CASULA: Record<string, string> = {
  verde: "#2E7D32",
  roxo: "#5E2B7E",
  branco: "#FFFDF3",
  vermelho: "#B71C1C",
  rosa: "#E78FB3",
};

const hexParaRgb = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbParaHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");

/** Mistura duas cores; t=0 devolve a, t=1 devolve b. */
export const misturar = (a: string, b: string, t: number) => {
  const [r1, g1, b1] = hexParaRgb(a);
  const [r2, g2, b2] = hexParaRgb(b);
  return rgbParaHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
};
export const escurecer = (c: string, t = 0.22) => misturar(c, "#000000", t);
export const clarear = (c: string, t = 0.25) => misturar(c, "#FFFFFF", t);

/** Luminância relativa (0 a 1) para decidir texto claro ou escuro. */
export const luminancia = (hex: string) => {
  const [r, g, b] = hexParaRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
