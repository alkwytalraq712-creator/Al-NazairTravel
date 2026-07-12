import { motion } from 'framer-motion';

export function Scene2Flights() {
  return (
    <motion.div 
      className="absolute inset-0 z-30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: '-10%', filter: 'blur(10px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div 
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 5, ease: 'linear' }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/flights-bg.jpg`}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg-dark)] via-[rgba(13,21,38,0.7)] to-transparent" />
      </motion.div>

      <div className="relative h-full flex flex-col justify-center px-16 md:px-32 w-full lg:w-2/3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100px' }}
          transition={{ duration: 1, delay: 0.5, ease: 'easeInOut' }}
          className="h-1 bg-[var(--color-primary)] mb-8"
        />
        <div className="overflow-hidden mb-4">
          <motion.h2
            className="ar-text text-7xl md:text-8xl font-bold text-white drop-shadow-lg"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            طيران
          </motion.h2>
        </div>
        <div className="overflow-hidden mb-12">
          <motion.p
            className="ar-text text-2xl md:text-3xl text-[var(--color-gold-light)] drop-shadow-md"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            احجز رحلتك إلى أي مكان في العالم
          </motion.p>
        </div>

        {/* Abstract floating ticket UI */}
        <motion.div
          className="glass-panel p-6 rounded-2xl w-full max-w-md backdrop-blur-xl border border-[var(--color-accent)]/30"
          initial={{ opacity: 0, y: 50, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.2, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformPerspective: 1000 }}
        >
          <div className="flex justify-between items-center mb-6">
             <div className="text-left">
                <p className="en-text text-sm text-[var(--color-text-muted)]">FROM</p>
                <p className="en-text text-2xl text-white font-bold">RUH</p>
             </div>
             <div className="flex-1 px-4 relative">
                <div className="h-[1px] w-full bg-[var(--color-primary)]/50 absolute top-1/2 -translate-y-1/2 border-dashed border-t" />
                <motion.div 
                  initial={{ left: 0 }}
                  animate={{ left: '100%' }}
                  transition={{ duration: 2, delay: 2, ease: "easeInOut" }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[var(--color-primary)] text-2xl"
                >
                  ✈
                </motion.div>
             </div>
             <div className="text-right">
                <p className="en-text text-sm text-[var(--color-text-muted)]">TO</p>
                <p className="en-text text-2xl text-white font-bold">DXB</p>
             </div>
          </div>
          <div className="flex justify-between items-end">
             <div>
               <p className="ar-text text-sm text-[var(--color-text-muted)]">التاريخ</p>
               <p className="en-text text-white font-medium">15 OCT</p>
             </div>
             <div className="text-right">
               <p className="ar-text text-sm text-[var(--color-text-muted)]">الدرجة</p>
               <p className="ar-text text-white font-medium">الأولى</p>
             </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
