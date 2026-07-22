import sharp from "sharp";

await sharp("public/deity-hero.png")
  .resize({
    width:1600,
    withoutEnlargement:true
  })
  .avif({
    quality:55,
    effort:6
  })
  .toFile("public/deity-hero.avif");

console.log("AVIF generated");
