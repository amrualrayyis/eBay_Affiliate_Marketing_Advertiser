const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Dynamically fetches the latest available Gemini "flash" model from the API.
 * Falls back to gemini-1.5-flash if the API call fails or no suitable model is found.
 */
async function getDynamicModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in .env");
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    if (!data.models) {
      console.warn("Could not fetch models, falling back to gemini-1.5-flash");
      return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    // Filter for gemini flash models that support generateContent
    // We prefer stable models over experimental ones if possible, but the user wants "valid model always"
    // and specifically mentioned "2.0 flash" which is often 'gemini-2.0-flash-exp' or similar.
    const flashModels = data.models.filter(m => 
      m.name.includes("gemini") && 
      m.name.includes("flash") && 
      m.supportedGenerationMethods.includes("generateContent")
    );

    if (flashModels.length === 0) {
      console.warn("No flash models found, falling back to gemini-1.5-flash");
      return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    // Sort by version (extract numbers from name like "models/gemini-2.0-flash-exp" or "models/gemini-1.5-flash")
    flashModels.sort((a, b) => {
      const getVersion = (name) => {
        const match = name.match(/(\d+\.\d+)/);
        return match ? parseFloat(match[1]) : 0;
      };
      // Sort descending to get newest first
      return getVersion(b.name) - getVersion(a.name);
    });

    const bestModel = flashModels[0].name.replace("models/", "");
    console.log(`✨ Dynamic AI Model Selected: ${bestModel}`);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: bestModel });
  } catch (error) {
    console.error("Error fetching dynamic model:", error.message);
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }
}

module.exports = { getDynamicModel };
