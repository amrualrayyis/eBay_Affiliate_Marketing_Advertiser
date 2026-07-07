require('dotenv').config({ override: true });
const { getDynamicModel } = require('./ai-model');
const fs = require('fs');

/**
 * Updates the niche repository with specific, high-performing trends found during research.
 */
async function injectLiveTrends() {
  console.log('--- 🧠 Injecting Live Trends into littlniss ---');

  if (!process.env.GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY is required.');
    return;
  }

  const model = await getDynamicModel();

  // Live trends found via Google Search
  const liveTrends = `
    1. Modest Fashion: Butter Yellow color, Drop-waist Maxi Dresses, Linen Wide-leg Trousers.
    2. Teacher Supplies: Biophilic/Nature Classroom Decor (Eucalyptus, Faux Vines), Boho Plant themes.
    3. Viral Gadgets: NeeDoh Nice Cubes (fidget cubes), Personalized whiteboard erasers.
  `;

  const prompt = `
    You are a professional market researcher for 'littlniss'.
    Using these LIVE trends: "${liveTrends}", create 4 NEW eBay niches for the bot.
    
    Return ONLY a JSON array:
    [
      { "category": "Fashion", "name": "Niche Name", "query": "ebay query", "color": 12345, "branding": "Emoji + Branding" }
    ]
    
    Rules:
    - Target 'New' items only.
    - Use negative filters (-used -broken -parts).
    - Ensure 'littlniss' is in the branding.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawJson = response.text().match(/\[[\s\S]*\]/)[0];
    const newNiches = JSON.parse(rawJson);

    let existingNiches = JSON.parse(fs.readFileSync('niches.json', 'utf8'));

    newNiches.forEach(newNiche => {
      if (!existingNiches.find(n => n.name === newNiche.name)) {
        existingNiches.push(newNiche);
        console.log(`✨ Added Viral Niche: ${newNiche.name}`);
      }
    });

    fs.writeFileSync('niches.json', JSON.stringify(existingNiches, null, 2));
    console.log('✅ niches.json updated with latest trends.');

  } catch (error) {
    console.error('Trend Error:', error.message);
  }
}

injectLiveTrends();
