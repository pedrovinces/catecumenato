#!/usr/bin/env python3
"""Envia as entregas do Narrador Católico para a pasta do projeto no Google Drive, sem limite de tamanho.

Credenciais (o autor cadastra nas variáveis de ambiente do ambiente na nuvem; nunca no chat nem no repositório):
  DRIVE_PONTE                             caminho gratuito: URL do app da Web do Apps Script do autor, com ?chave=...
                                          (scripts/drive_ponte.gs); devolve um token de acesso novo a cada envio
  ou, com um app OAuth próprio no Google Cloud:
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET  cliente OAuth do app "Narrador Católico Drive" (Google Cloud)
  GOOGLE_REFRESH_TOKEN                    autorização permanente da conta do autor (escopo drive)
A cada uso, o refresh token gera um token de acesso novo (o de acesso vale 1 hora; o refresh não expira
enquanto o app estiver "Em produção", não for revogado e for usado ao menos uma vez a cada 6 meses).

Uso:
  python3 -I scripts/drive_enviar.py pasta "Episódio 03 - Pecado Original"      # acha ou cria a subpasta; imprime o id
  python3 -I scripts/drive_enviar.py enviar <arquivo> --pasta <id> [--nome "Nome no Drive"] [--doc]
  python3 -I scripts/drive_enviar.py listar [--pasta <id>]

- "enviar" usa upload retomável em blocos de 16 MB (vídeos de 100 MB ou mais passam inteiros).
- Se já existe um arquivo com o mesmo nome na pasta, o conteúdo é substituído (sem duplicar).
- --doc converte um .txt/.md em documento Google (para a narração com rubricas).
"""
import json
import mimetypes
import os
import pathlib
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

RAIZ_DRIVE = "1u5STBEjiF2uLkfnZ0VXFGFgx6UD3QDEE"  # "Projeto Narrador Católico"
API = "https://www.googleapis.com/drive/v3"
UPLOAD = "https://www.googleapis.com/upload/drive/v3/files"
BLOCO = 16 * 1024 * 1024  # múltiplo de 256 KiB, como a API exige
PASTA_MIME = "application/vnd.google-apps.folder"
DOC_MIME = "application/vnd.google-apps.document"


def falhar(msg: str):
    sys.exit(f"erro: {msg}")


def token() -> str:
    # caminho gratuito: "ponte" no Google Apps Script do autor, que devolve um token de acesso novo a cada chamada
    ponte = os.environ.get("DRIVE_PONTE")
    if ponte:
        try:
            with urllib.request.urlopen(ponte, timeout=60) as r:
                d = json.load(r)
        except urllib.error.HTTPError as e:
            falhar(f"a ponte do Apps Script respondeu {e.code}")
        if "token" not in d:
            falhar(f"a ponte do Apps Script recusou: {d.get('erro', d)}")
        return d["token"]
    faltando = [v for v in ("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN") if not os.environ.get(v)]
    if faltando:
        falhar("faltam as variáveis de ambiente " + ", ".join(faltando) + " (o autor cadastra nas configurações do ambiente)")
    corpo = urllib.parse.urlencode({
        "client_id": os.environ["GOOGLE_CLIENT_ID"],
        "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
        "refresh_token": os.environ["GOOGLE_REFRESH_TOKEN"],
        "grant_type": "refresh_token",
    }).encode()
    try:
        with urllib.request.urlopen(urllib.request.Request("https://oauth2.googleapis.com/token", data=corpo), timeout=60) as r:
            return json.load(r)["access_token"]
    except urllib.error.HTTPError as e:
        falhar(f"o Google recusou a renovação ({e.code}): {e.read().decode(errors='replace')[:300]}")


def chamar(metodo: str, url: str, tk: str, dados: bytes | None = None, cab: dict | None = None, aceitar=(200,)):
    req = urllib.request.Request(url, data=dados, method=metodo, headers={"Authorization": f"Bearer {tk}", **(cab or {})})
    try:
        r = urllib.request.urlopen(req, timeout=300)
        corpo = r.read()
        return r.status, r.headers, (json.loads(corpo) if corpo and r.headers.get_content_type() == "application/json" else corpo)
    except urllib.error.HTTPError as e:
        if e.code in aceitar:
            return e.code, e.headers, e.read()
        falhar(f"{metodo} {url.split('?')[0]} → {e.code}: {e.read().decode(errors='replace')[:400]}")


