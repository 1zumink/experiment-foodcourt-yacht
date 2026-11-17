import type { CSSProperties } from 'react';
import type { LogoSpec, Restaurant } from '../types';

/** Логотип из Figma с тем же кадрированием; масштабируется через высоту */
export function Logo({ spec, height, style }: { spec: LogoSpec; height: number; style?: CSSProperties }) {
  const width = (spec.w / spec.h) * height;
  return (
    <span className="logo" style={{ width, height, ...style }} aria-hidden="true">
      {spec.parts.map((p, i) => (
        <span
          key={i}
          className="logo-part"
          style={{
            left: `${(p.x / spec.w) * 100}%`,
            top: `${(p.y / spec.h) * 100}%`,
            width: `${(p.w / spec.w) * 100}%`,
            height: `${(p.h / spec.h) * 100}%`,
            borderRadius: p.round ? '50%' : undefined,
          }}
        >
          <img
            src={p.src}
            alt=""
            draggable={false}
            style={
              p.img
                ? { left: `${p.img.left}%`, top: `${p.img.top}%`, width: `${p.img.width}%`, height: `${p.img.height}%` }
                : { inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
            }
          />
        </span>
      ))}
    </span>
  );
}

/** Плитка с логотипом на фирменном фоне */
export function LogoTile({ r, size, radius = 24 }: { r: Restaurant; size: number; radius?: number }) {
  const ratio = r.logo.w / r.logo.h;
  const pad = size * 0.06;
  const inner = size - pad * 2;
  const h = ratio > 1 ? inner / ratio : inner;
  return (
    <span className="logo-tile brand-surface" style={{ width: size, height: size, borderRadius: radius, background: r.brand }}>
      <Logo spec={r.logo} height={h} />
    </span>
  );
}
