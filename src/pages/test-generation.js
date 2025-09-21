import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, Download, AlertCircle, CheckCircle, Info } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { compressImage, getImageInfo } from '@/lib/imageCompression';

export default function TestGenerationPage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('cartoon');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSticker, setGeneratedSticker] = useState(null);
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
      // Obtener información de la imagen original
      const info = await getImageInfo(file);
      setImageInfo(info);

      // Si la imagen es muy grande, comprimirla
      if (file.size > 1024 * 1024) { // Mayor a 1MB
        setIsCompressing(true);
        console.log(`Imagen original: ${(file.size / 1024 / 1024).toFixed(2)}MB, comprimiendo...`);

        const compressedImage = await compressImage(file, 1024, 0.8);
        setSelectedImage(compressedImage);
        setImagePreview(compressedImage);

        console.log('Imagen comprimida exitosamente');
      } else {
        // Imagen pequeña, usar directamente
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
          setSelectedImage(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Error procesando imagen:', error);
      setError('Error procesando la imagen: ' + error.message);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage || !selectedStyle) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedSticker(null);

    try {
      const response = await fetch('/api/test-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: selectedImage,
          style: selectedStyle
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.message || 'Error generating sticker');
      }

      if (data.success) {
        setGeneratedSticker(data.sticker);
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

  const handleDownload = () => {
    if (!generatedSticker) return;

    const link = document.createElement('a');
    link.href = `data:${generatedSticker.mimeType};base64,${generatedSticker.data}`;
    link.download = `${generatedSticker.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setGeneratedSticker(null);
    setError(null);
    setImageInfo(null);
    setIsCompressing(false);
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🧪 Prueba de Generación de Stickers
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Prueba básica con Gemini 2.5 Flash Image - 1 sticker por vez
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  1. Sube una imagen
                </h2>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
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
                        <span className="text-blue-700 dark:text-blue-300 font-medium">
                          Comprimiendo imagen...
                        </span>
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
                              {(imageInfo.size / 1024 / 1024).toFixed(2)}MB •
                              {imageInfo.type}
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  2. Selecciona estilo
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

            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  3. Generar
                </h2>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={!selectedImage || !selectedStyle || isGenerating}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generar Sticker de Prueba
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={reset}
                    variant="outline"
                    className="w-full"
                  >
                    Reiniciar
                  </Button>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Result Section */}
          <div>
            <Card className="h-full">
              <Card.Header>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Resultado
                </h2>
              </Card.Header>
              <Card.Content className="flex flex-col items-center justify-center min-h-[400px]">
                <AnimatePresence mode="wait">
                  {isGenerating && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center"
                    >
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-300">
                        Generando sticker con Gemini...
                      </p>
                    </motion.div>
                  )}

                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center"
                    >
                      <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-red-600 dark:text-red-400 mb-4">
                        Error: {error}
                      </p>
                      <Button onClick={() => setError(null)} variant="outline" size="sm">
                        Cerrar
                      </Button>
                    </motion.div>
                  )}

                  {generatedSticker && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center w-full"
                    >
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-white" />
                      </div>

                      <img
                        src={`data:${generatedSticker.mimeType};base64,${generatedSticker.data}`}
                        alt={generatedSticker.name}
                        className="w-full max-w-sm mx-auto rounded-lg border mb-4"
                      />

                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        ¡Sticker generado!
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Estilo: {styles.find(s => s.id === generatedSticker.style)?.name}
                      </p>

                      <Button onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                      </Button>
                    </motion.div>
                  )}

                  {!isGenerating && !error && !generatedSticker && (
                    <motion.div
                      key="waiting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center"
                    >
                      <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Sube una imagen y selecciona un estilo para comenzar
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card.Content>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <Card.Content>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📋 Instrucciones de prueba
            </h3>
            <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200 text-sm">
              <li>Sube una imagen clara de una mascota</li>
              <li>Selecciona uno de los 6 estilos disponibles</li>
              <li>Haz clic en "Generar" y espera el resultado</li>
              <li>Si funciona, descargar el sticker generado</li>
              <li>Si hay errores, revisa la consola del navegador</li>
            </ul>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}