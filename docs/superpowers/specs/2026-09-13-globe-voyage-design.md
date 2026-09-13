# Le voyage de Nano — site secret 3D (spec de conception)

Date : 13 septembre 2026
Repo : https://github.com/BDenisss/globeThreeJs — en ligne : **https://nano-adventure.vercel.app/** (Vercel ; GitHub Pages abandonné le 13/09, le compte GitHub bloque toute exécution d'Actions)
Statut : design validé section par section en conversation, à implémenter.

## 1. Objectif

Un site 100 % front, accessible par le QR code de la p.42 du magazine « The Nano's adventure ». Il rejoue le voyage de la double page 24-25 sur un globe 3D cartoon : un petit avion de ligne vole d'étape en étape (7 étapes réelles), puis s'arrête devant une 8e étape verrouillée. Un code chiffré, dont l'indice est écrit dans la carte de cette étape, déverrouille la révélation : **Londres, 2–4 octobre 2026**, présentée sous forme de billet Eurostar noir & or (écho de la p.7) avec un message de Denis au verso.

Le site est **le moment de la révélation** : rien dans le magazine ne dit « Londres » avant.

## 2. Décisions figées

| Sujet | Décision |
|---|---|
| Rendu | three.js, WebGL, pas de post-processing lourd |
| Stack | Vite + JS vanilla (ES modules), zéro framework ; vitest pour les tests |
| Cible | Mobile portrait d'abord (Safari iPhone), fonctionne aussi en paysage et desktop |
| Globe | Asset « Low Poly Planet Earth » de Jacobs Development, CC-BY-4.0, `public/models/earth.glb` (920 Ko, 1 mesh texturé, ~9,2 k triangles) |
| Avion | Asset low-poly « Airplane » de Poly by Google (Poly Pizza), CC-BY, `public/models/plane.glb` — choix final du modèle à l'implémentation, parmi https://poly.pizza/m/8ciDd9k8wha et https://poly.pizza/m/a3XrQkLNna9 |
| Palette | Globe coloré (l'asset tel quel) ; UI noir `#141414` / or `#D9B65C` / crème pour le texte ; fond de scène bleu nuit `#0B1026` |
| Étapes | Paris → Malaisie (KL · Langkawi) → Bali → Japon → Shanghai → Retour à Paris → Barcelone → ??? |
| Contenu par étape | Nom du lieu + sous-titre optionnel + dates. Rien d'autre |
| Mot de passe | Code **chiffré**, longueur configurable (défaut 6), pavé numérique |
| Révélation | Billet Eurostar recto (LONDRES, 2–4 OCT 2026) + verso (message de Denis), retournable d'un tap |
| Hébergement | Vercel, repo GitHub importé, build automatique à chaque push sur `main`, `base: '/'` |
| Crédits | Une ligne discrète sur l'écran d'accueil : « Globe : Jacobs Development · Avion : Poly by Google — CC BY » |

## 3. Architecture

```
site/
  index.html                  page unique : <canvas> + couches UI HTML/CSS
  vite.config.js              base '/'
  package.json                scripts : dev, build, preview, test, seal
  public/
    models/earth.glb          globe
    models/plane.glb          avion
    secret.enc                révélation chiffrée (généré par `npm run seal`)
  src/
    content.js                ← SEUL fichier édité par Denis (étapes, indice, hash)
    main.js                   démarrage : charge les modèles, crée scène + UI, boucle de rendu
    state.js                  machine à états (pure, testable, sans three.js)
    scene/
      globe.js                chargement, recentrage, normalisation, calibration
      route.js                pointillé doré le long des arcs, révélation progressive
      plane.js                avion, animation de vol le long d'un arc
      camera.js               caméra orbitale, transitions douces
      effects.js              marqueur « ? », particules or de l'arrivée
    ui/
      intro.js                écran d'accueil + chargement
      stopCard.js             carte lieu/dates
      timeline.js             8 pastilles
      lock.js                 pavé numérique
      reveal.js               billet recto/verso
      input.js                swipe, flèches, clavier
    lib/
      geo.js                  lat/lon ↔ vecteur, arc de grand cercle, interpolation
      crypto.js               hash, dérivation de clé, déchiffrement (WebCrypto)
      ease.js                 fonctions d'easing
  scripts/
    seal.mjs                  Node : code + contenu clair → hash + secret.enc
  test/                       vitest : geo, state, crypto (via scripts/seal + lib/crypto)
  docs/superpowers/specs/     cette spec
  vercel.json                 preset Vite, cache des modèles
```

Dépendances : `three` (runtime), `vite`, `vitest` (dev). Rien d'autre.

Principe : **`state.js` et `lib/*` ne dépendent pas de three.js ni du DOM** ; ils sont testés unitairement. `scene/*` et `ui/*` lisent l'état et se mettent à jour ; ils ne décident rien.

## 4. Scène 3D

### 4.1 Globe

- Chargé via `GLTFLoader`. Le fichier a un décalage d'origine hérité de l'export FBX (nœud « Object » translaté de ~(−0,05 ; 1,25 ; 0,07)) : au chargement, on calcule la `Box3` du mesh, on **recentre** le modèle sur son centre et on **normalise** pour que le rayon de la sphère de base soit exactement 1 (unité de la scène). Les continents extrudés dépassent légèrement (≈ 1,05).
- **Calibration** : la correspondance lat/lon → point 3D suppose une sphère « Y vers le haut, méridien 0 sur +Z ». L'asset n'est pas garanti aligné. `globe.js` applique une rotation de correction fixe `CALIB = { yaw, pitch, roll }` (constantes dans `globe.js`, déterminées une fois). Le mode `?debug` dans l'URL affiche un marqueur rouge sur chaque étape et une aide au clavier (`Q/E` yaw, `W/S` pitch, `A/D` roll, `P` imprime les valeurs en console) pour trouver `CALIB`.
- Rotation d'attente : le globe (et tout ce qui est attaché : route, marqueurs) tourne de 0,05 rad/s autour de Y **uniquement pendant `INTRO`**. Aux étapes, le globe est immobile : la caméra fixe garde l'étape courante centrée (une rotation ferait dériver la ville hors champ en moins d'une minute).

### 4.2 Conversion géographique (`lib/geo.js`)

- `latLonToVec3(lat, lon, r)` → `{x, y, z}` : `x = r cos(lat) sin(lon)`, `y = r sin(lat)`, `z = r cos(lat) cos(lon)` (angles en radians).
- `slerp(a, b, t)` : interpolation sphérique entre deux vecteurs unitaires (arc de grand cercle).
- `arcPoint(a, b, t, lift, base = 1)` : point sur l'arc à `t ∈ [0,1]`, altitude `base + lift · sin(π t)` — l'avion monte puis redescend (base 1,07 pour l'avion) ; `lift` dépend de la longueur de l'arc (`0.08 + 0.3 · angle/π`, borné à 0,35).
- `arcLength(a, b)` : angle entre les deux vecteurs (pour proportionner la durée du vol).

### 4.3 Route (`scene/route.js`)

- Pour chaque segment entre étapes consécutives, un **pointillé doré** posé à l'altitude 1,06 (au-dessus des reliefs) : petits cylindres (ou segments d'un `LineSegments` épais via `Line2` de three/examples) de longueur 0,018 séparés de 0,014, couleur `#D9B65C`.
- Le segment `i` n'est visible que si l'étape `i+1` a été atteinte au moins une fois ; pendant le vol il **se dessine progressivement** derrière l'avion.
- Le segment Barcelone → « ? » mène au point d'attente (voir 4.5), pas à Londres. Après déverrouillage, un dernier segment « ? » → Londres est ajouté et se dessine pendant l'atterrissage.

### 4.4 Avion (`scene/plane.js`)

- glTF low-poly, mis à l'échelle pour une envergure ≈ 0,12 unité ; matériaux de l'asset conservés, avec une légère teinte dorée sur le fuselage si l'asset est blanc (paramètre).
- Posé à une étape : à l'altitude 1,07 au-dessus du point, nez orienté vers la prochaine étape.
- En vol : position = `arcPoint(a, b, ease(t), lift)` ; orientation = `lookAt(position suivante)` avec « up » = normale au globe ; **inclinaison** (roll) = `15° · sin(π t)` — nulle au décollage et à l'atterrissage, maximale à mi-vol (sur un grand cercle il n'y a pas de virage réel ; l'inclinaison est un effet de style, stable et indépendant de la cadence d'images). Durée = `1.2 s + 2.6 s · angle/π` (Paris → Malaisie ≈ 2,5 s, Shanghai → Paris ≈ 2,4 s, Paris → Barcelone ≈ 1,3 s). Retour arrière : même arc à l'envers, durée × 0,6.
- Point d'attente (état `LOCKED`) : l'avion flotte (oscillation verticale ±0,01, période 2 s) devant le « ? ».

### 4.5 Point d'attente et « ? »

Pour ne pas trahir la destination, le point d'attente n'est **pas** sur la trajectoire Barcelone → Londres. Il est au large dans l'Atlantique : `lat 45, lon −12`. Un « ? » doré (sprite dessiné sur canvas, taille 0,16) flotte à l'altitude 1,25 au-dessus de ce point et pulse doucement (±6 % de taille). Il est visible dès le début du parcours (teaser), sauf si le site est déjà déverrouillé. Il se dissout (opacité → 0 en 0,6 s) au déverrouillage. L'avion, lui, flotte à l'altitude 1,1 sous le « ? ».

### 4.6 Caméra (`scene/camera.js`)

- `PerspectiveCamera` (fov 45 portrait / 38 paysage), toujours orientée vers le centre du globe.
- Position cible : sur la droite centre → étape courante, à distance `D` (2,6 en portrait mobile, 2,2 en paysage/desktop), avec un décalage vertical pour laisser la place à la carte d'étape en bas (le globe est légèrement remonté à l'écran).
- Transition : la caméra `slerp` d'une direction à l'autre pendant le vol, sur la même durée que l'avion, easing `easeInOutCubic` ; l'avion reste donc au centre de l'écran.
- Pendant `INTRO` : la caméra est plus loin (D = 3,4), globe entier visible.
- Pas d'`OrbitControls` libres : l'utilisateur ne fait pas tourner le globe à la main (sinon les swipes de navigation entrent en conflit). Un drag horizontal lent (> 300 ms sans relâcher) est ignoré ; un swipe rapide navigue.

