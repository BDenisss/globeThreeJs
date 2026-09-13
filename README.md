# Le voyage de Nano

Site secret 3D (three.js) : un avion rejoue le voyage étape par étape sur un globe cartoon ; la dernière étape est verrouillée par un code et révèle un billet.

## Modifier le contenu
Tout est dans `src/content.js` : titre, étapes (nom, sous-titre, dates, coordonnées), indice de l'étape mystère, longueur du code.

## Sceller le secret (code + billet + message)
```bash
npm install
npm run seal
```
Le script demande le contenu du billet, le message du verso et le code (masqué). Il écrit `public/secret.enc` (chiffré AES-GCM, clé dérivée du code par PBKDF2). Le code et le contenu en clair ne sont jamais enregistrés, et aucun hash du code n'est publié : seul le bon code déchiffre le fichier. Mets `mystery.codeLength` à la longueur du code choisi.

## Développer
```bash
npm run dev      # http://localhost:5173/
npm test         # tests unitaires
npm run build    # dossier dist/
```
`?debug` dans l'URL : marqueurs rouges sur les villes + rotation libre à la souris. `?reset` : efface le déverrouillage mémorisé.

## Déployer
Le repo est importé dans Vercel (preset Vite, sortie `dist/`) : chaque push sur `main` déclenche un build et une mise en ligne sur https://nano-adventure.vercel.app/

## Crédits
Globe : « Low Poly Planet Earth » par Jacobs Development (CC BY 4.0). Avion : « Airplane » par Poly by Google (CC BY 3.0).
