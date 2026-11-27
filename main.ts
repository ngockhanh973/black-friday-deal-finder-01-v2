// Deal Autopsy II — Price War: the hand-in program, Node 22, stdlib only.
//
// It hands the site in, in this order:
//   1. Finds the repository root from this file's own path on the command
//      line, and the output directory from MAKEFUN_OUTPUT_DIR (/output in
//      the grader).
//   2. Checks that app/ and screenshots/ exist and hold what the gate
//      expects (an index.html, and 3 or 4 screenshots).
//   3. Copies both folders into the output directory, file by file.
//   4. Writes /output/dossier.json with the kit's buildDossier, so the
//      judge's view of the site is exactly what the scorer rebuilds.
//
// Run locally like this:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { buildDossier } from "./vendor/makefun-frontend.ts";

// Node 22 loads a .ts file as ESM, where __dirname does not exist, so the
// repository root comes from this script's own path on the command line.
const scriptDir = dirname(resolve(process.argv[1] ?? "main.ts"));
const repoRoot = scriptDir;
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

function mustBeFolder(path, what) {
  if (!existsSync(path)) throw new Error(`missing ${what}: ${path}`);
  if (!statSync(path).isDirectory()) throw new Error(`${what} is not a folder: ${path}`);
}

function copyTree(from, to) {
  // Plain recursive copy: folders are created, files are copied one by
  // one, and nothing is generated or fetched while handing in.
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    const src = join(from, name);
    const dst = join(to, name);
    if (statSync(src).isDirectory()) copyTree(src, dst);
    else copyFileSync(src, dst);
  }
}

function handIn() {
  const siteDir = join(repoRoot, "app");
  const shotsDir = join(repoRoot, "screenshots");
  mustBeFolder(siteDir, "app/");
  mustBeFolder(shotsDir, "screenshots/");
  const indexPage = join(siteDir, "index.html");
  if (!existsSync(indexPage)) throw new Error("app/index.html is missing");
  const shotFiles = readdirSync(shotsDir).filter((name) => !name.startsWith("."));
  if (shotFiles.length < 3 || shotFiles.length > 4) {
    throw new Error(`expected 3 or 4 screenshots, found ${shotFiles.length}`);
  }

  mkdirSync(outDir, { recursive: true });
  copyTree(siteDir, join(outDir, "app"));
  copyTree(shotsDir, join(outDir, "screenshots"));

  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  });
  const dossierPath = join(outDir, "dossier.json");
  writeFileSync(dossierPath, dossier);

  // A short, deterministic summary on stdout so a local run can be
  // eyeballed: how many site files went in, and how big the dossier is.
  const siteFiles = readdirSync(siteDir);
  console.log(`Price War: ${siteFiles.length} app files, ${shotFiles.length} screenshots, dossier ${dossier.length} bytes -> ${dossierPath}`);
}

handIn();
