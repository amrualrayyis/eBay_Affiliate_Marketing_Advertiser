require('dotenv').config({ override: true });
const fs = require('fs');
const path = require('path');
const { getDynamicModel } = require('./ai-model');

async function buildNewsletter() {
  console.log('--- 📧 Building Weekly littlniss Style Digest ---');

  const model = await getDynamicModel();

  const logPath = path.join(__dirname, 'littlniss-deals-log.csv');
  if (!fs.existsSync(logPath)) {
    console.error('No logs found.');
    return;
  }

  const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(l => l.trim() !== '');
  const deals = lines.slice(1).reverse().slice(0, 5); // Get the top 5 "Winner" sets

  let dealRows = '';
  deals.forEach(line => {
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    if (!matches || matches.length < 7) return;
    const [date, niche, title, price, currency, link, imagePath] = matches.map(m => m.replace(/"/g, ''));
    const relImage = imagePath ? 'posts/' + path.basename(imagePath) : '';

    dealRows += `
      <tr>
        <td style="padding: 20px; background: #ffffff; border-radius: 10px; margin-bottom: 20px; display: block; border: 1px solid #eee;">
          <img src="${relImage}" width="100%" style="border-radius: 5px; margin-bottom: 15px;">
          <h3 style="font-family: serif; color: #111; margin: 0 0 10px 0;">${title}</h3>
          <p style="color: #666; font-size: 0.9em;">Niche: ${niche}</p>
          <p style="font-size: 1.2em; font-weight: bold; color: #6a5acd;">${price} ${currency}</p>
          <a href="${link}" style="display: inline-block; padding: 10px 20px; background: #111; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px; font-size: 0.8em; text-transform: uppercase;">Shop the Set</a>
        </td>
      </tr>
      <tr><td style="height: 20px;"></td></tr>
    `;
  });

  // Ask Gemini for the Editorial Intro
  let editorial = "Hello littlniss family! Here are our favorite elegant finds from this past week. We hope they bring a touch of style to your professional life.";
  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = "Write a warm, 3-sentence 'Curator's Note' for a weekly style newsletter for 'littlniss'. Focus on grace, value, and the transition into mid-May.";
      const result = await model.generateContent(prompt);
      editorial = result.response.text().trim();
    } catch (e) {}
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; }
  .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
  .header { padding: 40px 20px; text-align: center; background: #fff; border-bottom: 1px solid #eee; }
  .content { padding: 20px; }
  .footer { padding: 30px; text-align: center; font-size: 12px; color: #999; }
</style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1 style="font-family: serif; font-size: 32px; letter-spacing: -1px; margin: 0;">littlniss</h1>
      <p style="text-transform: uppercase; letter-spacing: 2px; color: #888; font-size: 10px;">The Weekly Style Digest</p>
    </div>
    <div class="content">
      <p style="font-style: italic; color: #555; line-height: 1.6; border-left: 3px solid #6a5acd; padding-left: 15px; margin-bottom: 40px;">"${editorial}"</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${dealRows}
      </table>
    </div>
    <div class="footer">
      <p>&copy; 2026 littlniss Curator | All Rights Reserved</p>
      <p>You are receiving this because you signed up for the littlniss Style Digest.</p>
      <p><small>* Commissions may be earned on purchases via links.</small></p>
    </div>
  </div>
</body>
</html>
  `;

  fs.writeFileSync('newsletter.html', html);
  console.log('✅ newsletter.html generated successfully!');
}

buildNewsletter();
