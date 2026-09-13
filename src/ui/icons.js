const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${d}"/></svg>`;

export const ICONS = {
  paris: svg('M12 2 9.4 13h5.2L12 2zM7.5 14h9l2.5 8h-4l-3-4-3 4H5l2.5-8z'),
  malaisie: svg('M6 22V8l2-4 2 4v14H6zm8 0V8l2-4 2 4v14h-4zm-4-9h4v1.5h-4V13z'),
  bali: svg('M12 2l3 4H9l3-4zM8 7h8l2 4H6l2-4zM5 12h14v3H5v-3zM6 16h12v6H6v-6z'),
  japon: svg('M3 20L12 5l9 15H3zm6.2-9h5.6L12 7.5 9.2 11z'),
  shanghai: svg('M3 22V10h4v12H3zm6 0V4h5v18H9zm7 0V13h4v9h-4z'),
  retour: svg('M4 12l8-8 8 8v10h-6v-6h-4v6H4V12z'),
  barcelone: svg('M5 22V10l2-6 2 6v12H5zm5 0V7l2-5 2 5v15h-4zm5 0V10l2-6 2 6v12h-4z'),
  final: svg('M10 22V6l2-4 2 4v16h-4zM8.5 9h7v7h-7V9zm2 2v3h3v-3h-3z'),
  lock: svg('M6 11h12v11H6V11zm3 0V8a3 3 0 0 1 6 0v3h-2V8a1 1 0 0 0-2 0v3H9z'),
};

// Cachet scellé (carte de l'étape mystère), 96×96.
export const SEAL = `<svg viewBox="0 0 96 96" aria-hidden="true">
  <circle cx="48" cy="48" r="44" fill="none" stroke="#D9B65C" stroke-width="2"/>
  <circle cx="48" cy="48" r="37" fill="none" stroke="#D9B65C" stroke-width="1.2" stroke-dasharray="4 3"/>
  <text x="48" y="64" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="46" fill="#D9B65C">?</text>
</svg>`;
