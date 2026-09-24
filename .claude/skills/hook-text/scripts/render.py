#!/usr/bin/env python3
"""
Hook-text renderer: đặt chữ hook lên một frame video theo các mẫu bố cục có sẵn.

Dùng:  python3 render.py spec.json
Spec:  xem ../examples/spec-example.json và ../reference/templates.md

Đầu ra (trong thư mục out_dir):
  <id>-preview.jpg    frame + chữ, để xem
  <id>-overlay.png    chỉ chữ, nền trong suốt, kéo thẳng vào CapCut/Premiere
  contact-sheet.jpg   tất cả biến thể cạnh nhau
  guide.md            thông số từng biến thể (font, cỡ, màu, vị trí %) + các bước edit

Markup trong text:
  **từ khóa**   -> nhấn (màu accent, đậm hoặc highlight tùy mẫu)
  _chữ nghiêng_ -> serif nghiêng màu accent (Playfair Display Italic)
  xuống dòng    -> ngắt dòng bắt buộc; ngoài ra script tự wrap theo max_width
"""
import json, math, os, re, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(HERE, '..', 'fonts')
BASE_W = 1080  # mọi kích thước trong template tính theo khung rộng 1080

# ---------------------------------------------------------------- màu & font
DEFAULT_BRAND = {
    'accent': '#99DF00',   # lime brand Tự Mình Xây Kênh
    'dark':   '#26210F',   # ink
    'light':  '#FFFFFF',
    'cream':  '#F9E8DD',   # paper
}

def hex2rgb(h, a=255):
    h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

_font_cache = {}
def font(weight, size, serif=False):
    key = (weight, size, serif)
    if key in _font_cache: return _font_cache[key]
    if serif:
        f = ImageFont.truetype(os.path.join(FONT_DIR, 'PlayfairDisplay-Italic.ttf'), size)
        try: f.set_variation_by_axes([800])
        except Exception: pass
    else:
        f = ImageFont.truetype(os.path.join(FONT_DIR, f'BeVietnamPro-{weight}.ttf'), size)
    _font_cache[key] = f
    return f

def arrow_font(size):
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf']:
        if os.path.exists(p): return ImageFont.truetype(p, size)
    return font('Bold', size)

# ---------------------------------------------------------------- markup -> segments
TOKEN = re.compile(r'(\*\*.+?\*\*|_.+?_)')
def parse(text):
    """'a **b** _c_' -> [('a ', 'plain'), ('b', 'key'), ('c', 'italic')]"""
    out = []
    for part in TOKEN.split(text):
        if not part: continue
        if part.startswith('**'): out.append((part[2:-2], 'key'))
        elif part.startswith('_') and part.endswith('_') and len(part) > 2: out.append((part[1:-1], 'italic'))
        else: out.append((part, 'plain'))
    return out

def wrap(d, segs, fonts, max_w):
    """Word-wrap một đoạn segment thành các dòng, giữ kiểu và khoảng trắng gốc của từng từ."""
    tokens = []  # (word, kind, space_before)
    for t, kind in segs:
        parts = t.split(' ')
        for i, w in enumerate(parts):
            if w == '':
                # khoảng trắng ở đầu/cuối segment: đánh dấu cho token kế tiếp
                if i == len(parts) - 1 and tokens: tokens[-1] = tokens[-1][:3] + (True,)
                continue
            sp = i > 0 or (t.startswith(' ')) or (tokens and tokens[-1][3])
            tokens.append((w, kind, bool(sp), False))
    lines, cur, cur_w = [], [], 0
    for w, kind, sp, _ in tokens:
        f = fonts[kind]
        ww = tlen(d, w, f) + (d.textlength(' ', font=f) if (sp and cur) else 0)
        if cur and cur_w + ww > max_w:
            lines.append(cur); cur, cur_w = [], 0
            ww = tlen(d, w, f); sp_eff = False
        else:
            sp_eff = sp and bool(cur)
        cur.append((w, kind, sp_eff)); cur_w += ww
    if cur: lines.append(cur)
    merged = []
    for ln in lines:
        m = []
        for w, kind, sp in ln:
            if m and m[-1][1] == kind: m[-1] = (m[-1][0] + (' ' if sp else '') + w, kind)
            elif m and sp: m[-1] = (m[-1][0] + ' ', m[-1][1]); m.append((w, kind))
            else: m.append((w, kind))
        merged.append(m)
    return merged

