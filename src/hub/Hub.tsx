import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import '../styles/hub.css';

/** Стартовая страница эксперимента: две части — фудкорт и яхта, на обложках живые экраны */
export function Hub() {
  useEffect(() => {
    document.title = 'Эксперимент';
    document.documentElement.dataset.surface = 'hub';
    return () => {
      delete document.documentElement.dataset.surface;
    };
  }, []);

  return (
    <main className="hub">
      <header className="hub-head">
        <p className="hub-kicker">Эксперимент</p>
        <h1>Два интерфейса, одна команда</h1>
      </header>

      <div className="hub-grid">
        <section className="hub-card">
          <Cover className="hub-cover--food" label="Фудкорт: терминал, табло и приложение">
            <Device kind="board" href="#/display" src="#/display" w={1920} h={1080} k={0.15} style={{ left: 246, top: 40 }} />
            <Device kind="kiosk" href="#/kiosk" src="#/kiosk" w={1080} h={1920} k={0.165} style={{ left: 64, top: 30 }} />
            <Device kind="phone" href="#/app?table=14" src="#/app?table=14" w={390} h={844} k={0.33} style={{ left: 404, top: 104 }} />
          </Cover>
          <div className="hub-body">
            <p className="hub-num">01</p>
            <h2>Фудкорт</h2>
            <p>Единая касса для восьми ресторанов, заказ за столом по QR и табло выдачи.</p>
            <nav className="hub-links">
              <a href="#/kiosk">Терминал</a>
              <a href="#/app?table=14">Приложение · стол 14</a>
              <a href="#/display">Табло выдачи</a>
            </nav>
          </div>
        </section>

        <section className="hub-card">
          <Cover className="hub-cover--yacht" label="Яхта: пульт владельца на планшете и телефоне">
            <Device kind="tablet" href="#/yacht?d=tablet" src="#/yacht?embed=1" w={1180} h={820} k={0.33} style={{ left: 40, top: 44 }} />
            <Device kind="phone" href="#/yacht?d=phone" src="#/yacht?embed=1" w={390} h={844} k={0.34} style={{ left: 380, top: 92 }} />
          </Cover>
          <div className="hub-body">
            <p className="hub-num">02</p>
            <h2>Яхта</h2>
            <p>Пульт владельца: ход, музыка, свет, джакузи, сервис — и передача управления капитану в один жест.</p>
            <nav className="hub-links">
              <a href="#/yacht?d=phone">Телефон</a>
              <a href="#/yacht?d=tablet">Планшет</a>
            </nav>
          </div>
        </section>
      </div>
    </main>
  );
}

const COVER_W = 560;
const COVER_H = 400;

/** Обложка рисуется в макете 560×400 и вписывается в ширину карточки */
function Cover({ className, label, children }: { className: string; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current!;
    const fit = () => setK(el.clientWidth / COVER_W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className={`hub-cover ${className}`} style={{ height: COVER_H * k }} role="img" aria-label={label}>
      <div className="hub-cover-stage" style={{ width: COVER_W, height: COVER_H, transform: `scale(${k})` }}>
        {children}
      </div>
    </div>
  );
}

/** Живой экран в рамке устройства: iframe рендерится в настоящем размере и уменьшается */
function Device({
  kind,
  href,
  src,
  w,
  h,
  k,
  style,
}: {
  kind: 'kiosk' | 'board' | 'phone' | 'tablet';
  href: string;
  src: string;
  w: number;
  h: number;
  k: number;
  style: CSSProperties;
}) {
  return (
    <a className={`hub-device hub-device--${kind}`} href={href} style={{ ...style, width: w * k, height: h * k }} tabIndex={-1} aria-hidden="true">
      <iframe src={src} title="" loading="lazy" tabIndex={-1} style={{ width: w, height: h, transform: `scale(${k})` }} />
    </a>
  );
}
