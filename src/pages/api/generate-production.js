import GeminiProductionGenerator from '@/lib/geminiProductionGenerator';
import { getMongoStorage } from '@/lib/mongoStorage';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  try {
    const { sessionId, image, style } = req.body;

    // Validar datos requeridos
    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing session ID',
        message: 'Session ID is required'
      });
    }

    if (!image) {
      return res.status(400).json({
        error: 'Missing image data',
        message: 'Image data is required'
      });
    }

    if (!style) {
      return res.status(400).json({
        error: 'Missing style',
        message: 'Style selection is required'
      });
    }

    // Validar estilo
    const validStyles = ['cartoon', 'anime', 'watercolor', 'pixel', 'minimalist', 'realistic', 'pusheen'];
    if (!validStyles.includes(style)) {
      return res.status(400).json({
        error: 'Invalid style',
        message: `Style must be one of: ${validStyles.join(', ')}`
      });
    }

    console.log(`Starting WhatsApp sticker generation: session=${sessionId}, style=${style}`);

    // Extraer base64 de la imagen
    let base64Image;
    if (typeof image === 'string') {
      // Si es un string, verificar si tiene prefijo data URL
      base64Image = image.includes(',') ? image.split(',')[1] : image;
    } else {
      // Si no es string, puede ser que haya un problema con el formato
      console.error('Unexpected image format:', typeof image);
      return res.status(400).json({
        error: 'Invalid image format',
        message: 'Image must be a base64 string'
      });
    }

    // Crear instancia del generador de producción
    const generator = new GeminiProductionGenerator();

    // Variable para almacenar progreso (en producción se usaría WebSocket o SSE)
    let progressData = {};

    // Función de callback para el progreso
    const onProgress = (progress) => {
      progressData = progress;
      console.log('Production progress:', progress);
      // En una implementación real, enviarías esto via WebSocket o Server-Sent Events
    };

    // Generar stickers optimizados para WhatsApp
    const results = await generator.generateWhatsAppStickers(base64Image, style, onProgress);

    // Obtener instancia de MongoDB
    const mongoStorage = getMongoStorage();

    // Validar stickers
    const processedStickers = results.stickers.map((sticker, index) => {
      if (sticker.data && !sticker.error) {
        // Validar sticker
        const validation = generator.validateWhatsAppSticker(sticker.data);

        return {
          ...sticker,
          // Mantener data en base64 para MongoDB
          whatsappValidation: validation,
          isValid: validation.valid,
          index: index
        };
      }
      return { ...sticker, index: index };
    });

    // Guardar sesión completa en MongoDB
    const saveResult = await mongoStorage.saveSession(
      sessionId,
      processedStickers,
      {
        style,
        timestamp: Date.now()
      }
    );

    if (!saveResult.success) {
      console.error('Failed to save to MongoDB:', saveResult.error);
      // Continuar aunque falle el guardado
    }

    // Para el response, remover base64 grandes (opcional para reducir tamaño)
    const responseStickers = processedStickers.map(sticker => ({
      ...sticker,
      data: sticker.data && sticker.data.length > 100000 ? null : sticker.data,
      hasLargeData: sticker.data && sticker.data.length > 100000
    }));

    results.stickers = responseStickers;

    console.log(`Production generation completed: ${results.metrics.successful}/${results.stickers.length} successful for session ${sessionId}`);

    // Responder con los resultados optimizados
    res.status(200).json({
      success: true,
      sessionId,
      results: results,
      whatsappOptimized: true,
      poses: generator.emotionalPoses.map(pose => ({
        id: pose.id,
        name: pose.name,
        emoji: pose.emoji
      })),
      message: `Production stickers generated successfully`
    });

  } catch (error) {
    console.error('Production API Error:', error);

    // Determinar tipo de error específico
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    if (error.message.includes('GEMINI_API_KEY')) {
      statusCode = 500;
      errorMessage = 'API configuration error';
      errorCode = 'CONFIG_ERROR';
    } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
      statusCode = 429;
      errorMessage = 'Rate limit exceeded. Please try again in a few minutes.';
      errorCode = 'RATE_LIMIT';
    } else if (error.message.includes('Failed to generate')) {
      statusCode = 502;
      errorMessage = 'AI service temporarily unavailable';
      errorCode = 'AI_SERVICE_ERROR';
    } else if (error.message.includes('Invalid response')) {
      statusCode = 502;
      errorMessage = 'Invalid AI response format';
      errorCode = 'INVALID_RESPONSE';
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      statusCode = 503;
      errorMessage = 'Service temporarily unavailable';
      errorCode = 'SERVICE_UNAVAILABLE';
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      errorCode: errorCode,
      sessionId: req.body.sessionId || null,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      retryable: ['RATE_LIMIT', 'AI_SERVICE_ERROR', 'SERVICE_UNAVAILABLE'].includes(errorCode)
    });
  }
}