def line_width(d, line, fonts): return sum(tlen(d, t, fonts[k]) for t, k in line)
ARROWS = '→←↑↓➜⇒'
def tlen(d, t, f):
    """Độ rộng text, ký tự mũi tên đo bằng font fallback."""
    if not any(ch in ARROWS for ch in t): return d.textlength(t, font=f)
    w = 0
    for ch in t: w += d.textlength(ch, font=arrow_font(int(f.size * 0.9)) if ch in ARROWS else f)
    return w

def dtext(d, xy, t, f, fill):
    """d.text nhưng vẽ mũi tên bằng DejaVu vì Be Vietnam Pro không có glyph này."""
    if not any(ch in ARROWS for ch in t): d.text(xy, t, font=f, fill=fill); return
    x, y = xy
    for ch in t:
        if ch in ARROWS:
            fa = arrow_font(int(f.size * 0.9)); d.text((x, y + f.size * 0.08), ch, font=fa, fill=fill); x += d.textlength(ch, font=fa)
        else:
            d.text((x, y), ch, font=f, fill=fill); x += d.textlength(ch, font=f)

def fit_size(d, paras, make_fonts, max_w, size, floor=0.7):
    """Giảm cỡ chữ (tối đa 30%) nếu dòng ngắt tay dài nhất không vừa max_w."""
    while size > 8:
        fonts = make_fonts(size)
        widest = max((line_width(d, [(t, k) for t, k in parse(ln)], fonts) for p in paras for ln in p.split('\n')), default=0)
        if widest <= max_w or size <= int(size_floor_ref[0] * floor): return size
        size -= 2
    return size
size_floor_ref = [0]


# ---------------------------------------------------------------- vẽ tiện ích
def soft_shadow(size, draw_fn, blur=12, alpha=160, off=(0, 6)):
    L = Image.new('RGBA', size, (0, 0, 0, 0)); draw_fn(ImageDraw.Draw(L), (0, 0, 0, alpha))
    L = L.filter(ImageFilter.GaussianBlur(blur))
    o = Image.new('RGBA', size, (0, 0, 0, 0)); o.paste(L, off, L); return o

def dim(im, where, until_pct, strength):
    W, H = im.size
    ov = Image.new('L', (W, H), 0); g = ImageDraw.Draw(ov)
    n = int(H * until_pct)
    for i in range(n):
        v = int(strength * (1 - i / n) ** 1.3)
        y = i if where == 'top' else H - 1 - i
        g.line([(0, y), (W, y)], fill=v)
    return Image.composite(Image.new('RGBA', (W, H), (0, 0, 0, 255)), im, ov)

# ---------------------------------------------------------------- template
class Ctx:
    def __init__(self, frame, spec, variant):
        self.spec, self.v = spec, variant
        self.W, self.H = frame.size
        self.s = self.W / BASE_W                      # scale theo khung 1080
        b = dict(DEFAULT_BRAND); b.update(spec.get('brand', {}))
        self.accent, self.dark = hex2rgb(b['accent']), hex2rgb(b['dark'])
        self.light, self.cream = hex2rgb(b['light']), hex2rgb(b['cream'])
        self.frame = frame
        self.overlay = Image.new('RGBA', frame.size, (0, 0, 0, 0))   # chỉ chữ
        self.notes = []                                              # ghi vào guide
    def px(self, v): return int(round(v * self.s))
    def y0(self): return int(self.H * self.v.get('y_pct', 0.08))
    def maxw(self): return int(self.W * self.v.get('max_width_pct', 0.86))
    def blocks(self): return self.v['blocks']
    def note(self, s): self.notes.append(s)

