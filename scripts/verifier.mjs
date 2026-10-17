#!/usr/bin/env node
// Contrôle qualité d'un export avant publication : format, durée, volume,
// et planche d'images avec les zones masquées par l'interface TikTok / Reels.
import { basename, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { entree, ffmpeg, hms, sonder, sortie, verifierOutils } from "./lib/ffmpeg.mjs";

// Zones (en pixels sur 1080x1920) recouvertes par les boutons, la légende et
// le pseudo, en cumulant TikTok et Instagram. Garde-les alignées avec context/MONTAGE.md.
const ZONES = { haut: 220, bas: 480, droite: 140 };

const { values: args } = parseArgs({
  options: {
    input: { type: "string", short: "i" },
    dossier: { type: "string", short: "d", default: "videos/en-cours" },
    json: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: true,
});

if (args.help) {
  console.log(`verifier : contrôle une vidéo avant publication

Usage :
  node scripts/verifier.mjs -i videos/exports/rush.tiktok.mp4

Produit une planche de 9 images (<nom>.planche.jpg) avec, en rouge, les zones
cachées par l'interface des applis. Aucun texte important ne doit s'y trouver.`);
  process.exit(0);
}

try {
  verifierOutils();
  const source = entree(args.input);
  const infos = sonder(source);
  const problemes = [];
  if (infos.largeur !== 1080 || infos.hauteur !== 1920) problemes.push(`résolution ${infos.largeur}x${infos.hauteur} au lieu de 1080x1920`);
  if (infos.codecVideo !== "h264") problemes.push(`codec vidéo ${infos.codecVideo} (h264 attendu)`);
  if (infos.pixFmt !== "yuv420p") problemes.push(`format de pixels ${infos.pixFmt} (yuv420p attendu)`);
  if (!infos.aAudio) problemes.push("pas de son");
  if (infos.duree < 3) problemes.push("vidéo de moins de 3 secondes");

  let lufs = null;
  if (infos.aAudio) {
    const log = ffmpeg(["-i", source, "-vn", "-af", "ebur128", "-f", "null", "-"], { silencieux: true });
    const m = [...log.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].at(-1);
    lufs = m ? Number(m[1]) : null;
    if (lufs != null && (lufs < -17 || lufs > -11)) problemes.push(`volume ${lufs} LUFS (viser environ -14)`);
  }

  const planche = sortie(join(resolve(args.dossier), basename(source).replace(/\.[^.]+$/, "") + ".planche.jpg"));
  const pas = Math.max(infos.duree / 9, 0.1);
  const { haut, bas, droite } = ZONES;
  ffmpeg([
    "-i", source,
    "-vf",
    `fps=1/${pas.toFixed(3)},scale=1080:1920,` +
      `drawbox=x=0:y=0:w=iw:h=${haut}:color=red@0.35:t=fill,` +
      `drawbox=x=0:y=ih-${bas}:w=iw:h=${bas}:color=red@0.35:t=fill,` +
      `drawbox=x=iw-${droite}:y=${haut}:w=${droite}:h=ih-${haut + bas}:color=red@0.35:t=fill,` +
      `drawbox=x=0:y=${haut}:w=iw-${droite}:h=ih-${haut + bas}:color=white:t=4,` +
      `scale=360:640,tile=3x3:padding=6:color=white`,
    "-frames:v", "1", "-q:v", "3",
    planche,
  ], { silencieux: true });

  const r = {
    ok: problemes.length === 0,
    fichier: source,
    duree: Math.round(infos.duree * 100) / 100,
    resolution: `${infos.largeur}x${infos.hauteur}`,
    fps: Math.round(infos.fps * 100) / 100,
    lufs,
    tailleMo: Math.round((infos.taille / 1e6) * 10) / 10,
    planche,
    problemes,
  };
  if (args.json) console.log(JSON.stringify(r));
  else {
    console.log(`${r.resolution}, ${r.fps} i/s, ${hms(r.duree)}, ${r.tailleMo} Mo, son ${lufs ?? "?"} LUFS`);
    console.log(`Planche : ${planche}`);
    console.log(problemes.length ? problemes.map((p) => `problème : ${p}`).join("\n") : "Prêt à publier.");
  }
} catch (err) {
  if (args.json) console.log(JSON.stringify({ ok: false, erreur: err.message }));
  else console.error(`erreur : ${err.message}`);
  process.exit(1);
}
