// Petites fonctions partagées autour de ffmpeg / ffprobe.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function verifierOutils() {
  for (const bin of ["ffmpeg", "ffprobe"]) {
    const r = spawnSync(bin, ["-version"], { stdio: "ignore" });
    if (r.status !== 0) {
      throw new Error(`${bin} introuvable. Installe-le (macOS : brew install ffmpeg).`);
    }
  }
}

export function entree(path) {
  if (!path) throw new Error("--input est obligatoire");
  const abs = resolve(path);
  if (!existsSync(abs)) throw new Error(`fichier introuvable : ${abs}`);
  return abs;
}

export function sortie(path) {
  const abs = resolve(path);
  mkdirSync(dirname(abs), { recursive: true });
  return abs;
}

export function sonder(path) {
  const json = execFileSync(
    "ffprobe",
    ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", path],
    { encoding: "utf8" },
  );
  const data = JSON.parse(json);
  const video = data.streams.find((s) => s.codec_type === "video");
  const audio = data.streams.find((s) => s.codec_type === "audio");
  let largeur = video?.width ?? 0;
  let hauteur = video?.height ?? 0;
  // Les vidéos iPhone portent souvent une rotation en métadonnées.
  const rotation = Math.abs(
    Number(video?.side_data_list?.find((d) => d.rotation != null)?.rotation ?? video?.tags?.rotate ?? 0),
  );
  if (rotation === 90 || rotation === 270) [largeur, hauteur] = [hauteur, largeur];
  const [num, den] = String(video?.avg_frame_rate ?? "0/1").split("/").map(Number);
  return {
    duree: Number(data.format.duration ?? 0),
    largeur,
    hauteur,
    fps: den ? num / den : 0,
    codecVideo: video?.codec_name ?? null,
    pixFmt: video?.pix_fmt ?? null,
    transfert: video?.color_transfer ?? null,
    codecAudio: audio?.codec_name ?? null,
    frequenceAudio: audio ? Number(audio.sample_rate) : null,
    aVideo: !!video,
    aAudio: !!audio,
    taille: Number(data.format.size ?? 0),
  };
}

export function ffmpeg(args, { silencieux = false } = {}) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-y", ...args], {
    stdio: silencieux ? ["ignore", "ignore", "pipe"] : "inherit",
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 256,
  });
  if (r.status !== 0) {
    throw new Error(`ffmpeg a échoué (code ${r.status})${r.stderr ? `\n${r.stderr.slice(-2000)}` : ""}`);
  }
  return r.stderr ?? "";
}

export function hms(secondes) {
  const s = Math.max(0, secondes);
  const m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(2).padStart(5, "0")}`;
}
