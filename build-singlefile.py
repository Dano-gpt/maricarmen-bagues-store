#!/usr/bin/env python3
"""Genera una version de un solo archivo (bagues-portal-standalone.html)
con CSS, JS, fuentes e imagenes embebidas. Util para compartir por mail o
abrir sin servidor. Uso: python3 build-singlefile.py [--preview]"""
import base64, io, os, re, sys
from PIL import Image

PREVIEW = '--preview' in sys.argv
OUT = 'bagues-portal-preview.html' if PREVIEW else 'bagues-portal-standalone.html'

def b64(path, mime):
    return 'data:%s;base64,%s' % (mime, base64.b64encode(open(path,'rb').read()).decode())

def img_data(path):
    im = Image.open(path)
    if PREVIEW:
        maxw = 700
        if im.size[0] > maxw:
            im = im.resize((maxw, int(im.size[1]*maxw/im.size[0])), Image.LANCZOS)
        buf = io.BytesIO()
        im.convert('RGBA' if path.endswith('.png') else 'RGB').save(buf,'WEBP',quality=62)
        return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
    mime = 'image/png' if path.lower().endswith('.png') else 'image/jpeg'
    return b64(path, mime)

# --- CSS: tokens + estilos, con fuentes embebidas -------------------------
css = ''
for f in ['css/tokens.colors.css','css/tokens.typography.css','css/tokens.spacing.css','css/styles.css']:
    css += open(f,encoding='utf-8').read() + '\n'
css = re.sub(r"@import url\([^)]*\);", '', css)
for font in os.listdir('fonts'):
    css = css.replace("url('../fonts/%s')" % font, "url('%s')" % b64('fonts/'+font,'font/woff2'))

# --- JS -------------------------------------------------------------------
js = ''.join(open(f,encoding='utf-8').read()+'\n' for f in ['js/config.js','js/ds.js','js/app.js'])

# --- HTML -----------------------------------------------------------------
html = open('index.html',encoding='utf-8').read()
html = re.sub(r'<link rel="stylesheet"[^>]*>', '<style>%s</style>' % css, html)
html = re.sub(r'<link rel="preload"[^>]*>', '', html)
html = re.sub(r'<script src="js/[^"]+"></script>\s*', '', html)
html = html.replace('</body>', '<script>%s</script>\n</body>' % js)

# --- Imagenes referenciadas en CSS/JS/HTML --------------------------------
assets = set(re.findall(r"assets/[A-Za-z0-9_\-/.]+\.(?:png|jpg|jpeg)", html))
for a in sorted(assets):
    if os.path.exists(a):
        html = html.replace(a, img_data(a))

open(OUT,'w',encoding='utf-8').write(html)
print('%s  %.2f MB' % (OUT, os.path.getsize(OUT)/1e6))
