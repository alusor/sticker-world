import GeminiTestGenerator from '@/lib/geminiTestGenerator';

export default async function handler(req, res) {
  // Solo permitir POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  try {
    const { image, style } = req.body;

    // Validar que tenemos los datos necesarios
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

    // Validar que el estilo es válido
    const validStyles = ['cartoon', 'anime', 'watercolor', 'pixel', 'minimalist', 'realistic', 'pusheen'];
    if (!validStyles.includes(style)) {
      return res.status(400).json({
        error: 'Invalid style',
        message: `Style must be one of: ${validStyles.join(', ')}`
      });
    }

    console.log(`Starting sticker generation with style: ${style}`);

    // Extraer solo la parte base64 de la imagen (remover data:image/...;base64, si existe)
    const base64Image = image.includes(',') ? image.split(',')[1] : image;

    // Crear instancia del generador
    const generator = new GeminiTestGenerator();

    // Generar el sticker
    const sticker = await generator.generateSingleSticker(base64Image, style);

    console.log('Sticker generated successfully:', sticker.id);

    // Responder con el sticker generado
    res.status(200).json({
      success: true,
      sticker: sticker,
      message: 'Sticker generated successfully'
    });

  } catch (error) {
    console.error('API Error:', error);

    // Determinar el tipo de error y responder apropiadamente
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
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}