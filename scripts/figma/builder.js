// Сборщик макетов в Figma из слепков src/dev/figmaExport.ts.
// Запускается внутри use_figma: const B = new Function('figma', SRC)(figma);
// Тело — функция без внешних зависимостей; возвращает { decode, ensureIcons, build }.

function hexPaint(h) {
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const a = h.length > 6 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}
function solid(P, i) {
  if (P[i] === undefined) return { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0 };
  const c = hexPaint(P[i]);
  return { type: 'SOLID', color: { r: c.r, g: c.g, b: c.b }, opacity: c.a };
}
function rgba(P, i) {
  if (P[i] === undefined) return { r: 0, g: 0, b: 0, a: 0 };
  return hexPaint(P[i]);
}

/** CSS-угол (0 — вверх, по часовой) → gradientTransform Figma */
function gradTransform(deg) {
  const a = (deg * Math.PI) / 180;
  const d = { x: Math.sin(a), y: -Math.cos(a) };
  const n = { x: -d.y, y: d.x };
  const s = { x: 0.5 - d.x / 2, y: 0.5 - d.y / 2 };
  return [
    [d.x, d.y, -(d.x * s.x + d.y * s.y)],
    [n.x, n.y, 0.5 - (n.x * 0.5 + n.y * 0.5)],
  ];
}

function gradient(P, g) {
  const type = g.t === 'A' ? 'GRADIENT_ANGULAR' : g.t === 'R' ? 'GRADIENT_RADIAL' : 'GRADIENT_LINEAR';
  const t = g.t === 'R' ? [[1, 0, 0], [0, 1, 0]] : gradTransform(g.t === 'A' ? g.a + 90 : g.a);
  return { type, gradientTransform: t, gradientStops: g.s.map(([c, p]) => ({ position: Math.max(0, Math.min(1, p)), color: rgba(P, c) })) };
}

function decode(b) {
  let p = 8;
  const idat = [];
  let w = 0;
  let h = 0;
  while (p < b.length) {
    const len = ((b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3]) >>> 0;
    const type = String.fromCharCode(b[p + 4], b[p + 5], b[p + 6], b[p + 7]);
    const d = b.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') {
      w = ((d[0] << 24) | (d[1] << 16) | (d[2] << 8) | d[3]) >>> 0;
      h = ((d[4] << 24) | (d[5] << 16) | (d[6] << 8) | d[7]) >>> 0;
    }
    if (type === 'IDAT') idat.push(d);
    p += 12 + len;
  }
  const z = new Uint8Array(idat.reduce((a, d) => a + d.length, 0));
  let o = 0;
  for (const d of idat) {
    z.set(d, o);
    o += d.length;
  }
  const raw = new Uint8Array(h * (w * 3 + 1));
  let q = 2;
  let ro = 0;
  while (q < z.length - 4) {
    const hdr = z[q];
    if (((hdr >> 1) & 3) !== 0) break; // не «stored»-блок — данных больше нет
    const L = z[q + 1] | (z[q + 2] << 8);
    q += 5;
    raw.set(z.subarray(q, q + L), ro);
    ro += L;
    q += L;
    if (hdr & 1) break;
  }
  const rb = w * 3;
  const body = new Uint8Array(h * rb);
  for (let r = 0; r < h; r++) body.set(raw.subarray(r * (rb + 1) + 1, (r + 1) * (rb + 1)), r * rb);
  const n = ((body[0] << 24) | (body[1] << 16) | (body[2] << 8) | body[3]) >>> 0;
  const u = body.subarray(4, 4 + n);
  const parts = [];
  let s = '';
  let i = 0;
  while (i < u.length) {
    let c = u[i++];
    if (c >= 0xf0) {
      c = ((c & 7) << 18) | ((u[i++] & 63) << 12) | ((u[i++] & 63) << 6) | (u[i++] & 63);
      c -= 0x10000;
      s += String.fromCharCode(0xd800 + (c >> 10), 0xdc00 + (c & 1023));
    } else {
      if (c >= 0xe0) c = ((c & 15) << 12) | ((u[i++] & 63) << 6) | (u[i++] & 63);
      else if (c >= 0xc0) c = ((c & 31) << 6) | (u[i++] & 63);
      s += String.fromCharCode(c);
    }
    if (s.length > 8192) {
      parts.push(s);
      s = '';
    }
  }
  parts.push(s);
  return JSON.parse(parts.join(''));
}

