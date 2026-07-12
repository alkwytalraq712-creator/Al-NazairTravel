import { motion } from 'framer-motion';

export function Scene4Packages() {
  return (
    <motion.div 
      className="absolute inset-0 z-30"
      initial={{ opacity: 0, clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ opacity: 1, clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div 
        className="absolute inset-0"
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ duration: 6, ease: 'easeOut' }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/destinations-bg.jpg`}
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[var(--color-bg-dark)] via-[rgba(13,21,38,0.5)] to-transparent" />
      </motion.div>

      <div className="relative h-full flex flex-col justify-center items-end text-right px-16 md:px-32 w-full">
        <motion.div
          className="w-16 h-16 rounded-lg bg-[var(--color-primary)] mb-6 flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20"
          initial={{ opacity: 0, rotate: 45, scale: 0 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, type: 'spring' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.2 7.8l-7.7 7.7-4-4-5.7 5.7" />
            <path d="M15 7h6v6" />
          </svg>
        </motion.div>

        <div className="overflow-hidden">
          <motion.h2
            className="ar-text text-6xl md:text-8xl font-bold text-white mb-4 drop-shadow-md"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            باقات سفر
          </motion.h2>
        </div>
        
        <div className="overflow-hidden mb-12">
          <motion.p
            className="ar-text text-2xl md:text-3xl text-[var(--color-gold-light)] max-w-xl drop-shadow-md"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            وجهات سياحية حول العالم مصممة خصيصاً لك ولعائلتك
          </motion.p>
        </div>

        {/* Floating image placeholders / cards */}
        <div className="flex gap-4 relative h-48 w-full max-w-lg justify-end mt-4">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="w-32 h-40 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md relative overflow-hidden"
              initial={{ opacity: 0, y: 100, rotate: Math.random() * 20 - 10 }}
              animate={{ opacity: 1, y: 0, rotate: (i - 2) * 8 }}
              transition={{ duration: 1, delay: 1.5 + i * 0.2, type: 'spring' }}
              style={{ transformOrigin: 'bottom center', zIndex: 10 - i }}
            >
               <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-dark)]/80 to-transparent z-10" />
               <div className="absolute bottom-3 left-0 right-0 text-center z-20">
                 <div className="w-1/2 h-1 bg-[var(--color-primary)] mx-auto rounded-full mb-2" />
               </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
