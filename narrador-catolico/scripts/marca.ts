// npx tsx scripts/marca.ts  → arquivos da marca em marca/ (PNG transparentes, avatar e SVG do símbolo)
import fs from "node:fs";
import path from "node:path";
import { renderizarStills } from "./quadros-chave";
import { RAIZ } from "./config-render";
import { TRACO } from "../src/marca/Marca";

const pasta = path.join(RAIZ, "marca");
const pedidos = [
  { nome: "narrador-catolico-avatar", comp: "MarcaAvatar" },
  { nome: "narrador-catolico-horizontal-fundo-escuro", comp: "MarcaHorizontal", props: { claro: false } },
  { nome: "narrador-catolico-horizontal-fundo-claro", comp: "MarcaHorizontal", props: { claro: true } },
  { nome: "narrador-catolico-empilhado-fundo-escuro", comp: "MarcaEmpilhada", props: { claro: false } },
  { nome: "narrador-catolico-empilhado-fundo-claro", comp: "MarcaEmpilhada", props: { claro: true } },
  { nome: "narrador-catolico-simbolo-ouro", comp: "MarcaSimbolo", props: { cor: "#E9B949" } },
  { nome: "narrador-catolico-simbolo-branco", comp: "MarcaSimbolo", props: { cor: "#FFFFFF" } },
  { nome: "narrador-catolico-simbolo-preto", comp: "MarcaSimbolo", props: { cor: "#14111C" } },
];
fs.mkdirSync(pasta, { recursive: true });

// SVG do símbolo, da mesma geometria usada no vídeo (src/marca/Marca.tsx, TRACO)
const svg = (cor: string) => {
  const T = TRACO;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <title>Narrador Católico</title>
  <g fill="none" stroke="${cor}" stroke-linecap="round" stroke-linejoin="round" stroke-width="${T.traco}">
    <ellipse cx="${T.aureola.cx}" cy="${T.aureola.cy}" rx="${T.aureola.rx}" ry="${T.aureola.ry}" stroke-width="${T.traco - 1}"/>
    <rect x="${T.capsula.x}" y="${T.capsula.y}" width="${T.capsula.w}" height="${T.capsula.h}" rx="${T.capsula.w / 2}"/>
    <path d="${T.cruz}"/>
    <path d="${T.suporte}"/>
    <circle cx="126" cy="198" r="8" fill="${cor}" stroke="none"/>
    <circle cx="274" cy="198" r="8" fill="${cor}" stroke="none"/>
    <path d="${T.haste}"/>
    <path d="${T.base}" stroke-width="${T.traco + 2}"/>
  </g>
</svg>
`;
};
for (const [nome, cor] of [["ouro", "#E9B949"], ["branco", "#FFFFFF"], ["preto", "#14111C"]]) {
  fs.writeFileSync(path.join(pasta, `narrador-catolico-simbolo-${nome}.svg`), svg(cor));
  console.log(`  marca/narrador-catolico-simbolo-${nome}.svg`);
}
renderizarStills(pedidos, pasta, "ep01").catch((e) => {
  console.error(e);
  process.exit(1);
});
