# Imagen de preview (`assets/og-image.jpg`)

Es lo que se ve cuando alguien comparte el link en WhatsApp, Telegram,
LinkedIn o Twitter. **No se actualiza sola**: si cambia el titular o el
posicionamiento del sitio, hay que regenerarla o va a seguir mostrando el
mensaje viejo.

La plantilla es `tools/og-card.html` — el mismo enjambre del sitio,
congelado en el sello Z.

## Regenerar

Con el sitio servido en local (`python3 -m http.server 8901` desde la raíz):

```python
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from PIL import Image
import os

CB = os.path.expanduser("~/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome")
CD = os.path.expanduser("~/.local/bin/chromedriver")
op = Options(); op.binary_location = CB
for a in ["--headless=new","--no-sandbox","--window-size=1400,900",
          "--force-device-scale-factor=2","--hide-scrollbars",
          "--enable-unsafe-swiftshader","--use-angle=swiftshader","--use-gl=angle"]:
    op.add_argument(a)
d = webdriver.Chrome(service=Service(executable_path=CD), options=op)
d.get("http://localhost:8901/tools/og-card.html")
for _ in range(30):                      # esperar a que el enjambre termine
    time.sleep(1)
    if d.execute_script("return document.body.dataset.listo==='1'"): break
time.sleep(2)
open("/tmp/og-raw.png","wb").write(d.find_element("tag name","body").screenshot_as_png)
d.quit()

Image.open("/tmp/og-raw.png").convert("RGB").resize((1200,630), Image.LANCZOS) \
     .save("assets/og-image.jpg", "JPEG", quality=88, optimize=True)
```

Se captura el `<body>` y no la ventana: `--window-size` no da el alto exacto
y la imagen salía recortada. A 2x y después reducida a 1200x630 para que el
texto quede nítido.

## Después de cambiarla

Los scrapers cachean por días. Para forzar una lectura nueva, compartir el
link con un parámetro (`zeebenlabs.com/?p=2`) o pasarlo por el depurador de
Facebook.
