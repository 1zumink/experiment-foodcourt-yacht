import { useLayoutEffect, useState, type ReactNode } from 'react';

/** Экран киоска 1080×1920, вписанный в окно браузера */
export function KioskFrame({ children, w = 1080, h = 1920 }: { children: ReactNode; w?: number; h?: number }) {
  const [s, setS] = useState(1);
  useLayoutEffect(() => {
    const fit = () => setS(Math.min(window.innerWidth / w, window.innerHeight / h));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [w, h]);
  return (
    <div className="kiosk-viewport">
      <div style={{ width: w * s, height: h * s, position: 'relative' }}>
        <div className="kiosk" style={{ width: w, height: h, transform: `scale(${s})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
