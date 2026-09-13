// ✏️ Seul fichier à éditer pour le contenu. Les coordonnées servent à placer les étapes sur le globe.
export const title = "Le voyage de Nano";
export const tagline = "Touche pour décoller";

export const stops = [
  { id: "paris",     name: "Paris",          sub: "Où tout a commencé",      dates: "Mars 2026",          lat: 48.8566, lon:   2.3522 },
  { id: "malaisie",  name: "Malaisie",       sub: "Kuala Lumpur · Langkawi", dates: "Mai – juillet 2026", lat:  3.1390, lon: 101.6869 },
  { id: "bali",      name: "Bali",           sub: "",                        dates: "2026",               lat: -8.6500, lon: 115.2167 },
  { id: "japon",     name: "Japon",          sub: "",                        dates: "2026",               lat: 35.6762, lon: 139.6503 },
  { id: "shanghai",  name: "Shanghai",       sub: "",                        dates: "2026",               lat: 31.2304, lon: 121.4737 },
  { id: "retour",    name: "Retour à Paris", sub: "",                        dates: "Juillet 2026",       lat: 48.8566, lon:   2.3522 },
  { id: "barcelone", name: "Barcelone",      sub: "",                        dates: "2026",               lat: 41.3874, lon:   2.1686 },
];

export const mystery = {
  hint: "Ton indice écrit ici.",
  reentryHint: "Entre à nouveau le code pour revoir ton billet.",
  codeLength: 6,
  waitPoint: { lat: 45, lon: -12 },
  destination: { lat: 51.5074, lon: -0.1278 },
};

export const credits = "Globe : Jacobs Development · Avion : Poly by Google — CC BY";