def render_lines(ctx, lines, fonts, colors, y, lh, align, x_left, shadow=True, gap=0):
    """Vẽ các dòng (đã wrap) với bóng mềm; trả về y sau cùng."""
    d0 = ImageDraw.Draw(ctx.overlay)
    pos = []
    for ln in lines:
        w = line_width(d0, ln, fonts)
        x = (ctx.W - w) / 2 if align == 'center' else x_left
        pos.append((x, y, ln)); y += lh + gap
    def draw(d, col_override=None):
        for x, yy, ln in pos:
            xx = x
            for t, k in ln:
                f = fonts[k]; dy = -(f.size - fonts['plain'].size) * 0.55 if k == 'italic' else 0
                dtext(d, (xx, yy + dy), t, f, col_override or colors[k]); xx += tlen(d, t, f)
    if shadow:
        ctx.overlay.alpha_composite(soft_shadow(ctx.overlay.size, lambda d, c: draw(d, c), blur=ctx.px(12), alpha=170, off=(0, ctx.px(6))))
    draw(ImageDraw.Draw(ctx.overlay))
    return y

# --- 1. highlight: chữ trắng bóng mềm, từ khóa nằm trong vệt bút dạ accent
def t_highlight(ctx):
    size = ctx.px(ctx.v.get('size', 66)); size_floor_ref[0] = size
    mk = lambda s_: {'plain': font('Medium', s_), 'key': font('ExtraBold', s_), 'italic': font('ExtraBold', s_, True)}
    size = fit_size(ImageDraw.Draw(ctx.overlay), ctx.blocks(), mk, ctx.maxw(), size); lh = int(size * 1.35)
    fonts = mk(size)
    colors = {'plain': ctx.light, 'key': ctx.dark, 'italic': ctx.accent}
    y = ctx.y0(); d0 = ImageDraw.Draw(ctx.overlay)
    for para in ctx.blocks():
        for lines in [wrap(d0, parse(p), fonts, ctx.maxw()) for p in para.split('\n')]:
            # vẽ marker trước
            yy = y
            for ln in lines:
                w = line_width(d0, ln, fonts); x = (ctx.W - w) / 2 if ctx.v.get('align', 'center') == 'center' else int(ctx.W * 0.08)
                for t, k in ln:
                    tw = tlen(d0, t, fonts[k])
                    if k == 'key':
                        mk = Image.new('RGBA', (int(tw) + ctx.px(36), int(size * 1.25)), (0, 0, 0, 0))
                        ImageDraw.Draw(mk).rounded_rectangle((0, 0, mk.width - 1, mk.height - 1), radius=ctx.px(10), fill=ctx.accent[:3] + (235,))
                        mk = mk.rotate(-1.5, resample=Image.BICUBIC, expand=True)
                        ctx.overlay.alpha_composite(mk, (int(x) - ctx.px(18), int(yy) - ctx.px(4)))
                    x += tw
                yy += lh
            y = render_lines(ctx, lines, fonts, colors, y, lh, ctx.v.get('align', 'center'), int(ctx.W * 0.08))
        y += int(lh * 0.5)
    ctx.note(f'Font: Be Vietnam Pro Medium {size}px, từ khóa ExtraBold trên vệt highlight {ctx.spec.get("brand",{}).get("accent", DEFAULT_BRAND["accent"])}, bóng mềm đen 65% blur 12.')

