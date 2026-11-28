#!/usr/bin/env python3
"""Mantém o Google Drive do projeto em dia com o que foi produzido, sem precisar pedir (pedido do autor).

Uso:
  python3 -I scripts/drive_sync.py ep04 --video          # vídeo final (out/<slug>.mp4) e a versão leve (out/<slug>-leve.mp4)
  python3 -I scripts/drive_sync.py ep04 --clipes         # assets/video/ep04/*.mp4 → "Clipes (fal.ai)"
  python3 -I scripts/drive_sync.py ep04 --imagens        # assets/img/ep04/*.png → "Imagens (Canva)"
  python3 -I scripts/drive_sync.py ep04 --audio          # assets/audio/ep04/*.m4a (gravações originais) → "Áudio bruto"
  python3 -I scripts/drive_sync.py ep04 --storyboard     # PDFs do storyboard → pasta do episódio
  python3 -I scripts/drive_sync.py ep04 --legenda        # legenda do Instagram (docs/<cod>-legenda-instagram.md) → .txt na pasta
  python3 -I scripts/drive_sync.py ep04 --tudo

- Destinos em roteiro/drive-pastas.json. As subpastas são achadas pelo nome ou criadas.
- Só envia o que mudou (compara o MD5 com o do arquivo no Drive); o que mudou substitui o arquivo de mesmo nome,
  então no Drive fica sempre apenas a última versão.
- Vídeo final: nome "<rotulo> - <título> - vídeo final.mp4". Uma cópia antiga com o nome do arquivo de saída
  (<slug>.mp4, como as que o autor subiu à mão) vai para a lixeira do Drive depois que a versão nova sobe.
- Sem credencial do Drive nesta sessão (DRIVE_PONTE), avisa e sai sem erro: o render não falha por isso.
"""
import hashlib
import importlib.util
import json
import pathlib
import re
import sys
import time
import urllib.parse

RAIZ = pathlib.Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location("drive_enviar", RAIZ / "scripts" / "drive_enviar.py")
de = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(de)

SUB = {"imagens": "Imagens (Canva)", "clipes": "Clipes (fal.ai)", "audio": "Áudio bruto"}


class Sessao:
    """Token renovado a cada 40 min (o da ponte vale 1 hora)."""

    def __init__(self):
        self._tk, self._t = None, 0.0

    def tk(self) -> str:
        if not self._tk or time.time() - self._t > 2400:
            self._tk, self._t = de.token(), time.time()
        return self._tk


