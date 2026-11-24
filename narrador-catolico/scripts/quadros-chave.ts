// npm run quadros -- ep01  → renderiza os quadros-chave para aprovação em out/quadros/
// Os quadros são achados pelos eventos do roteiro, não por timecode.
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { resolverLinha, type Linha } from "../src/lib/linha-do-tempo";
import { carregarEpisodio } from "./linha-do-tempo";
import { CHROMIUM, RAIZ } from "./config-render";

type Pedido = { nome: string; comp: string; quadro?: number; props?: Record<string, unknown> };

const quadroDe = (linha: Linha, cena: string, evento: string, mais = 0) => {
  const c = linha.cenas.find((x) => x.id === cena);
  const e = c?.eventos[evento]?.[0];
  if (!c || e === undefined) throw new Error(`evento ${cena}/${evento} não encontrado`);
  return c.inicio + e + mais;
};

export const prepararBundle = () =>
  bundle({
    entryPoint: path.join(RAIZ, "src/index.ts"),
    publicDir: path.join(RAIZ, "assets"),
    onProgress: () => undefined,
  });

export const renderizarStills = async (pedidos: Pedido[], pasta: string, codigo: string) => {
  const serveUrl = await prepararBundle();
  fs.mkdirSync(pasta, { recursive: true });
  for (const p of pedidos) {
    const inputProps = { codigo, ...(p.props ?? {}) };
    const composition = await selectComposition({ serveUrl, id: p.comp, inputProps, browserExecutable: CHROMIUM });
    const saida = path.join(pasta, `${p.nome}.png`);
    await renderStill({ composition, serveUrl, output: saida, frame: p.quadro ?? 0, inputProps, browserExecutable: CHROMIUM, imageFormat: "png" });
    console.log(`  ${path.relative(RAIZ, saida)}${p.quadro !== undefined ? `  (quadro ${p.quadro}, ${(p.quadro / 30).toFixed(2)} s)` : ""}`);
  }
};

const principal = async () => {
  const codigo = process.argv[2] ?? "ep01";
  const { roteiro, ts } = carregarEpisodio(codigo);
  const linha = resolverLinha(roteiro, ts);
  const extras = process.argv.slice(3);
  const pedidos: Pedido[] = [
    { nome: "1-cena1-congela", comp: codigo, quadro: quadroDe(linha, "abertura", "congela", 10) },
    { nome: "2a-cena4-torcedor-legenda-exata", comp: codigo, quadro: quadroDe(linha, "roxo", "torcedor", 14), props: { destaque: "exata" } },
    { nome: "2b-cena4-torcedor-legenda-clara", comp: codigo, quadro: quadroDe(linha, "roxo", "torcedor", 14), props: { destaque: "clara" } },
    { nome: "3a-cena7-oculos-encaixe", comp: codigo, quadro: quadroDe(linha, "rosa", "oculos", 3) },
    { nome: "3b-cena7-oculos-bracos-cruzados", comp: codigo, quadro: Math.min(quadroDe(linha, "rosa", "oculos", 26), quadroDe(linha, "rosa", "letreiro", -2)) },
    { nome: "3c-cena7-letreiro", comp: codigo, quadro: quadroDe(linha, "rosa", "letreiro", 10) },
    { nome: "4-logotipo-opcoes", comp: "Logos" },
  ];
  for (const e of extras) {
    const [cena, evento, mais] = e.split(":");
    pedidos.push({ nome: `extra-${cena}-${evento}${mais ? "+" + mais : ""}`, comp: codigo, quadro: quadroDe(linha, cena, evento, Number(mais ?? 0)) });
  }
  await renderizarStills(pedidos, path.join(RAIZ, "out", "quadros"), codigo);
};

if (process.argv[1]?.endsWith("quadros-chave.ts")) principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
