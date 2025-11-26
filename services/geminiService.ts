import { GoogleGenAI } from "@google/genai";
import { TestSettings } from "../types";

const FALLBACK_TEXT = "sunflowers turn their heads to follow the sun across the sky providing a beautiful example of heliotropism in nature nature always finds a way to survive and thrive even in the harshest conditions the yellow petals bring joy to those who see them standing tall in the garden field";

const THEMES = [
  "the life cycle of a sunflower from seed to bloom",
  "the physics of sunlight and photosynthesis",
  "a calming walk through a golden meadow in late summer",
  "the symbiotic relationship between bees and garden flowers",
  "the history of Van Gogh's sunflower paintings",
  "the intricate fibonacci spiral patterns found in sunflower seeds",
  "morning dew and the quiet sunrise over a field",
  "the resilience of nature in changing seasons",
  "different varieties of yellow flowers found in the wild",
  "the process of harvesting sunflower seeds for oil",
  "the feeling of warmth on a bright summer day",
  "how plants communicate through their root systems",
  "the geometry of nature and fractals in plants",
  "the role of rain in a thriving ecosystem",
  "ancient myths and legends surrounding the sun",
  "the japanese art of shinrin yoku or forest bathing",
  "mindfulness meditation techniques for focus",
  "the psychological benefits of keeping a gratitude journal",
  "how mycelium networks connect trees underground",
  "the calming rhythm of ocean tides and waves",
  "stoic philosophy on controlling what we can",
  "the concept of flow state in creative work",
  "sustainable living and reducing carbon footprint",
  "the intricate migration patterns of monarch butterflies",
  "identifying constellations in the night sky",
  "the importance of deep breathing for stress relief",
  "the growth mindset versus the fixed mindset",
  "the delicate balance of coral reef ecosystems",
  "how silence can improve cognitive function",
  "the beauty of wabi sabi and accepting imperfection",
  "the formation of clouds and weather patterns",
  "the therapeutic power of gardening",
  "understanding the circadian rhythm and sleep",
  "the history of tea ceremonies in different cultures",
  "the sound of rain against a window pane"
];

export const generateText = async (settings: TestSettings): Promise<string> => {
  // If no API key is present, return fallback immediately to avoid errors
  if (!process.env.API_KEY) {
    console.warn("No API_KEY found, using fallback text.");
    return FALLBACK_TEXT;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Construct a prompt based on settings
    let lengthInstruction = "";
    if (settings.mode === 'words') {
      lengthInstruction = `approximately ${settings.wordCount} words`;
    } else {
      // For time mode, generate enough text to not run out
      lengthInstruction = `approximately ${settings.duration * 3} words`; 
    }

    const complexity = settings.includePunctuation ? "standard punctuation and capitalization" : "lowercase, no punctuation";
    const numbers = settings.includeNumbers ? "include a few numbers naturally" : "no numbers";

    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];

    const prompt = `Generate a text for a typing test about: "${theme}". 
    Length: ${lengthInstruction}. 
    Style Requirements: ${complexity}, ${numbers}.
    Typing Goal: Optimize the text for 10-finger touch typing practice by ensuring a balanced use of left and right hand keys, varied word lengths, and smooth sentence flow.
    Output format: Return ONLY the raw plain text. No Markdown. No title. No newlines.
    The text should contain standard single spacing between words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text;
    
    if (!text) return FALLBACK_TEXT;

    // Clean up text if needed (e.g., remove newlines if the model adds them weirdly)
    // For typing tests, single spaces between words are standard.
    return text.replace(/\s+/g, ' ').trim();

  } catch (error) {
    console.error("Gemini API Error:", error);
    return FALLBACK_TEXT;
  }
};