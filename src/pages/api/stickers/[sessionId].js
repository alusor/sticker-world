import { getMongoStorage } from '@/lib/mongoStorage';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET requests are allowed'
    });
  }

  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing session ID',
        message: 'Session ID is required'
      });
    }

    console.log(`Loading stickers from MongoDB for session: ${sessionId}`);

    // Obtener instancia de MongoDB
    const mongoStorage = getMongoStorage();

    // Cargar sesión desde MongoDB
    const sessionResult = await mongoStorage.loadSession(sessionId);

    if (!sessionResult.success) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'No session data found for this ID'
      });
    }

    const sessionData = sessionResult.data;

    // Reconstruir el objeto results similar al de generate-production
    const results = {
      success: true,
      sessionId: sessionId,
      results: {
        sessionId: sessionId,
        style: sessionData.metadata?.style,
        stickers: sessionData.stickers,
        metrics: {
          successful: sessionData.metadata?.successful || sessionData.stickers.filter(s => !s.error).length,
          failed: sessionData.metadata?.failed || sessionData.stickers.filter(s => s.error).length,
          total: sessionData.stickers.length,
          loadedFromMongoDB: true
        }
      },
      whatsappOptimized: true,
      message: `Stickers loaded from MongoDB`,
      loadedAt: Date.now()
    };

    console.log(`Loaded ${results.results.metrics.successful}/${results.results.metrics.total} stickers from MongoDB for session ${sessionId}`);

    res.status(200).json(results);

  } catch (error) {
    console.error('Error loading stickers from disk:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to load stickers from MongoDB',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}