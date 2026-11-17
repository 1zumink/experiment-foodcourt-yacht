import { useCallback, useRef, useState } from 'react';

/**
 * Размер элемента в CSS-пикселях макета (до масштабирования киоска).
 * Callback-ref: работает и для элементов, которые появляются позже первого рендера.
 */
export function useSize<T extends HTMLElement>() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const ro = useRef<ResizeObserver | null>(null);
  const ref = useCallback((el: T | null) => {
    ro.current?.disconnect();
    ro.current = null;
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    ro.current = new ResizeObserver(measure);
    ro.current.observe(el);
    measure();
  }, []);
  return [ref, size] as const;
}