def buscar(tk: str, q: str) -> list:
    url = f"{API}/files?" + urllib.parse.urlencode({"q": q, "fields": "files(id,name,mimeType,size,modifiedTime)", "pageSize": 200,
                                                      "supportsAllDrives": "true", "includeItemsFromAllDrives": "true"})
    return chamar("GET", url, tk)[2]["files"]


def aspas(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def pasta(tk: str, nome: str, pai: str = RAIZ_DRIVE) -> str:
    achadas = buscar(tk, f"'{pai}' in parents and name = '{aspas(nome)}' and mimeType = '{PASTA_MIME}' and trashed = false")
    if achadas:
        return achadas[0]["id"]
    meta = json.dumps({"name": nome, "mimeType": PASTA_MIME, "parents": [pai]}).encode()
    return chamar("POST", f"{API}/files?supportsAllDrives=true", tk, meta, {"Content-Type": "application/json; charset=UTF-8"})[2]["id"]


def enviar(tk: str, arquivo: pathlib.Path, pasta_id: str, nome: str | None, doc: bool):
    nome = nome or arquivo.name
    tamanho = arquivo.stat().st_size
    tipo = "text/plain" if doc else (mimetypes.guess_type(arquivo.name)[0] or "application/octet-stream")
    existente = buscar(tk, f"'{pasta_id}' in parents and name = '{aspas(nome)}' and trashed = false")
    meta = {"name": nome}
    if doc:
        meta["mimeType"] = DOC_MIME
    cab = {"Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": tipo, "X-Upload-Content-Length": str(tamanho)}
    if existente:
        url = f"{UPLOAD}/{existente[0]['id']}?uploadType=resumable&supportsAllDrives=true"
        _, h, _ = chamar("PATCH", url, tk, json.dumps(meta).encode(), cab)
    else:
        meta["parents"] = [pasta_id]
        _, h, _ = chamar("POST", f"{UPLOAD}?uploadType=resumable&supportsAllDrives=true", tk, json.dumps(meta).encode(), cab)
    sessao = h["Location"]
    enviado = 0
    t0 = time.time()
    with arquivo.open("rb") as f:
        while enviado < tamanho:
            f.seek(enviado)
            pedaco = f.read(BLOCO)
            fim = enviado + len(pedaco) - 1
            for tentativa in range(5):
                try:
                    st, h, corpo = chamar("PUT", sessao, tk, pedaco, {"Content-Range": f"bytes {enviado}-{fim}/{tamanho}"}, aceitar=(308,))
                    break
                except SystemExit:
                    if tentativa == 4:
                        raise
                    time.sleep(2 ** tentativa)
            if st == 308:
                faixa = h.get("Range")
                enviado = int(faixa.split("-")[1]) + 1 if faixa else 0
                print(f"  {enviado / tamanho:5.0%} de {tamanho / 1e6:.1f} MB", flush=True)
            else:
                enviado = tamanho
                info = corpo if isinstance(corpo, dict) else json.loads(corpo)
                acao = "substituído" if existente else "enviado"
                print(f"{acao}: {nome} ({tamanho / 1e6:.1f} MB, {time.time() - t0:.0f} s) → https://drive.google.com/file/d/{info['id']}/view")


def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    cmd = args.pop(0)

    def opcao(nome, padrao=None):
        if nome in args:
            i = args.index(nome)
            v = args[i + 1] if i + 1 < len(args) and not args[i + 1].startswith("--") else True
            del args[i:i + (2 if v is not True else 1)]
            return v
        return padrao

    tk = token()
    if cmd == "pasta":
        print(pasta(tk, args[0], opcao("--em", RAIZ_DRIVE)))
    elif cmd == "listar":
        for x in buscar(tk, f"'{opcao('--pasta', RAIZ_DRIVE)}' in parents and trashed = false"):
            print(f"{x['id']}  {x['mimeType'].split('.')[-1]:12} {int(x.get('size', 0)) / 1e6:8.1f} MB  {x['name']}")
    elif cmd == "enviar":
        destino, nome, doc = opcao("--pasta"), opcao("--nome"), bool(opcao("--doc", False))
        if not destino:
            falhar("informe --pasta <id>")
        enviar(tk, pathlib.Path(args[0]), destino, nome, doc)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