# --- 2. sticker: thẻ đen nghiêng nhẹ, chữ kem, từ khóa accent
def t_sticker(ctx):
    size = ctx.px(ctx.v.get('size', 58)); size_floor_ref[0] = size
    mk = lambda s_: {'plain': font('ExtraBold', s_), 'key': font('Black', int(s_ * 1.25)), 'italic': font('Black', int(s_ * 1.3), True)}
    size = fit_size(ImageDraw.Draw(ctx.overlay), ctx.blocks(), mk, ctx.maxw() - ctx.px(120), size); lh = int(size * 1.35)
    fonts = mk(size)
    colors = {'plain': ctx.cream, 'key': ctx.accent, 'italic': ctx.accent}
    tmp = Image.new('RGBA', ctx.overlay.size, (0, 0, 0, 0)); d0 = ImageDraw.Draw(tmp)
    all_lines = []
    for para in ctx.blocks():
        for p in para.split('\n'): all_lines += wrap(d0, parse(p), fonts, ctx.maxw() - ctx.px(120))
    cw = max(line_width(d0, ln, fonts) for ln in all_lines) + ctx.px(120)
    ch = len(all_lines) * lh + ctx.px(70)
    card = Image.new('RGBA', (int(cw) + ctx.px(80), int(ch) + ctx.px(80)), (0, 0, 0, 0)); cd = ImageDraw.Draw(card)
    cd.rounded_rectangle((ctx.px(40), ctx.px(40), ctx.px(40) + cw, ctx.px(40) + ch), radius=ctx.px(32), fill=ctx.dark)
    yy = ctx.px(40) + ctx.px(32)
    for ln in all_lines:
        w = line_width(cd, ln, fonts); xx = ctx.px(40) + (cw - w) / 2
        for t, k in ln:
            f = fonts[k]; dy = -(f.size - size) * 0.7
            dtext(cd, (xx, yy + dy), t, f, colors[k]); xx += tlen(cd, t, f)
        yy += lh
    card = card.rotate(ctx.v.get('tilt', -2.5), resample=Image.BICUBIC, expand=True)
    sh = Image.new('RGBA', card.size, (0, 0, 0, 0)); sh.paste((0, 0, 0, 120), (0, 0), card.split()[3]); sh = sh.filter(ImageFilter.GaussianBlur(ctx.px(18)))
    px_ = (ctx.W - card.width) // 2; py_ = ctx.y0() - ctx.px(40)
    ctx.overlay.alpha_composite(sh, (px_ + ctx.px(6), py_ + ctx.px(14))); ctx.overlay.alpha_composite(card, (px_, py_))
    ctx.note(f'Thẻ nền {ctx.spec.get("brand",{}).get("dark", DEFAULT_BRAND["dark"])} bo góc 32, nghiêng {ctx.v.get("tilt", -2.5)}°, chữ Be Vietnam Pro ExtraBold {size}px màu kem, từ khóa Black màu accent.')

# --- 3. glass: panel kính mờ, kicker nhỏ, vạch accent, căn trái
def t_glass(ctx):
    size = ctx.px(ctx.v.get('size', 56)); size_floor_ref[0] = size
    pw = int(ctx.W * ctx.v.get('max_width_pct', 0.84)); px_ = (ctx.W - pw) // 2; py_ = ctx.y0()
    mk = lambda s_: {'plain': font('Light', s_), 'key': font('Bold', s_), 'italic': font('Bold', int(s_ * 1.15), True)}
    size = fit_size(ImageDraw.Draw(ctx.overlay), ctx.blocks(), mk, pw - ctx.px(130), size); lh = int(size * 1.4)
    fonts = mk(size)
    colors = {'plain': ctx.light, 'key': ctx.light, 'italic': ctx.accent}
    inner = px_ + ctx.px(74)
    tmp = Image.new('RGBA', ctx.overlay.size); d0 = ImageDraw.Draw(tmp)
    lines = []
    for para in ctx.blocks():
        for p in para.split('\n'): lines += wrap(d0, parse(p), fonts, pw - ctx.px(130))
    kicker = ctx.v.get('kicker')
    ph = ctx.px(48) + (ctx.px(56) if kicker else 0) + len(lines) * lh + ctx.px(30)
    # panel: blur vùng frame tương ứng (chỉ có trong preview), overlay giữ nền tối bán trong suốt
    region = ctx.frame.crop((px_, py_, px_ + pw, py_ + ph)).filter(ImageFilter.GaussianBlur(ctx.px(26)))
    region = Image.alpha_composite(region.convert('RGBA'), Image.new('RGBA', (pw, ph), (15, 15, 15, 150)))
    mask = Image.new('L', (pw, ph), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, pw - 1, ph - 1), radius=ctx.px(28), fill=255)
    ctx.frame.alpha_composite(soft_shadow(ctx.frame.size, lambda d, c: d.rounded_rectangle((px_, py_, px_ + pw, py_ + ph), radius=ctx.px(28), fill=c), blur=ctx.px(24), alpha=110, off=(0, ctx.px(16))))
    ctx.frame.paste(region, (px_, py_), mask)
    # overlay riêng: nền tối 60% để dùng ngoài CapCut nếu không có blur
    ov = ImageDraw.Draw(ctx.overlay)
    ov.rounded_rectangle((px_, py_, px_ + pw, py_ + ph), radius=ctx.px(28), fill=(15, 15, 15, 150), outline=(255, 255, 255, 60), width=2)
    ImageDraw.Draw(ctx.frame).rounded_rectangle((px_, py_, px_ + pw, py_ + ph), radius=ctx.px(28), outline=(255, 255, 255, 60), width=2)
    ov.rounded_rectangle((px_ + ctx.px(40), py_ + ctx.px(44), px_ + ctx.px(46), py_ + ph - ctx.px(44)), radius=3, fill=ctx.accent)
    y = py_ + ctx.px(44)
    if kicker:
        ov.text((inner, y + ctx.px(4)), ' '.join(kicker.upper()), font=font('SemiBold', ctx.px(26)), fill=ctx.accent); y += ctx.px(56)
    render_lines(ctx, lines, fonts, colors, y, lh, 'left', inner, shadow=False)
    ctx.note(f'Panel kính mờ: blur nền 26, phủ đen 60%, bo góc 28, viền trắng 25%. Chữ Be Vietnam Pro Light {size}px, từ khóa Bold, kicker SemiBold 26px giãn chữ.')