### 4.7 Éclairage et fond

- `HemisphereLight` (ciel bleu clair / sol brun sombre, 0,9) + `DirectionalLight` blanche (1,1) venant du haut-gauche + `DirectionalLight` dorée `#D9B65C` (0,5) en contre-jour bas-droite.
- Fond uni `#0B1026` + quelques centaines d'étoiles (`Points`, taille 1,5 px, opacité 0,6) sur une sphère lointaine, très discrètes.
- `renderer.setPixelRatio(min(devicePixelRatio, 2))`, antialias activé, `toneMapping = ACESFilmic`, exposition 1,0.

## 5. Machine à états (`state.js`)

```
INTRO
  → START                 → AT_STOP(0)
AT_STOP(i)
  → NEXT   (i < 6)        → FLYING(i → i+1)
  → NEXT   (i == 6)       → FLYING(6 → WAIT)      (vers le point d'attente)
  → PREV   (i > 0)        → FLYING(i → i-1, backwards)
  → GOTO(j)               → FLYING(i → j) si j ∈ visited ∪ {max(visited)+1}, sinon ignoré
FLYING(a → b)
  → ARRIVED               → AT_STOP(b)
                            ou LOCKED       si b == WAIT
                            ou REVEALED     si b == 7 et secret déchiffré en mémoire
                            ou LOCKED(reentry) si b == 7 et secret non déchiffré (rechargement)
  (toute autre commande : ignorée)
LOCKED / LOCKED(reentry)
  → PREV                  → FLYING(WAIT ou 7 → 6, backwards)
  → OPEN_LOCK             → même état + lockOpen = true
  → CODE_OK               → UNLOCKING   (depuis LOCKED)
                            REVEALED    (depuis LOCKED(reentry) : pas de re-vol, billet direct)
  → CODE_KO               → même état (compteur d'échecs pour l'animation, sans effet bloquant)
UNLOCKING
  → LANDED                → REVEALED
REVEALED  (comportement d'un AT_STOP(7) : PREV possible, NEXT ignoré, tap sur le billet le retourne)
```

