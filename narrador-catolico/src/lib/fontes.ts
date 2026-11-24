import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fontes locais (Google Fonts, licença OFL) para o render não depender de internet.
export const TITULO = "Anton";
export const LEGENDA = "Montserrat";

let carregadas: Promise<unknown> | null = null;
export const carregarFontes = () =>
  (carregadas ??= Promise.all([
    loadFont({ family: TITULO, url: staticFile("fonts/Anton-Regular.ttf"), weight: "400" }),
    loadFont({ family: LEGENDA, url: staticFile("fonts/Montserrat-ExtraBold.ttf"), weight: "800" }),
    loadFont({ family: LEGENDA, url: staticFile("fonts/Montserrat-Black.ttf"), weight: "900" }),
  ]));