# --- 4. editorial: giữa khung, sans nhẹ + serif nghiêng accent cỡ lớn, phủ tối phần trên
def t_editorial(ctx):
    size = ctx.px(ctx.v.get('size', 58)); size_floor_ref[0] = size
    mk = lambda s_: {'plain': font('Regular', s_), 'key': font('Black', int(s_ * 1.45)), 'italic': font('Black', int(s_ * 1.9), True)}
    size = fit_size(ImageDraw.Draw(ctx.overlay), ctx.blocks(), mk, ctx.maxw(), size); lh = int(size * 1.35)
    fonts = mk(size)
    colors = {'plain': ctx.light, 'key': ctx.light, 'italic': ctx.accent}
    y = ctx.y0(); d0 = ImageDraw.Draw(ctx.overlay)
    for para in ctx.blocks():
        for p in para.split('\n'):
            segs = parse(p); kinds = {k for _, k in segs}
            lines = wrap(d0, segs, fonts, ctx.maxw())
            this_lh = int(fonts['italic'].size * 1.05) if 'italic' in kinds else (int(fonts['key'].size * 1.2) if 'key' in kinds else lh)
            y = render_lines(ctx, lines, fonts, colors, y, this_lh, 'center', 0)
        y += int(lh * 0.35)
    d = ImageDraw.Draw(ctx.overlay); d.line([(ctx.W / 2 - ctx.px(50), y + ctx.px(10)), (ctx.W / 2 + ctx.px(50), y + ctx.px(10))], fill=ctx.accent, width=ctx.px(4))
    ctx.note(f'Be Vietnam Pro Regular {size}px trắng; dòng nhấn Black {int(size*1.45)}px; cụm nghiêng Playfair Display Italic 800 {int(size*1.9)}px màu accent; bóng mềm; phủ tối 50% phần trên khung.')

# --- 5. bubbles: hộp đen mờ từng dòng kiểu TikTok, từ khóa accent
def t_bubbles(ctx):
    size = ctx.px(ctx.v.get('size', 46)); lh = int(size * 1.35); gap = ctx.px(6)
    fonts = {'plain': font('SemiBold', size), 'key': font('Bold', size), 'italic': font('Black', int(size * 1.15), True)}
    colors = {'plain': ctx.light, 'key': ctx.accent, 'italic': ctx.accent}
    y = ctx.y0(); d0 = ImageDraw.Draw(ctx.overlay); align = ctx.v.get('align', 'center')
    padx, pady = ctx.px(26), ctx.px(12)
    for para in ctx.blocks():
        lines = []
        for p in para.split('\n'): lines += wrap(d0, parse(p), fonts, int(ctx.W * ctx.v.get('max_width_pct', 0.94)) - 2 * padx)
        boxes = []; yy = y
        for ln in lines:
            w = line_width(d0, ln, fonts); x = (ctx.W - w) / 2 if align == 'center' else int(ctx.W * 0.08)
            boxes.append((x - padx, yy - pady, x + w + padx, yy + lh + pady - ctx.px(4))); yy += lh + gap
        bd = ImageDraw.Draw(ctx.overlay)
        for b in boxes: bd.rounded_rectangle(b, radius=ctx.px(18), fill=(0, 0, 0, 150))
        y = render_lines(ctx, lines, fonts, colors, y, lh, align, int(ctx.W * 0.08), shadow=False, gap=gap)
        y += ctx.px(26)
    ctx.note(f'Hộp đen 60% bo góc 18 theo từng dòng, chữ Be Vietnam Pro SemiBold {size}px trắng, từ khóa Bold màu accent. Mỗi khối hiện theo lời nói, khối trước mờ 40%.')

