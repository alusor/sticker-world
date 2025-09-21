import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Card from './Card';

const StyleSelector = ({ onStyleSelect, selectedStyle }) => {
  const styles = [
    {
      id: 'cartoon',
      name: 'Cartoon',
      description: 'Estilo caricaturesco y colorido',
      preview: '🎨',
      color: 'from-yellow-400 to-orange-500',
      category: 'popular'
    },
    {
      id: 'pusheen',
      name: 'Pusheen',
      description: 'Adorable estilo Pusheen kawaii',
      preview: '😸',
      color: 'from-gray-300 to-gray-500',
      category: 'trending'
    },
    {
      id: 'anime',
      name: 'Anime',
      description: 'Estilo manga japonés',
      preview: '✨',
      color: 'from-pink-400 to-purple-500',
      category: 'popular'
    },
    {
      id: 'realistic',
      name: 'Realista',
      description: 'Mantiene la apariencia natural',
      preview: '📸',
      color: 'from-green-400 to-blue-500',
      category: 'classic'
    },
    {
      id: 'watercolor',
      name: 'Acuarela',
      description: 'Efecto de pintura con acuarelas',
      preview: '🎭',
      color: 'from-blue-400 to-teal-500',
      category: 'artistic'
    },
    {
      id: 'pixel',
      name: 'Pixel Art',
      description: 'Estilo retro de videojuegos',
      preview: '🎮',
      color: 'from-purple-400 to-indigo-500',
      category: 'retro'
    },
    {
      id: 'minimalist',
      name: 'Minimalista',
      description: 'Líneas simples y limpias',
      preview: '⚪',
      color: 'from-gray-400 to-gray-600',
      category: 'artistic'
    }
  ];

  const handleStyleClick = (style) => {
    onStyleSelect?.(style);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Elige un estilo artístico
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Selecciona el estilo que mejor represente a tu mascota
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {styles.map((style, index) => (
          <motion.div
            key={style.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card
              hover
              className={`
                cursor-pointer transition-all duration-200 relative overflow-hidden
                ${selectedStyle?.id === style.id
                  ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800'
                  : 'hover:shadow-lg'
                }
              `}
              onClick={() => handleStyleClick(style)}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${style.color} opacity-10`} />

              {/* Trending badge */}
              {style.category === 'trending' && (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10">
                  🔥 NUEVO
                </div>
              )}

              {/* Selected indicator */}
              {selectedStyle?.id === style.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-1 z-10"
                >
                  <Check className="w-4 h-4" />
                </motion.div>
              )}

              <Card.Content className="relative z-10">
                <div className="text-center">
                  {/* Preview emoji */}
                  <div className="text-4xl mb-4">{style.preview}</div>

                  {/* Style name */}
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {style.name}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {style.description}
                  </p>
                </div>
              </Card.Content>
            </Card>
          </motion.div>
        ))}
      </div>

      {selectedStyle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">{selectedStyle.preview}</div>
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                Estilo seleccionado: {selectedStyle.name}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {selectedStyle.description}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StyleSelector;