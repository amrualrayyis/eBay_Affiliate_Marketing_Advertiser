const fs = require('fs');
const path = require('path');

/**
 * Generates a responsive HTML landing page from the CSV logs.
 */
function buildHub() {
  console.log('--- 🌐 Building littlniss Deals Hub ---');

  const logPath = path.join(__dirname, 'littlniss-deals-log.csv');
  if (!fs.existsSync(logPath)) {
    console.error('No logs found. Run the bot first!');
    return;
  }

  const rawContent = fs.readFileSync(logPath, 'utf8');
  const lines = rawContent.split('\n').filter(l => l.trim() !== '');
  
  // Advanced CSV Parser to handle nested quotes and JSON
  function parseCSVLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && line[i+1] === '"') { cur += '"'; i++; }
        else if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { result.push(cur); cur = ''; }
        else { cur += char; }
    }
    result.push(cur);
    return result;
  }

  const deals = lines.slice(1).reverse().slice(0, 12); 

  let dealCards = '';
  deals.forEach(line => {
    const parts = parseCSVLine(line);
    if (parts.length < 8) return;

    const [date, niche, title, price, currency, link, imagePath, imageUrl, blogPost, fullContentRaw] = parts;
    
    let pack = {};
    try { pack = JSON.parse(fullContentRaw || '{}'); } catch (e) {}

    const relativeImagePath = imagePath ? 'posts/' + path.basename(imagePath) : '';
    // Use public URL if available, fallback to local for display in hub
    const pinImage = imageUrl || relativeImagePath;

    dealCards += `
      <div class="card">
        <div class="niche-badge">${niche}</div>
        ${relativeImagePath ? `<img src="${relativeImagePath}" class="product-img" alt="${title}">` : '<div class="img-placeholder">Image coming soon</div>'}
        <div class="card-content">
            <h3>${title}</h3>
            <p class="price">${price} ${currency}</p>
            
            <div class="action-bar">
                <a href="${link}" class="btn btn-primary" target="_blank">Shop Now</a>
                <div class="pin-wrap">
                    <button class="btn btn-secondary" onclick="pinToPinterest('${link}', '${pinImage}', '${(pack.pinterest ? pack.pinterest.title : title).replace(/'/g, "\\'")}')">📌 Pin It</button>
                    <div class="board-hint">Board: <b>${pack.pinterest ? pack.pinterest.suggestedBoard : "littlniss Picks"}</b></div>
                </div>
            </div>

            <div class="ai-studio">
                <div class="studio-header">
                    <h4>✨ AI Creative Studio</h4>
                    <button class="gen-btn" onclick="alert('Runway/Midjourney API integration pending. Using prompts for manual generation...')">Generate AI Media</button>
                </div>
                <div class="prompt-box">
                    <label>Midjourney (Editorial Shot)</label>
                    <div class="copy-wrap">
                        <code id="mj-${date.replace(/\//g, '')}">${pack.midjourneyPrompt || "Prompt not available."}</code>
                        <button onclick="copyToClipboard('mj-${date.replace(/\//g, '')}')">Copy</button>
                    </div>
                </div>
                <div class="prompt-box">
                    <label>Runway (Video Reveal)</label>
                    <div class="copy-wrap">
                        <code id="rw-${date.replace(/\//g, '')}">${pack.runwayPrompt || "Prompt not available."}</code>
                        <button onclick="copyToClipboard('rw-${date.replace(/\//g, '')}')">Copy</button>
                    </div>
                </div>
                <div class="caption-box">
                    <label>TikTok / Reels Caption</label>
                    <p id="tk-${date.replace(/\//g, '')}">${pack.tiktok || "Caption coming soon."}</p>
                    <button class="small-copy" onclick="copyText('tk-${date.replace(/\//g, '')}')">Copy Caption</button>
                </div>
            </div>

            <div class="blog-preview">
                <p>${blogPost || "Click to explore this elegantly curated style set."}</p>
            </div>
            <div class="date">Featured on ${date}</div>
        </div>
      </div>
    `;
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>littlniss | Style Studio Hub</title>
    <style>
        :root { --primary: #6a5acd; --dark: #111; --light: #fdfdfd; --gray: #eee; }
        body { font-family: 'Georgia', serif; background: var(--light); color: #333; margin: 0; padding: 20px; line-height: 1.6; }
        header { text-align: center; padding: 60px 0; background: #fff; border-bottom: 1px solid var(--gray); margin-bottom: 50px; }
        h1 { font-family: 'Times New Roman', serif; color: var(--dark); margin: 0; font-size: 3.5em; font-weight: normal; letter-spacing: -2px; }
        p.subtitle { color: #666; font-size: 1em; margin-top: 10px; text-transform: uppercase; letter-spacing: 3px; }
        
        .container { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 30px; }
        .card { background: #fff; border: 1px solid var(--gray); transition: all 0.3s ease; position: relative; }
        .card:hover { transform: translateY(-5px); box-shadow: 0 15px 40px rgba(0,0,0,0.05); }
        
        .product-img { width: 100%; height: 300px; object-fit: cover; border-bottom: 1px solid #f9f9f9; }
        .niche-badge { position: absolute; top: 15px; left: 15px; padding: 4px 12px; background: var(--dark); color: #fff; font-size: 0.65em; text-transform: uppercase; font-weight: bold; z-index: 10; }
        
        .card-content { padding: 25px; }
        h3 { font-family: 'Times New Roman', serif; margin: 0 0 10px 0; font-size: 1.4em; color: var(--dark); height: 2.4em; overflow: hidden; }
        .price { font-size: 1.2em; color: var(--primary); margin-bottom: 15px; font-weight: bold; }
        
        .action-bar { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 25px; }
        .btn { padding: 10px; text-align: center; text-decoration: none; text-transform: uppercase; font-size: 0.75em; font-weight: bold; cursor: pointer; border: 1px solid var(--dark); transition: 0.2s; }
        .btn-primary { background: var(--dark); color: #fff; }
        .btn-secondary { background: #fff; color: var(--dark); }
        .btn:hover { opacity: 0.8; }

        .pin-wrap { display: flex; flex-direction: column; gap: 5px; }
        .board-hint { font-size: 0.6em; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
        .board-hint b { color: var(--primary); }

        .ai-studio { background: #f9f9fb; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px dashed #ccc; }
        .studio-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .gen-btn { background: var(--primary); color: #fff; border: none; padding: 5px 10px; font-size: 0.7em; cursor: pointer; text-transform: uppercase; font-weight: bold; }
        .ai-studio h4 { margin: 0; font-size: 0.85em; text-transform: uppercase; color: #777; }
        .prompt-box, .caption-box { margin-bottom: 15px; }
        .prompt-box label, .caption-box label { display: block; font-size: 0.7em; font-weight: bold; color: #999; margin-bottom: 5px; }
        .copy-wrap { display: flex; gap: 5px; align-items: center; }
        code { flex-grow: 1; font-size: 0.75em; background: #fff; padding: 5px; border: 1px solid #ddd; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
        .ai-studio button { font-size: 0.65em; padding: 4px 8px; background: #eee; border: 1px solid #ccc; cursor: pointer; }
        .ai-studio p { font-size: 0.8em; margin: 5px 0; font-style: italic; color: #444; }

        .blog-preview { font-size: 0.9em; color: #666; height: 4.5em; overflow: hidden; margin-bottom: 15px; }
        .date { font-size: 0.65em; color: #aaa; text-transform: uppercase; }
    </style>
    <script>
        function copyToClipboard(id) {
            const code = document.getElementById(id);
            navigator.clipboard.writeText(code.innerText);
            alert('Prompt copied!');
        }
        function copyText(id) {
            const text = document.getElementById(id);
            navigator.clipboard.writeText(text.innerText);
            alert('Caption copied!');
        }
        function pinToPinterest(url, img, desc) {
            const fullImgUrl = img.startsWith('http') ? img : (window.location.origin + '/' + img);
            const pinUrl = \`https://www.pinterest.com/pin/create/button/?url=\${encodeURIComponent(url)}&media=\${encodeURIComponent(fullImgUrl)}&description=\${encodeURIComponent(desc)}\`;
            window.open(pinUrl, '_blank');
        }
    </script>
</head>
<body>
    <header>
        <h1>littlniss</h1>
        <p class="subtitle">AI Creative Studio & Style Hub</p>
    </header>
    <div class="container">
        ${dealCards}
    </div>
    <footer>
        <p>&copy; 2026 littlniss Curator | Empowering Creators with AI</p>
    </footer>
</body>
</html>
  `;

  fs.writeFileSync('index.html', html);
  console.log('✅ index.html generated successfully!');
}

buildHub();
