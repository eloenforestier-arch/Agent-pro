# Agent Pro

> L'agent de montage vidéo pour TikTok et Instagram Reels. Il coupe les blancs, ajoute les sous-titres, exporte au bon format et prépare la publication.

Il travaille avec **Catherine Poulain** (stratégie, idées, scripts) : Catherine dit quoi tourner, Agent Pro monte.

---

## Installation (une seule fois)

1. Installe **Node.js 22** ou plus récent : https://nodejs.org
2. Installe **ffmpeg** : sur Mac, `brew install ffmpeg` (Homebrew : https://brew.sh)
3. Ouvre ce dossier dans Claude Code (app Claude, onglet Code)

Vérification : `npm run verifier -- --help` doit afficher l'aide.

---

## Utilisation

1. Dépose ta vidéo (tournée à la verticale) dans `videos/a-monter/`
2. Lance `/monter`
3. Récupère les fichiers dans `videos/exports/` et publie depuis ton téléphone

| Commande | À quoi ça sert |
|----------|----------------|
| `/monter` | Montage complet : coupe, sous-titres, export, vérification, légende |
| `/blancs` | Couper seulement les blancs, pour finir dans CapCut |
| `/sous-titres` | Ajouter les sous-titres à une vidéo déjà coupée |
| `/export` | Exporter en 1080x1920 pour TikTok et Instagram, et vérifier |
| `/legende` | Légende, hashtags et couverture |

---

## Les scripts (utilisables sans Claude)

```bash
# Couper les blancs (--plan pour juste voir ce qui serait coupé)
node scripts/coupe-blancs.mjs -i videos/a-monter/ma-video.mov -o videos/en-cours/ma-video.coupe.mp4

# Repérer les "euh" et les mots bannis dans une transcription
node scripts/mots-a-surveiller.mjs -t videos/en-cours/ma-video/transcript.json

# Exporter pour TikTok et Instagram (+ image de couverture prise à 2 s)
node scripts/export-reseaux.mjs -i videos/en-cours/ma-video.coupe.mp4 -p les-deux --couverture 2

# Vérifier avant de publier (planche d'images avec les zones cachées par les applis)
node scripts/verifier.mjs -i videos/exports/ma-video.tiktok.mp4
```

Chaque script a une aide : `--help`.

---

## Structure

```
Agent-pro/
├── CLAUDE.md               # Le cerveau de l'agent
├── context/
│   ├── MONTAGE.md          # Ta charte de montage (format, rythme, sous-titres, son)
│   └── HISTORY.md          # Journal des vidéos montées
├── scripts/                # Coupe des blancs, export, vérification
├── videos/
│   ├── a-monter/           # Tes rushs (jamais modifiés)
│   ├── en-cours/           # Fichiers intermédiaires
│   └── exports/            # Vidéos prêtes à publier
├── .claude/commands/       # Les commandes /monter, /blancs...
└── .agents/skills/         # Skills HyperFrames (sous-titres, motion design, musique)
```

Les vidéos ne sont pas envoyées sur GitHub (trop lourdes).

---

## Bon à savoir

- **CapCut** n'a pas d'API : l'agent ne peut pas l'ouvrir à ta place. Utilise `/blancs` puis importe le fichier coupé dans CapCut si tu préfères y finir.
- **Publication** : l'agent ne poste rien lui-même. Il te donne le fichier, la légende et les hashtags.
- **iPhone** : désactive la Vidéo HDR (Réglages > Appareil photo > Formats) et laisse une seconde de silence avant de parler.
- Les skills HyperFrames viennent de `heygen-com/hyperframes`. Mise à jour : `npx hyperframes skills update`.