# --- 6. timeline: danh sách "mốc | nội dung", mốc màu accent to, căn trái, tối nửa dưới/trên
def t_timeline(ctx):
    size = ctx.px(ctx.v.get('size', 40)); big = ctx.px(ctx.v.get('size_big', 58))
    fk, fs = font('Black', big), font('Medium', size)
    xL = int(ctx.W * 0.085); y = ctx.y0(); d = ImageDraw.Draw(ctx.overlay)
    rows = ctx.v.get('rows', [])
    for k, v in rows:
        d.rounded_rectangle((xL, y + ctx.px(6), xL + ctx.px(8), y + big), radius=4, fill=ctx.accent)
        d.text((xL + ctx.px(30), y), k, font=fk, fill=ctx.accent)
        tx = xL + ctx.px(30) + d.textlength(k, font=fk) + ctx.px(18)
        lines = wrap(d, parse(v), {'plain': fs, 'key': font('Bold', size), 'italic': font('Bold', size, True)}, ctx.W - tx - int(ctx.W * 0.06))
        for ln in lines:
            xx = tx
            for t, kk in ln:
                f = {'plain': fs, 'key': font('Bold', size), 'italic': font('Bold', size, True)}[kk]
                dtext(d, (xx, y + (big - size) * 0.6), t, f, ctx.accent if kk != 'plain' else ctx.light); xx += tlen(d, t, f)
            y += int(size * 1.2)
        y += int(big * 0.9)
    if ctx.blocks():
        y += ctx.px(10); d.line([(xL, y), (xL + ctx.px(120), y)], fill=(255, 255, 255, 120), width=2); y += ctx.px(34)
        fonts = {'plain': font('Light', size), 'key': font('SemiBold', size), 'italic': font('Black', int(size * 1.5), True)}
        colors = {'plain': ctx.light, 'key': ctx.accent, 'italic': ctx.accent}
        for para in ctx.blocks():
            for p in para.split('\n'):
                lines = wrap(d, parse(p), fonts, ctx.W - xL - int(ctx.W * 0.08))
                y = render_lines(ctx, lines, fonts, colors, y, int(size * 1.45), 'left', xL, shadow=False)
            y += ctx.px(24)
    ctx.note(f'Mốc: Be Vietnam Pro Black {big}px màu accent với vạch dọc; nội dung Medium {size}px trắng; phần dưới Light, từ khóa SemiBold accent; phủ tối 55% vùng chữ.')

