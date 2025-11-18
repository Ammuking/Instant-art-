import { GoogleGenAI, Modality } from "@google/genai";

// Ensure API key is present
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("Missing API_KEY in environment variables");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || '' });

/**
 * Generates an image based on a text prompt using Gemini Flash Image.
 */
export const generateImage = async (prompt: string): Promise<string> => {
  if (!API_KEY) throw new Error("API Key is missing");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData && part.inlineData.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }

    throw new Error("No image data returned from Gemini.");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

/**
 * Edits an image based on a source image and instructions.
 */
export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
  if (!API_KEY) throw new Error("API Key is missing");

  // Extract the raw base64 data if it includes the data:image prefix
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
            {
                inlineData: {
                    data: base64Data,
                    mimeType: 'image/png', // Assuming PNG for simplicity/standardization
                }
            },
            { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData && part.inlineData.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }

    throw new Error("No edited image data returned from Gemini.");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};
