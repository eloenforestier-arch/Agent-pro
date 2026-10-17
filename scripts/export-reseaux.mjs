#!/usr/bin/env node
// Exporte une vidéo au format TikTok / Instagram Reels :
// 1080x1920 (9:16), H.264 + AAC, son normalisé à -14 LUFS, HDR iPhone converti en SDR.
import { copyFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import { entree, ffmpeg, hms, sonder, sortie, verifierOutils } from "./lib/ffmpeg.mjs";

const LIMITES = { tiktok: 10 * 60, instagram: 3 * 60 };

const { values: args } = parseArgs({
  options: {
    input: { type: "string", short: "i" },
    plateforme: { type: "string", short: "p", default: "les-deux" },
    dossier: { type: "string", short: "d", default: "videos/exports" },
    nom: { type: "string" },
    cadrage: { type: "string", default: "auto" },
    fps: { type: "string", default: "30" },
    debut: { type: "string" },
    fin: { type: "string" },
    couverture: { type: "string" },
    "sans-normalisation": { type: "boolean", default: false },
    json: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: true,
});

if (args.help) {
  console.log(`export-reseaux : prépare la vidéo finale pour TikTok et Instagram

Usage :
  node scripts/export-reseaux.mjs -i videos/en-cours/rush.coupe.mp4 -p les-deux

Options :
  -i, --input          Vidéo montée
  -p, --plateforme     tiktok | instagram | les-deux (défaut)
  -d, --dossier        Dossier de sortie (défaut videos/exports)
  --nom                Nom de base des fichiers (défaut : nom de la source)
  --cadrage            auto (défaut) | remplir | flou
                         remplir : recadre au centre pour remplir l'écran 9:16
                         flou    : vidéo horizontale entière, fond flouté derrière
                         auto    : remplir si la source est verticale, flou sinon
  --fps                Images par seconde (défaut 30, 60 accepté)
  --debut / --fin      Garder seulement un extrait (en secondes)
  --couverture         Seconde à utiliser pour l'image de couverture (JPG)
  --sans-normalisation Ne pas normaliser le volume`);
  process.exit(0);
}

try {
  verifierOutils();
  const source = entree(args.input);
  const plateformes = args.plateforme === "les-deux" ? ["tiktok", "instagram"] : [args.plateforme];
  for (const p of plateformes) if (!LIMITES[p]) throw new Error(`plateforme inconnue : ${p}`);
  const fps = Number(args.fps);
  if (![24, 25, 30, 50, 60].includes(fps)) throw new Error("--fps doit valoir 24, 25, 30, 50 ou 60");

  const infos = sonder(source);
  if (!infos.aVideo) throw new Error("pas de piste vidéo dans ce fichier");
  const avertissements = [];
  const verticale = infos.largeur / infos.hauteur < 0.7;
  const cadrage = args.cadrage === "auto" ? (verticale ? "remplir" : "flou") : args.cadrage;
  if (!["remplir", "flou"].includes(cadrage)) throw new Error("--cadrage doit valoir auto, remplir ou flou");
  if (Math.min(infos.largeur, infos.hauteur) < 720) avertissements.push(`source en basse définition (${infos.largeur}x${infos.hauteur}) : l'image sera agrandie`);

  const hdr = ["arib-std-b67", "smpte2084"].includes(infos.transfert);
  const filtres = [];
  if (hdr) {
    if (aFiltre("zscale")) {
      filtres.push(
        "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv",
      );
    } else {
      avertissements.push("vidéo HDR (iPhone) mais ffmpeg sans zscale : couleurs possiblement délavées. Sur iPhone, Réglages > Appareil photo > Formats > désactive 'Vidéo HDR'.");
    }
  }
  const vid = filtres.length ? `${filtres.join(",")},` : "";
  const graphe =
    cadrage === "remplir"
      ? `[0:v]${vid}scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=${fps},format=yuv420p[v]`
      : `[0:v]${vid}split[f][p];` +
        `[f]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.08[fond];` +
        `[p]scale=1080:1920:force_original_aspect_ratio=decrease[premier];` +
        `[fond][premier]overlay=(W-w)/2:(H-h)/2,setsar=1,fps=${fps},format=yuv420p[v]`;

  const extrait = [];
  if (args.debut) extrait.push("-ss", args.debut);
  if (args.fin) extrait.push("-to", args.fin);

  const nom = args.nom ?? basename(source).replace(/\.[^.]+$/, "").replace(/\.coupe$/, "");
  const dossier = resolve(args.dossier);
  const principal = sortie(join(dossier, `${nom}.${plateformes[0]}.mp4`));

  ffmpeg([
    ...extrait, "-i", source,
    "-filter_complex", graphe,
    "-map", "[v]",
    ...(infos.aAudio ? ["-map", "0:a:0"] : []),
    "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "18",
    "-maxrate", "15M", "-bufsize", "30M",
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
    ...(infos.aAudio
      ? [
          ...(args["sans-normalisation"] ? [] : ["-af", "loudnorm=I=-14:TP=-1:LRA=11"]),
          "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
        ]
      : []),
    "-movflags", "+faststart",
    principal,
  ], { silencieux: true });

  const fichiers = [principal];
  for (const p of plateformes.slice(1)) {
    const copie = join(dossier, `${nom}.${p}.mp4`);
    copyFileSync(principal, copie);
    fichiers.push(copie);
  }

  const final = sonder(principal);
  for (const p of plateformes) {
    if (final.duree > LIMITES[p]) avertissements.push(`${p} : ${hms(final.duree)} dépasse la limite de ${hms(LIMITES[p])}`);
  }
  if (!infos.aAudio) avertissements.push("aucune piste audio");

  let couverture = null;
  if (args.couverture != null) {
    couverture = join(dossier, `${nom}.couverture.jpg`);
    ffmpeg(["-ss", args.couverture, "-i", principal, "-frames:v", "1", "-q:v", "2", couverture], { silencieux: true });
  }

  const resultat = {
    ok: true,
    fichiers,
    couverture,
    duree: Math.round(final.duree * 100) / 100,
    resolution: `${final.largeur}x${final.hauteur}`,
    fps: Math.round(final.fps * 100) / 100,
    cadrage,
    hdrConverti: hdr && aFiltre("zscale"),
    avertissements,
  };
  if (args.json) console.log(JSON.stringify(resultat));
  else {
    console.log(`Export ${resultat.resolution}, ${resultat.fps} i/s, ${hms(resultat.duree)} (cadrage : ${cadrage})`);
    for (const f of fichiers) console.log(`  ${f}`);
    if (couverture) console.log(`  couverture : ${couverture}`);
    for (const a of avertissements) console.log(`attention : ${a}`);
  }
} catch (err) {
  if (args.json) console.log(JSON.stringify({ ok: false, erreur: err.message }));
  else console.error(`erreur : ${err.message}`);
  process.exit(1);
}

function aFiltre(nom) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-filters"], { encoding: "utf8" });
  return new RegExp(`\\s${nom}\\s`).test(r.stdout ?? "");
}
