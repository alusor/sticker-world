import { GoogleGenAI } from '@google/genai';

class GeminiTestGenerator {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required');
    }

    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });
  }

  async generateSingleSticker(base64Image, style) {
    try {
      const prompt = this.buildStickerPrompt(style);

      console.log('Generating sticker with prompt:', prompt);

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
        ],
      });

      return this.processImageResponse(response, style);
    } catch (error) {
      console.error('Error generating sticker:', error);
      throw new Error(`Failed to generate sticker: ${error.message}`);
    }
  }

  buildStickerPrompt(style) {
    const stylePrompts = {
      cartoon: `Transform this pet into a vibrant cartoon-style sticker. Create a kawaii-inspired design with bold, clean outlines, cel-shading, and bright saturated colors. The pet should have exaggerated cute features like larger eyes and a friendly expression. Use a white background suitable for WhatsApp stickers. Make it look like a professional sticker design with clean edges.`,

      anime: `Transform this pet into an anime manga-style sticker. Use the characteristic anime art style with sharp lines, gradient shading, and expressive large eyes. Apply a soft color palette with cel-shading techniques. The pet should have an endearing anime character appearance on a white background. Make it suitable for WhatsApp stickers.`,

      watercolor: `Transform this pet into a watercolor painting sticker. Apply soft, flowing watercolor brush strokes with gentle color bleeding effects. Use a dreamy, pastel color palette with organic, flowing edges. Maintain the pet's features while giving it an artistic, hand-painted watercolor appearance on a white background.`,

      pixel: `Transform this pet into a retro pixel art sticker. Use 16-bit video game aesthetics with blocky, pixelated details and a limited color palette reminiscent of classic arcade games. The pet should look like a cute video game character sprite with crisp pixel edges on a white background.`,

      minimalist: `Transform this pet into a minimalist line art sticker. Use clean, simple geometric lines and shapes with minimal detail. Apply a monochromatic or limited color scheme focusing on essential features only. The design should be elegant and modern with plenty of white space.`,

      realistic: `Enhance this pet photo to create a high-quality realistic sticker. Improve lighting, contrast, and colors while maintaining photorealistic appearance. Add subtle artistic enhancement without changing the natural look. Ensure clean edges suitable for sticker format with a white background.`,

      pusheen: `Transform this pet into an adorable Pusheen-style sticker. Apply the iconic Pusheen illustration style: make the pet round, chubby, and compact with a simplified kawaii design. PRESERVE the pet's original colors, markings, and distinctive features - do not change them to gray. Use the Pusheen art technique: small simple dot eyes (keeping original eye color), minimal or subtle mouth, thick clean outlines, and very rounded proportions with tiny paws. The body should be spherical and adorable like Pusheen's shape, but maintain this pet's actual fur colors and patterns. Create a clean, simple, irresistibly cute design with the signature Pusheen charm while keeping the pet's unique appearance. Use a white background perfect for messaging apps.`
    };

    return stylePrompts[style] || stylePrompts.cartoon;
  }

  processImageResponse(response, style) {
    try {
      if (!response?.candidates?.[0]?.content?.parts) {
        throw new Error('Invalid response structure from Gemini API');
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const timestamp = Date.now();

          return {
            id: `test_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
            name: `Sticker ${style}`,
            style: style,
            data: imageData, // Base64 data
            mimeType: part.inlineData.mimeType || 'image/png',
            timestamp: timestamp
          };
        }
      }

      throw new Error('No image data found in response');
    } catch (error) {
      console.error('Error processing image response:', error);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }
}

export default GeminiTestGenerator;