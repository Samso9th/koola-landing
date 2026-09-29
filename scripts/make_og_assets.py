#!/usr/bin/env python3
"""Build OG image (1200x630) + favicon/apple-touch icons from the Koola brand master sheet."""
from PIL import Image

SRC = 'public/brand/koola-master.png'
CREAM = (246, 239, 228)  # #F6EFE4, brand background

master = Image.open(SRC).convert('RGB')
W, H = master.size  # 1536 x 1024

def autotrim(img, tol=12):
    """Trim borders matching the background color."""
    px = img.load()
    w, h = img.size
    def is_bg(c):
        return abs(c[0]-CREAM[0]) <= tol and abs(c[1]-CREAM[1]) <= tol and abs(c[2]-CREAM[2]) <= tol
    left, right, top, bottom = w, 0, h, 0
    for y in range(h):
        for x in range(w):
            if not is_bg(px[x, y]):
                left, right = min(left, x), max(right, x)
                top, bottom = min(top, y), max(bottom, y)
    return img.crop((left, top, right + 1, bottom + 1))

# --- OG image: center logo lockup (flask + wordmark), middle column of the sheet ---
col_w = W // 3
SPLIT_Y = 660  # between wordmark bottom (~y625) and icon tile top (~y680)
lockup = autotrim(master.crop((col_w, 0, 2 * col_w, SPLIT_Y)))

OG_W, OG_H = 1200, 630
og = Image.new('RGB', (OG_W, OG_H), CREAM)
scale = min((OG_W * 0.60) / lockup.width, (OG_H * 0.80) / lockup.height)
resized = lockup.resize((round(lockup.width * scale), round(lockup.height * scale)), Image.LANCZOS)
og.paste(resized, ((OG_W - resized.width) // 2, (OG_H - resized.height) // 2))
og.save('public/brand/koola-og.png', optimize=True)
print('og:', og.size, '->', 'public/brand/koola-og.png')

# --- App icons: middle icon tile (red rounded square with flask), bottom middle ---
icon = autotrim(master.crop((col_w, SPLIT_Y, 2 * col_w, H)))
for size, name in ((180, 'apple-touch-icon.png'), (512, 'icon-512.png'), (192, 'icon-192.png'), (32, 'favicon.png')):
    icon.resize((size, size), Image.LANCZOS).save(f'public/brand/{name}', optimize=True)
    print('icon:', size, '->', f'public/brand/{name}')