# --- 7. chips: "A → B" hai chip + dòng dưới
def t_chips(ctx):
    a, b = ctx.v['chips']; size = ctx.px(ctx.v.get('size', 60))
    fc = font('Black', size); d = ImageDraw.Draw(ctx.overlay); y = ctx.y0()
    lead = ctx.v.get('lead')
    if lead:
        f = font('Medium', ctx.px(54)); d.text(((ctx.W - d.textlength(lead, font=f)) / 2, y), lead, font=f, fill=ctx.light); y += ctx.px(80)
    cw = max(d.textlength(a, font=fc), d.textlength(b, font=fc)) + ctx.px(80); ch = int(size * 1.75); gap = ctx.px(110)
    x0 = (ctx.W - (2 * cw + gap)) / 2
    ctx.overlay.alpha_composite(soft_shadow(ctx.overlay.size, lambda dd, c: (dd.rounded_rectangle((x0, y, x0 + cw, y + ch), radius=ctx.px(24), fill=c), dd.rounded_rectangle((x0 + cw + gap, y, x0 + 2 * cw + gap, y + ch), radius=ctx.px(24), fill=c)), blur=ctx.px(14), alpha=150, off=(0, ctx.px(10))))
    d = ImageDraw.Draw(ctx.overlay)
    d.rounded_rectangle((x0, y, x0 + cw, y + ch), radius=ctx.px(24), fill=(30, 30, 30, 235))
    d.rounded_rectangle((x0 + cw + gap, y, x0 + 2 * cw + gap, y + ch), radius=ctx.px(24), fill=ctx.accent)
    d.text((x0 + (cw - d.textlength(a, font=fc)) / 2, y + ctx.px(16)), a, font=fc, fill=ctx.light)
    d.text((x0 + cw + gap + (cw - d.textlength(b, font=fc)) / 2, y + ctx.px(16)), b, font=fc, fill=ctx.dark)
    ax, ay = x0 + cw + gap / 2, y + ch / 2
    d.line([(ax - ctx.px(30), ay), (ax + ctx.px(24), ay)], fill=ctx.light, width=ctx.px(8)); d.polygon([(ax + ctx.px(32), ay), (ax + ctx.px(8), ay - ctx.px(20)), (ax + ctx.px(8), ay + ctx.px(20))], fill=ctx.light)
    y += ch + ctx.px(40)
    if ctx.blocks():
        s2 = ctx.px(62); fonts = {'plain': font('ExtraBold', s2), 'key': font('ExtraBold', s2), 'italic': font('Black', int(s2 * 1.2), True)}
        colors = {'plain': ctx.light, 'key': ctx.accent, 'italic': ctx.accent}
        for para in ctx.blocks():
            y = render_lines(ctx, wrap(d, parse(para), fonts, ctx.maxw()), fonts, colors, y, int(s2 * 1.35), 'center', 0)
    ctx.note(f'Chip trái đen 92%, chip phải accent, chữ Be Vietnam Pro Black {size}px, mũi tên trắng; dòng dưới ExtraBold 62px.')

TEMPLATES = {'highlight': t_highlight, 'sticker': t_sticker, 'glass': t_glass, 'editorial': t_editorial,
             'bubbles': t_bubbles, 'timeline': t_timeline, 'chips': t_chips}
DEFAULT_DIM = {'highlight': ('top', 0.28, 90), 'editorial': ('top', 0.30, 140), 'bubbles': None, 'timeline': ('bottom', 0.55, 150),
               'chips': ('top', 0.28, 120), 'glass': None, 'sticker': None}

# ---------------------------------------------------------------- main
def run(spec):
    out = spec.get('out_dir', 'out'); os.makedirs(out, exist_ok=True)
    frame0 = Image.open(spec['frame']).convert('RGB')
    target_w = spec.get('width', 1080)
    frame0 = frame0.resize((target_w, int(frame0.height * target_w / frame0.width)), Image.LANCZOS)
    previews, guide = [], []
    guide.append(f"# Hướng dẫn dựng hook text\n\nKhung: {frame0.width}x{frame0.height}. Mọi cỡ chữ dưới đây tính cho khung rộng {frame0.width}px; sang khung khác thì nhân tỉ lệ.\n")
    for v in spec['variants']:
        frame = frame0.convert('RGBA')
        dm = v.get('dim', DEFAULT_DIM.get(v['template']))
        if dm: frame = dim(frame, *dm)
        ctx = Ctx(frame, spec, v)
        TEMPLATES[v['template']](ctx)
        comp = Image.alpha_composite(ctx.frame, ctx.overlay).convert('RGB')
        pid = v['id']
        comp.save(os.path.join(out, f'{pid}-preview.jpg'), quality=92)
        ctx.overlay.save(os.path.join(out, f'{pid}-overlay.png'))
        previews.append(comp)
        # đo vùng chữ thực tế để ghi vị trí
        bbox = ctx.overlay.getbbox() or (0, 0, 0, 0)
        top_pct, bot_pct = bbox[1] / frame.height * 100, bbox[3] / frame.height * 100
        guide.append(f"## {pid} — mẫu `{v['template']}`\n")
        guide.append(f"- Vùng chữ: từ {top_pct:.0f}% đến {bot_pct:.0f}% chiều cao khung, rộng {(bbox[2]-bbox[0])/frame.width*100:.0f}% khung, căn {'giữa' if v.get('align','center')=='center' else 'trái'}.")
        if dm: guide.append(f"- Phủ tối: gradient đen từ mép {'trên' if dm[0]=='top' else 'dưới'} vào {int(dm[1]*100)}% khung, đậm nhất {int(dm[2]/255*100)}%.")
        for n in ctx.notes: guide.append(f"- {n}")
        guide.append(f"- File: `{pid}-overlay.png` (nền trong suốt) thả thẳng lên timeline, hoặc dựng tay theo thông số trên.\n")
    # contact sheet
    n = len(previews); tw = 540; th = int(tw * frame0.height / frame0.width)
    sheet = Image.new('RGB', (n * (tw + 20) - 20, th), (20, 20, 20))
    for i, p in enumerate(previews): sheet.paste(p.resize((tw, th), Image.LANCZOS), (i * (tw + 20), 0))
    sheet.save(os.path.join(out, 'contact-sheet.jpg'), quality=88)
    guide.append(CAPCUT_STEPS)
    open(os.path.join(out, 'guide.md'), 'w').write('\n'.join(guide))
    print('OK ->', out, '|', ', '.join(v['id'] for v in spec['variants']))

