// npx tsx scripts/capa.ts ep01 [imagem]  → out/<slug>-capa.png (1080x1920) e out/<slug>-capa-4x5.jpg (grade do perfil)
// A capa usa a composição "Capa" (src/filme/Capa.tsx): marca, imagem, EPISÓDIO NN, título e faixa de cores.
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
// dados da capa no roteiro ("capa": titulo, imagem, cores, enquadre); o número vem de "episodio"
const capa = roteiro.capa ?? {};
const props = {
  imagem: capa.imagem ?? imagem,
  episodio: capa.episodio ?? String(roteiro.episodio).padStart(2, "0"), // "03 · PARTE 1" nos episódios em duas partes
  titulo: capa.titulo ?? roteiro.titulo,
  cores: capa.cores,
  enquadre: capa.enquadre,
};
renderizarStills([{ nome: `${slug}-capa`, comp: "Capa", props }], pasta, codigo)
  .then(() => {
    const png = path.join(pasta, `${slug}-capa.png`);
    // recorte 4:5 centrado (1080x1350): é o que aparece na grade do perfil
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", png, "-vf", "crop=1080:1350:0:285", "-q:v", "2", path.join(pasta, `${slug}-capa-4x5.jpg`)]);
    console.log(`  out/${slug}-capa-4x5.jpg`);
    // recorte 3:4 centrado (1080x1440): formato atual da grade do perfil
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", png, "-vf", "crop=1080:1440:0:240", "-q:v", "2", path.join(pasta, `${slug}-capa-3x4.jpg`)]);
    console.log(`  out/${slug}-capa-3x4.jpg`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
