# /blancs

> Couper seulement les blancs d'un rush, pour finir le montage dans CapCut.

---

1. Fichier : `$ARGUMENTS`, ou la vidéo jointe à la conversation (copie-la d'abord dans `videos/a-monter/`), sinon liste `videos/a-monter/` et demande.
2. `node scripts/coupe-blancs.mjs -i <rush> --plan` et annonce le temps gagné et le nombre de coupes.
3. Lance la coupe vers `videos/en-cours/<nom>.coupe.mp4`.
4. Si l'utilisateur trouve le résultat trop haché ou trop lent, ajuste (voir `context/MONTAGE.md`) :
   - trop haché, mots mangés : `--marge 0.2` ou `--min 0.7`
   - encore des blancs : `--min 0.3`
   - coupes dans la voix (pièce bruyante) : `--seuil -30` ; voix coupée trop tôt (voix douce) : `--seuil -40`
5. Termine par :

```
Fichier prêt pour CapCut : videos/en-cours/<nom>.coupe.mp4
Dans CapCut : Nouveau projet > importe ce fichier > Texte > Sous-titres automatiques (langue : français).
```

Envoie le fichier coupé à l'utilisateur (outil SendUserFile). Propose de noter le réglage final dans `context/MONTAGE.md` s'il diffère du défaut.
