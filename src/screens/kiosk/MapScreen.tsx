import { FloorMap } from '../../components/FloorMap';
import { BottomBar, CartButton } from '../../components/BottomBar';
import { useSize } from '../../components/useSize';
import { usePrefs } from '../../state/prefs';
import { useCart } from '../../state/cart';
import { useSession } from '../../state/session';
import { MAP_H, MAP_W } from '../../data/floor';
import { S } from '../../i18n';
import type { RestaurantId } from '../../types';

export function MapScreen() {
  const { t } = usePrefs();
  const { lines, count } = useCart();
  const { go } = useSession();
  const [ref, size] = useSize<HTMLDivElement>();
  const scale = size.h ? Math.min(1, size.h / MAP_H, size.w / MAP_W) : 1;
  const counts: Partial<Record<RestaurantId, number>> = {};
  for (const l of lines) counts[l.restaurantId] = (counts[l.restaurantId] ?? 0) + l.qty;

  return (
    <section className="screen screen--map">
      <h1 className="sr-only" data-screen-title tabIndex={-1}>
        {t(S.chooseRestaurant)}
      </h1>
      <div className="map-wrap" ref={ref}>
        <FloorMap mode="select" scale={scale} title={t(S.chooseRestaurant)} counts={counts} onRestaurant={(rid) => go({ name: 'menu', rid })} showTerminal />
      </div>
      <BottomBar>
        {count > 0 ? (
          <CartButton />
        ) : (
          <p className="map-hint">
            <strong>{t(S.tapRestaurantHint)}</strong>
            <span>{t(S.oneCartHint)}</span>
          </p>
        )}
      </BottomBar>
    </section>
  );
}
