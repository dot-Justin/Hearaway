#!/usr/bin/env tsx
/**
 * Utility to convert legacy audio assets to Web-optimised OGG files.
 *
 * Usage:
 *   npx tsx scripts/convertAudioToOgg.ts [--dry-run] [--overwrite] [--delete-original] [--move-original]
 *
 * Requirements:
 *   - ffmpeg must be available on the system PATH.
 *
 * Notes:
 *   - By default existing .ogg files are left untouched and originals are kept.
 *   - Pass --overwrite to regenerate existing .ogg files.
 *   - Pass --delete-original to remove the source file after a successful conversion.
 *   - Pass --move-original to archive the source file under public/audio/.originals/.
 */

import { promises as fs } from "node:fs";
import { join, relative, parse } from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";

type CliFlags = {
  dryRun: boolean;
  overwrite: boolean;
  deleteOriginal: boolean;
  moveOriginal: boolean;
};

const PROJECT_ROOT = join(process.cwd());
const AUDIO_ROOT = join(PROJECT_ROOT, "public", "audio");
const TARGET_FOLDERS = ["animals", "city", "desert", "other", "thunder", "water", "wind"];
const SUPPORTED_INPUTS = new Set([".wav", ".mp3", ".flac", ".aif", ".aiff", ".m4a"]);
const OUTPUT_EXTENSION = ".ogg";
const DEFAULT_QUALITY = "6"; // High-quality Vorbis (approx ~192 kbps)
const ORIGINAL_ARCHIVE_ROOT = join(AUDIO_ROOT, ".originals");

type ConversionResult = {
  inputPath: string;
  outputPath: string;
  inputBytes: number;
  outputBytes: number;
  skipped: boolean;
};

async function ffmpegExists(): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = spawn("ffmpeg", ["-version"], { stdio: "ignore" });
    probe.once("error", () => resolve(false));
    probe.once("close", (code) => resolve(code === 0));
  });
}

function parseFlags(): CliFlags {
  const args = new Set(process.argv.slice(2));
  return {
    dryRun: args.has("--dry-run"),
    overwrite: args.has("--overwrite"),
    deleteOriginal: args.has("--delete-original"),
    moveOriginal: args.has("--move-original"),
  };
}

async function* walk(folder: string): AsyncGenerator<string> {
  const items = await fs.readdir(folder, { withFileTypes: true });
  for (const item of items) {
    const itemPath = join(folder, item.name);
    if (item.isDirectory()) {
      yield* walk(itemPath);
    } else if (item.isFile()) {
      yield itemPath;
    }
  }
}

function buildOutputPath(inputPath: string): string {
  const parsed = parse(inputPath);
  return join(parsed.dir, `${parsed.name}${OUTPUT_EXTENSION}`);
}

async function convertFile(
  inputPath: string,
  outputPath: string,
  flags: CliFlags
): Promise<ConversionResult> {
  const inputStats = await fs.stat(inputPath);

  if (flags.dryRun) {
    console.log(`[dry-run] ${relative(PROJECT_ROOT, inputPath)} -> ${relative(PROJECT_ROOT, outputPath)}`);
    return {
      inputPath,
      outputPath,
      inputBytes: inputStats.size,
      outputBytes: 0,
      skipped: true,
    };
  }

  await fs.mkdir(parse(outputPath).dir, { recursive: true });

  await new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn(
      "ffmpeg",
      [
        "-y",
        "-i",
        inputPath,
        "-c:a",
        "libvorbis",
        "-qscale:a",
        DEFAULT_QUALITY,
        outputPath,
      ],
      { stdio: "inherit" }
    );

    ffmpeg.once("error", (err) => reject(err));
    ffmpeg.once("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });

  if (flags.deleteOriginal) {
    await fs.unlink(inputPath);
  } else if (flags.moveOriginal) {
    const relativePath = relative(AUDIO_ROOT, inputPath);
    const archivePath = join(ORIGINAL_ARCHIVE_ROOT, relativePath);
    await fs.mkdir(parse(archivePath).dir, { recursive: true });
    await fs.rename(inputPath, archivePath);
  }

  const outputStats = await fs.stat(outputPath);

  return {
    inputPath,
    outputPath,
    inputBytes: inputStats.size,
    outputBytes: outputStats.size,
    skipped: false,
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

async function main() {
  const flags = parseFlags();

  if (flags.deleteOriginal && flags.moveOriginal) {
    throw new Error("Flags --delete-original and --move-original cannot be used together.");
  }

  if (!(await ffmpegExists())) {
    throw new Error(
      "ffmpeg is required but was not found on PATH. Please install ffmpeg before running this script."
    );
  }

  const conversions: Array<{ input: string; output: string }> = [];

  for (const folder of TARGET_FOLDERS) {
    const folderPath = join(AUDIO_ROOT, folder);
    try {
      for await (const filePath of walk(folderPath)) {
        const ext = parse(filePath).ext.toLowerCase();

        if (!SUPPORTED_INPUTS.has(ext)) {
          continue;
        }

        const outputPath = buildOutputPath(filePath);

        if (!flags.overwrite) {
          try {
            await fs.access(outputPath);
            // Output exists and overwrite disabled; skip.
            continue;
          } catch {
            // file does not exist -> convert
          }
        }

        conversions.push({ input: filePath, output: outputPath });
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        continue; // Folder missing, skip gracefully.
      }
      throw error;
    }
  }

  if (conversions.length === 0) {
    console.log("No convertible audio files found.");
    return;
  }

  let modeDescription = "keeping originals";
  if (flags.deleteOriginal) {
    modeDescription = "deleting originals";
  } else if (flags.moveOriginal) {
    modeDescription = `moving originals to ${relative(PROJECT_ROOT, ORIGINAL_ARCHIVE_ROOT)}`;
  }

  console.log(
    `Converting ${conversions.length} file(s) to OGG (${flags.dryRun ? "dry-run" : modeDescription})`
  );

  const results: ConversionResult[] = [];

  for (const { input, output } of conversions) {
    console.log(`${relative(PROJECT_ROOT, input)} -> ${relative(PROJECT_ROOT, output)}`);
    const result = await convertFile(input, output, flags);
    results.push(result);
  }

  if (results.length > 0) {
    const processed = results.filter((r) => !r.skipped);
    const skipped = results.filter((r) => r.skipped);

    if (flags.dryRun) {
      const totalInput = results.reduce((sum, r) => sum + r.inputBytes, 0);
      console.log(
        `Dry-run summary: ${results.length} candidate file(s), ${formatBytes(totalInput)} of source audio.`
      );
    } else {
      const totalInput = processed.reduce((sum, r) => sum + r.inputBytes, 0);
      const totalOutput = processed.reduce((sum, r) => sum + r.outputBytes, 0);
      const saved = totalInput - totalOutput;
      const percent = totalInput > 0 ? ((saved / totalInput) * 100).toFixed(1) : "0.0";

      console.log("Conversion summary:");
      console.log(`  Converted: ${processed.length}`);
      console.log(`  Skipped:   ${skipped.length}`);
      console.log(`  Source:    ${formatBytes(totalInput)}`);
      console.log(`  Output:    ${formatBytes(totalOutput)}`);
      console.log(`  Saved:     ${formatBytes(saved)} (${percent}%)`);
    }
  }

  console.log("Conversion complete.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

