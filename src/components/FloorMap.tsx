import type { RestaurantId } from '../types';
import { restaurants } from '../data/restaurants';
import { MAP_H, MAP_W, tables, terminalPoint, terminalSpot, tree } from '../data/floor';
import { Logo } from './Logo';
import { usePrefs } from '../state/prefs';
import { S } from '../i18n';
import { Icon } from './Icon';

interface Props {
  mode: 'select' | 'table' | 'locate';
  scale?: number;
  title?: string;
  onRestaurant?: (id: RestaurantId) => void;
  counts?: Partial<Record<RestaurantId, number>>;
  selectedTable?: number | null;
  onTable?: (n: number) => void;
  highlight?: RestaurantId[];
  /** Видимая область карты (координаты макета). По умолчанию — вся карта. */
  view?: { x: number; y: number; w: number; h: number };
  /** Терминал: показать отметку «Вы здесь» у входа, маршруты идут от неё */
  showTerminal?: boolean;
  /** Приложение: стол гостя — подсвечен, маршруты идут от него */
  myTable?: number | null;
}

/** Карта фудкорта по макету Figma: рестораны по периметру, столы, дерево в центре */
export function FloorMap({
  mode,
  scale = 1,
  title,
  onRestaurant,
  counts,
  selectedTable,
  onTable,
  highlight,
  view = { x: 0, y: 0, w: MAP_W, h: MAP_H },
  showTerminal,
  myTable,
}: Props) {
  const { t } = usePrefs();
  const mine = myTable ? tables.find((x) => x.n === myTable) : undefined;
  const from = showTerminal ? terminalPoint : mine ? { x: mine.x + mine.w / 2, y: mine.y + mine.h / 2 } : null;
  const target = mode === 'locate' ? restaurants.filter((r) => highlight?.includes(r.id)) : [];
  const tableTarget = mode === 'locate' && selectedTable && selectedTable !== myTable ? tables.find((x) => x.n === selectedTable) : undefined;

  return (
    <div className={`floor floor--${mode}`} style={{ width: view.w * scale, height: view.h * scale }}>
      <div className="floor-inner" style={{ width: MAP_W, height: MAP_H, transform: `scale(${scale}) translate(${-view.x}px, ${-view.y}px)` }}>
        {title && (
          <div className="floor-title" aria-hidden={mode !== 'select'}>
            {title}
          </div>
        )}

        {/* Маршрут от терминала (киоск) или от стола гостя (приложение) */}
        {from && (target.length > 0 || tableTarget) && (
          <svg className="floor-route" width={MAP_W} height={MAP_H} aria-hidden="true">
            {target.map((r) => (
              <line key={r.id} x1={from.x} y1={from.y} x2={r.map.x + r.map.w / 2} y2={r.map.y + r.map.h / 2} />
            ))}
            {tableTarget && <line x1={from.x} y1={from.y} x2={tableTarget.x + tableTarget.w / 2} y2={tableTarget.y + 50} />}
          </svg>
        )}

        {tables.map((tb) => {
          const sel = selectedTable === tb.n || myTable === tb.n;
          const style = { left: tb.x, top: tb.y, width: tb.w, height: tb.h };
          if (mode === 'table') {
            return (
              <button
                key={tb.n}
                type="button"
                className={`floor-table is-pickable${selectedTable === tb.n ? ' is-selected' : ''}`}
                style={style}
                aria-pressed={selectedTable === tb.n}
                aria-label={`${t(S.table)} ${tb.n}`}
                onClick={() => onTable?.(tb.n)}
              >
                {selectedTable === tb.n && <Icon name="check" size={36} stroke={3.4} />}
                <span>{tb.n}</span>
              </button>
            );
          }
          return (
            <div key={tb.n} className={`floor-table${sel ? ' is-selected' : ''}`} style={style} aria-hidden="true">
              <span>{tb.n}</span>
            </div>
          );
        })}

        <div className="floor-tree" style={{ left: tree.x, top: tree.y, width: tree.w, height: tree.h }} aria-hidden="true">
          <img src="/figma/you-are-here.svg" alt="" width={tree.w} height={tree.h} />
          <span className="floor-tree-icon">
            <Icon name="tree" size={72} stroke={2} />
          </span>
        </div>

        {showTerminal && (
          <div className="floor-terminal" style={{ left: terminalSpot.x, top: terminalSpot.y, width: terminalSpot.w, height: terminalSpot.h }}>
            <Icon name="pin" size={34} />
            {t(S.youAreHere)}
          </div>
        )}

        {restaurants.map((r) => {
          const m = r.map;
          const dim = mode === 'table' || (mode === 'locate' && !highlight?.includes(r.id));
          const hl = mode === 'locate' && highlight?.includes(r.id);
          const count = counts?.[r.id];
          const body = (
            <>
              <Logo spec={r.logo} height={r.logo.h} style={{ position: 'absolute', left: m.logoX - m.x, top: m.logoY - m.y }} />
              <span className="sr-only">{r.name}</span>
              {!!count && (
                <span className="floor-badge" aria-label={`${count} ${t(S.inCart)}`}>
                  {count}
                </span>
              )}
            </>
          );
          const style = { left: m.x, top: m.y, width: m.w, height: m.h, borderRadius: m.radius, background: r.brand };
          return mode === 'select' ? (
            <button key={r.id} type="button" className="floor-rest brand-surface" style={style} onClick={() => onRestaurant?.(r.id)}>
              {body}
            </button>
          ) : (
            <div key={r.id} className={`floor-rest brand-surface${dim ? ' is-dim' : ''}${hl ? ' is-hl' : ''}`} style={style} aria-hidden={dim}>
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}
