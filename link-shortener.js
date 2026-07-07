const https = require('https');

/**
 * Shortens a URL using TinyURL.
 * @param {string} longUrl - The URL to shorten.
 * @returns {Promise<string>} - The shortened URL.
 */
async function shortenUrl(longUrl) {
  const url = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 && data.startsWith('http')) {
          resolve(data);
        } else {
          console.warn('Link shortening failed, using long URL.');
          resolve(longUrl);
        }
      });
    }).on('error', (err) => {
      console.error('Shortener Error:', err.message);
      resolve(longUrl);
    });
  });
}

module.exports = { shortenUrl };
