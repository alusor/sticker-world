import GeminiBatchGenerator from '@/lib/geminiBatchGenerator';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  try {
    const { image, style, mode = 'sequential' } = req.body;

    // Validar datos requeridos
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

    // Validar modo
    const validModes = ['sequential', 'parallel'];
    if (!validModes.includes(mode)) {
      return res.status(400).json({
        error: 'Invalid mode',
        message: `Mode must be one of: ${validModes.join(', ')}`
      });
    }

    console.log(`Starting batch generation: mode=${mode}, style=${style}`);

    // Extraer base64 de la imagen
    const base64Image = image.includes(',') ? image.split(',')[1] : image;

    // Crear instancia del generador
    const generator = new GeminiBatchGenerator();

    // Variable para almacenar progreso (en una implementación real usarías WebSockets o SSE)
    let progressData = {};

    // Función de callback para el progreso
    const onProgress = (progress) => {
      progressData = progress;
      console.log('Progress update:', progress);
      // En una implementación real, enviarías esto via WebSocket
    };

    // Generar stickers según el modo
    let results;
    if (mode === 'parallel') {
      results = await generator.generateParallel(base64Image, style, onProgress);
    } else {
      results = await generator.generateSequential(base64Image, style, onProgress);
    }

    console.log(`Batch generation completed: ${results.metrics.successful}/${results.stickers.length} successful`);

    // Responder con los resultados
    res.status(200).json({
      success: true,
      results: results,
      message: `Batch generation completed in ${mode} mode`
    });

  } catch (error) {
    console.error('Batch API Error:', error);

    // Determinar tipo de error
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error.message.includes('GEMINI_API_KEY')) {
      statusCode = 500;
      errorMessage = 'API configuration error';
    } else if (error.message.includes('Failed to generate')) {
      statusCode = 502;
      errorMessage = 'AI service error';
    } else if (error.message.includes('Invalid response')) {
      statusCode = 502;
      errorMessage = 'Invalid AI response';
    } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
      statusCode = 429;
      errorMessage = 'Rate limit exceeded';
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}