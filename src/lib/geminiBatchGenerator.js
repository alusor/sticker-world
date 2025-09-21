import { GoogleGenAI } from '@google/genai';

class GeminiBatchGenerator {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required');
    }

    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    // 6 variaciones emocionales específicas para stickers expresivos
    this.testVariations = [
      { id: 'sleeping_side', name: 'Acostado Durmiendo', prompt: 'lying down in a relaxed sleeping position on their side with closed eyes, peaceful expression, and completely relaxed body language' },
      { id: 'crying_sad', name: 'Lloroso/Triste', prompt: 'with a sad crying expression, teary eyes, droopy ears, and vulnerable emotional posture looking melancholic and needing comfort' },
      { id: 'super_happy', name: 'Súper Feliz', prompt: 'with an extremely happy and excited expression, bright cheerful eyes, tongue out if appropriate, radiating pure joy and enthusiasm' },
      { id: 'working_laptop', name: 'Trabajando en Laptop', prompt: 'sitting at a small laptop computer with focused concentrated expression, appearing to be working or studying diligently' },
      { id: 'sleeping_pillow', name: 'Durmiendo con Almohada', prompt: 'cuddling with a soft pillow in a cozy sleeping position, completely comfortable and content, curled up peacefully' },
      { id: 'hungry_drooling', name: 'Hambriento', prompt: 'with an extremely hungry expression, drooling slightly, eyes focused on food, looking starved and eager to eat with anticipation' }
    ];
  }

  /**
   * Genera stickers en modo secuencial
   */
  async generateSequential(base64Image, style, onProgress) {
    const results = {
      mode: 'sequential',
      startTime: Date.now(),
      endTime: null,
      totalDuration: 0,
      stickers: [],
      metrics: {
        successful: 0,
        failed: 0,
        averageTime: 0,
        minTime: Infinity,
        maxTime: 0,
        individualTimes: []
      }
    };

    for (let i = 0; i < this.testVariations.length; i++) {
      const variation = this.testVariations[i];
      const stepStartTime = Date.now();

      try {
        // Notificar progreso
        onProgress?.({
          current: i + 1,
          total: this.testVariations.length,
          currentVariation: variation.name,
          status: 'generating'
        });

        const sticker = await this.generateSingleSticker(base64Image, style, variation);

        const stepDuration = Date.now() - stepStartTime;

        if (sticker) {
          sticker.generationTime = stepDuration;
          results.stickers.push(sticker);
          results.metrics.successful++;
          results.metrics.individualTimes.push(stepDuration);
          results.metrics.minTime = Math.min(results.metrics.minTime, stepDuration);
          results.metrics.maxTime = Math.max(results.metrics.maxTime, stepDuration);
        } else {
          results.metrics.failed++;
        }

        console.log(`✅ ${variation.name}: ${stepDuration}ms`);

      } catch (error) {
        console.error(`❌ ${variation.name}:`, error);
        results.metrics.failed++;

        // Agregar sticker fallido con info del error
        results.stickers.push({
          id: `failed_${variation.id}`,
          name: variation.name,
          variation: variation.id,
          error: error.message,
          generationTime: Date.now() - stepStartTime
        });
      }
    }

    // Calcular métricas finales
    results.endTime = Date.now();
    results.totalDuration = results.endTime - results.startTime;

    if (results.metrics.individualTimes.length > 0) {
      results.metrics.averageTime = Math.round(
        results.metrics.individualTimes.reduce((a, b) => a + b, 0) / results.metrics.individualTimes.length
      );
    }

    // Reemplazar Infinity si no hay tiempos exitosos
    if (results.metrics.minTime === Infinity) {
      results.metrics.minTime = 0;
    }

    onProgress?.({
      current: this.testVariations.length,
      total: this.testVariations.length,
      status: 'completed'
    });

    return results;
  }

  /**
   * Genera stickers en modo paralelo
   */
  async generateParallel(base64Image, style, onProgress) {
    const results = {
      mode: 'parallel',
      startTime: Date.now(),
      endTime: null,
      totalDuration: 0,
      stickers: [],
      metrics: {
        successful: 0,
        failed: 0,
        averageTime: 0,
        minTime: Infinity,
        maxTime: 0,
        individualTimes: []
      }
    };

    // Notificar inicio
    onProgress?.({
      current: 0,
      total: this.testVariations.length,
      status: 'starting_parallel'
    });

    // Crear todas las promesas de una vez
    const promises = this.testVariations.map(async (variation) => {
      const stepStartTime = Date.now();

      try {
        const sticker = await this.generateSingleSticker(base64Image, style, variation);
        const stepDuration = Date.now() - stepStartTime;

        if (sticker) {
          sticker.generationTime = stepDuration;
          return { success: true, sticker, duration: stepDuration, variation: variation.name };
        } else {
          return { success: false, error: 'No sticker generated', duration: stepDuration, variation: variation.name };
        }
      } catch (error) {
        const stepDuration = Date.now() - stepStartTime;
        return {
          success: false,
          error: error.message,
          duration: stepDuration,
          variation: variation.name,
          sticker: {
            id: `failed_${variation.id}`,
            name: variation.name,
            variation: variation.id,
            error: error.message,
            generationTime: stepDuration
          }
        };
      }
    });

    // Usar Promise.allSettled para esperar todos los resultados
    const settled = await Promise.allSettled(promises);

    // Procesar resultados
    settled.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { success, sticker, duration, variation, error } = result.value;

        if (success && sticker) {
          results.stickers.push(sticker);
          results.metrics.successful++;
          results.metrics.individualTimes.push(duration);
          results.metrics.minTime = Math.min(results.metrics.minTime, duration);
          results.metrics.maxTime = Math.max(results.metrics.maxTime, duration);
          console.log(`✅ ${variation}: ${duration}ms`);
        } else {
          results.metrics.failed++;
          if (result.value.sticker) {
            results.stickers.push(result.value.sticker);
          }
          console.error(`❌ ${variation}:`, error);
        }
      } else {
        results.metrics.failed++;
        console.error(`❌ Promise rejected for variation ${index}:`, result.reason);
      }
    });

    // Calcular métricas finales
    results.endTime = Date.now();
    results.totalDuration = results.endTime - results.startTime;

    if (results.metrics.individualTimes.length > 0) {
      results.metrics.averageTime = Math.round(
        results.metrics.individualTimes.reduce((a, b) => a + b, 0) / results.metrics.individualTimes.length
      );
    }

    if (results.metrics.minTime === Infinity) {
      results.metrics.minTime = 0;
    }

    onProgress?.({
      current: this.testVariations.length,
      total: this.testVariations.length,
      status: 'completed'
    });

    return results;
  }

  /**
   * Genera un sticker individual
   */
  async generateSingleSticker(base64Image, style, variation) {
    const prompt = this.buildStickerPrompt(style, variation.prompt);

    try {
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

      return this.processImageResponse(response, variation);
    } catch (error) {
      console.error(`Error generating ${variation.name}:`, error);
      throw error;
    }
  }

  /**
   * Construye el prompt para un estilo y variación específica
   */
  buildStickerPrompt(style, variationPrompt) {
    const stylePrompts = {
      cartoon: `Transform this pet into a vibrant cartoon-style sticker with a ${variationPrompt}. Create a kawaii-inspired design with bold, clean outlines, cel-shading, and bright saturated colors. The pet should have exaggerated cute features like larger eyes and a friendly expression. Use a white background suitable for WhatsApp stickers.`,

      anime: `Transform this pet into an anime manga-style sticker with a ${variationPrompt}. Use the characteristic anime art style with sharp lines, gradient shading, and expressive large eyes. Apply a soft color palette with cel-shading techniques. The pet should have an endearing anime character appearance on a white background.`,

      watercolor: `Transform this pet into a watercolor painting sticker with a ${variationPrompt}. Apply soft, flowing watercolor brush strokes with gentle color bleeding effects. Use a dreamy, pastel color palette with organic, flowing edges. Maintain the pet's features while giving it an artistic, hand-painted watercolor appearance.`,

      pixel: `Transform this pet into a retro pixel art sticker with a ${variationPrompt}. Use 16-bit video game aesthetics with blocky, pixelated details and a limited color palette reminiscent of classic arcade games. The pet should look like a cute video game character sprite with crisp pixel edges.`,

      minimalist: `Transform this pet into a minimalist line art sticker with a ${variationPrompt}. Use clean, simple geometric lines and shapes with minimal detail. Apply a monochromatic or limited color scheme focusing on essential features only. The design should be elegant and modern with plenty of white space.`,

      realistic: `Enhance this pet photo to create a high-quality realistic sticker with a ${variationPrompt}. Improve lighting, contrast, and colors while maintaining photorealistic appearance. Add subtle artistic enhancement without changing the natural look. Ensure clean edges suitable for sticker format.`,

      pusheen: `Transform this pet into an adorable Pusheen-style sticker with a ${variationPrompt}. Apply the iconic Pusheen illustration style: make the pet round, chubby, and compact with a simplified kawaii design. PRESERVE the pet's original colors, markings, and distinctive features - do not change them to gray. Use the Pusheen art technique: small simple dot eyes (keeping original eye color), minimal or subtle mouth, thick clean outlines, and very rounded proportions with tiny paws. The body should be spherical and adorable like Pusheen's shape, but maintain this pet's actual fur colors and patterns. Create a clean, simple, irresistibly cute design with the signature Pusheen charm while keeping the pet's unique appearance. Use a white background perfect for messaging apps.`
    };

    return stylePrompts[style] || stylePrompts.cartoon;
  }

  /**
   * Procesa la respuesta de la API de Gemini
   */
  processImageResponse(response, variation) {
    try {
      if (!response?.candidates?.[0]?.content?.parts) {
        throw new Error('Invalid response structure from Gemini API');
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const timestamp = Date.now();

          return {
            id: `batch_${variation.id}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
            name: variation.name,
            variation: variation.id,
            data: imageData,
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

export default GeminiBatchGenerator;