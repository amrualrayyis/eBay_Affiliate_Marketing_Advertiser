require('dotenv').config({ override: true });
const eBayApi = require('ebay-api');
const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');
const { sendDiscordWebhook } = require('./discord-notifier');
const { generateContentPack } = require('./ai-stylist');
const { logDealToCSV } = require('./csv-logger');
const { downloadImage } = require('./image-downloader');
const { brandImage, createCollage, addSocialProofBadge } = require('./branding-engine');
const { shortenUrl } = require('./link-shortener');
const { logToBulkScheduler } = require('./bulk-scheduler');
const { uploadToImgBB } = require('./image-host');


const { getDynamicModel } = require('./ai-model');

const ebay = new eBayApi({
  appId: process.env.EBAY_APP_ID,
  certId: process.env.EBAY_CERT_ID,
  sandbox: false,
  siteId: eBayApi.SiteId.EBAY_US,
});

async function runDynamicBot() {
  console.log('--- 🤖 Starting littlniss Multi-Platform Bot ---');
  
  const campaignId = process.env.EBAY_CAMPAIGN_ID;

  // Initialize Gemini if key is present
  let model;
  if (process.env.GEMINI_API_KEY) {
    model = await getDynamicModel();
  }

  // 1. Load Niches
  let nicheRepository = JSON.parse(fs.readFileSync('niches.json', 'utf8'));

  // 2. Load Memory
  let postedItems = fs.existsSync('posted-items.json') ? JSON.parse(fs.readFileSync('posted-items.json', 'utf8')) : [];

  // --- WEEKLY CONTENT CALENDAR LOGIC ---
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  let activeCategory = 'Random';

  if (today === 'Monday') activeCategory = 'Professional';
  if (today === 'Tuesday') activeCategory = 'Tech';
  if (today === 'Wednesday') activeCategory = 'Home';
  if (today === 'Thursday') activeCategory = 'Learning';
  if (today === 'Friday') activeCategory = 'Fashion';

  console.log(`📅 Today is ${today}. Active Theme: ${activeCategory}`);

  let dailyNiches = [];
  const limit = 10; // Increased to 10 deals per iteration
  
  if (activeCategory === 'Random' || today === 'Saturday' || today === 'Sunday') {
    dailyNiches = nicheRepository.sort(() => 0.5 - Math.random()).slice(0, limit);
  } else {
    dailyNiches = nicheRepository.filter(n => n.category === activeCategory);
    if (dailyNiches.length > limit) dailyNiches = dailyNiches.slice(0, limit);
    if (dailyNiches.length < limit) {
        const fillers = nicheRepository.filter(n => n.category !== activeCategory).sort(() => 0.5 - Math.random());
        dailyNiches = [...dailyNiches, ...fillers.slice(0, limit - dailyNiches.length)];
    }
  }

  for (const niche of dailyNiches) {
    console.log(`\n--- ${niche.name} ---`);

    try {
      const headers = campaignId ? { 'X-EBAY-C-ENDUSERCTX': `affiliateCampaignId=${campaignId}` } : {};
      const response = await ebay.buy.browse.search({ q: niche.query, filter: 'conditionIds:{1000}', limit: 10 }, { headers });

      if (!response.itemSummaries || response.itemSummaries.length === 0) continue;

      const freshItems = response.itemSummaries.filter(i => !postedItems.includes(i.itemId)).slice(0, 5);
      if (freshItems.length === 0) {
        console.log(`No NEW deals for ${niche.name} today.`);
        continue;
      }

      console.log(`🧠 AI is evaluating the top ${freshItems.length} items...`);
      let winner = freshItems[0];
      if (process.env.GEMINI_API_KEY && model) {
        try {
          const selectionPrompt = `Which of these is the best fit for littlniss? (Return ONLY number 1-5):\n${freshItems.map((item, idx) => `${idx + 1}. ${item.title} ($${item.price.value})`).join('\n')}`;
          const result = await model.generateContent(selectionPrompt);
          const choice = parseInt(result.response.text().trim().replace(/[^0-9]/g, '')) - 1;
          if (choice >= 0 && choice < freshItems.length) winner = freshItems[choice];
        } catch (e) { console.error('AI selection failed.'); }
      }
      const item = winner;

      // --- GENERATE CONTENT PACK ---
      let pack = await generateContentPack(item.title, niche.name);

      // --- GENERATE EVERGREEN SEARCH LINK ---
      // We use the item title to create a search link that stays active even if the item sells out.
      // We removed the double quotes to allow eBay's fuzzy matching to find similar items if needed.
      const encodedTitle = encodeURIComponent(item.title);
      const evergreenBaseUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodedTitle}&LH_BIN=1&LH_ItemCondition=1000`;
      
      // Add affiliate tracking to the search link
      const trackingUrl = campaignId ? `${evergreenBaseUrl}&mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=${campaignId}&toolid=20008&customid=littlniss-evergreen&mkevt=1` : evergreenBaseUrl;
      
      const moneyLink1 = await shortenUrl(trackingUrl);

      // --- DOWNLOAD & BRAND ASSETS ---
      let finalImagePath = 'Not saved';
      try {
        const path1 = await downloadImage(item.image.imageUrl, `frame1_${item.itemId}`);
        const brandedPath1 = await brandImage(path1, `${item.price.value} ${item.price.currency}`);
        finalImagePath = brandedPath1;
      } catch (e) { console.error('Visual Engine Error:', e.message); }

      // --- POST TO DISCORD ---
      const vStory = pack.videoStoryboard || { hook: "Style Check!", slide1: "Item 1", slide2: "Item 2", slide3: "Final", cta: "Link in bio" };
      const embed = {
        title: (pack.pinterest && pack.pinterest.title) ? pack.pinterest.title : item.title,
        url: moneyLink1,
        color: niche.color,
        image: { url: item.image.imageUrl },
        description: `**Pinterest:** ${pack.pinterest ? pack.pinterest.desc : "Elegant style pick"}\n` +
                     `🏷️ **Alt-Text:** *${pack.pinterest ? pack.pinterest.altText : "Stylish find"}*\n` +
                     `📌 **Board:** \`${pack.pinterest ? pack.pinterest.suggestedBoard : "littlniss Picks"}\`\n\n` +
                     `**Instagram:** ${pack.instagram}\n\n` +
                     `💬 **Engagement:** *${pack.engagementQuestion}*\n\n` +
                     `🎬 **Reels Storyboard:**\n` +
                     `🪝 **Hook:** ${vStory.hook}\n` +
                     `1️⃣ **Scene 1:** ${vStory.slide1}\n` +
                     `2️⃣ **Scene 2:** ${vStory.slide2}\n` +
                     `3️⃣ **Scene 3:** ${vStory.slide3}\n` +
                     `🚀 **CTA:** ${vStory.cta}\n\n` +
                     `🔗 [View Item on eBay](${moneyLink1})`,
        footer: { text: `littlniss Curation Engine | ${niche.name}` }
      };

      await sendDiscordWebhook(embed);

      // --- LOG FOR BULK SCHEDULER ---
      logToBulkScheduler({
        caption: pack.instagram,
        link: moneyLink1,
        imageUrl: item.image.imageUrl
      });

      // --- UPLOAD TO HOST ---
      let hostedImageUrl = null;
      if (finalImagePath !== 'Not saved') {
        hostedImageUrl = await uploadToImgBB(finalImagePath);
      }

      logDealToCSV({
        nicheName: niche.name,
        title: item.title,
        price: parseFloat(item.price.value).toFixed(2),
        currency: item.price.currency,
        link: moneyLink1,
        imagePath: finalImagePath,
        imageUrl: hostedImageUrl,
        blogPost: pack.blogPost,
        fullContent: pack
      });

      postedItems.push(item.itemId);
      fs.writeFileSync('posted-items.json', JSON.stringify(postedItems.slice(-500), null, 2));
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) { console.error(err.message); }
  }

  try {
    const { execSync } = require('child_process');
    execSync('node build-hub.js');
  } catch (e) {}
}

runDynamicBot();