- `visited` : ensemble des indices déjà atteints (0 inclus dès START). Les segments de route affichés découlent de `visited`.
- `unlocked` : booléen, persisté dans `localStorage['nano.unlocked'] = '1'`. Si vrai au chargement, l'étape 8 est atteignable comme une étape normale : depuis Barcelone, `NEXT` vole directement vers Londres (le « ? » et le point d'attente n'existent pas). À l'arrivée, si le secret est déjà déchiffré en mémoire (code retrouvé dans `sessionStorage`, voir 7.2) → `REVEALED` ; sinon → `LOCKED(reentry)`, dont la carte dit « Entre à nouveau le code » à la place de l'indice.
- `?reset` dans l'URL : efface `localStorage` puis recharge sans le paramètre.
- Réducteur pur : `next(state, action) → state`. Les effets (lancer une animation, jouer le déchiffrement) sont déclenchés par `main.js` en comparant l'état avant/après.

## 6. Couches UI (HTML/CSS par-dessus le canvas)

Typographie : une police condensée pour les titres (Anton via Google Fonts, avec fallback `Impact, sans-serif`) et une serif pour le texte (Libre Baskerville, fallback Georgia) — les mêmes familles que le magazine. Or `#D9B65C`, crème `#F3EBD8`, noir `#141414`.

