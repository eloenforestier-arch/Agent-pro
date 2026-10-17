#!/usr/bin/env node
// Repère dans une transcription (mots horodatés) les tics de langage et les
// mots bannis, et donne les plages de temps à couper avec transcript-cut.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { hms } from "./lib/ffmpeg.mjs";

// Garde ces listes alignées avec context/MONTAGE.md.
const BANNIS = ["parfait", "pas de souci", "pas de soucis"];
const HESITATIONS = ["euh", "euhh", "heu", "hum", "hmm", "bah", "ben", "mmh"];

const { values: args } = parseArgs({
  options: {
    transcript: { type: "string", short: "t" },
    bannis: { type: "string" },
    hesitations: { type: "string" },
    marge: { type: "string", default: "0.05" },
    json: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: true,
});

if (args.help) {
  console.log(`mots-a-surveiller : liste les hésitations et mots bannis d'une transcription

Usage :
  node scripts/mots-a-surveiller.mjs -t videos/en-cours/rush.transcript.json

Options :
  -t, --transcript  Transcription JSON ({ words: [{ text, start, end }] } ou tableau)
  --bannis          Liste séparée par des virgules (défaut : ${BANNIS.join(", ")})
  --hesitations     Liste séparée par des virgules (défaut : ${HESITATIONS.join(", ")})
  --marge           Marge en secondes autour de chaque coupe (défaut 0.05)
  --json            Sortie JSON`);
  process.exit(0);
}

try {
  if (!args.transcript) throw new Error("--transcript est obligatoire");
  const data = JSON.parse(readFileSync(resolve(args.transcript), "utf8"));
  const mots = (Array.isArray(data) ? data : data.words ?? data.segments?.flatMap((s) => s.words ?? []) ?? [])
    .map((m) => ({ texte: normaliser(m.text ?? m.word ?? ""), brut: m.text ?? m.word ?? "", debut: Number(m.start), fin: Number(m.end) }))
    .filter((m) => m.texte && Number.isFinite(m.debut) && Number.isFinite(m.fin));

  const bannis = liste(args.bannis, BANNIS);
  const hesitations = liste(args.hesitations, HESITATIONS);
  const marge = Number(args.marge);
  const trouves = [];

  for (let i = 0; i < mots.length; i++) {
    for (const expression of bannis) {
      const parts = expression.split(" ");
      if (parts.every((p, k) => mots[i + k]?.texte === p)) {
        const fin = mots[i + parts.length - 1].fin;
        trouves.push({ type: "banni", texte: expression, debut: mots[i].debut, fin, contexte: contexte(mots, i, parts.length) });
      }
    }
    if (hesitations.includes(mots[i].texte)) {
      trouves.push({ type: "hesitation", texte: mots[i].texte, debut: mots[i].debut, fin: mots[i].fin, contexte: contexte(mots, i, 1) });
    }
  }

  const plages = trouves
    .filter((t) => t.type === "hesitation")
    .map((t) => `${Math.max(0, t.debut - marge).toFixed(2)}-${(t.fin + marge).toFixed(2)}`)
    .join(",");

  if (args.json) {
    console.log(JSON.stringify({ ok: true, trouves, removeHesitations: plages }));
  } else if (!trouves.length) {
    console.log("Rien à signaler : aucune hésitation ni mot banni.");
  } else {
    for (const t of trouves) {
      console.log(`${t.type === "banni" ? "BANNI " : "hésit."} ${hms(t.debut)}  « ${t.texte} »  …${t.contexte}…`);
    }
    if (plages) console.log(`\nPlages des hésitations (pour --remove) :\n${plages}`);
    if (trouves.some((t) => t.type === "banni")) {
      console.log("\nLes mots bannis ne sont pas coupés automatiquement : couper un mot au milieu d'une phrase peut la rendre bancale. Décide au cas par cas.");
    }
  }
} catch (err) {
  if (args.json) console.log(JSON.stringify({ ok: false, erreur: err.message }));
  else console.error(`erreur : ${err.message}`);
  process.exit(1);
}

function normaliser(t) {
  return String(t).toLowerCase().replace(/[’']/g, "'").replace(/[^\p{L}\p{N}' -]/gu, "").trim();
}

function liste(valeur, defaut) {
  return valeur ? valeur.split(",").map((v) => normaliser(v)).filter(Boolean) : defaut;
}

function contexte(mots, i, n) {
  return mots.slice(Math.max(0, i - 4), i + n + 4).map((m) => m.brut.trim()).join(" ");
}
