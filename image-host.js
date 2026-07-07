const fs = require('fs');

/**
 * Uploads a local image to ImgBB using their free API.
 * @param {string} imagePath - Path to the local image file.
 * @returns {Promise<string|null>} - The public URL of the uploaded image.
 */
async function uploadToImgBB(imagePath) {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ IMGBB_API_KEY missing in .env. Skipping upload.');
    return null;
  }

  try {
    const image = fs.readFileSync(imagePath);
    const base64Image = image.toString('base64');

    const formData = new URLSearchParams();
    formData.append('image', base64Image);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      console.log(`☁️ Image uploaded to ImgBB: ${data.data.url}`);
      return data.data.url;
    } else {
      console.error('ImgBB Upload Failed:', data.error.message);
      return null;
    }
  } catch (error) {
    console.error('ImgBB API Error:', error.message);
    return null;
  }
}

module.exports = { uploadToImgBB };