### 6.1 Accueil (`INTRO`)
Titre `content.title` (défaut « Le voyage de Nano ») en Anton or, sous-titre « Touche pour décoller » qui pulse doucement, ligne de crédits en bas (10 px, crème 50 %). Tant que les modèles chargent, le sous-titre est remplacé par une barre de progression or (progression réelle des `GLTFLoader`). Tap n'importe où → `START`.

### 6.2 Carte d'étape (`AT_STOP`)
Panneau noir 85 % opaque, liseré or 1 px, coins arrondis 12 px, ancré en bas (portrait) ou à droite (paysage). Contenu : `name` (Anton, 28 px, or), `sub` (Baskerville italique 14 px, crème) s'il existe, `dates` (Baskerville 14 px, crème 80 %). Entrée : glisse depuis le bas sur 350 ms à l'arrivée ; sortie : fondu 200 ms au départ.

### 6.3 Timeline
Barre horizontale fixe en bas (au-dessus de la carte), 8 pastilles de 28 px espacées, reliées par un pointillé fin. États : visitée = contour or, courante = or plein + picto noir, à venir = gris 40 %, la 8e = cadenas tant que `!unlocked`, puis picto Big Ben stylisé. Pictos : SVG inline simplifiés des icônes de la double page (Tour Eiffel, tours Petronas, temple, Fuji, skyline, maison, Sagrada, cadenas/?). Tap sur une pastille autorisée → `GOTO(j)`.

