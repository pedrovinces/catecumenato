// Área segura do Reels (1080 x 1920): nada de texto essencial nos 15% de cima, nos 20% de baixo
// e nos 120 px da direita. Todo texto do motor se posiciona por estas constantes.
export const AREA = {
  topo: 288, // 15% de 1920
  base: 1536, // 1920 - 20%
  direita: 940, // 1080 - 120, com 20 px de folga
  esquerda: 44,
  legendaTopo: 1262,
  legendaBase: 1526,
  selo: { x: 36, y: 300, d: 200 },
};
export const CENTRO_TEXTO = (AREA.esquerda + AREA.direita) / 2;
