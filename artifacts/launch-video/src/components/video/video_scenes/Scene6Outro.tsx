import { motion } from 'framer-motion';

export function Scene6Outro() {
  return (
    <motion.div 
      className="absolute inset-0 z-40 bg-[var(--color-bg-dark)] flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.3 }}
        transition={{ duration: 4 }}
      >
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--color-accent),_transparent_70%)] opacity-40 mix-blend-screen" />
      </motion.div>

      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
           initial={{ rotate: -10, scale: 0.8 }}
           animate={{ rotate: 0, scale: 1 }}
           transition={{ duration: 1.5, delay: 0.8, type: 'spring' }}
           className="relative mb-8"
        >
          <div className="absolute inset-0 bg-[var(--color-primary)] blur-[60px] opacity-30 rounded-full transform scale-150" />
          <img 
            src={`${import.meta.env.BASE_URL}images/qema-logo.png`}
            className="w-48 md:w-64 object-contain relative z-10 drop-shadow-2xl"
          />
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          <h2 className="ar-text text-5xl md:text-7xl font-bold text-white mb-4">قمة النظائر</h2>
          <p className="ar-text text-2xl md:text-3xl text-[var(--color-accent)] mb-12">وجهتك الأولى للسفر</p>

          <motion.div
            className="flex items-center gap-6 justify-center bg-white/5 border border-white/10 rounded-full py-4 px-8 backdrop-blur-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 2, type: 'spring' }}
          >
            <span className="ar-text text-xl md:text-2xl text-white font-bold">حمل التطبيق الآن</span>
            <div className="flex gap-3">
              {/* App Store style icon */}
              <div className="w-12 h-12 bg-white/10 hover:bg-white/20 transition-colors rounded-full flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.76 1.54.04 2.86.72 3.65 1.88-3.22 1.95-2.68 6.13.43 7.4-1 2.37-1.85 3.32-2.75 3.65zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              </div>
              {/* Play Store style icon */}
              <div className="w-12 h-12 bg-white/10 hover:bg-white/20 transition-colors rounded-full flex items-center justify-center pl-1">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <path d="M5 2.5v19l16-9.5-16-9.5z"/>
                </svg>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
