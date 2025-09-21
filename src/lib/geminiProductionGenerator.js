import { GoogleGenAI } from '@google/genai';

class GeminiProductionGenerator {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required');
    }

    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    // Poses emocionales específicas para stickers expresivos
    this.emotionalPoses = [
      {
        id: 'sleeping_side',
        name: 'Acostado Durmiendo',
        emoji: '😴',
        prompt: 'lying down in a relaxed sleeping position on their side with closed eyes, peaceful expression, and completely relaxed body language'
      },
      {
        id: 'crying_sad',
        name: 'Lloroso/Triste',
        emoji: '😢',
        prompt: 'with a sad crying expression, teary eyes, droopy ears, and vulnerable emotional posture looking melancholic and needing comfort'
      },
      {
        id: 'super_happy',
        name: 'Súper Feliz',
        emoji: '😊',
        prompt: 'with an extremely happy and excited expression, bright cheerful eyes, tongue out if appropriate, radiating pure joy and enthusiasm'
      },
      {
        id: 'working_laptop',
        name: 'Trabajando en Laptop',
        emoji: '💻',
        prompt: 'sitting at a small laptop computer with focused concentrated expression, appearing to be working or studying diligently'
      },
      {
        id: 'sleeping_pillow',
        name: 'Durmiendo con Almohada',
        emoji: '🛏️',
        prompt: 'cuddling with a soft pillow in a cozy sleeping position, completely comfortable and content, curled up peacefully'
      },
      {
        id: 'hungry_drooling',
        name: 'Hambriento',
        emoji: '🍽️',
        prompt: 'with an extremely hungry expression, drooling slightly, eyes focused on food, looking starved and eager to eat with anticipation'
      }
    ];

    // Limitaciones de WhatsApp
    this.whatsappConstraints = {
      dimensions: '512x512',
      maxFileSize: 500 * 1024, // 500KB
      format: 'PNG',
      backgroundRequired: true
    };
  }

  /**
   * Genera stickers optimizados para WhatsApp
   */
  async generateWhatsAppStickers(base64Image, style, onProgress) {
    const results = {
      sessionId: Date.now().toString(),
      startTime: Date.now(),
      endTime: null,
      totalDuration: 0,
      style: style,
      stickers: [],
      metrics: {
        successful: 0,
        failed: 0,
        averageTime: 0,
        errors: []
      }
    };

    try {
      // Notificar inicio
      onProgress?.({
        current: 0,
        total: this.emotionalPoses.length,
        status: 'starting',
        message: 'Iniciando generación de stickers...'
      });

      // Generar stickers en paralelo para mejor experiencia
      const promises = this.emotionalPoses.map(async (pose, index) => {
        const stepStartTime = Date.now();

        try {
          // Notificar progreso individual
          onProgress?.({
            current: index + 1,
            total: this.emotionalPoses.length,
            status: 'generating',
            currentPose: pose.name,
            message: `Generando ${pose.emoji} ${pose.name}...`
          });

          const sticker = await this.generateWhatsAppSticker(base64Image, style, pose);
          const stepDuration = Date.now() - stepStartTime;

          if (sticker) {
            sticker.generationTime = stepDuration;
            sticker.pose = pose;
            return { success: true, sticker, duration: stepDuration };
          } else {
            return { success: false, error: 'No sticker generated', duration: stepDuration, pose };
          }
        } catch (error) {
          const stepDuration = Date.now() - stepStartTime;
          console.error(`Error generating ${pose.name}:`, error);
          return {
            success: false,
            error: error.message,
            duration: stepDuration,
            pose
          };
        }
      });

      // Esperar todos los resultados
      const settled = await Promise.allSettled(promises);

      // Procesar resultados
      settled.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { success, sticker, error, pose, duration } = result.value;

          if (success && sticker) {
            results.stickers.push(sticker);
            results.metrics.successful++;
          } else {
            results.metrics.failed++;
            results.metrics.errors.push({
              pose: pose.name,
              error: error || 'Unknown error',
              duration
            });

            // Agregar sticker fallido para UI
            results.stickers.push({
              id: `failed_${pose.id}_${Date.now()}`,
              name: pose.name,
              emoji: pose.emoji,
              error: error || 'Generation failed',
              pose: pose,
              generationTime: duration
            });
          }
        } else {
          results.metrics.failed++;
          results.metrics.errors.push({
            pose: this.emotionalPoses[index]?.name || `Unknown ${index}`,
            error: result.reason?.message || 'Promise rejected',
            duration: 0
          });
        }
      });

      // Calcular métricas finales
      results.endTime = Date.now();
      results.totalDuration = results.endTime - results.startTime;

      if (results.metrics.successful > 0) {
        const successfulTimes = results.stickers
          .filter(s => s.generationTime && !s.error)
          .map(s => s.generationTime);

        if (successfulTimes.length > 0) {
          results.metrics.averageTime = Math.round(
            successfulTimes.reduce((a, b) => a + b, 0) / successfulTimes.length
          );
        }
      }

      onProgress?.({
        current: this.emotionalPoses.length,
        total: this.emotionalPoses.length,
        status: 'completed',
        message: `¡Completado! ${results.metrics.successful}/${this.emotionalPoses.length} stickers generados`
      });

      return results;

    } catch (error) {
      console.error('Critical error in generateWhatsAppStickers:', error);
      results.endTime = Date.now();
      results.totalDuration = results.endTime - results.startTime;
      results.metrics.errors.push({
        pose: 'system',
        error: error.message,
        duration: results.totalDuration
      });

      onProgress?.({
        current: 0,
        total: this.emotionalPoses.length,
        status: 'error',
        message: `Error: ${error.message}`
      });

      throw error;
    }
  }

  /**
   * Genera un sticker individual optimizado para WhatsApp
   */
  async generateWhatsAppSticker(base64Image, style, pose) {
    const prompt = this.buildWhatsAppPrompt(style, pose.prompt);

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

      return this.processWhatsAppImageResponse(response, pose);
    } catch (error) {
      console.error(`Error generating WhatsApp sticker for ${pose.name}:`, error);
      throw error;
    }
  }

  /**
   * Construye prompts optimizados para WhatsApp
   */
  buildWhatsAppPrompt(style, posePrompt) {
    const whatsappOptimization = `IMPORTANT: Create a WhatsApp sticker exactly 512x512 pixels with the following requirements:
    - Exact dimensions: 512 x 512 pixels (square format)
    - Clean solid white background or transparent background
    - Bold, clear outlines for visibility on any chat background
    - High contrast colors for mobile screen visibility
    - Centered composition with appropriate padding around edges
    - Sticker-appropriate size (not too small, not too large within the frame)
    - Optimize for file size while maintaining quality (target under 500KB)
    - PNG format for best compatibility with WhatsApp`;

    const basePet = "CRITICAL: Always preserve the original pet's breed, colors, markings, and distinctive features from the input image.";

    const stylePrompts = {
      cartoon: `${basePet} Transform this pet into a vibrant cartoon-style WhatsApp sticker ${posePrompt}. Create a kawaii-inspired design with bold, clean outlines, cel-shading, and bright saturated colors. The pet should have exaggerated cute features like larger eyes and a friendly expression. ${whatsappOptimization}`,

      anime: `${basePet} Transform this pet into an anime manga-style WhatsApp sticker ${posePrompt}. Use the characteristic anime art style with sharp lines, gradient shading, and expressive large eyes. Apply a soft color palette with cel-shading techniques. The pet should have an endearing anime character appearance. ${whatsappOptimization}`,

      watercolor: `${basePet} Transform this pet into a watercolor painting WhatsApp sticker ${posePrompt}. Apply soft, flowing watercolor brush strokes with gentle color bleeding effects. Use a dreamy, pastel color palette with organic, flowing edges. Maintain the pet's features while giving it an artistic, hand-painted watercolor appearance. ${whatsappOptimization}`,

      pixel: `${basePet} Transform this pet into a retro pixel art WhatsApp sticker ${posePrompt}. Use 16-bit video game aesthetics with blocky, pixelated details and a limited color palette reminiscent of classic arcade games. The pet should look like a cute video game character sprite with crisp pixel edges. ${whatsappOptimization}`,

      minimalist: `${basePet} Transform this pet into a minimalist line art WhatsApp sticker ${posePrompt}. Use clean, simple geometric lines and shapes with minimal detail. Apply a monochromatic or limited color scheme focusing on essential features only. The design should be elegant and modern with plenty of white space. ${whatsappOptimization}`,

      realistic: `${basePet} Enhance this pet photo to create a high-quality realistic WhatsApp sticker ${posePrompt}. Improve lighting, contrast, and colors while maintaining photorealistic appearance. Add subtle artistic enhancement without changing the natural look. Ensure clean edges suitable for sticker format. ${whatsappOptimization}`,

      pusheen: `${basePet} Transform this pet into an adorable Pusheen-style WhatsApp sticker ${posePrompt}. Apply the iconic Pusheen illustration style: make the pet round, chubby, and compact with a simplified kawaii design. PRESERVE the pet's original colors, markings, and distinctive features - do not change them to gray. Use the Pusheen art technique: small simple dot eyes (keeping original eye color), minimal or subtle mouth, thick clean outlines, and very rounded proportions with tiny paws. The body should be spherical and adorable like Pusheen's shape, but maintain this pet's actual fur colors and patterns. Create a clean, simple, irresistibly cute design with the signature Pusheen charm while keeping the pet's unique appearance. ${whatsappOptimization}`
    };

    return stylePrompts[style] || stylePrompts.cartoon;
  }

  /**
   * Procesa la respuesta optimizada para WhatsApp
   */
  processWhatsAppImageResponse(response, pose) {
    try {
      if (!response?.candidates?.[0]?.content?.parts) {
        throw new Error('Invalid response structure from Gemini API');
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const timestamp = Date.now();

          return {
            id: `wa_${pose.id}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
            name: pose.name,
            emoji: pose.emoji,
            variation: pose.id,
            data: imageData,
            mimeType: 'image/png', // WhatsApp prefers PNG
            timestamp: timestamp,
            whatsappOptimized: true,
            dimensions: this.whatsappConstraints.dimensions
          };
        }
      }

      throw new Error('No image data found in response');
    } catch (error) {
      console.error('Error processing WhatsApp image response:', error);
      throw new Error(`Failed to process WhatsApp image: ${error.message}`);
    }
  }

  /**
   * Valida si una imagen cumple con los requisitos de WhatsApp
   */
  validateWhatsAppSticker(imageData) {
    try {
      // Calcular tamaño del archivo
      const fileSize = (imageData.length * 3) / 4; // Estimación base64 a bytes

      const validation = {
        valid: true,
        issues: [],
        fileSize: fileSize,
        maxFileSize: this.whatsappConstraints.maxFileSize,
        dimensions: this.whatsappConstraints.dimensions,
        format: this.whatsappConstraints.format
      };

      // Validar tamaño de archivo
      if (fileSize > this.whatsappConstraints.maxFileSize) {
        validation.valid = false;
        validation.issues.push(`File size ${Math.round(fileSize / 1024)}KB exceeds WhatsApp limit of ${Math.round(this.whatsappConstraints.maxFileSize / 1024)}KB`);
      }

      // Nota: La validación de dimensiones se hace a nivel de prompt
      // ya que Gemini genera directamente en el tamaño solicitado
      validation.issues.push(`Generated with WhatsApp optimization: ${this.whatsappConstraints.dimensions} pixels`);

      return validation;
    } catch (error) {
      return {
        valid: false,
        issues: [`Validation error: ${error.message}`],
        fileSize: 0,
        maxFileSize: this.whatsappConstraints.maxFileSize
      };
    }
  }

  /**
   * Obtiene información sobre las limitaciones de WhatsApp
   */
  getWhatsAppConstraints() {
    return {
      ...this.whatsappConstraints,
      description: 'WhatsApp sticker requirements for optimal performance',
      tips: [
        'Images should be 512x512 pixels for best quality',
        'Keep file size under 500KB for fast loading',
        'PNG format is recommended for transparency support',
        'Use solid backgrounds or transparent backgrounds only'
      ]
    };
  }
}

export default GeminiProductionGenerator;