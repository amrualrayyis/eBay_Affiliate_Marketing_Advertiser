require('dotenv').config({ override: true });
const { getDynamicModel } = require('./ai-model');
const { sendDiscordWebhook } = require('./discord-notifier');

async function monitorCompetitors() {
  console.log('--- 🕵️ Starting Competitor Intelligence Scan ---');

  if (!process.env.GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY required.');
    return;
  }

  const model = await getDynamicModel();

  // Define niches to scan
  const targetNiches = ["Modest Fashion Pinterest 2026", "Top Teacher Influencers Instagram", "Aesthetic Home Decor Blogs"];

  let intelligenceData = "";

  // In a production environment, we would use a search tool here to get real URLs.
  // For this local build, we will use Gemini's knowledge to identify industry leaders and common strategies.
  
  const prompt = `
    You are a Strategic Analyst for 'littlniss'.
    Analyze the current landscape for these 3 areas: ${targetNiches.join(', ')}.
    
    1. Identify 2-3 'Industry Leaders' or top accounts.
    2. Analyze their current 'Winning Aesthetic' (colors, fonts, photo styles).
    3. Identify a 'Content Gap' (something they are missing that littlniss can provide).

    Write a 3-paragraph 'Competitor Intelligence Brief'.
    Keep it professional, data-driven, and actionable.
  `;

  try {
    const result = await model.generateContent(prompt);
    const brief = result.response.text().trim();

    const embed = {
      title: "🕵️ Weekly Competitor Intelligence Brief",
      description: brief,
      color: 15105570, // Orange
      footer: { text: "littlniss Market Intelligence" },
      timestamp: new Date().toISOString(),
    };

    await sendDiscordWebhook(embed);
    console.log('✅ Competitor Brief sent to Discord.');

  } catch (error) {
    console.error('Analysis Error:', error.message);
  }
}

monitorCompetitors();
