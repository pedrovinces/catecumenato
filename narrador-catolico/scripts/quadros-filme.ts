// npx tsx scripts/quadros-filme.ts ep01 1.0 5.0 ...  → quadros do filme nos segundos dados, em out/quadros-filme/
import path from "node:path";
import { renderizarStills } from "./quadros-chave";
import { RAIZ } from "./config-render";

const [codigo = "ep01", ...segundos] = process.argv.slice(2);
const pedidos = segundos.map((s) => ({ nome: `t${Number(s).toFixed(1).padStart(5, "0")}`, comp: codigo, quadro: Math.round(Number(s) * 30) }));
renderizarStills(pedidos, path.join(RAIZ, "out", "quadros-filme"), codigo).catch((e) => {
  console.error(e);
  process.exit(1);
});
