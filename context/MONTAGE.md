# MONTAGE.md

> La charte de montage. L'agent la lit avant chaque vidéo et la met à jour quand un réglage est validé.

---

## La chaîne

- **Sujet :** l'intelligence artificielle et comment s'en servir
- **Audience :** 15 à 30 ans, jeunes entrepreneurs et curieux de l'IA
- **Plateformes :** TikTok d'abord, puis Instagram Reels
- **Ton :** direct, très pédagogique, énergique, audience tutoyée
- **Formats :** face caméra, voix off avec motion design, écran partagé (tutoriels)
- **Rythme de publication :** au moins une vidéo par jour, 2h30 à 3h par jour tournage et montage compris. Le montage doit donc être rapide : viser 30 à 45 minutes par vidéo.

---

## Format technique

| Réglage | Valeur | Pourquoi |
|---------|--------|----------|
| Résolution | 1080x1920 (9:16, vertical) | Format plein écran des deux applis |
| Images par seconde | 30 | Standard, fichiers plus légers que 60 |
| Codec | H.264, yuv420p, AAC 48 kHz | Accepté partout sans recompression bizarre |
| Volume | -14 LUFS | Niveau sonore standard des réseaux (LUFS = unité de volume perçu) |
| Durée TikTok | 20 à 60 s conseillé, 10 min max | |
| Durée Reels | 15 à 60 s conseillé, 3 min max | |

### Tournage à l'iPhone 16 (pour faciliter le montage)

- Filmer **à la verticale**, en 1080p ou 4K, **30 i/s**
- Désactiver la **Vidéo HDR** (Réglages > Appareil photo > Formats) : sinon couleurs délavées sur certains téléphones. L'export convertit quand même si on oublie.
- Laisser **1 seconde de silence** avant de parler et après la dernière phrase : la coupe est plus propre
- Une prise ratée ? Marquer une pause de 2 secondes et recommencer la phrase : la coupe des blancs isole la bonne prise, il ne reste qu'à supprimer la mauvaise

---

## Rythme et coupe

- **Accroche dans les 3 premières secondes** : la première image doit déjà parler. Aucun blanc au début.
- **Jump cut** (coupe sèche entre deux phrases, en enlevant le silence) : c'est le style par défaut
- Réglages de `coupe-blancs.mjs` :
  - `--seuil -35` (dB) : niveau sous lequel c'est un blanc
  - `--min 0.45` (s) : blanc le plus court qu'on coupe. Nerveux : 0.3
  - `--marge 0.12` (s) : garde un souffle avant et après chaque phrase
- **Hésitations à couper :** euh, heu, hum, bah, ben
- **Mots bannis** (à signaler, couper ou retourner) : "parfait", "pas de souci"
- **Fin :** pas de blanc final, terminer sur l'appel à l'action

---

## Sous-titres

- **Toujours** des sous-titres (beaucoup regardent sans le son)
- Style par défaut : `anchor` du skill `embedded-captions` (sous-titre propre, lisible). À valider sur la première vidéo, puis à noter ici.
- 1 à 2 lignes maximum, 3 à 5 mots par bloc
- Mots-clés mis en valeur (couleur d'accent) : outils IA, chiffres, résultats
- Corriger les noms d'outils mal transcrits (ChatGPT, Claude, Midjourney, CapCut, Notion...)

### Zones sûres (en pixels sur 1080x1920)

L'interface des applis cache une partie de l'image. Aucun texte important dedans :

- **Haut :** 220 px (onglets, recherche)
- **Bas :** 480 px (pseudo, légende, musique)
- **Droite :** 140 px (like, commentaire, partage)

`scripts/verifier.mjs` dessine ces zones en rouge sur la planche de contrôle.

---

## Son

- Voix normalisée à -14 LUFS (fait par l'export)
- Musique de fond : 18 à 22 dB sous la voix, baissée pendant la parole (ducking : la musique baisse automatiquement quand on parle)
- Bruitages (whoosh, pop) seulement sur les changements forts, pas à chaque coupe

---

## Identité visuelle

- **Police :** à définir
- **Couleurs (texte, accent) :** à définir
- **Logo / pseudo :** à définir
- **Créateurs de référence pour le style :** à venir

---

## Publication

- Légende courte : une phrase qui reprend la promesse + question pour faire commenter
- 3 à 5 hashtags ciblés (niche IA + format), pas de hashtags génériques en masse
- Couverture : image où le visage est net, avec le titre lisible dans la zone centrale
- Adapter la légende à chaque plateforme (TikTok plus direct, Instagram peut être un peu plus long)
