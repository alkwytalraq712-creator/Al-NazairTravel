import { motion } from 'framer-motion';

export function Scene1Intro() {
  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-[var(--color-bg-dark)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        className="flex flex-col items-center"
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/qema-logo.png`} 
          alt="Qema Al Nathair" 
          className="w-48 md:w-64 mb-8 object-contain drop-shadow-2xl"
        />
        <div className="overflow-hidden">
          <motion.h1 
            className="ar-text text-5xl md:text-7xl font-bold text-white mb-2"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
          >
            قمة النظائر
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h2 
            className="en-text text-[var(--color-accent)] text-xl md:text-2xl tracking-[0.3em] uppercase"
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 1.1 }}
          >
            Travel & Tourism
          </motion.h2>
        </div>
        <div className="overflow-hidden mt-6">
          <motion.p
             className="ar-text text-[var(--color-text-muted)] text-xl md:text-2xl"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 1, delay: 1.5 }}
          >
            للسياحة والسفر
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}
