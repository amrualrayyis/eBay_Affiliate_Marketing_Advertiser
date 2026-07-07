require('dotenv').config({ override: true });
const eBayApi = require('ebay-api');
const { getDynamicModel } = require('./ai-model');

const ebay = new eBayApi({
  appId: process.env.EBAY_APP_ID,
  certId: process.env.EBAY_CERT_ID,
  sandbox: false,
  siteId: eBayApi.SiteId.EBAY_US,
});

async function searchBestHeadphone() {
  console.log('--- 🔍 Searching for the most COMFORTABLE Headset with BEST MIC for $50 ---');
  
  const campaignId = process.env.EBAY_CAMPAIGN_ID;
  const headers = campaignId ? { 'X-EBAY-C-ENDUSERCTX': `affiliateCampaignId=${campaignId}` } : {};

  try {
    const response = await ebay.buy.browse.search({ 
      q: 'wireless headset -earbuds -in-ear', 
      filter: 'price:[30..50],priceCurrency:USD',
      limit: 40 
    }, { headers });

    if (!response.itemSummaries || response.itemSummaries.length === 0) {
      console.log('No deals found.');
      return;
    }

    const items = response.itemSummaries;
    console.log(`Found ${items.length} items. Evaluating for physical comfort and mic clarity...`);

    let model;
    if (process.env.GEMINI_API_KEY) {
      model = await getDynamicModel();
    }

    let winner = items[0];
    if (model) {
      const selectionPrompt = `You are a tech advisor. A user is buying a headset for a woman who priorities:
      1. ALL-DAY PHYSICAL COMFORT (lightweight, soft pads, low clamping force).
      2. CRYSTAL-CLEAR MICROPHONE for long conversations.
      
      Budget is $50. High-end refurbished/used items are allowed and preferred for better hardware.
      Look for: SteelSeries (comfort), HyperX (padding), Sennheiser/EPOS (mic quality). Avoid heavy/bulky "gamer-aesthetic" headsets if possible, but prioritize comfort.
      
      List of items:
      ${items.map((item, idx) => `${idx + 1}. ${item.title} - Price: $${item.price.value} - Condition: ${item.condition}`).join('\n')}
      
      Respond with ONLY the number of the best item and a 1-sentence explanation of why it wins on COMFORT and MIC CLARITY specifically.
      Format: "Winner: [number] - [explanation]"`;

      const result = await model.generateContent(selectionPrompt);
      const text = result.response.text().trim();
      console.log('AI Evaluation:', text);

      const match = text.match(/Winner: (\d+)/);
      if (match) {
        const choice = parseInt(match[1]) - 1;
        if (choice >= 0 && choice < items.length) {
          winner = items[choice];
        }
      }
    }

    console.log('\n🏆 --- BEST COMFORT & MIC DEAL FOUND --- 🏆');
    console.log(`Title: ${winner.title}`);
    console.log(`Price: $${winner.price.value} ${winner.price.currency}`);
    console.log(`URL: ${winner.itemWebUrl}`);
    if (winner.image) {
      console.log(`Image: ${winner.image.imageUrl}`);
    }
    
  } catch (error) {
    console.error('Search Error:', error);
  }
}

searchBestHeadphone();
