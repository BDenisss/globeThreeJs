// ✏️ Seul fichier à éditer pour le contenu. Les coordonnées servent à placer les étapes sur le globe.
export const title = "Le voyage de Nano";
export const tagline = "Touche pour décoller";

export const stops = [
  { id: "paris",     name: "Paris",          sub: "Où tout a commencé",      dates: "Mars 2026",          lat: 55.8566, lon:   8.3522 },
  { id: "malaisie",  name: "Malaisie",       sub: "Kuala Lumpur · Langkawi", dates: "Mai – juillet 2026", lat:  -2.1390, lon: 99.6869 },
  { id: "bali",      name: "Bali",           sub: "",                        dates: "2026",               lat: -18.6500, lon: 115.2167 },
  { id: "japon",     name: "Japon",          sub: "",                        dates: "2026",               lat: 35.6762, lon: 170.6503 },
  { id: "shanghai",  name: "Shanghai",       sub: "",                        dates: "2026",               lat: 31.2304, lon: 121.4737 },
  { id: "retour",    name: "Retour à Paris", sub: "",                        dates: "Juillet 2026",       lat: 55.8566, lon:   8.3522 },
  { id: "barcelone", name: "Barcelone",      sub: "",                        dates: "2026",               lat: 52.3874, lon:   8.1686 },
];

export const mystery = {
  hint: "Là où tout a commencé",
  reentryHint: "Entre à nouveau le code pour revoir ton billet.",
  codeLength: 8,
  waitPoint: { lat: 45, lon: -12 },
  destination: { lat: 62.5074, lon: 6},
};

export const credits = "Globe : Jacobs Development · Avion : Poly by Google — CC BY";