/* ============ Шрифты ============ */
const fontCache = new Map();
let sfStyles = null;
async function fontFor(serif, weight) {
  let fn;
  if (serif) {
    const st = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold' }[Math.round(weight / 100) * 100] || 'Medium';
    fn = { family: 'Cormorant Garamond', style: st };
  } else {
    if (!sfStyles) {
      const all = await figma.listAvailableFontsAsync();
      sfStyles = all.filter((f) => f.fontName.family === 'SF Pro').map((f) => f.fontName.style);
    }
    const want = { 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold', 800: 'Heavy' }[Math.round(weight / 100) * 100] || 'Regular';
    const st = sfStyles.find((s) => s.replace(/\s/g, '').toLowerCase() === want.toLowerCase()) || 'Regular';
    fn = sfStyles.length ? { family: 'SF Pro', style: st } : { family: 'Inter', style: 'Regular' };
  }
  const key = fn.family + '|' + fn.style;
  if (!fontCache.has(key)) fontCache.set(key, figma.loadFontAsync(fn).then(() => fn, () => null));
  const ok = await fontCache.get(key);
  if (ok) return ok;
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  return { family: 'Inter', style: 'Regular' };
}

/* ============ Иконки-компоненты ============ */
async function ensureIcons(registry, holder, prefix) {
  const out = {};
  const existing = holder.findAllWithCriteria({ types: ['COMPONENT'] });
  let col = existing.length;
  for (const [name, svg] of Object.entries(registry)) {
    const full = prefix + name;
    let comp = existing.find((c) => c.name === full);
    if (!comp) {
      const node = figma.createNodeFromSvg(svg);
      comp = figma.createComponent();
      comp.name = full;
      comp.resize(24, 24);
      comp.fills = [];
      for (const ch of [...node.children]) comp.appendChild(ch);
      node.remove();
      holder.appendChild(comp);
      comp.x = 120 + (col % 16) * 64;
      comp.y = 120 + Math.floor(col / 16) * 64;
      col++;
    }
    out[name] = comp;
  }
  return out;
}

function recolor(node, paint, sw) {
  const kids = 'findAll' in node ? node.findAll((n) => n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE' || n.type === 'LINE') : [];
  for (const k of kids) {
    if (k.fills && k.fills.length) k.fills = [paint];
    if (k.strokes && k.strokes.length) {
      k.strokes = [paint];
      if (sw != null) k.strokeWeight = sw;
    }
  }
}

/* ============ Узлы ============ */
function applyProps(node, p, P) {
  const fills = [];
  if (p.f !== undefined) fills.push(solid(P, p.f));
  if (p.g) fills.push(gradient(P, p.g));
  node.fills = fills;
  if (p.r !== undefined) {
    if (Array.isArray(p.r)) {
      node.topLeftRadius = p.r[0];
      node.topRightRadius = p.r[1];
      node.bottomRightRadius = p.r[2];
      node.bottomLeftRadius = p.r[3];
    } else node.cornerRadius = p.r;
  }
  if (p.b) {
    node.strokes = [solid(P, p.b[0])];
    node.strokeAlign = 'INSIDE';
    node.strokeTopWeight = p.b[1];
    node.strokeRightWeight = p.b[2];
    node.strokeBottomWeight = p.b[3];
    node.strokeLeftWeight = p.b[4];
    if (p.b[5]) node.dashPattern = [6, 4];
  } else if (p.s) {
    node.strokes = [solid(P, p.s[0])];
    node.strokeAlign = 'INSIDE';
    node.strokeWeight = Math.max(0.5, p.s[1]);
  }
  const eff = [];
  if (p.e)
    for (const [kind, c, x, y, blur, spread] of p.e) {
      eff.push({ type: kind === 'I' ? 'INNER_SHADOW' : 'DROP_SHADOW', color: rgba(P, c), offset: { x, y }, radius: blur, spread, visible: true, blendMode: 'NORMAL' });
    }
  if (p.bb) eff.push({ type: 'BACKGROUND_BLUR', radius: p.bb, visible: true });
  if (eff.length) node.effects = eff;
  if (p.o !== undefined) node.opacity = p.o;
  if ('clipsContent' in node) node.clipsContent = !!p.k;
}

async function buildNode(n, parent, ctx) {
  const P = ctx.P;
  const kind = n[0];
  if (kind === 'F') {
    const f = figma.createFrame();
    f.name = String(n[1]);
    parent.appendChild(f);
    f.x = n[2];
    f.y = n[3];
    f.resize(Math.max(n[4], 0.01), Math.max(n[5], 0.01));
    applyProps(f, n[6] || {}, P);
    for (const k of n[7] || []) await buildNode(k, f, ctx);
    return f;
  }
  if (kind === 'T') {
    const [, x, y, w, h, text, size, weight, c, lh, ls, align, multi, nw, serif] = n;
    const t = figma.createText();
    parent.appendChild(t);
    t.fontName = await fontFor(!!serif, weight);
    t.fontSize = Math.max(1, size);
    t.characters = String(text);
    if (c >= 0) t.fills = [solid(P, c)];
    t.lineHeight = { unit: 'PIXELS', value: lh || size * 1.2 };
    if (ls) t.letterSpacing = { unit: 'PIXELS', value: ls };
    t.name = String(text).slice(0, 40);
    // Шрифт в Figma шире браузерного — подгоняем трекинг под ширину строки из браузера
    t.textAutoResize = 'WIDTH_AND_HEIGHT';
    if (nw && t.width > nw + 0.5) {
      const chars = Math.max(1, [...String(text)].length);
      t.letterSpacing = { unit: 'PIXELS', value: (ls || 0) - (t.width - nw) / chars };
    }
    if (multi) {
      t.textAutoResize = 'HEIGHT';
      t.resize(Math.max(1, w + 1), Math.max(1, h));
      t.textAlignHorizontal = align === 1 ? 'CENTER' : align === 2 ? 'RIGHT' : 'LEFT';
      t.x = x;
    } else {
      t.textAutoResize = 'WIDTH_AND_HEIGHT';
      t.x = align === 1 ? x + (w - t.width) / 2 : align === 2 ? x + w - t.width : x;
    }
    t.y = y;
    return t;
  }
  if (kind === 'S') {
    const [, x, y, w, h, svg] = n;
    const s = figma.createNodeFromSvg(svg);
    parent.appendChild(s);
    s.name = 'svg';
    s.x = x;
    s.y = y;
    if (Math.abs(s.width - w) > 0.5 || Math.abs(s.height - h) > 0.5) s.resize(Math.max(w, 0.01), Math.max(h, 0.01));
    s.clipsContent = false;
    return s;
  }
  if (kind === 'I') {
    const [, name, x, y, size, c, sw] = n;
    const comp = ctx.icons[name];
    if (!comp) return null;
    const inst = comp.createInstance();
    parent.appendChild(inst);
    inst.rescale(size / 24);
    inst.x = x;
    inst.y = y;
    if (c >= 0) recolor(inst, solid(P, c), sw ? (sw * size) / 24 : null);
    return inst;
  }
  if (kind === 'C') {
    const [, x, y, w, h] = n;
    const r = figma.createRectangle();
    parent.appendChild(r);
    r.name = '3D-сцена (картинка)';
    r.x = x;
    r.y = y;
    r.resize(w, h);
    r.fills = ctx.sceneHash ? [{ type: 'IMAGE', imageHash: ctx.sceneHash, scaleMode: 'FILL' }] : [];
    return r;
  }
  if (kind === 'E') {
    const [, x, y, w, h, c] = n;
    const e = figma.createEllipse();
    parent.appendChild(e);
    e.x = x;
    e.y = y;
    e.resize(w, h);
    e.fills = [solid(P, c)];
    return e;
  }
  return null;
}

/** Собрать экран: spec — слепок, parent — секция, (x, y) — место */
async function build(spec, opts) {
  const { parent, x, y, name, icons, sceneHash } = opts;
  const P = spec.P;
  const frame = figma.createFrame();
  parent.appendChild(frame);
  frame.name = name;
  frame.x = x;
  frame.y = y;
  frame.resize(spec.w, spec.h);
  frame.fills = spec.bg >= 0 ? [solid(P, spec.bg)] : [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  frame.clipsContent = true;
  const ctx = { P, icons, sceneHash };
  for (const n of spec.t) await buildNode(n, frame, ctx);
  return frame;
}

return { decode, ensureIcons, build };
