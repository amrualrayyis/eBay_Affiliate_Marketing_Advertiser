const { Jimp, loadFont } = require('jimp');
const { SANS_32_WHITE, SANS_16_WHITE, SANS_32_BLACK } = require('jimp/fonts');
const path = require('path');

/**
 * Returns the path to the original image (renamed for consistency) without overlays.
 */
async function brandImage(imagePath, price, isSale = false) {
  try {
    const image = await Jimp.read(imagePath);
    
    // Logic for overlays removed as requested (clean images only)

    const brandedPath = imagePath.replace('.jpg', '_branded.jpg');
    await image.write(brandedPath);
    return brandedPath;

  } catch (error) {
    console.error('Branding Error:', error.message);
    return imagePath;
  }
}

/**
 * Creates a side-by-side collage of two images.
 */
async function createCollage(path1, path2, price1, price2) {
  try {
    const img1 = await Jimp.read(path1);
    const img2 = await Jimp.read(path2);
    
    const height = 600;
    // Manually calculate width to maintain aspect ratio and avoid Jimp.AUTO/validation issues
    const w1 = Math.round(img1.width * (height / img1.height));
    const w2 = Math.round(img2.width * (height / img2.height));

    img1.resize({ w: w1, h: height });
    img2.resize({ w: w2, h: height });

    const canvas = new Jimp({ width: img1.width + img2.width + 10, height: height, color: 0xffffffff });
    canvas.composite(img1, 0, 0);
    canvas.composite(img2, img1.width + 10, 0);

    const font = await loadFont(SANS_32_BLACK);
    canvas.print({ font: font, x: 20, y: height - 50, text: "littlniss Style Set" });
    canvas.print({ font: font, x: canvas.width - 200, y: height - 50, text: `Total: $${(parseFloat(price1) + parseFloat(price2)).toFixed(2)}` });

    const brandedPath = path1.replace('.jpg', '_collage.jpg');
    await canvas.write(brandedPath);
    return brandedPath;
  } catch (error) {
    console.error('Collage Error:', error.message);
    return path1;
  }
}

/**
 * Adds a 'Social Proof' badge.
 */
async function addSocialProofBadge(image, text) {
  try {
    const badgeHeight = 40;
    const badgeWidth = 200;
    const badge = new Jimp({ width: badgeWidth, height: badgeHeight, color: 0xe67e22ff });
    const font = await loadFont(SANS_16_WHITE);
    
    badge.print({ font: font, x: 10, y: 10, text: text });
    image.composite(badge, 20, 20);
    return image;
  } catch (e) { return image; }
}

module.exports = { brandImage, createCollage, addSocialProofBadge };