CAPCUT_STEPS = """
## Các bước dựng trong CapCut (điện thoại hoặc máy tính)

**Cách 1, nhanh nhất: dùng file overlay PNG**
1. Mở project, chọn đúng đoạn video cần đặt hook.
2. Overlay (Lớp phủ) → Add overlay → chọn file `<id>-overlay.png`.
3. Kéo overlay phủ đúng khung (pinch 2 ngón cho khớp mép). Vì PNG cùng tỉ lệ với video nên chỉ cần zoom về 100%.
4. Cắt độ dài overlay đúng bằng thời gian nói câu hook (thường 2 đến 4 giây).
5. Animation → In: chọn "Fade" 0.3s hoặc "Slide up" 0.4s. Out: "Fade" 0.3s. Không dùng hiệu ứng nảy, xoay.
6. Nếu mẫu có phủ tối: thêm một overlay màu đen (Stickers → Shapes → hình chữ nhật đen), kéo che vùng chữ, Opacity 40 đến 55%, Mask → Linear gradient để mờ dần, đặt dưới lớp chữ.

**Cách 2: gõ chữ trực tiếp trong CapCut (khi cần sửa chữ về sau)**
1. Text → Add text, gõ từng dòng đúng ngắt dòng như bản preview.
2. Font: tìm "Be Vietnam Pro" (CapCut có sẵn). Serif nghiêng: tìm "Playfair Display", chọn Italic; nếu không có thì Import font từ thư mục `fonts/` của skill này.
3. Style: màu chữ và cỡ theo thông số ở trên. Bóng: Shadow màu đen, Opacity 60 đến 70%, Blur 10 đến 12, Distance 5, góc 90°.
4. Từ khóa màu accent: tách thành text riêng, đặt cạnh, hoặc dùng "Text → Style → Highlight" cho mẫu highlight.
5. Với mẫu bubbles: bật Background cho text, màu đen, Opacity 60%, bo góc 40 đến 50%, padding vừa. Mỗi khối là một text riêng.
6. Căn vị trí theo % chiều cao đã ghi. Bật lưới (Ruler/Grid) để căn giữa.

**Quy tắc luôn giữ**
- Không đè chữ lên mặt. Vùng an toàn: cách mép trên 6%, cách mép dưới 22% (nơi TikTok đặt caption và nút).
- Tối đa 2 dòng cho hook mở đầu, cỡ chữ không nhỏ hơn 40px trên khung 1080.
- Một video chỉ một màu nhấn. Ở đây là màu accent của brand.
- Hook phải đọc được trong 1 giây đầu: thử tắt tiếng, lướt qua trên điện thoại, nếu không nắm được ý thì cỡ chữ đang nhỏ hoặc câu đang dài.
"""

if __name__ == '__main__':
    if len(sys.argv) < 2: print(__doc__); sys.exit(1)
    run(json.load(open(sys.argv[1])))
