require('dotenv').config({ override: true });

/**
 * Sends a rich embed message to a Discord Webhook.
 * @param {Object} embed - The Discord embed object.
 */
async function sendDiscordWebhook(embed) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error('Error: DISCORD_WEBHOOK_URL missing in .env');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'littlniss Bot',
        avatar_url: 'https://www.ebay.com/favicon.ico',
        content: "🚀 **New littlniss Deal Found!**",
        embeds: [embed],
      }),
    });

    if (response.ok) {
      console.log('Successfully posted to Discord!');
    } else {
      const errData = await response.json();
      console.error('Discord API Error:', errData);
    }
  } catch (error) {
    console.error('Failed to send Discord message:', error.message);
  }
}

module.exports = { sendDiscordWebhook };
