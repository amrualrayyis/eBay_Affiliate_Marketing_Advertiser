require('dotenv').config({ override: true });
const eBayApi = require('ebay-api');
const { getDynamicModel } = require('./ai-model');

const ebay = new eBayApi({
  appId: process.env.EBAY_APP_ID,
  certId: process.env.EBAY_CERT_ID,
  sandbox: false,
  siteId: eBayApi.SiteId.EBAY_US,
});

async function findBestWallet() {
  console.log('--- 🔍 Searching for a "NICE" Wallet for a Wife ---');
  
  const campaignId = process.env.EBAY_CAMPAIGN_ID;
  const headers = campaignId ? { 'X-EBAY-C-ENDUSERCTX': `affiliateCampaignId=${campaignId}` } : {};

  try {
    // Search for mini, compact, or card case wallets - New With Tags
    const response = await ebay.buy.browse.search({ 
      q: 'women (mini, compact, small, "card case") wallet (Coach, "Kate Spade", "Michael Kors", "Tory Burch") NWT', 
      filter: 'price:[30..150],priceCurrency:USD',
      limit: 50 
    }, { headers });

    if (!response.itemSummaries || response.itemSummaries.length === 0) {
      console.log('No compact wallets found.');
      return;
    }

    const items = response.itemSummaries;
    console.log(`Found ${items.length} compact wallets. Evaluating for security, card capacity, and style...`);

    let model;
    if (process.env.GEMINI_API_KEY) {
      model = await getDynamicModel();
    }

    let winners = [items[0]];
    if (model) {
      const selectionPrompt = `You are a personal shopper. A user wants a SMALL wallet for his wife for "going out" so it's less likely to be stolen (low profile/secure).
      It MUST hold cards and be from a "nice" brand (Coach, Kate Spade, Michael Kors, Tory Burch).
      All items are "New With Tags" (NWT).
      
      Criteria:
      1. COMPACTNESS: Must be small enough to fit in a small crossbody or even a pocket.
      2. SECURITY: Should have secure closures (zippers, snaps) and a low profile.
      3. CARD CAPACITY: Must clearly be able to hold multiple credit cards/ID.
      4. STYLE: Elegant and gift-worthy.
      
      List of items:
      ${items.map((item, idx) => `${idx + 1}. ${item.title} - Price: $${item.price.value}`).join('\n')}
      
      Respond with the top 3 best items. For each, provide the number and a 1-sentence explanation focusing on why it's perfect for a secure night out.
      Format:
      1. Winner: [number] - [explanation]
      2. Winner: [number] - [explanation]
      3. Winner: [number] - [explanation]`;

      const result = await model.generateContent(selectionPrompt);
      const text = result.response.text().trim();
      console.log('AI Evaluation:\n', text);

      const matches = [...text.matchAll(/Winner: (\d+)/g)];
      if (matches.length > 0) {
        winners = matches.map(match => {
          const choice = parseInt(match[1]) - 1;
          return items[choice];
        }).filter(item => item !== undefined);
      }
    }

    console.log('\n🎁 --- THE TOP 3 WALLET GIFTS FOUND --- 🎁');
    winners.slice(0, 3).forEach((winner, idx) => {
      console.log(`\nOption ${idx + 1}:`);
      console.log(`Title: ${winner.title}`);
      console.log(`Price: $${winner.price.value} ${winner.price.currency}`);
      console.log(`URL: ${winner.itemWebUrl}`);
      if (winner.image) {
        console.log(`Image: ${winner.image.imageUrl}`);
      }
    });
    
  } catch (error) {
    console.error('Search Error:', error);
  }
}

findBestWallet();
