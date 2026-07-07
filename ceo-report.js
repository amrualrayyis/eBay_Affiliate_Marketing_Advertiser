require('dotenv').config({ override: true });
const fs = require('fs');
const { getDynamicModel } = require('./ai-model');
const { sendDiscordWebhook } = require('./discord-notifier');

async function generateCEOReport() {
  console.log('--- 📊 Generating Weekly CEO Report ---');

  const model = await getDynamicModel();

  const logPath = 'littlniss-deals-log.csv';
  if (!fs.existsSync(logPath)) {
    console.log('No logs found yet.');
    return;
  }

  const logs = fs.readFileSync(logPath, 'utf8').split('\n').slice(1).filter(line => line.trim() !== '');
  const totalDeals = logs.length;
  
  // Simple estimation: assume 5% commission on total value
  let totalValue = 0;
  let niches = {};

  logs.forEach(line => {
    const parts = line.split(',');
    if (parts.length < 4) return;
    const niche = parts[1].replace(/"/g, '');
    const price = parseFloat(parts[3]);
    
    totalValue += price;
    niches[niche] = (niches[niche] || 0) + 1;
  });

  const topNiche = Object.keys(niches).reduce((a, b) => niches[a] > niches[b] ? a : b);
  const estCommission = (totalValue * 0.05).toFixed(2);

  // Ask Gemini for a strategy note
  const prompt = `
    You are a Business Analyst for 'littlniss'.
    Weekly Stats:
    - Total Deals Found: ${totalDeals}
    - Most Active Niche: ${topNiche}
    - Total Value of Curated Items: $${totalValue.toFixed(2)}
    - Estimated Potential Commission (5%): $${estCommission}

    Write a 2-sentence 'CEO Strategy Note' suggesting one way to improve growth next week.
  `;

  let strategyNote = "Keep up the great work! Consistency is key to growing your audience.";
  if (process.env.GEMINI_API_KEY) {
    try {
      const result = await model.generateContent(prompt);
      strategyNote = result.response.text().trim();
    } catch (e) { console.error('AI Error in Report'); }
  }

  const embed = {
    title: "📈 Weekly littlniss CEO Report",
    description: `**Performance Summary**\n\n` +
                 `✅ **Total Deals Posted:** ${totalDeals}\n` +
                 `🔥 **Top Performing Niche:** ${topNiche}\n` +
                 `💰 **Est. Potential Earnings:** $${estCommission}\n\n` +
                 `💡 **CEO Strategy Note:**\n_${strategyNote}_`,
    color: 10181046, // Purple
    footer: { text: "littlniss Business Intelligence" },
    timestamp: new Date().toISOString(),
  };

  await sendDiscordWebhook(embed);
  console.log('✅ CEO Report sent to Discord.');
}

generateCEOReport();
