import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { Download, Share2, RotateCcw, Heart, Star, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function ResultPage() {
  const router = useRouter();
  const { id, style } = router.query;
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  const getStyleDisplay = (styleId) => {
    const styles = {
      cartoon: { name: 'Cartoon', emoji: '🎨' },
      anime: { name: 'Anime', emoji: '✨' },
      realistic: { name: 'Realista', emoji: '📸' },
      watercolor: { name: 'Acuarela', emoji: '🎭' },
      pixel: { name: 'Pixel Art', emoji: '🎮' },
      minimalist: { name: 'Minimalista', emoji: '⚪' },
      pusheen: { name: 'Pusheen', emoji: '😸' }
    };
    return styles[styleId] || { name: 'Desconocido', emoji: '❓' };
  };

  useEffect(() => {
    if (!id) return;

    const loadResults = async () => {
      try {
        // Verificar si llegamos aquí con un error en los query params
        if (router.query.error) {
          setResults({ error: decodeURIComponent(router.query.error) });
          setLoading(false);
          return;
        }

        // Cargar desde MongoDB a través del API
        try {
          console.log(`Loading stickers from MongoDB for session ${id}`);

          const response = await fetch(`/api/stickers/${id}`);
          if (response.ok) {
            const mongoResults = await response.json();
            console.log('Successfully loaded results from MongoDB');
            setResults(mongoResults);
            setLoading(false);
            return;
          } else if (response.status === 404) {
            console.log('Session not found in MongoDB');
            setResults({ error: 'Sesión no encontrada. Por favor, genera los stickers de nuevo.' });
          } else {
            console.log('Error loading from MongoDB');
            setResults({ error: 'Error al cargar los resultados.' });
          }
        } catch (error) {
          console.error('Error loading from MongoDB:', error);
          setResults({ error: 'Error de conexión. Por favor, intenta de nuevo.' });
        }
      } catch (error) {
        console.error('Error loading results:', error);
        setResults({ error: 'Error cargando los resultados' });
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [id, router]);

  const styleInfo = getStyleDisplay(style);

  const handleDownload = (sticker) => {
    if (!sticker.data) return;

    const link = document.createElement('a');
    // Usar base64 directamente desde MongoDB
    link.href = `data:${sticker.mimeType || 'image/png'};base64,${sticker.data}`;
    link.download = `${sticker.name.replace(/\s+/g, '_')}_${sticker.emoji}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    if (!results?.results?.stickers) return;

    const downloadableStickers = results.results.stickers.filter(s => s.data && !s.error);
    downloadableStickers.forEach((sticker, index) => {
      setTimeout(() => handleDownload(sticker), index * 500);
    });
  };

  const toggleFavorite = (stickerId) => {
    if (!results?.results?.stickers) return;

    setResults(prev => ({
      ...prev,
      results: {
        ...prev.results,
        stickers: prev.results.stickers.map(sticker =>
          sticker.id === stickerId
            ? { ...sticker, favorite: !sticker.favorite }
            : sticker
        )
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">No se encontraron resultados</p>
          <Button onClick={() => router.push('/create')}>Crear nuevos stickers</Button>
        </div>
      </div>
    );
  }

  // Si hay un error, mostrarlo
  if (results.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Error en la generación
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {results.error}
          </p>
          <Button onClick={() => router.push('/create')}>
            Intentar de nuevo
          </Button>
        </div>
      </div>
    );
  }

  const stickers = results?.results?.stickers || [];
  const validStickers = stickers.filter(s => s.data && !s.error);
  const failedStickers = stickers.filter(s => s.error);
  const largeDataStickers = stickers.filter(s => s.hasLargeData);
  const hasLargeDataIssues = largeDataStickers.length > 0;

  // Información sobre storage individual si está disponible
  const storageInfo = results?.results?.metrics;
  const hasStorageInfo = storageInfo && storageInfo.stored !== undefined;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="text-4xl">{styleInfo.emoji}</div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              ¡Tus stickers están listos!
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            Estilo: {styleInfo.name} • {validStickers.length} stickers generados exitosamente
          </p>
          {failedStickers.length > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {failedStickers.length} stickers no pudieron generarse
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Poses emocionales para conversaciones expresivas
          </p>
          {hasLargeDataIssues && (
            <div className="max-w-2xl mx-auto mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                ℹ️ {hasStorageInfo ? (
                  <>Cargados {storageInfo.stored} de {storageInfo.total} stickers desde almacenamiento local. Los stickers faltantes eran demasiado grandes para guardar.</>
                ) : (
                  <>Algunos stickers se generaron correctamente pero sus datos son demasiado grandes para almacenar localmente.</>
                )} Intenta generar de nuevo para obtener todos los stickers completos.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button onClick={handleDownloadAll} size="lg">
              <Download className="w-5 h-5 mr-2" />
              Descargar todos
            </Button>
            <Button variant="outline" size="lg">
              <Share2 className="w-5 h-5 mr-2" />
              Compartir
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/create')}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Crear más
            </Button>
          </div>
        </motion.div>

        {/* Stickers grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {stickers.map((sticker, index) => (
            <motion.div
              key={sticker.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card
                hover
                className={`overflow-hidden cursor-pointer transition-all duration-200 ${
                  selectedSticker?.id === sticker.id
                    ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800'
                    : ''
                } ${sticker.error ? 'opacity-60' : ''}`}
                onClick={() => setSelectedSticker(sticker)}
              >
                <div className="relative">
                  {(sticker.filePath || sticker.data) && !sticker.error ? (
                    <img
                      src={sticker.filePath ? sticker.filePath : `data:${sticker.mimeType || 'image/png'};base64,${sticker.data}`}
                      alt={sticker.name}
                      className="w-full h-64 object-cover bg-white"
                    />
                  ) : sticker.hasLargeData ? (
                    <div className="w-full h-64 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">{sticker.emoji}</div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Sticker generado</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Datos temporalmente no disponibles</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">{sticker.emoji}</div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Error generando</p>
                      </div>
                    </div>
                  )}

                  {/* Pose emoji badge */}
                  <div className="absolute top-3 left-3 bg-white/90 text-gray-800 px-2 py-1 rounded-full text-sm font-medium">
                    {sticker.emoji}
                  </div>

                  {/* Favorite button */}
                  {sticker.data && !sticker.error && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(sticker.id);
                      }}
                      className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
                        sticker.favorite
                          ? 'bg-red-500 text-white'
                          : 'bg-white/80 text-gray-600 hover:bg-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${sticker.favorite ? 'fill-current' : ''}`} />
                    </button>
                  )}

                  {/* WhatsApp optimized badge */}
                  {sticker.whatsappOptimized && !sticker.error && (
                    <div className="absolute bottom-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      WhatsApp
                    </div>
                  )}
                </div>

                <Card.Content>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {sticker.name}
                      </h3>
                      {sticker.error && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                          {sticker.error}
                        </p>
                      )}
                    </div>
                    {sticker.data && !sticker.error && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(sticker);
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card.Content>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* WhatsApp optimization info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <Card.Header>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                ✅ Optimizado para WhatsApp
              </h2>
            </Card.Header>
            <Card.Content>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Especificaciones técnicas:</h3>
                  <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• Dimensiones: 512 x 512 píxeles</li>
                    <li>• Formato: PNG optimizado</li>
                    <li>• Tamaño: Menos de 500KB cada uno</li>
                    <li>• Fondo: Limpio y contrastado</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Beneficios:</h3>
                  <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• Máxima calidad en chats</li>
                    <li>• Carga rápida en cualquier conexión</li>
                    <li>• Compatible con todos los dispositivos</li>
                    <li>• Visibilidad perfecta en cualquier fondo</li>
                  </ul>
                </div>
              </div>
            </Card.Content>
          </Card>
        </motion.div>

        {/* Usage instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
            <Card.Header>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                📱 Cómo usar tus stickers en WhatsApp
              </h2>
            </Card.Header>
            <Card.Content>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Descarga los stickers que más te gusten</li>
                <li>Abre WhatsApp y ve a cualquier conversación</li>
                <li>Toca el ícono de emoji y luego el de stickers</li>
                <li>Toca el ícono "+" para agregar nuevos stickers</li>
                <li>Selecciona las imágenes descargadas y ¡listo!</li>
              </ol>
            </Card.Content>
          </Card>
        </motion.div>
      </div>

      {/* Sticker preview modal */}
      {selectedSticker && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedSticker(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {(selectedSticker.filePath || selectedSticker.data) && !selectedSticker.error ? (
              <img
                src={selectedSticker.filePath ? selectedSticker.filePath : `data:${selectedSticker.mimeType || 'image/png'};base64,${selectedSticker.data}`}
                alt={selectedSticker.name}
                className="w-full h-64 object-contain rounded-lg mb-4 bg-white"
              />
            ) : (
              <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-lg mb-4">
                <div className="text-center">
                  <div className="text-6xl mb-2">{selectedSticker.emoji}</div>
                  <p className="text-gray-500 dark:text-gray-400">Error generando sticker</p>
                  <p className="text-sm text-red-500 dark:text-red-400 mt-2">{selectedSticker.error}</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {selectedSticker.emoji} {selectedSticker.name}
                </h3>
                {selectedSticker.whatsappOptimized && (
                  <p className="text-sm text-green-600 dark:text-green-400">✓ Optimizado para WhatsApp</p>
                )}
              </div>
              {(selectedSticker.filePath || selectedSticker.data) && !selectedSticker.error && (
                <Button onClick={() => handleDownload(selectedSticker)}>
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}