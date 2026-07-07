require('dotenv').config({ override: true });
const { getDynamicModel } = require('./ai-model');

let model;

/**
 * Generates a full social media content pack for a product.
 */
async function generateContentPack(itemTitle, nicheName) {
  if (!model && process.env.GEMINI_API_KEY) {
    model = await getDynamicModel();
  }

  const fallback = {
    pinterest: { title: itemTitle, desc: "Check out this amazing find!", altText: "Elegant style pick", suggestedBoard: "littlniss Picks" },
    instagram: `Check out this ${nicheName} find! 💖 #littlniss`,
    facebook: `I found something special for you today: ${itemTitle}. Hope you like it!`,
    tiktok: `Check out this ${nicheName} find! 💖 #littlniss #shoppinghaul`,
    midjourneyPrompt: `A high-end, editorial style photograph of ${itemTitle}, minimalist aesthetic, soft natural lighting, professional studio setting, 8k resolution --ar 16:9`,
    runwayPrompt: `A cinematic product reveal video of ${itemTitle}, slow panning shot, elegant atmosphere, high quality textures, 4k`,
    matchingSearch: "fashion accessory",
    engagementQuestion: "What do you think of this look?",
    blogPost: "A stylish find for your collection. Perfect for the modern professional.",
    videoStoryboard: {
      hook: "Style check! ✨",
      slide1: "Main item showcase",
      slide2: "Accessory pairing",
      slide3: "Final look",
      cta: "Link in bio!"
    }
  };

  if (!process.env.GEMINI_API_KEY) return fallback;

  const prompt = `
    You are a social media manager for 'littlniss', a professional and elegant brand for teachers and home curators.
    Create a content pack for this item: "${itemTitle}" (${nicheName}).

    1. Pinterest: A catchy 5-8 word Title and a 2-sentence SEO-rich Description.
    2. Instagram/TikTok: A trendy, short caption with 3 emojis and 5 niche hashtags. Include "#ad" at the end.
    3. Facebook: A warm, helpful 2-sentence post. Include "(Commission earned)" at the end.
    4. Midjourney: A descriptive prompt for a high-end, editorial product shot (minimalist, 8k, photorealistic).
    5. Runway: A cinematic video prompt for a 5-second slow-motion product reveal.

    Return ONLY JSON:
    {
      "pinterest": { 
        "title": "", 
        "desc": "", 
        "altText": "SEO description for the image", 
        "suggestedBoard": "Must be ONE of: 'littlniss | Professional Style', 'littlniss | Tech & Gadgets', 'littlniss | Home & Curation', 'littlniss | Learning & Teachers', 'littlniss | Fashion Finds', or 'littlniss | Daily Curations'" 
      },
      "instagram": "",
      "tiktok": "",
      "facebook": "",
      "midjourneyPrompt": "",
      "runwayPrompt": "",
      "matchingSearch": "3-word Etsy search query",
      "engagementQuestion": "A question to boost comments",
      "blogPost": "A 150-word engaging blog post about the set",
      "videoStoryboard": {
        "hook": "A catchy opening text/hook",
        "slide1": "Visual/Action for Main Item",
        "slide2": "Visual/Action for Accessory",
        "slide3": "Visual/Action for the Final Look",
        "cta": "Link in bio call to action"
      }
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Gemini AI Error:', error.message);
    return fallback;
  }
}

module.exports = { generateContentPack };
