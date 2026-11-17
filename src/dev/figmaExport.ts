/**
 * DEV-ONLY: сериализация экрана в компактное дерево для сборки редактируемых слоёв в Figma.
 * window.__fig(rootSelector, name, opts) → JSON-строка.
 *
 * Узлы:
 *  ['F', name, x, y, w, h, props, children]   фрейм (props: f fill, r radius, b border, s inner stroke, e effects, o opacity, k clip)
 *  ['T', x, y, w, h, text, size, weight, color, lineHeight, letterSpacing, align, multiline]
 *  ['L', logoId, x, y, h]                      инстанс логотипа
 *  ['I', icon, x, y, size, color, strokeWidth] инстанс иконки
 *  ['Q', x, y, size, seed]                     QR-код
 *  ['E', x, y, w, h, color]                    эллипс
 *  ['S', x, y, w, h, svg]                      произвольный SVG
 *  ['C', x, y, w, h]                           место под картинку (3D-канвас)
 *  props.g — градиент {t: 'L'|'A', a: угол, s: [[цвет, позиция 0..1]]}, props.bb — размытие фона
 */

type N = unknown[];

const LOGO_BY_FILE: Record<string, string> = {
  'vkusno.png': 'vkusno',
  'burgerking.png': 'bk',
  'kroshka.png': 'kroshka',
  'franklins.png': 'franklins',
  'farsh.png': 'farsh',
  'teremok.png': 'teremok',
  'rostics.png': 'rostics',
  'dodo-bird.png': 'dodo',
};

const FRAME_TAGS = new Set(['BUTTON', 'HEADER', 'FOOTER', 'NAV', 'SECTION', 'UL', 'OL', 'LI', 'FORM', 'FIELDSET', 'LABEL', 'A', 'ASIDE']);

const r2 = (v: number) => Math.round(v * 2) / 2;

function parseColor(c: string): [number, number, number, number] | null {
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  const a = p.length > 3 ? p[3] : 1;
  if (a === 0) return null;
  return [p[0], p[1], p[2], a];
}

function hex8(c: [number, number, number, number]) {
  const h = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return h(c[0]) + h(c[1]) + h(c[2]) + (c[3] < 1 ? h(c[3] * 255) : '');
}

/** Разбор box-shadow на отдельные тени (запятые внутри rgba не считаются) */
function splitShadows(s: string) {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Разбор CSS-градиента из computed style (linear / conic) */
function parseGradient(bg: string, col: (c: string) => number) {
  const m = bg.match(/^(linear|conic|radial)-gradient\((.*)\)$/s);
  if (!m) return undefined;
  const parts = splitShadows(m[2]);
  let a = 180;
  let first = parts[0];
  if (m[1] === 'linear') {
    const deg = first.match(/^(-?[\d.]+)deg$/);
    const dir: Record<string, number> = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270 };
    if (deg) {
      a = parseFloat(deg[1]);
      parts.shift();
    } else if (dir[first] !== undefined) {
      a = dir[first];
      parts.shift();
    }
  } else if (m[1] === 'conic') {
    const f = first.match(/from\s+(-?[\d.]+)deg/);
    if (/^from|^at/.test(first)) parts.shift();
    a = f ? parseFloat(f[1]) : 0;
  } else {
    if (!/^rgb|^#/.test(first)) parts.shift();
  }
  const stops: [number, number | null][] = parts.map((p) => {
    const cm = p.match(/rgba?\([^)]+\)/);
    const pos = p.replace(/rgba?\([^)]+\)/, '').trim();
    return [col(cm ? cm[0] : 'rgb(0,0,0)'), pos.endsWith('%') ? parseFloat(pos) / 100 : null];
  });
  stops.forEach((s, i) => {
    if (s[1] === null) s[1] = stops.length > 1 ? i / (stops.length - 1) : 0;
  });
  return { t: m[1] === 'conic' ? 'A' : m[1] === 'radial' ? 'R' : 'L', a, s: stops };
}

