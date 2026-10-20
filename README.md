# SpoolTracker – appli Mac (hors ligne)

Version locale de SpoolTracker pour Mac à puce Apple (M1 à M4). Tout tourne sur le Mac, sans compte ni Internet.
Le site en ligne (Next.js + Supabase) vit sur la branche `main` et n'est pas concerné par ce dossier.

## Comment ça marche

- **Electron** ouvre une fenêtre et lance en interne le serveur Next.js (`electron/main.js`).
- **Données** : un seul fichier `data.json` dans `~/Library/Application Support/SpoolTracker/` (`lib/db.ts`).
  - Une copie par jour d'utilisation va dans `sauvegardes/` (30 conservées).
  - Menu SpoolTracker → *Ouvrir le dossier des données* pour y accéder.
- **Export / import** : onglet Config → *Sauvegarde des données*.
- **Mises à jour** : au démarrage, l'appli regarde les Releases GitHub dont le tag commence par `app-v`. Si une version plus récente existe, elle propose de télécharger le `.dmg`.

## Développer

```bash
npm install
npm run dev     # interface dans le navigateur, données dans ./.data
npm run app     # compile puis ouvre la vraie fenêtre Electron
```

`npm run dist:test` produit une version de test non installée pour l'OS courant, dans `dist/`.

## Publier une nouvelle version

Le `.dmg` est compilé sur un Mac de GitHub Actions (`.github/workflows/release-mac.yml`) quand on pousse un tag `app-v…` :

```bash
git tag -a app-v1.1.0 -m "Ce qui change, en une ou deux lignes"
git push origin app-v1.1.0
```

- Le numéro du tag devient la version de l'appli.
- Le message du tag s'affiche dans la fenêtre « Nouvelle version disponible ».
- Le suivi de la compilation se fait dans l'onglet *Actions* du dépôt GitHub (environ 5 min).

## Installer sur le Mac (première fois)

1. Télécharger `SpoolTracker-x.y.z-arm64.dmg` depuis les Releases GitHub, l'ouvrir et glisser SpoolTracker dans Applications.
2. Au premier lancement, macOS bloque l'appli car elle n'est pas signée par Apple.
   Aller dans *Réglages Système → Confidentialité et sécurité*, descendre jusqu'à « SpoolTracker a été bloqué » et cliquer sur *Ouvrir quand même*.
3. Si macOS dit que l'appli « est endommagée », taper dans le Terminal :
   `xattr -cr /Applications/SpoolTracker.app`

## Récupérer les données de l'ancienne version en ligne

1. Si le projet Supabase est en pause, le réactiver depuis le tableau de bord Supabase (*Restore project*).
2. Ajouter dans le `.env.local` du site (`../gestion-bobines/.env.local`) la clé `SUPABASE_SERVICE_ROLE_KEY`, à trouver dans Supabase → Project Settings → API Keys.
3. Depuis ce dossier, lancer le script ci-dessous. Sans pseudo, il liste les comptes existants.
   ```bash
   node --env-file=../gestion-bobines/.env.local scripts/export-supabase.mjs <pseudo>
   ```
4. Dans l'appli : Config → *Importer un fichier* → choisir le `export-<pseudo>-<date>.json` créé.
