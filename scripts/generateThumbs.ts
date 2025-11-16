import sharp from "sharp";
import fs from "fs";
import path from "path";

const BACKGROUNDS_DIR = path.join(process.cwd(), "public", "assets", "backgrounds");
const THUMBS_DIR = path.join(BACKGROUNDS_DIR, "thumbs");
const THUMB_WIDTH = 512;

async function generateThumbs() {
  console.log("🎨 Generating thumbnail images for media session...");

  // Get all biome directories
  const biomes = fs
    .readdirSync(BACKGROUNDS_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && dirent.name !== "thumbs")
    .map((dirent) => dirent.name);

  let totalProcessed = 0;
  let totalSkipped = 0;

  for (const biome of biomes) {
    const biomeDir = path.join(BACKGROUNDS_DIR, biome);
    const thumbBiomeDir = path.join(THUMBS_DIR, biome);

    // Create thumbs subdirectory
    if (!fs.existsSync(thumbBiomeDir)) {
      fs.mkdirSync(thumbBiomeDir, { recursive: true });
    }

    // Get all images in biome directory
    const images = fs
      .readdirSync(biomeDir)
      .filter((file) => /\.(jpg|jpeg|png)$/i.test(file));

    console.log(`\n📁 Processing ${biome} (${images.length} images)...`);

    for (const image of images) {
      const inputPath = path.join(biomeDir, image);
      const outputPath = path.join(thumbBiomeDir, image);

      // Skip if thumb already exists
      if (fs.existsSync(outputPath)) {
        totalSkipped++;
        continue;
      }

      try {
        await sharp(inputPath)
          .resize(THUMB_WIDTH, null, {
            withoutEnlargement: true,
            fit: "inside",
          })
          .jpeg({
            quality: 85,
            progressive: true,
          })
          .toFile(outputPath);

        totalProcessed++;
        process.stdout.write(`  ✓ ${image}\n`);
      } catch (error) {
        console.error(`  ✗ Failed to process ${image}:`, error);
      }
    }
  }

  console.log(`\n✨ Done! Processed ${totalProcessed} images, skipped ${totalSkipped} existing thumbs`);
}

generateThumbs().catch((error) => {
  console.error("Error generating thumbs:", error);
  process.exit(1);
});
