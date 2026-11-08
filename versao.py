#!/usr/bin/env python3
"""Carimba a versão nos links de css/js das páginas e no config.js (evita cache antigo no telão).
Uso: python3 versao.py 20261107b"""
import re, sys
V = sys.argv[1]
for p in ['index.html', 'palco.html', 'apresentador.html', 'orador.html']:
    s = open(p).read()
    s = re.sub(r'((?:href|src)="(?:css|js|vendor)/[^"?]+)(\?v=[^"]*)?"', lambda m: m.group(1) + '?v=' + V + '"', s)
    open(p, 'w').write(s)
c = open('js/config.js').read()
c = re.sub(r"\n  versao: '[^']*',", '', c)
c = c.replace("  aulaPadrao:", "  versao: '" + V + "',\n  aulaPadrao:", 1)
open('js/config.js', 'w').write(c)
print('versão', V)
