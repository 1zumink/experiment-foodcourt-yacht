/** SVG-дуга по окружности (углы в градусах, 0 — вправо, по часовой) — без stroke-dasharray, чтобы переносилась в Figma */
export function arcPath(cx: number, cy: number, r: number, start: number, sweep: number) {
  if (sweep <= 0.01) return '';
  const s = Math.min(sweep, 359.99);
  const pt = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}`;
  };
  return `M ${pt(start)} A ${r} ${r} 0 ${s > 180 ? 1 : 0} 1 ${pt(start + s)}`;
}
