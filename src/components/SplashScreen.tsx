import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './Logo';

export const SplashScreen: React.FC = () => {
  const [messageIndex, setMessageIndex] = React.useState(0);
  const messages = ["Iniciando SmileVision Pro", "Verificando autenticação..."];

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (messageIndex < messages.length - 1) {
        setMessageIndex(prev => prev + 1);
      }
    }, 2500); // Change message halfway through (assuming 5s total)
    return () => clearTimeout(timer);
  }, [messageIndex]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }
      }}
      className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center overflow-hidden touch-none h-[100dvh] w-full"
    >
      <div className="relative flex flex-col items-center px-6 w-full max-w-xs sm:max-w-sm">
        {/* Logo with Blur and Scale animation */}
        <motion.div
          initial={{ scale: 0.8, filter: 'blur(12px)', opacity: 0 }}
          animate={{ 
            scale: 1, 
            filter: 'blur(0px)', 
            opacity: 1,
            transition: { 
              duration: 1.5, 
              ease: "easeOut" 
            }
          }}
          className="mb-12 flex justify-center w-full"
        >
          <div className="w-32 h-32 sm:w-44 sm:h-44 flex items-center justify-center">
            <Logo size={undefined} className="w-full h-full" />
          </div>
        </motion.div>

        {/* Progress Line */}
        <div className="w-full max-w-[200px] h-[2px] bg-charcoal-100 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ 
              width: "100%",
              transition: { 
                duration: 2, 
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "loop"
              }
            }}
            className="h-full bg-primary-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
          />
        </div>

        {/* Subtle Text with Sequence */}
        <div className="h-6 mt-4 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={messages[messageIndex]}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-[10px] font-bold text-charcoal-400 uppercase tracking-[0.2em]"
            >
              {messages[messageIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Background subtle elements */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.03 }}
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />
    </motion.div>
  );
};