### 6.4 Commandes (`ui/input.js`)
Swipe horizontal (déplacement > 40 px, durée < 300 ms) : gauche → `NEXT`, droite → `PREV`. Deux chevrons or discrets à mi-hauteur sur les bords (masqués si l'action est impossible). Clavier : `←`/`→`. Toute commande pendant `FLYING`/`UNLOCKING` est ignorée (pas de file).

### 6.5 Carte verrouillée (`LOCKED`)
Même panneau que 6.2, mais : cachet scellé rond en or (SVG, écho du 8e tampon de la p.24-25) avec « ? », titre « Destination mystère », le texte `mystery.hint` (Baskerville, 15 px, crème), et un bouton « Entrer le code » (fond or, texte noir). Tap → `OPEN_LOCK`.

### 6.6 Pavé numérique
Plein écran noir 92 %. En haut, `codeLength` cases (44 px, contour or, chiffre en Anton) ; au centre, un pavé 3 × 4 : `1..9`, `⌫`, `0`, `✕` (fermer). Le code est vérifié automatiquement à la dernière case remplie (délai 150 ms pour laisser voir le dernier chiffre).
- Mauvais code : cases secouées (translation ±6 px, 400 ms), vidées, message « Pas encore… relis bien la carte. » en crème sous les cases pendant 2 s. Aucun blocage, aucun compteur visible.
- Bon code : cases remplies en or, pavé fondu en 400 ms, puis `CODE_OK`.

### 6.7 Révélation (`UNLOCKING` → `REVEALED`)
Séquence orchestrée par `main.js` (durées indicatives) :
1. 0,0 s — le « ? » se dissout (0,6 s) ; la carte verrouillée disparaît.
2. 0,4 s — le segment « ? » → Londres commence à se dessiner ; l'avion décolle et vole vers Londres (durée normale du vol, ≈ 1,3 s) ; la caméra suit.
3. À l'atterrissage — éclat de ~60 particules or au-dessus de Londres (montée + fondu, 1,2 s) ; un marqueur Big Ben stylisé (SVG sprite) apparaît.
4. +0,5 s — le **billet** glisse depuis le bas : `LANDED` → `REVEALED`.

**Billet (recto)** : format 340 × 170 px (portrait) : bandeau or « EUROSTAR · BOARDING PASS », « PARIS GARE DU NORD → LONDON ST PANCRAS », « LONDRES » en Anton 34 px or, « 2 – 4 OCT 2026 », passagers « NANO & MIMI », un talon détachable à droite (perforation en pointillé) avec « SURPRISE » à la verticale. Contenu tiré du secret déchiffré, donc modifiable via `seal`.
**Billet (verso)** : même format, fond noir, liseré or, le message de Denis (Baskerville 14 px, crème, scrollable si long), signé « Mimi ». Tap sur le billet → retournement 3D CSS (`rotateY`, 600 ms). Un petit texte « touche le billet » apparaît une seule fois sous le billet.

Une fois `REVEALED`, la 8e pastille devient normale ; revenir en arrière puis revenir à Londres rejoue seulement l'arrivée du billet (pas les particules).

## 7. Verrou et chiffrement

### 7.1 Ce qui est publié
- `content.js` contient `codeHash` = hex de `SHA-256(salt + code)` et `codeSalt` (16 octets aléatoires, hex).
- `public/secret.enc` : JSON `{ v: 1, kdfSalt, iv, ciphertext }` (base64), où `ciphertext = AES-GCM-256(key, JSON du contenu)` et `key = PBKDF2-SHA256(code, kdfSalt, 200 000 itérations)`.
- Le contenu clair (`{ destination, dates, from, to, passengers, message }`) n'existe **nulle part** dans le repo.

### 7.2 Côté navigateur (`lib/crypto.js`)
- `hashCode(code, salt)` (SubtleCrypto `digest`) ; comparaison avec `codeHash`. Si égal → dérivation de clé et déchiffrement de `secret.enc` (fetch déjà fait au chargement). Si le déchiffrement échoue malgré le hash correct (fichier désynchronisé), message d'erreur clair en console et sur l'écran (« Le secret est corrompu, contacte Mimi »).
- Le contenu déchiffré est gardé en mémoire uniquement (jamais écrit en `localStorage`). Le code validé est copié dans `sessionStorage['nano.code']` (durée de vie : l'onglet). Au chargement, si `unlocked = 1` et que `sessionStorage` a le code, le secret est déchiffré silencieusement → l'arrivée à Londres donne directement `REVEALED`. Si le code n'est plus en session, l'arrivée donne `LOCKED(reentry)` : la carte demande « Entre à nouveau le code », et le bon code affiche le billet sans rejouer le vol. Ainsi la révélation est retrouvable pendant la lecture, mais jamais stockée en clair durablement.

### 7.3 `npm run seal` (`scripts/seal.mjs`, Node ≥ 20)
Pose les questions en ligne de commande : code (masqué), destination, dates, gares, passagers, message (multi-ligne, terminé par une ligne vide). Génère `codeSalt`, `codeHash`, `public/secret.enc`, et **réécrit uniquement les lignes `codeSalt`/`codeHash`** de `content.js`. Vérifie en relisant que le déchiffrement fonctionne avant d'écrire. Affiche un récapitulatif sans le code.

## 8. Contenu (`src/content.js`)

```js
export const title = "Le voyage de Nano";

export const stops = [
  { id: "paris",     name: "Paris",           sub: "Où tout a commencé",        dates: "Mars 2026",          lat: 48.8566, lon:   2.3522 },
  { id: "malaisie",  name: "Malaisie",        sub: "Kuala Lumpur · Langkawi",   dates: "Mai – juillet 2026", lat:  3.1390, lon: 101.6869 },
  { id: "bali",      name: "Bali",            sub: "",                          dates: "2026",               lat: -8.6500, lon: 115.2167 },
  { id: "japon",     name: "Japon",           sub: "",                          dates: "2026",               lat: 35.6762, lon: 139.6503 },
  { id: "shanghai",  name: "Shanghai",        sub: "",                          dates: "2026",               lat: 31.2304, lon: 121.4737 },
  { id: "retour",    name: "Retour à Paris",  sub: "",                          dates: "Juillet 2026",       lat: 48.8566, lon:   2.3522 },
  { id: "barcelone", name: "Barcelone",       sub: "",                          dates: "2026",               lat: 41.3874, lon:   2.1686 },
];

export const mystery = {
  hint: "Ton indice écrit ici.",
  codeLength: 6,
  waitPoint: { lat: 45, lon: -12 },
  destination: { lat: 51.5074, lon: -0.1278 },   // utilisé pour la position 3D seulement ; le nom vient du secret
};

export const codeSalt = "";   // rempli par `npm run seal`
export const codeHash = "";   // rempli par `npm run seal`

export const credits = "Globe : Jacobs Development · Avion : Poly by Google — CC BY";
```

Points ouverts à renseigner par Denis (valeurs `2026` et `sub: ""` ci-dessus) : dates exactes de Bali, Japon, Shanghai, Barcelone ; ville précise au Japon si ce n'est pas Tokyo ; l'indice ; le code.

Note : `mystery.destination` (lat/lon de Londres) est en clair dans `content.js` — des coordonnées brutes dans un fichier de code ne trahissent rien à une lectrice normale, et l'avion doit pouvoir voler vers la bonne position. Si Denis préfère, ce champ peut lui aussi être déplacé dans le secret (coût : nul, à décider à l'implémentation).

## 9. Responsive et performance

- Portrait mobile : canvas plein écran, carte en bas (max 40 % de hauteur), timeline juste au-dessus, chevrons sur les bords.
- Paysage / desktop : carte en colonne à droite (320 px), timeline en bas, le globe centré dans l'espace restant.
- `ResizeObserver` sur le conteneur ; `camera.aspect` et `fov` mis à jour ; `visualViewport` sur iOS pour ignorer la barre Safari.
- Budget : < 3 Mo transférés au total (globe 0,9 Mo + avion < 0,5 Mo + three ≈ 0,6 Mo gzip + polices), 60 fps sur iPhone récent, ≥ 30 fps sur iPhone de 2019.
- `prefers-reduced-motion` : vols ramenés à 0,4 s, particules désactivées, globe immobile.
- Pas de WebGL : message plein écran « Ton navigateur ne peut pas afficher le globe — essaie avec Safari ou Chrome. » (pas de fallback 2D).
- Textures/géométries `dispose()` non nécessaires (scène unique, pas de changement de page).

## 10. Vérification

### 10.1 Tests unitaires (vitest, `npm test`)
- `geo` : `latLonToVec3` renvoie des vecteurs unitaires ; Paris/Londres/KL ont les signes attendus ; `slerp(a, b, 0.5)` de Paris → Tokyo a une latitude > 55° (passe par la Sibérie) ; `arcPoint(t=0.5)` est à l'altitude `1 + lift`.
- `state` : séquence complète INTRO → … → LOCKED par `NEXT` ; `NEXT` ignoré pendant `FLYING` ; `GOTO` refusé vers une étape non visitée sauf la suivante ; `PREV` depuis `LOCKED` ramène à Barcelone ; `CODE_OK` → `UNLOCKING` → `LANDED` → `REVEALED` ; avec `unlocked = true` au départ, `NEXT` depuis Barcelone vole directement vers l'étape 7.
- `crypto` : `seal` (fonctions pures extraites de `scripts/seal.mjs`) puis `lib/crypto` : bon code → contenu identique ; mauvais code → rejet sans exception non gérée ; `codeHash` change si le sel change.

### 10.2 Vérification visuelle (navigateur intégré, émulation 375 × 812)
Captures à chaque jalon : accueil chargé, arrivée à Malaisie (carte + route), vol en cours (avion orienté, route qui se dessine), état verrouillé (« ? » + carte cachet), pavé numérique, révélation (billet recto puis verso). Plus une capture en paysage 812 × 375 et une en desktop 1440 × 900.

### 10.3 Test réel
Denis ouvre l'URL GitHub Pages sur son iPhone : fluidité, swipes, pavé, `?reset`.

## 11. Déploiement

- `vite.config.js` : `base: '/'`.
- `vercel.json` : preset Vite, sortie `dist/`, cache long sur `/models/`. Denis importe le repo dans Vercel (une fois) ; chaque push sur `main` construit et publie. Les tests ne tournent pas dans le pipeline Vercel : ils sont lancés localement avant chaque commit.
- URL finale : `https://nano-adventure.vercel.app/` — c'est elle que porte le QR de la p.42.
- Icône : `public/favicon.svg` (planète cartoon + anneau doré) et `public/apple-touch-icon.png` (180 × 180, fond bleu nuit), référencées dans `index.html`.

## 12. Ordre de construction (jalons)

1. **Squelette + déploiement** : Vite, `index.html`, canvas avec un cube, import Vercel → URL vivante.
2. **Globe** : chargement, recentrage, normalisation, éclairage, étoiles, mode `?debug` et calibration validée (marqueurs sur les 8 villes au bon endroit).
3. **Géo + route** : `lib/geo.js` testé, pointillé doré entre toutes les étapes.
4. **Avion + caméra** : vol animé le long d'un arc, caméra qui suit, inclinaison.
5. **Machine à états + navigation + UI d'étape** : `state.js` testé, swipe/flèches/clavier, carte d'étape, timeline.
6. **Verrou + secret** : `seal`, `crypto` testé, carte cachet, pavé numérique.
7. **Révélation** : séquence, particules, billet recto/verso, persistance.
8. **Accueil, responsive, polish, crédits** : écran d'intro, paysage/desktop, reduced-motion, captures finales.

## 13. Hors périmètre

- Son / musique (l'écran d'accueil ferait sauter le verrou audio si un jour on en veut ; rien de prévu).
- Photos ou textes longs par étape.
- Rotation libre du globe à la main.
- Lettre intime (livrée autrement ; le verso du billet porte un message court).
- Multi-langue, analytics, partage social.
