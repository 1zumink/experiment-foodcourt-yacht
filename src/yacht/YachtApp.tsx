import { useEffect, useRef } from 'react';
import { act, isDark, startSim, useYacht, type Tab } from './state';
import { Scene } from './scene/Scene';
import { HelmPanel, dirName } from './ui/Helm';
import { LightsPanel, MusicPanel, ServicePanel, SpaPanel } from './ui/Comfort';
import { CaptainButton, StormAlert, Toast } from './ui/Captain';
import { YIcon } from './ui/icons';
import '../styles/yacht.css';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'helm', label: 'Ход', icon: 'helm' },
  { id: 'music', label: 'Музыка', icon: 'music' },
  { id: 'lights', label: 'Свет', icon: 'lights' },
  { id: 'spa', label: 'Джакузи', icon: 'spa' },
  { id: 'service', label: 'Сервис', icon: 'service' },
];

function Panel({ tab }: { tab: Tab }) {
  switch (tab) {
    case 'helm':
      return <HelmPanel />;
    case 'music':
      return <MusicPanel />;
    case 'lights':
      return <LightsPanel />;
    case 'spa':
      return <SpaPanel />;
    case 'service':
      return <ServicePanel />;
  }
}

function Remote() {
  const s = useYacht();
  const press = useRef<number | null>(null);
  return (
    <div className="y-app" data-theme={isDark(s) ? 'dark' : 'light'} data-weather={s.weather}>
      <div className="y-layout">
        <section className="y-stagearea">
          <div className="y-canvas">
            <Scene />
          </div>
          <header className="y-top">
            <div
              className="y-name"
              onPointerDown={() => {
                // скрытый демо-жест: долгое нажатие на имя вызывает/убирает шторм
                press.current = window.setTimeout(() => act.storm(s.weather !== 'storm'), 1200);
              }}
              onPointerUp={() => press.current && window.clearTimeout(press.current)}
              onPointerLeave={() => press.current && window.clearTimeout(press.current)}
            >
              <p className="y-eyebrow">Моторная яхта</p>
              <h1>Aurelia</h1>
            </div>
            <CaptainButton />
          </header>
          <div className="y-status" aria-label="Состояние">
            <span>
              <b>{Math.round(s.speed)}</b> уз
            </span>
            <span>
              <b>{Math.round(s.heading)}°</b> {dirName(s.heading)}
            </span>
            <span>
              <b>{s.spa.temp.toFixed(0)}°</b> джакузи
            </span>
            <span className={s.weather === 'storm' ? 'is-warn' : ''}>{s.weather === 'storm' ? 'Шторм' : 'Штиль'}</span>
          </div>
          {s.picking && <div className="y-hint">Коснитесь места на яхте, куда подать заказ</div>}
          <Toast />
        </section>

        <section className="y-sheet">
          <nav className="y-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={s.tab === t.id}
                className={s.tab === t.id ? 'is-on' : ''}
                onClick={() => act.tab(t.id)}
              >
                <YIcon name={t.icon} size={22} stroke={1.5} />
                <span>{t.label}</span>
                {t.id === 'service' && s.order && s.order.stage !== 'served' && <i className="y-dot" />}
                {t.id === 'helm' && s.control !== 'owner' && <i className="y-dot y-dot--brass" />}
              </button>
            ))}
          </nav>
          <div className="y-panel-scroll" role="tabpanel" key={s.tab}>
            <Panel tab={s.tab} />
          </div>
        </section>
      </div>
      <StormAlert />
    </div>
  );
}

export default function YachtApp() {
  const s = useYacht();
  const d = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('d');
  const device = d === 'tablet' ? 'tablet' : d === 'phone' ? 'phone' : null;
  const embed = new URLSearchParams(window.location.hash.split('?')[1] ?? '').has('embed');

  useEffect(() => startSim(), []);
  useEffect(() => {
    // Снятие экранов для Figma — только в режиме разработки
    if (import.meta.env.DEV) import('../dev/yachtShots');
  }, []);
  useEffect(() => {
    document.title = 'Яхта — пульт владельца';
    const root = document.documentElement;
    root.dataset.surface = 'yacht';
    return () => {
      delete root.dataset.surface;
    };
  }, []);

  const demo = (
    <aside className="y-demo">
      <button type="button" onClick={() => act.storm(s.weather !== 'storm')}>
        {s.weather === 'storm' ? 'Успокоить море' : 'Вызвать шторм'}
      </button>
      <a href={device === 'tablet' ? '#/yacht?d=phone' : '#/yacht?d=tablet'}>{device === 'tablet' ? 'Телефон' : 'Планшет'}</a>
      <a href="#/">← Эксперимент</a>
    </aside>
  );

  if (!device) {
    return (
      <div className="y-full">
        <Remote />
        {!embed && demo}
      </div>
    );
  }
  return (
    <div className="y-stage" data-theme={isDark(s) ? 'dark' : 'light'}>
      <div className={`y-device y-device--${device}`}>
        <Remote />
      </div>
      {demo}
    </div>
  );
}
