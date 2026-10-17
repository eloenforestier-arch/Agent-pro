#!/usr/bin/env node
// Coupe les blancs (silences) d'une vidéo face caméra, sans transcription.
// Détection par le niveau sonore (ffmpeg silencedetect), puis montage des
// passages parlés bout à bout (jump cut).
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { entree, ffmpeg, hms, sonder, sortie, verifierOutils } from "./lib/ffmpeg.mjs";

const { values: args } = parseArgs({
  options: {
    input: { type: "string", short: "i" },
    out: { type: "string", short: "o" },
    seuil: { type: "string", default: "-35" },
    min: { type: "string", default: "0.45" },
    marge: { type: "string", default: "0.12" },
    plan: { type: "boolean", default: false },
    json: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: true,
});

if (args.help) {
  console.log(`coupe-blancs : enlève les silences d'une vidéo (jump cut)

Usage :
  node scripts/coupe-blancs.mjs -i rush.mov -o videos/en-cours/rush.coupe.mp4

Options :
  -i, --input   Vidéo source
  -o, --out     Vidéo de sortie (défaut : <source>.coupe.mp4)
  --seuil       Niveau en dB sous lequel on considère que c'est un blanc (défaut -35).
                Pièce bruyante : -30. Voix douce ou micro loin : -40.
  --min         Durée minimale d'un blanc à couper, en secondes (défaut 0.45).
                Rythme TikTok nerveux : 0.3. Plus posé : 0.7.
  --marge       Marge gardée avant et après chaque phrase, en secondes (défaut 0.12),
                pour ne pas manger le début ou la fin des mots.
  --plan        Affiche seulement les passages gardés, sans encoder
  --json        Sortie au format JSON`);
  process.exit(0);
}

try {
  verifierOutils();
  const source = entree(args.input);
  const seuil = Number(args.seuil);
  const min = Number(args.min);
  const marge = Number(args.marge);
  const infos = sonder(source);
  if (!infos.aAudio) throw new Error("la vidéo n'a pas de piste audio : impossible de détecter les blancs");

  const silences = detecterSilences(source, seuil, min);
  const gardes = passagesGardes(silences, infos.duree, marge);
  const dureeGardee = gardes.reduce((t, [a, b]) => t + (b - a), 0);
  const resume = {
    source,
    dureeAvant: round(infos.duree),
    dureeApres: round(dureeGardee),
    gagne: round(infos.duree - dureeGardee),
    blancsCoupes: silences.length,
    passages: gardes.map(([a, b]) => [round(a), round(b)]),
  };

  if (args.plan) {
    afficher(resume);
    process.exit(0);
  }
  if (!gardes.length) throw new Error("aucune parole détectée : essaie un --seuil plus bas (ex : -45)");

  const out = sortie(args.out ?? source.replace(/\.[^.]+$/, "") + ".coupe.mp4");
  monter(source, gardes, out, infos.aVideo);
  afficher({ ...resume, sortie: out });
} catch (err) {
  if (args.json) console.log(JSON.stringify({ ok: false, erreur: err.message }));
  else console.error(`erreur : ${err.message}`);
  process.exit(1);
}

function detecterSilences(source, seuil, min) {
  const log = ffmpeg(
    ["-i", source, "-vn", "-af", `silencedetect=noise=${seuil}dB:d=${min}`, "-f", "null", "-"],
    { silencieux: true },
  );
  const silences = [];
  let debut = null;
  for (const ligne of log.split("\n")) {
    const s = ligne.match(/silence_start: (-?[\d.]+)/);
    if (s) debut = Math.max(0, Number(s[1]));
    const e = ligne.match(/silence_end: ([\d.]+)/);
    if (e && debut != null) {
      silences.push([debut, Number(e[1])]);
      debut = null;
    }
  }
  // Silence qui court jusqu'à la fin du fichier.
  if (debut != null) silences.push([debut, Infinity]);
  return silences;
}

function passagesGardes(silences, duree, marge) {
  const gardes = [];
  let curseur = 0;
  for (const [a, b] of silences) {
    const fin = Math.min(duree, a + marge);
    if (fin - curseur > 0.08) gardes.push([curseur, fin]);
    curseur = Math.max(curseur, Math.min(duree, b - marge));
  }
  if (duree - curseur > 0.08) gardes.push([curseur, duree]);
  // Fusionne les passages qui se chevauchent à cause des marges.
  const fusion = [];
  for (const p of gardes) {
    const last = fusion.at(-1);
    if (last && p[0] <= last[1] + 0.02) last[1] = Math.max(last[1], p[1]);
    else fusion.push([...p]);
  }
  // Un bout plus court que deux marges ne contient pas de parole.
  return fusion.filter(([a, b]) => b - a > 2 * marge + 0.05);
}

function monter(source, gardes, out, aVideo) {
  const expr = gardes.map(([a, b]) => `between(t,${a.toFixed(3)},${b.toFixed(3)})`).join("+");
  const filtres = [];
  if (aVideo) filtres.push(`[0:v]select='${expr}',setpts=N/FRAME_RATE/TB[v]`);
  filtres.push(`[0:a]aselect='${expr}',asetpts=N/SR/TB[a]`);
  const dir = mkdtempSync(join(tmpdir(), "coupe-blancs-"));
  const script = join(dir, "filtre.txt");
  writeFileSync(script, filtres.join(";\n"));
  try {
    ffmpeg([
      "-i", source,
      "-filter_complex_script", script,
      ...(aVideo ? ["-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p"] : []),
      "-map", "[a]", "-c:a", "aac", "-b:a", "192k",
      "-movflags", "+faststart",
      out,
    ], { silencieux: true });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function afficher(r) {
  if (args.json) {
    console.log(JSON.stringify({ ok: true, ...r }));
    return;
  }
  console.log(`Avant : ${hms(r.dureeAvant)}  Après : ${hms(r.dureeApres)}  Gagné : ${r.gagne.toFixed(1)} s`);
  console.log(`${r.blancsCoupes} blancs coupés, ${r.passages.length} passages gardés`);
  if (args.plan) for (const [a, b] of r.passages) console.log(`  garde ${hms(a)} -> ${hms(b)}`);
  if (r.sortie) console.log(`Vidéo : ${r.sortie}`);
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}
