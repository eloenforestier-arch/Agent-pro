# /sous-titres

> Ajouter des sous-titres à une vidéo déjà coupée.

---

1. Fichier : `$ARGUMENTS`, sinon prends la dernière vidéo de `videos/en-cours/` et confirme.
2. Lis `context/MONTAGE.md` (style validé, couleurs, zones sûres).
3. Suis le skill `embedded-captions` :
   - transcription en français : `--model small --language fr`, jamais un modèle `.en`
   - relis la transcription et corrige les noms d'outils (ChatGPT, Claude, Midjourney...)
   - recommande 2 ou 3 styles du catalogue (le style validé en premier), laisse choisir
4. Vérifie avec `node scripts/verifier.mjs -i <résultat>` et regarde la planche : pas de texte dans les zones rouges.
5. Propose `/export` ensuite. Si un nouveau style est validé, propose de l'écrire dans `context/MONTAGE.md`.
