// npm run linha -- ep01   → valida o roteiro e grava out/ep01-linha-do-tempo.json
import fs from "node:fs";
import path from "node:path";
import { resolverLinha } from "../src/lib/linha-do-tempo";
import { RAIZ } from "./config-render";

export const carregarEpisodio = (codigo: string) => {
  const pasta = path.join(RAIZ, "roteiro");
  // há outros <codigo>-*.json (planos, clipes, imagens, tempos): o roteiro é o que tem "cenas" e "slug"
  const lerJson = (f: string) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(pasta, f), "utf8"));
    } catch {
      return null;
    }
  };
  const arq = fs
    .readdirSync(pasta)
    .filter((f) => f.startsWith(codigo + "-") && f.endsWith(".json"))
    .sort()
    .find((f) => {
      const d = lerJson(f);
      return d && typeof d === "object" && "cenas" in d && "slug" in d;
    });
  if (!arq) throw new Error(`roteiro de ${codigo} não encontrado em roteiro/`);
  const roteiro = lerJson(arq);
  const tsArq = path.join(pasta, `${codigo}-timestamps.json`);
  if (!fs.existsSync(tsArq)) throw new Error(`faltam os tempos: roteiro/${codigo}-timestamps.json (rode a guia ou a sincronização)`);
  const ts = JSON.parse(fs.readFileSync(tsArq, "utf8"));
  return { roteiro, ts };
};

const principal = () => {
  const codigo = process.argv[2] ?? "ep01";
  const { roteiro, ts } = carregarEpisodio(codigo);
  const linha = resolverLinha(roteiro, ts);
  fs.mkdirSync(path.join(RAIZ, "out"), { recursive: true });
  const destino = path.join(RAIZ, "out", `${codigo}-linha-do-tempo.json`);
  fs.writeFileSync(destino, JSON.stringify(linha, null, 1));
  const s = (f: number) => (f / linha.fps).toFixed(2).padStart(6);
  console.log(`${codigo}: ${s(linha.duracao)} s, ${linha.duracao} quadros, tempos de "${linha.fonteTempos}"`);
  for (const c of linha.cenas) {
    const ev = Object.entries(c.eventos)
      .map(([k, v]) => `${k}@${v.map((x) => (x / linha.fps).toFixed(2)).join("/")}`)
      .join(" ");
    console.log(`  ${c.id.padEnd(12)} ${s(c.inicio)} a ${s(c.fim)}  ${ev}`);
  }
  console.log(`  legendas: ${linha.legendas.length} grupos; efeitos: ${linha.sfx.length}`);
  for (const a of linha.avisos) console.log(`  aviso: ${a}`);
};

if (process.argv[1]?.endsWith("linha-do-tempo.ts")) principal();
