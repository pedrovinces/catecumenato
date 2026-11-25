// npx tsx scripts/still.ts <Composicao> <saida.png> [props JSON]  → renderiza um Still qualquer
import path from "node:path";
import { renderizarStills } from "./quadros-chave";
import { RAIZ } from "./config-render";

const [comp, saida, props] = process.argv.slice(2);
const destino = path.resolve(RAIZ, saida);
renderizarStills([{ nome: path.basename(destino, ".png"), comp, props: props ? JSON.parse(props) : {} }], path.dirname(destino), "ep01").catch((e) => {
  console.error(e);
  process.exit(1);
});
