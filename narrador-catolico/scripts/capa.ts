// npx tsx scripts/capa.ts ep01 [imagem]  → out/<slug>-capa.png (1080x1920) e out/<slug>-capa-4x5.jpg (grade do perfil)
// A capa usa a composição "Capa": imagem do episódio + título do roteiro em duas linhas.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { renderizarStills } from "./quadros-chave";
import { RAIZ } from "./config-render";

const [codigo = "ep01", imagem = "p01-espelho"] = process.argv.slice(2);
const roteiro = fs
  .readdirSync(path.join(RAIZ, "roteiro"))
  .filter((f) => f.startsWith(codigo + "-") && f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(RAIZ, "roteiro", f), "utf8")))
  .find((d) => d && typeof d === "object" && "cenas" in d && "slug" in d);
const slug: string = roteiro.slug;
const pasta = path.join(RAIZ, "out");
const palavras = String(roteiro.titulo).toUpperCase().split(/\s+/);
// duas linhas de tamanho parecido: "POR QUE O PADRE" / "MUDA DE COR?"
let corte = 1;
for (let i = 1; i < palavras.length; i++) {
  const maior = (k: number) => Math.max(palavras.slice(0, k).join(" ").length, palavras.slice(k).join(" ").length);
  if (maior(i) < maior(corte)) corte = i;
}
const linhas = [palavras.slice(0, corte).join(" "), palavras.slice(corte).join(" ")].filter(Boolean);
renderizarStills([{ nome: `${slug}-capa`, comp: "Capa", props: { imagem, linhas } }], pasta, codigo)
  .then(() => {
    const png = path.join(pasta, `${slug}-capa.png`);
    // recorte 4:5 centrado (1080x1350): é o que aparece na grade do perfil
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", png, "-vf", "crop=1080:1350:0:285", "-q:v", "2", path.join(pasta, `${slug}-capa-4x5.jpg`)]);
    console.log(`  out/${slug}-capa-4x5.jpg`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
