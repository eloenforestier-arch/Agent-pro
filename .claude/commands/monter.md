# /monter

> Montage complet d'un rush : coupe des blancs, sous-titres, export TikTok + Instagram, vérification, légende.

---

## Étape 1 : Charger le contexte

Lis `CLAUDE.md`, `context/MONTAGE.md` et les dernières entrées de `context/HISTORY.md`.

## Étape 2 : Trouver le rush

Si `$ARGUMENTS` donne un fichier, utilise-le. Sinon liste `videos/a-monter/` et demande lequel monter. S'il est vide :

```
Dépose ta vidéo dans videos/a-monter/ (ou donne-moi son chemin), puis relance /monter.
```

## Étape 3 : Examiner

- `node scripts/verifier.mjs -i <rush>` puis regarde la planche (outil Read sur le JPG)
- Annonce en 3 lignes : durée, orientation (verticale ou horizontale), qualité du son, ce que tu vas faire

## Étape 4 : Couper

1. `node scripts/coupe-blancs.mjs -i <rush> --plan` : annonce le temps gagné
2. Si OK : `node scripts/coupe-blancs.mjs -i <rush> -o videos/en-cours/<nom>.coupe.mp4`
3. Transcris la version coupée : `npx hyperframes transcribe videos/en-cours/<nom>.coupe.mp4 --model small --language fr -d videos/en-cours/<nom>` (demande avant le premier téléchargement du modèle)
4. `node scripts/mots-a-surveiller.mjs -t videos/en-cours/<nom>/transcript.json`
5. Présente les hésitations et les mots bannis trouvés. Propose de couper les hésitations (et, au cas par cas, les mots bannis ou les prises ratées) avec `.agents/skills/media-use/scripts/transcript-cut.mjs --plan`, puis sans `--plan` après accord. Si quelque chose a été coupé, retranscris la nouvelle version.

## Étape 5 : Sous-titres

Demande si on sous-titre ici ou dans CapCut. Si ici, suis le skill `embedded-captions` sur la version coupée (style par défaut dans `context/MONTAGE.md`). Corrige les noms d'outils IA mal transcrits.

## Étape 6 : Export et vérification

1. `node scripts/export-reseaux.mjs -i <vidéo finale> -p les-deux --couverture <seconde où le visage est net>`
2. `node scripts/verifier.mjs -i videos/exports/<nom>.tiktok.mp4` et regarde la planche : aucun sous-titre dans les zones rouges
3. Corrige et réexporte si besoin

## Étape 7 : Livrer

```
Vidéo prête :
- TikTok : videos/exports/<nom>.tiktok.mp4
- Instagram : videos/exports/<nom>.instagram.mp4
- Couverture : videos/exports/<nom>.couverture.jpg
Durée : [avant] -> [après]
```

Puis enchaîne sur `/legende`, et ajoute une entrée dans `context/HISTORY.md`.

---

## Règles

- Ne touche jamais au rush original
- Une étape à la fois, avec validation avant les coupes qui enlèvent des mots
- Français, tutoiement, pas de tirets longs (em dashes), définis les termes techniques
