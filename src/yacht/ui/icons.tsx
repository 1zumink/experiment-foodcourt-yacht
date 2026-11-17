const P: Record<string, string> = {
  helm: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM12 1v8M12 15v8M1 12h8M15 12h8M4.2 4.2l5.7 5.7M14.1 14.1l5.7 5.7M19.8 4.2l-5.7 5.7M9.9 14.1l-5.7 5.7',
  music: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm11-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  lights: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z',
  spa: 'M3 15c1.5 0 1.5 1.5 3 1.5S7.5 15 9 15s1.5 1.5 3 1.5S13.5 15 15 15s1.5 1.5 3 1.5S19.5 15 21 15M3 19c1.5 0 1.5 1.5 3 1.5S7.5 19 9 19s1.5 1.5 3 1.5S13.5 19 15 19s1.5 1.5 3 1.5S19.5 19 21 19M8 11c-1-1.5 1-2.5 0-4.5M12 11c-1-1.5 1-2.5 0-4.5M16 11c-1-1.5 1-2.5 0-4.5',
  service: 'M3 17h18M5 17a7 7 0 0 1 14 0M12 10V8M10 8h4M2 20h20',
  captain: 'M4 11c0-3 3.6-5 8-5s8 2 8 5H4ZM4 11h16v1.5H4zM12 6V4M10 8.5h4M7 15.5a5 5 0 0 0 10 0',
  play: 'M7 4.5v15l12-7.5-12-7.5Z',
  pause: 'M7 4h3.5v16H7zM13.5 4H17v16h-3.5z',
  next: 'M5 5v14l10-7L5 5ZM18 5v14',
  prev: 'M19 5v14L9 12l10-7ZM6 5v14',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  back: 'M15 5l-7 7 7 7',
  pin: 'M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10Zm0-8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  storm: 'M7 16a5 5 0 1 1 1-9.9A6 6 0 0 1 19 8a4 4 0 0 1-1 8H7ZM13 13l-3 5h4l-2 4',
  glass: 'M8 3h8l-1 7a3 3 0 0 1-6 0L8 3ZM12 13v7M8.5 21h7M8.5 6.5h7',
  shell: 'M4 14c0-5 3.6-9 8-9s8 4 8 9c-2.5 2.5-5.5 4-8 4s-5.5-1.5-8-4ZM12 5v13M8 6.5l2 11M16 6.5l-2 11',
  fruit: 'M8 21a5 5 0 1 1 0-10 5 5 0 0 1 0 10ZM17 18a4 4 0 1 1 0-8 4 4 0 0 1 0 8ZM8 11c0-3 2-6 6-7M17 10c0-2-1-4-3-6',
  cup: 'M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6V8ZM17 10h1.5a2.5 2.5 0 0 1 0 5H16.5M8 2.5c-.6 1 .6 2 0 3M12 2.5c-.6 1 .6 2 0 3',
  cocktail: 'M4 4h16l-8 9-8-9ZM12 13v7M8 21h8M15 3l3-1',
  bowl: 'M3 11h18a9 9 0 0 1-18 0ZM8 11a2.5 2.5 0 0 1 5-1M12.5 11a2.5 2.5 0 0 1 5 0M12 6a2 2 0 0 1 2-2',
};

export type IconName = keyof typeof P;

export function YIcon({ name, size = 22, stroke = 1.6 }: { name: string; size?: number; stroke?: number }) {
  const filled = name === 'play' || name === 'pause' || name === 'next' || name === 'prev';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-icon={name}
    >
      <path d={P[name]} />
      {filled && (name === 'next' || name === 'prev') && <path d={name === 'next' ? 'M18 5v14' : 'M6 5v14'} stroke="currentColor" strokeWidth={2} />}
    </svg>
  );
}
