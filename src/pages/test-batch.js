import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Play, RotateCcw, Settings, Download, Info, Zap, Users } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ProgressTracker from '@/components/ui/ProgressTracker';
import MetricsDisplay from '@/components/ui/MetricsDisplay';
import { compressImage, getImageInfo } from '@/lib/imageCompression';

export default function TestBatchPage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('cartoon');
  const [selectedMode, setSelectedMode] = useState('sequential');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({});
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [imageInfo, setImageInfo] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const styles = [
    { id: 'cartoon', name: 'Cartoon', emoji: '🎨' },
    { id: 'anime', name: 'Anime', emoji: '✨' },
    { id: 'watercolor', name: 'Acuarela', emoji: '🎭' },
    { id: 'pixel', name: 'Pixel Art', emoji: '🎮' },
    { id: 'minimalist', name: 'Minimalista', emoji: '⚪' },
    { id: 'realistic', name: 'Realista', emoji: '📸' },
    { id: 'pusheen', name: 'Pusheen', emoji: '😸' }
  ];

  const modes = [
    {
      id: 'sequential',
      name: 'Secuencial',
      description: 'Genera 1 sticker a la vez. Mejor para medir tiempo promedio.',
      icon: Users,
      color: 'blue'
    },
    {
      id: 'parallel',
      name: 'Paralelo',
      description: 'Genera 6 stickers simultáneamente. Mejor para medir tiempo total.',
      icon: Zap,
      color: 'yellow'
    }
  ];

  // Variaciones emocionales que se van a generar
  const testVariations = [
    { id: 'sleeping_side', name: 'Acostado Durmiendo', emoji: '😴' },
    { id: 'crying_sad', name: 'Lloroso/Triste', emoji: '😢' },
    { id: 'super_happy', name: 'Súper Feliz', emoji: '😊' },
    { id: 'working_laptop', name: 'Trabajando en Laptop', emoji: '💻' },
    { id: 'sleeping_pillow', name: 'Durmiendo con Almohada', emoji: '🛏️' },
    { id: 'hungry_drooling', name: 'Hambriento', emoji: '🍽️' }
  ];

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setIsCompressing(false);

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    try {
      const info = await getImageInfo(file);
      setImageInfo(info);

      if (file.size > 1024 * 1024) {
        setIsCompressing(true);
        const compressedImage = await compressImage(file, 1024, 0.8);
        setSelectedImage(compressedImage);
        setImagePreview(compressedImage);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
          setSelectedImage(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      setError('Error procesando la imagen: ' + error.message);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage || !selectedStyle || !selectedMode) return;

    setIsGenerating(true);
    setError(null);
    setResults(null);
    setProgress({ current: 0, total: 6, status: 'starting' });

    try {
      const response = await fetch('/api/test-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: selectedImage,
          style: selectedStyle,
          mode: selectedMode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.message || 'Error generating stickers');
      }

      if (data.success) {
        setResults(data.results);
        setProgress({ current: 6, total: 6, status: 'completed' });
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Generation error:', error);
      setError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadAll = () => {
    if (!results?.stickers) return;

    results.stickers.forEach((sticker, index) => {
      if (sticker.data && !sticker.error) {
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = `data:${sticker.mimeType};base64,${sticker.data}`;
          link.download = `${sticker.name}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, index * 500);
      }
    });
  };

  const reset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResults(null);
    setError(null);
    setImageInfo(null);
    setIsCompressing(false);
    setProgress({});
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🚀 Prueba Avanzada - Generación por Lotes
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Genera 6 poses emocionales expresivas y mide tiempos para planificar animaciones
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {testVariations.map((variation) => (
              <span key={variation.id} className="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                {variation.emoji} {variation.name}
              </span>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Panel de configuración */}
          <div className="space-y-6">
            {/* Upload de imagen */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  1. Imagen de Prueba
                </h2>
              </Card.Header>
              <Card.Content>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />

                {isCompressing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      <span className="text-blue-700 dark:text-blue-300">Comprimiendo imagen...</span>
                    </div>
                  </motion.div>
                )}

                {imagePreview && !isCompressing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4"
                  >
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    {imageInfo && (
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                          <Info className="w-4 h-4" />
                          <span>
                            {imageInfo.width}×{imageInfo.height}px •
                            {(imageInfo.size / 1024 / 1024).toFixed(2)}MB
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </Card.Content>
            </Card>

            {/* Selector de estilo */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  2. Estilo Artístico
                </h2>
              </Card.Header>
              <Card.Content>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {styles.map(style => (
                    <option key={style.id} value={style.id}>
                      {style.emoji} {style.name}
                    </option>
                  ))}
                </select>
              </Card.Content>
            </Card>

            {/* Selector de modo */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  3. Modo de Generación
                </h2>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  {modes.map(mode => {
                    const Icon = mode.icon;
                    const isSelected = selectedMode === mode.id;

                    return (
                      <motion.div
                        key={mode.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? `border-${mode.color}-500 bg-${mode.color}-50 dark:bg-${mode.color}-900/20`
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => setSelectedMode(mode.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <Icon className={`w-6 h-6 mt-1 ${
                            isSelected
                              ? `text-${mode.color}-600 dark:text-${mode.color}-400`
                              : 'text-gray-400'
                          }`} />
                          <div className="flex-1">
                            <h3 className={`font-semibold ${
                              isSelected
                                ? `text-${mode.color}-900 dark:text-${mode.color}-100`
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {mode.name}
                            </h3>
                            <p className={`text-sm ${
                              isSelected
                                ? `text-${mode.color}-700 dark:text-${mode.color}-300`
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {mode.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </Card.Content>
            </Card>

            {/* Controles */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  4. Ejecutar Prueba
                </h2>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={!selectedImage || !selectedStyle || !selectedMode || isGenerating}
                    className="w-full"
                    size="lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {isGenerating ? 'Generando...' : `Generar 6 Stickers (${selectedMode})`}
                  </Button>

                  <div className="flex space-x-2">
                    <Button onClick={reset} variant="outline" className="flex-1">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reiniciar
                    </Button>

                    {results && (
                      <Button onClick={handleDownloadAll} variant="outline" className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Descargar Todo
                      </Button>
                    )}
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Panel de resultados */}
          <div className="space-y-6">
            {/* Progress tracker */}
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Progreso de Generación
                </h2>
              </Card.Header>
              <Card.Content>
                <ProgressTracker
                  mode={selectedMode}
                  progress={progress}
                  variations={testVariations}
                  isActive={isGenerating}
                />
              </Card.Content>
            </Card>

            {/* Error display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                    <Card.Content>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-white text-sm">!</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-red-900 dark:text-red-100">Error en la generación</h3>
                          <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
                        </div>
                      </div>
                    </Card.Content>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Galería de resultados */}
            <AnimatePresence>
              {results && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <Card.Header>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Stickers Generados ({results.metrics.successful}/{results.stickers.length})
                      </h2>
                    </Card.Header>
                    <Card.Content>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {results.stickers.map((sticker, index) => (
                          <motion.div
                            key={sticker.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative group"
                          >
                            {sticker.error ? (
                              <div className="aspect-square bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                  <span className="text-red-500 text-2xl mb-2 block">❌</span>
                                  <p className="text-xs text-red-600 dark:text-red-400">{sticker.name}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="aspect-square bg-white rounded-lg border overflow-hidden">
                                <img
                                  src={`data:${sticker.mimeType};base64,${sticker.data}`}
                                  alt={sticker.name}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center pointer-events-none">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center">
                                    <p className="text-white text-sm font-medium drop-shadow-lg">{sticker.name}</p>
                                    {sticker.generationTime && (
                                      <p className="text-white text-xs drop-shadow-lg">
                                        {(sticker.generationTime / 1000).toFixed(1)}s
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </Card.Content>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Métricas */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <MetricsDisplay
                results={results}
                onExport={(data) => console.log('Exported metrics:', data)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}