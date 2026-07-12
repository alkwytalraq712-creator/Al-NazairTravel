import { motion } from 'framer-motion';

export function Scene3Visas() {
  return (
    <motion.div 
      className="absolute inset-0 z-30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: '-10%', filter: 'blur(10px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div 
        className="absolute inset-0"
        initial={{ scale: 1.1, x: 20 }}
        animate={{ scale: 1, x: 0 }}
        transition={{ duration: 5, ease: 'linear' }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/passport-bg.jpg`}
          className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-[var(--color-bg-dark)]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-dark)] via-transparent to-[var(--color-bg-dark)] opacity-80" />
      </motion.div>

      <div className="relative h-full flex flex-col items-center justify-center text-center px-8">
        <motion.div
          className="w-24 h-24 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mb-8 border border-[var(--color-accent)]/30 backdrop-blur-sm"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1.2, delay: 0.3, type: 'spring', bounce: 0.4 }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </motion.div>

        <div className="overflow-hidden">
          <motion.h2
            className="ar-text text-6xl md:text-8xl font-bold text-white mb-6 drop-shadow-xl"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            تأشيرات
          </motion.h2>
        </div>

        <motion.p
          className="ar-text text-2xl md:text-4xl text-[var(--color-text-inverse)] drop-shadow-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          إصدار التأشيرات بسهولة <span className="text-[var(--color-primary)]">وسرعة</span>
        </motion.p>
        
        <motion.div 
          className="mt-12 flex flex-wrap justify-center gap-4 max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          {['شنغن', 'بريطانيا', 'أمريكا', 'والمزيد'].map((dest, i) => (
            <motion.div 
              key={dest}
              className="px-6 py-2 rounded-full glass-panel ar-text text-lg text-[var(--color-gold-light)] border border-[var(--color-gold-light)]/30"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.8 + (i * 0.15) }}
            >
              {dest}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
