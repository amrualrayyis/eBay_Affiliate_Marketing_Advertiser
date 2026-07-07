require('dotenv').config({ override: true });
const eBayApi = require('ebay-api');
const fs = require('fs');
const { sendDiscordWebhook } = require('./discord-notifier');

const ebay = new eBayApi({
  appId: process.env.EBAY_APP_ID,
  certId: process.env.EBAY_CERT_ID,
  sandbox: false,
  siteId: eBayApi.SiteId.EBAY_US,
});

async function runPriceWatchdog() {
  console.log('--- 🛡️ Starting Price Watchdog ---');

  let watchlist = [];
  try {
    if (fs.existsSync('watchlist.json')) {
      watchlist = JSON.parse(fs.readFileSync('watchlist.json', 'utf8'));
    }
  } catch (e) {
    console.log('Watchlist is empty or invalid.');
    return;
  }

  if (watchlist.length === 0) {
    console.log('No items to watch.');
    return;
  }

  const campaignId = process.env.EBAY_CAMPAIGN_ID;

  for (let i = 0; i < watchlist.length; i++) {
    const watchItem = watchlist[i];
    console.log(`Checking price for: ${watchItem.title}...`);

    try {
      const headers = campaignId ? {
        'X-EBAY-C-ENDUSERCTX': `affiliateCampaignId=${campaignId},affiliateReferenceId=littlniss-watchdog`
      } : {};

      // Get the latest item details from eBay
      const item = await ebay.buy.browse.getItem(watchItem.itemId, { headers });

      if (!item || !item.price) continue;

      const currentPrice = parseFloat(item.price.value);
      const savedPrice = watchItem.savedPrice;

      if (currentPrice < savedPrice) {
        console.log(`🔥 PRICE DROP DETECTED for ${watchItem.title}: $${savedPrice} -> $${currentPrice}`);

        // Construct a special Price Drop Alert
        const dropPercent = (((savedPrice - currentPrice) / savedPrice) * 100).toFixed(0);
        const moneyLink = item.itemAffiliateWebUrl || item.itemWebUrl;
        const imageUrl = item.image ? item.image.imageUrl : (item.primaryImage ? item.primaryImage.imageUrl : 'https://www.ebay.com/favicon.ico');

        const embed = {
          title: `🔥 PRICE DROP ALERT: ${dropPercent}% OFF!`,
          description: `${watchItem.branding}\n\n**${watchItem.title}**\n\n~~Was: ${savedPrice} ${watchItem.currency}~~\n**Now: ${currentPrice} ${watchItem.currency}**\n\nGrab it before it's gone!`,
          url: moneyLink,
          color: 15158332, // Red for urgency
          image: { url: imageUrl },
          thumbnail: { url: imageUrl },
          footer: { text: `Niche: ${watchItem.nicheName} | littlniss Price Watch` },
          timestamp: new Date().toISOString(),
        };

        await sendDiscordWebhook(embed);

        // Update the saved price in the watchlist
        watchlist[i].savedPrice = currentPrice;
        fs.writeFileSync('watchlist.json', JSON.stringify(watchlist, null, 2));
      } else {
        console.log(`No drop for ${watchItem.title} (Current: ${currentPrice})`);
      }

      // Small delay between checks
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`Error checking ${watchItem.itemId}:`, error.message);
    }
  }

  console.log('--- ✅ Price Watchdog Cycle Complete ---');

  // Trigger Hub Rebuild to remove dead links from site
  try {
    const { execSync } = require('child_process');
    console.log('🌐 Refreshing Deals Hub (Stock Update)...');
    execSync('node build-hub.js');
  } catch (e) {}
}

runPriceWatchdog();
mbed);

        // Update the saved price in the watchlist
        watchlist[i].savedPrice = currentPrice;
        fs.writeFileSync('watchlist.json', JSON.stringify(watchlist, null, 2));
      } else {
        console.log(`No drop for ${watchItem.title} (Current: ${currentPrice})`);
      }

      // Small delay between checks
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`Error checking ${watchItem.itemId}:`, error.message);
    }
  }

  console.log('--- ✅ Price Watchdog Cycle Complete ---');
}

runPriceWatchdog();
