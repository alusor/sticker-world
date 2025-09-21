import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import ImageUploader from '@/components/ui/ImageUploader';
import StyleSelector from '@/components/ui/StyleSelector';
import { compressImage } from '@/lib/imageCompression';

const STEPS = {
  UPLOAD: 1,
  STYLE: 2
};

export default function CreatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(STEPS.UPLOAD);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleImageSelect = (file, preview) => {
    setSelectedImage(file);
    setImagePreview(preview);
  };

  const handleStyleSelect = (style) => {
    setSelectedStyle(style);
  };

  const handleNext = async () => {
    if (currentStep === STEPS.UPLOAD && selectedImage) {
      setCurrentStep(STEPS.STYLE);
    } else if (currentStep === STEPS.STYLE && selectedStyle) {
      await handleGenerate();
    }
  };

  const handleBack = () => {
    if (currentStep === STEPS.STYLE) {
      setCurrentStep(STEPS.UPLOAD);
    } else {
      router.push('/');
    }
  };

  const handleGenerate = async () => {
    const sessionId = Date.now().toString();
    setIsGenerating(true);

    try {
      // Comprimir la imagen antes de guardar
      const compressedImage = await compressImage(selectedImage, 1024, 0.8);

      // Almacenar datos de la sesión en localStorage para la página de generación
      const sessionData = {
        sessionId,
        style: selectedStyle,
        imageData: compressedImage, // Use compressed image
        timestamp: Date.now()
      };

      localStorage.setItem(`sticker_session_${sessionId}`, JSON.stringify(sessionData));

      // Redirigir a la página de generación con animaciones
      router.push(`/generate/${sessionId}?style=${selectedStyle.id}&poses=emotional`);

    } catch (error) {
      console.error('Error compressing image:', error);
      // Fallback to original image if compression fails
      const sessionData = {
        sessionId,
        style: selectedStyle,
        imageData: imagePreview,
        timestamp: Date.now()
      };

      localStorage.setItem(`sticker_session_${sessionId}`, JSON.stringify(sessionData));
      router.push(`/generate/${sessionId}?style=${selectedStyle.id}&poses=emotional`);
    } finally {
      setIsGenerating(false);
    }
  };

  const canProceed = () => {
    if (isGenerating) return false;
    if (currentStep === STEPS.UPLOAD) return selectedImage;
    if (currentStep === STEPS.STYLE) return selectedStyle;
    return false;
  };

  const stepVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Crear tus stickers
          </h1>

          {/* Progress bar */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep >= STEPS.UPLOAD
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }
              `}>
                1
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep >= STEPS.UPLOAD
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                Subir imagen
              </span>
            </div>

            <div className={`w-12 h-0.5 ${
              currentStep >= STEPS.STYLE
                ? 'bg-blue-600'
                : 'bg-gray-300 dark:bg-gray-600'
            }`} />

            <div className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep >= STEPS.STYLE
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }
              `}>
                2
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep >= STEPS.STYLE
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                Elegir estilo
              </span>
            </div>
          </div>
        </div>

        {/* Step content */}
        <div className="relative min-h-[500px]">
          <AnimatePresence mode="wait" custom={currentStep}>
            {currentStep === STEPS.UPLOAD && (
              <motion.div
                key="upload"
                custom={currentStep}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                    Sube la foto de tu mascota
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Selecciona una imagen clara de tu mascota para obtener mejores resultados
                  </p>
                </div>

                <ImageUploader
                  onImageSelect={handleImageSelect}
                />
              </motion.div>
            )}

            {currentStep === STEPS.STYLE && (
              <motion.div
                key="style"
                custom={currentStep}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <StyleSelector
                  onStyleSelect={handleStyleSelect}
                  selectedStyle={selectedStyle}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center mt-12">
          <Button
            variant="outline"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === STEPS.UPLOAD ? 'Volver al inicio' : 'Anterior'}
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || isGenerating}
            className="min-w-[140px]"
          >
            {currentStep === STEPS.STYLE ? (
              <>
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Preparando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generar stickers
                  </>
                )}
              </>
            ) : (
              <>
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}