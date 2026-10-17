# /legende

> Préparer la publication : légende, hashtags et couverture pour TikTok et Instagram.

---

1. Lis la transcription de la vidéo (`videos/en-cours/<nom>/transcript.json`) ou demande de quoi parle la vidéo. Relis la section Publication de `context/MONTAGE.md`.
2. Propose :

```
### TikTok
Légende : [1 phrase qui reprend la promesse + 1 question pour faire commenter]
Hashtags : [3 à 5]

### Instagram
Légende : [2 à 3 phrases, plus de contexte, appel à l'action : enregistre / partage]
Hashtags : [3 à 5]

### Couverture
Seconde conseillée : [t] (visage net, expression forte)
Texte de couverture : [3 à 5 mots]
```

3. Si l'utilisateur veut une autre couverture : `node scripts/export-reseaux.mjs` n'est pas à relancer, extrais simplement l'image :
   `ffmpeg -ss <t> -i videos/exports/<nom>.tiktok.mp4 -frames:v 1 -q:v 2 videos/exports/<nom>.couverture.jpg`
4. Rappelle comment publier :
   - envoie les fichiers sur ton iPhone (AirDrop ou iCloud Drive)
   - TikTok : + > Importer > choisis `<nom>.tiktok.mp4`, colle la légende
   - Instagram : + > Reel > choisis `<nom>.instagram.mp4`, Modifier la couverture > Ajouter depuis la pellicule

## Règles

- Accroches concrètes, jamais génériques. Mots bannis interdits ("parfait", "pas de souci")
- Français, tutoiement, pas de tirets longs (em dashes)
