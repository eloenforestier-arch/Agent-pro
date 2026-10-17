# /export

> Exporter une vidéo au format TikTok / Instagram Reels et la vérifier.

---

1. Fichier : `$ARGUMENTS`, sinon la dernière vidéo de `videos/en-cours/` (confirme).
2. Demande la plateforme si ce n'est pas clair (défaut : les deux).
3. `node scripts/export-reseaux.mjs -i <vidéo> -p les-deux --couverture <seconde>`
   - vidéo horizontale : fond flouté automatique ; propose `--cadrage remplir` si le sujet est bien centré
   - `--debut` / `--fin` pour ne garder qu'un extrait
4. `node scripts/verifier.mjs -i videos/exports/<nom>.tiktok.mp4` puis regarde la planche et la couverture (outil Read).
5. Rapporte les avertissements tels quels (durée trop longue, basse définition, volume) et propose la correction.
6. Ajoute une entrée dans `context/HISTORY.md`.
