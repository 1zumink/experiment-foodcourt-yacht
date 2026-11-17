const paths: Record<string, string> = {
  back: 'M15 18l-6-6 6-6',
  next: 'M9 18l6-6-6-6',
  cart: 'M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2 M10 21h.01 M18 21h.01',
  plus: 'M12 5v14 M5 12h14',
  minus: 'M5 12h14',
  close: 'M18 6L6 18 M6 6l12 12',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  trash: 'M4 7h16 M10 11v6 M14 11v6 M6 7l1 13h10l1-13 M9 7V4h6v3',
  a11y: 'M12 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M5 8l7 1.5L19 8 M12 9.5V14 M12 14l-3.5 7 M12 14l3.5 7',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M3 12h18 M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z',
  bag: 'M5 8h14l-1 12H6L5 8z M9 8V6a3 3 0 0 1 6 0v2',
  table: 'M3 9h18 M5 9v10 M19 9v10 M3 9l2-4h14l2 4',
  card: 'M3 6h18v12H3z M3 10h18 M7 15h4',
  qr: 'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h2v2h-2z M18 18h2v2h-2z M14 18h2 M18 14h2',
  phone: 'M7 3h10v18H7z M11 18h2',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
  pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  text: 'M4 7V5h16v2 M12 5v14 M9 19h6',
  contrast: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 3v18',
  down: 'M12 4v14 M6 12l6 6 6-6',
  gift: 'M4 11h16v9H4z M3 7h18v4H3z M12 7v13 M12 7c-1.5-3-5-3-5-1s3 1 5 1c2 0 5 1 5-1s-3.5-2-5 1',
  tree: 'M12 22v-7 M9 22h6 M12 15c-3.9 0-7-2.2-7-5.5 0-2 1.3-3.7 3.1-4.3A4.5 4.5 0 0 1 12 2.5a4.5 4.5 0 0 1 3.9 2.7c1.8.6 3.1 2.3 3.1 4.3 0 3.3-3.1 5.5-7 5.5z',
  backspace: 'M21 5H9l-6 7 6 7h12z M12 9l6 6 M18 9l-6 6',
};

export function Icon({ name, size = 32, stroke = 2.4 }: { name: keyof typeof paths | string; size?: number; stroke?: number }) {
  return (
    <svg data-icon={name} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {(paths[name] ?? '').split(' M').map((d, i) => (
        <path key={i} d={i === 0 ? d : 'M' + d} />
      ))}
    </svg>
  );
}
