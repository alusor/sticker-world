import TempStorage from '@/lib/tempStorage';

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

    console.log(`Loading stickers from disk for session: ${sessionId}`);

    // Crear instancia de almacenamiento temporal
    const tempStorage = new TempStorage();

    // Cargar información de la sesión
    const sessionResult = tempStorage.loadSessionInfo(sessionId);
    if (!sessionResult.success) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'No session data found for this ID'
      });
    }

    const sessionInfo = sessionResult.data;

    // Cargar stickers desde disco
    const stickers = tempStorage.loadStickersFromDisk(sessionId, sessionInfo.totalStickers || 6);

    // Reconstruir el objeto results similar al de generate-production
    const results = {
      success: true,
      sessionId: sessionId,
      results: {
        sessionId: sessionId,
        style: sessionInfo.style,
        stickers: stickers,
        metrics: {
          successful: stickers.filter(s => !s.error).length,
          failed: stickers.filter(s => s.error).length,
          total: stickers.length,
          loadedFromDisk: true
        }
      },
      whatsappOptimized: true,
      message: `Stickers loaded from temporary storage`,
      loadedAt: Date.now()
    };

    console.log(`Loaded ${results.results.metrics.successful}/${results.results.metrics.total} stickers from disk for session ${sessionId}`);

    res.status(200).json(results);

  } catch (error) {
    console.error('Error loading stickers from disk:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to load stickers from temporary storage',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}