def md5(p: pathlib.Path) -> str:
    h = hashlib.md5()
    with p.open("rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def no_drive(s: Sessao, pasta: str) -> dict:
    q = f"'{pasta}' in parents and trashed = false"
    url = f"{de.API}/files?" + urllib.parse.urlencode({"q": q, "fields": "files(id,name,md5Checksum,mimeType)", "pageSize": 1000,
                                                         "supportsAllDrives": "true", "includeItemsFromAllDrives": "true"})
    return {f["name"]: f for f in de.chamar("GET", url, s.tk())[2]["files"]}


def sincronizar(s: Sessao, arquivos: list[tuple[pathlib.Path, str]], pasta: str, rotulo: str) -> tuple[int, int]:
    existentes = no_drive(s, pasta)
    enviados = iguais = 0
    for local, nome in arquivos:
        atual = existentes.get(nome)
        if atual and atual.get("md5Checksum") == md5(local):
            iguais += 1
            continue
        for tentativa in range(2):
            try:
                de.enviar(s.tk(), local, pasta, nome, False)
                enviados += 1
                break
            except SystemExit as e:
                if tentativa:
                    print(f"  falhou: {nome} ({e})", flush=True)
    print(f"{rotulo}: {enviados} enviado(s), {iguais} já em dia", flush=True)
    return enviados, iguais


def main():
    args = sys.argv[1:]
    if not args or args[0].startswith("--"):
        sys.exit(__doc__)
    cod, opcoes = args[0], set(args[1:]) or {"--tudo"}
    tudo = "--tudo" in opcoes
    mapa = json.loads((RAIZ / "roteiro" / "drive-pastas.json").read_text(encoding="utf-8"))
    if cod not in mapa:
        sys.exit(f"{cod} não está em roteiro/drive-pastas.json")
    m = mapa[cod]
    s = Sessao()
    try:
        s.tk()
    except SystemExit as e:
        print(f"aviso: sem acesso ao Drive nesta sessão ({e}); nada foi enviado. Rode de novo numa sessão com DRIVE_PONTE.")
        return

    if tudo or "--video" in opcoes:
        rot = next(json.loads(p.read_text(encoding="utf-8")) for p in sorted((RAIZ / "roteiro").glob(f"{cod}-*.json"))
                   if '"slug"' in p.read_text(encoding="utf-8")[:4000] and '"cenas"' in p.read_text(encoding="utf-8"))
        video = RAIZ / "out" / f"{rot['slug']}.mp4"
        if video.exists():
            nome = f"{m['rotulo']} - {rot['titulo']} - vídeo final.mp4"
            sincronizar(s, [(video, nome)], m["pasta"], "vídeo final")
            leve = RAIZ / "out" / f"{rot['slug']}-leve.mp4"
            if leve.exists() and leve.stat().st_mtime >= video.stat().st_mtime:  # só a leve feita a partir desta final
                sincronizar(s, [(leve, f"{m['rotulo']} - {rot['titulo']} - versão leve (celular).mp4")], m["pasta"], "versão leve")
            antigo = no_drive(s, m["pasta"]).get(video.name)
            if antigo and antigo["name"] != nome:
                de.chamar("PATCH", f"{de.API}/files/{antigo['id']}?supportsAllDrives=true", s.tk(), json.dumps({"trashed": True}).encode(),
                          {"Content-Type": "application/json; charset=UTF-8"})
                print(f"  cópia antiga '{video.name}' foi para a lixeira do Drive", flush=True)
        else:
            print(f"vídeo final: {video.relative_to(RAIZ)} não existe (renderize antes)")

    if tudo or "--legenda" in opcoes:
        fonte = RAIZ / m.get("legenda", f"docs/{cod}-legenda-instagram.md")
        if fonte.exists():
            bloco = re.search(r"```\n(.*?)\n```", fonte.read_text(encoding="utf-8"), re.S)
            if not bloco:
                print(f"legenda: {fonte.name} sem bloco ``` com o texto")
            else:
                texto = bloco.group(1).strip() + "\n"
                tags = re.findall(r"(?<!\S)#\w+", texto.strip().splitlines()[-1])
                if len(tags) != 5:  # regra do autor: exatamente 5 hashtags no fim
                    print(f"legenda: a última linha tem {len(tags)} hashtags, e a regra é 5; nada enviado")
                else:
                    txt = RAIZ / "out" / f"{cod}-legenda-instagram.txt"
                    txt.parent.mkdir(exist_ok=True)
                    txt.write_text(texto, encoding="utf-8")
                    sincronizar(s, [(txt, f"{m['rotulo']} - Legenda do Instagram.txt")], m["pasta"], "legenda")

    if tudo or "--storyboard" in opcoes:
        arqs = [(RAIZ / k, v) for k, v in m.get("storyboard", {}).items() if (RAIZ / k).exists()]
        if arqs:
            sincronizar(s, arqs, m["pasta_storyboard"], "storyboard")

    for chave, padrao in (("imagens", "assets/img/{c}/*.png"), ("clipes", "assets/video/{c}/*.mp4"), ("audio", "assets/audio/{c}/*.m4a")):
        if not (tudo or f"--{chave}" in opcoes):
            continue
        locais = sorted(p for p in RAIZ.glob(padrao.format(c=cod)) if p.is_file() and "previa" not in p.name)
        if not locais:
            continue
        sub = de.pasta(s.tk(), SUB[chave], m["pasta"])
        if chave == "audio":
            nomes = [(p, m.get("audio", {}).get(p.name, f"{m['rotulo']} - {p.name}")) for p in locais]
        else:
            nomes = [(p, p.name) for p in locais]
        sincronizar(s, nomes, sub, SUB[chave])


if __name__ == "__main__":
    main()
