const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Downloads an image from a URL and saves it locally.
 * @param {string} url - The image URL.
 * @param {string} fileName - The name to save the file as.
 * @returns {Promise<string>} - The path to the saved image.
 */
async function downloadImage(url, fileName) {
  const postsDir = path.join(__dirname, 'posts');
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir);
  }

  // Sanitize filename
  const safeName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50) + '.jpg';
  const filePath = path.join(postsDir, safeName);

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(filePath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(filePath);
        });
      } else {
        res.resume();
        reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
}

module.exports = { downloadImage };