/** SVG со стилями из CSS-классов → самодостаточная разметка с атрибутами */
function inlineSvg(el: SVGSVGElement, colorHex: string) {
  const clone = el.cloneNode(true) as SVGSVGElement;
  const src = [el, ...el.querySelectorAll('*')];
  const dst = [clone, ...clone.querySelectorAll('*')];
  const PROPS = ['opacity', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray'];
  src.forEach((s, i) => {
    if (s.tagName === 'defs' || s.closest('defs') || s.tagName === 'stop' || s.tagName === 'linearGradient') return;
    const cs = getComputedStyle(s);
    const d = dst[i] as SVGElement;
    for (const p of PROPS) {
      let v = cs.getPropertyValue(p);
      if (!v) continue;
      if (p === 'stroke-dasharray' && v === 'none') continue;
      if (v.startsWith('url(')) v = v.replace(/url\("?#?[^#"]*#?([^")]+)"?\)/, 'url(#$1)');
      const rgb = parseColor(v);
      if (rgb) {
        v = '#' + hex8([rgb[0], rgb[1], rgb[2], 1]);
        // Импорт SVG в Figma не понимает fill-/stroke-opacity — переносим прозрачность на элемент
        if (rgb[3] < 1) {
          const op = parseFloat(cs.opacity || '1') * rgb[3];
          d.setAttribute('opacity', String(Math.round(op * 1000) / 1000));
        }
      }
      d.setAttribute(p, v);
    }
    d.removeAttribute('class');
    d.removeAttribute('style');
  });
  let svg = clone.outerHTML.replace(/currentColor/g, colorHex);
  const r = el.getBoundingClientRect();
  svg = svg.replace(/<svg([^>]*?)\swidth="[^"]*"/, '<svg$1').replace(/<svg([^>]*?)\sheight="[^"]*"/, '<svg$1');
  return svg.replace('<svg', `<svg width="${r2(r.width)}" height="${r2(r.height)}"`);
}

export function serialize(rootSel: string, name: string, opts: { designW?: number } = {}) {
  const root = document.querySelector<HTMLElement>(rootSel);
  if (!root) throw new Error('root not found: ' + rootSel);

  // Без анимаций и со сброшенным скроллом
  let st = document.getElementById('__fig-style');
  if (!st) {
    st = document.createElement('style');
    st.id = '__fig-style';
    st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
    document.head.appendChild(st);
  }
  root.querySelectorAll<HTMLElement>('*').forEach((el) => {
    if (el.scrollTop) el.scrollTop = 0;
  });

  const measureCtx = document.createElement('canvas').getContext('2d')!;
  const rootRect = root.getBoundingClientRect();
  const S = opts.designW ? rootRect.width / opts.designW : rootRect.width / root.offsetWidth || 1;
  const palette: string[] = [];
  const icons: Record<string, string> = {};
  const col = (c: string | null | undefined) => {
    if (!c) return -1;
    const p = parseColor(c);
    if (!p) return -1;
    const h = hex8(p);
    let i = palette.indexOf(h);
    if (i < 0) i = palette.push(h) - 1;
    return i;
  };
  const box = (r: DOMRect, ox: number, oy: number) => [r2((r.left - rootRect.left) / S - ox), r2((r.top - rootRect.top) / S - oy), r2(r.width / S), r2(r.height / S)];
  /** Масштаб элемента относительно макета (для уменьшенных карт) */
  const scaleOf = (el: Element) => {
    // Берём крупный предок: у мелких inline-элементов offsetWidth округлён и даёт шум
    let cur: Element | null = el;
    while (cur && cur !== root && !((cur as HTMLElement).offsetWidth >= 100)) cur = cur.parentElement;
    const h = (cur ?? root) as HTMLElement;
    const w = h.offsetWidth;
    if (!w) return 1;
    const k = h.getBoundingClientRect().width / S / w;
    return Math.abs(k - 1) < 0.02 ? 1 : k;
  };

  function radii(cs: CSSStyleDeclaration, w: number, h: number, k: number) {
    const one = (v: string, dim: number) => {
      const first = v.split(' ')[0];
      if (first.endsWith('%')) return (parseFloat(first) / 100) * dim;
      return parseFloat(first) * k || 0;
    };
    const m = Math.min(w, h);
    const r = [one(cs.borderTopLeftRadius, m), one(cs.borderTopRightRadius, m), one(cs.borderBottomRightRadius, m), one(cs.borderBottomLeftRadius, m)].map((v) => r2(Math.min(v, m / 2)));
    if (r.every((v) => v === 0)) return undefined;
    return r.every((v) => v === r[0]) ? r[0] : r;
  }

  function visualProps(el: Element, cs: CSSStyleDeclaration, w: number, h: number) {
    const k = scaleOf(el);
    const p: Record<string, unknown> = {};
    const bg = col(cs.backgroundColor);
    if (bg >= 0) p.f = bg;
    if (cs.backgroundImage && cs.backgroundImage.includes('gradient')) {
      const g = parseGradient(cs.backgroundImage.split(/,\s*(?=(?:linear|conic|radial)-gradient)/)[0], (c) => col(c));
      if (g) p.g = g;
    }
    const bf = (cs as CSSStyleDeclaration & { webkitBackdropFilter?: string }).backdropFilter || (cs as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter;
    const bm = bf && bf.match(/blur\(([\d.]+)px\)/);
    if (bm) p.bb = parseFloat(bm[1]);
    const r = radii(cs, w, h, k);
    if (r !== undefined) p.r = r;
    const bw = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map((v) => r2(parseFloat(v) * k || 0));
    const styles = [cs.borderTopStyle, cs.borderRightStyle, cs.borderBottomStyle, cs.borderLeftStyle];
    if (bw.some((v, i) => v > 0 && styles[i] !== 'none')) {
      const c = col(cs.borderTopColor !== 'rgba(0, 0, 0, 0)' && bw[0] ? cs.borderTopColor : cs.borderBottomColor || cs.borderLeftColor);
      if (c >= 0) p.b = [c, ...bw, styles.includes('dashed') ? 1 : 0];
    }
    if (cs.boxShadow && cs.boxShadow !== 'none') {
      const eff: unknown[] = [];
      for (const sh of splitShadows(cs.boxShadow)) {
        const inset = sh.includes('inset');
        const cm = sh.match(/rgba?\([^)]+\)/);
        const c = col(cm ? cm[0] : 'rgb(0,0,0)');
        const nums = sh.replace(/rgba?\([^)]+\)/, '').replace('inset', '').trim().split(/\s+/).map((v) => parseFloat(v) * k || 0);
        const [x = 0, y = 0, blur = 0, spread = 0] = nums;
        if (c < 0) continue;
        if (inset && !x && !y && !blur && !p.s && !p.b) p.s = [c, r2(spread)];
        else eff.push([inset ? 'I' : 'D', c, r2(x), r2(y), r2(blur), r2(spread)]);
      }
      if (eff.length) p.e = eff;
    }
    const o = parseFloat(cs.opacity);
    if (o < 1) p.o = Math.round(o * 100) / 100;
    if (cs.overflow !== 'visible' || cs.overflowX !== 'visible' || cs.overflowY !== 'visible') p.k = 1;
    return p;
  }

  /** Соседние текстовые узлы (React дробит «через {n} с») сериализуются одним текстом */
  function textNode(run: Text[], ox: number, oy: number): N | null {
    const t = run[0];
    const raw = run.map((n) => n.data).join('');
    const at = (idx: number): [Text, number] => {
      for (const n of run) {
        if (idx <= n.data.length) return [n, idx];
        idx -= n.data.length;
      }
      const last = run[run.length - 1];
      return [last, last.data.length];
    };
    const start = raw.search(/\S/);
    if (start < 0) return null;
    const end = raw.length - (raw.length - raw.trimEnd().length);
    const el = t.parentElement!;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden') return null;
    const range = document.createRange();
    range.setStart(...at(start));
    range.setEnd(...at(end));
    const rects = [...range.getClientRects()].filter((r) => r.width > 0);
    if (!rects.length) return null;
    const left = Math.min(...rects.map((r) => r.left));
    const right = Math.max(...rects.map((r) => r.right));
    const top = Math.min(...rects.map((r) => r.top));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    const tops = [...new Set(rects.map((r) => Math.round(r.top)))].sort((a, b) => a - b);
    const k = scaleOf(el);
    const size = parseFloat(cs.fontSize) * k;
    let text = raw.slice(start, end).replace(/\s+/g, ' ');
    if (cs.textTransform === 'uppercase') text = text.toUpperCase();
    const multi = tops.length > 1;
    const lineBox = rects[0].height / S;
    const pitch = multi ? (tops[1] - tops[0]) / S : lineBox;
    const ls = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing) * k;
    const align = cs.textAlign === 'center' ? 1 : cs.textAlign === 'right' || cs.textAlign === 'end' ? 2 : 0;
    const [x, y, w, h] = box(new DOMRect(left, top, right - left, bottom - top), ox, oy);
    const yAdj = multi ? r2(y - (pitch - lineBox) / 2) : y;
    // Натуральная ширина строки в браузере (в Figma «SF Pro» шире «SF Pro Display» — сборщик подгонит трекинг)
    measureCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    const nw = r2(measureCtx.measureText(text).width + ls * [...text].length);
    return ['T', x, yAdj, w, h, text, r2(size), parseInt(cs.fontWeight, 10) || 400, col(cs.color), r2(pitch), r2(ls), align, multi ? 1 : 0, nw, /Cormorant|Didot|Georgia|serif$/.test(cs.fontFamily.split(',')[0]) || cs.fontFamily.startsWith('"Cormorant') ? 1 : 0];
  }

  function pseudo(el: Element, which: '::before' | '::after', ox: number, oy: number, elBox: number[]): N | null {
    const cs = getComputedStyle(el, which);
    if (!cs.content || cs.content === 'none' || cs.display === 'none') return null;
    const k = scaleOf(el);
    const w = parseFloat(cs.width) * k;
    const h = parseFloat(cs.height) * k;
    if (!w || !h) return null;
    let left = cs.left !== 'auto' ? parseFloat(cs.left) * k : elBox[2] - parseFloat(cs.right) * k - w;
    let top = cs.top !== 'auto' ? parseFloat(cs.top) * k : elBox[3] - parseFloat(cs.bottom) * k - h;
    const tm = cs.transform.match(/matrix\(([^)]+)\)/);
    if (tm) {
      const v = tm[1].split(',').map(Number);
      if (Math.abs(v[0]) < 0.01 || Math.abs(v[3]) < 0.01) return null;
      left += v[4] * k;
      top += v[5] * k;
    }
    const props = visualProps(el, cs, w, h);
    if (props.f === undefined && !props.g && !props.b && !props.e) return null;
    delete props.k;
    return ['F', which.slice(2), r2(elBox[0] + left - ox), r2(elBox[1] + top - oy), r2(w), r2(h), props, []];
  }

  /** Возвращает список узлов; ox/oy — начало координат текущего фрейма-родителя */
  function walk(el: Element, ox: number, oy: number): N[] {
    if (['sr-only', 'demo-link', 'm-demo', 'y-demo', 'y-toast'].some((c) => el.classList.contains(c))) return [];
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return [];
    const rect = el.getBoundingClientRect();
    const [x, y, w, h] = box(rect, ox, oy);

    if (el instanceof SVGSVGElement) {
      if (w <= 0) return [];
      const icon = el.getAttribute('data-icon');
      if (icon) {
        if (!icons[icon]) icons[icon] = inlineSvg(el, '#000000').replace(/ width="[^"]*" height="[^"]*"/, ' width="24" height="24"');
        return [['I', icon, x, y, w, col(cs.color), parseFloat(el.getAttribute('stroke-width') || '2.4')]];
      }
      const seed = el.getAttribute('data-seed');
      if (seed) return [['Q', x, y, w, seed]];
      const color = parseColor(cs.color);
      const svg = inlineSvg(el, color ? '#' + hex8([color[0], color[1], color[2], 1]) : '#000');
      return [['S', x, y, w, h, svg]];
    }
    if (el.classList.contains('logo')) {
      const img = el.querySelector('img');
      const file = img?.getAttribute('src')?.split('/').pop() || '';
      const id = LOGO_BY_FILE[file];
      if (id) return [['L', id, x, y, h]];
    }
    if (el instanceof HTMLImageElement) {
      if (el.src.endsWith('you-are-here.svg')) return [['E', x, y, w, h, col('rgb(139,255,154)')]];
      return [];
    }
    if (el instanceof HTMLCanvasElement) return [['C', x, y, w, h]];
    if (el instanceof HTMLInputElement && el.type === 'range') {
      const k = (Number(el.value) - Number(el.min || 0)) / (Number(el.max || 100) - Number(el.min || 0));
      const varColor = (v: string, fb: string) => {
        const probe = document.createElement('i');
        probe.style.color = getComputedStyle(el).getPropertyValue(v).trim() || fb;
        el.parentElement!.appendChild(probe);
        const c = getComputedStyle(probe).color;
        probe.remove();
        return col(c);
      };
      const brass = varColor('--y-brass', 'rgb(169,130,75)');
      const line = varColor('--y-line-strong', 'rgba(15,30,46,0.2)');
      const ty = r2(h / 2 - 2);
      const tx = r2(Math.max(0, Math.min(w - 22, k * (w - 22))));
      return [
        [
          'F',
          'range',
          x,
          y,
          w,
          h,
          {},
          [
            ['F', 'track', 0, ty, w, 4, { f: line, r: 2 }, []],
            ['F', 'fill', 0, ty, r2(tx + 11), 4, { f: brass, r: 2 }, []],
            ['F', 'thumb', tx, r2(h / 2 - 11), 22, 22, { f: col('rgb(255,255,255)'), r: 11, e: [['D', col('rgba(15,30,46,0.3)'), 0, 2, 8, 0]] }, []],
          ],
        ],
      ];
    }
    if (el instanceof HTMLInputElement) {
      const props = visualProps(el, cs, w, h);
      const ph = !el.value;
      const text = el.value || el.placeholder;
      const size = parseFloat(cs.fontSize);
      const pl = parseFloat(cs.paddingLeft);
      const tw = w - pl - parseFloat(cs.paddingRight);
      const kids: N[] = text
        ? [['T', r2(pl), r2((h - size * 1.2) / 2), r2(tw), r2(size * 1.2), text, size, parseInt(cs.fontWeight, 10), col(ph ? 'rgb(150,150,150)' : cs.color), r2(size * 1.2), 0, cs.textAlign === 'center' ? 1 : 0, 0]]
        : [];
      return [['F', 'input', x, y, w, h, props, kids]];
    }

    const props = visualProps(el, cs, w, h);
    const visual = props.f !== undefined || props.g || props.bb || props.b || props.s || props.e || props.k;
    const nameOf = () => (typeof el.className === 'string' && el.className ? el.className.split(' ')[0] : el.tagName.toLowerCase());

    const collect = (cx: number, cy: number, elBox: number[]) => {
      const kids: N[] = [];
      const before = pseudo(el, '::before', cx, cy, elBox);
      if (before) kids.push(before);
      const nodes = [...el.childNodes];
      for (let i = 0; i < nodes.length; i++) {
        const c = nodes[i];
        if (c.nodeType === 3) {
          const run = [c as Text];
          while (i + 1 < nodes.length && nodes[i + 1].nodeType === 3) run.push(nodes[++i] as Text);
          const t = textNode(run, cx, cy);
          if (t) kids.push(t);
        } else if (c.nodeType === 1) kids.push(...walk(c as Element, cx, cy));
      }
      const after = pseudo(el, '::after', cx, cy, elBox);
      if (after) kids.push(after);
      return kids;
    };

    const absX = x + ox;
    const absY = y + oy;
    const elBox = [absX, absY, w, h];
    const kidsIfFrame = () => collect(absX, absY, elBox);

    if (visual || (FRAME_TAGS.has(el.tagName) && el.children.length + [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent!.trim()).length > 1) || props.o !== undefined) {
      return [['F', nameOf(), x, y, w, h, props, kidsIfFrame()]];
    }
    return collect(ox, oy, elBox);
  }

  const rootCs = getComputedStyle(root);
  const children: N[] = [];
  for (const c of root.childNodes) if (c.nodeType === 1) children.push(...walk(c as Element, 0, 0));
  return JSON.stringify({ n: name, w: r2(rootRect.width / S), h: r2(rootRect.height / S), bg: col(rootCs.backgroundColor), P: palette, t: children, icons });
}

// Помощники для снятия состояний из консоли
const w = (ms: number) => new Promise((r) => setTimeout(r, ms));
const click = (sel: string, text?: string, nth = 0) => {
  const els = [...document.querySelectorAll<HTMLElement>(sel)].filter((e) => !text || e.textContent!.includes(text));
  const el = els[nth];
  if (!el) throw new Error(`no ${sel} ${text ?? ''}`);
  el.click();
};
const cap: Record<string, string> = {};
const keep = (id: string, root = '.kiosk', designW?: number) => {
  (window as unknown as { __figNoIdle?: boolean }).__figNoIdle = true;
  cap[id] = serialize(root, id, { designW });
  return cap[id].length;
};

declare global {
  interface Window {
    __fig: typeof serialize;
    __w: typeof w;
    __c: typeof click;
    __k: typeof keep;
    __cap: typeof cap;
  }
}
Object.assign(window, { __fig: serialize, __w: w, __c: click, __k: keep, __cap: cap });
export {};
