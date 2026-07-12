import { motion } from 'framer-motion';

export function Scene5Tickets() {
  return (
    <motion.div 
      className="absolute inset-0 z-30 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div 
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/tickets-bg.jpg`}
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-[var(--color-bg-dark)]/60" />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl px-8">
        {/* Ticket graphic */}
        <motion.div
           className="w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row mb-12 relative"
           initial={{ rotateX: 60, y: 100, opacity: 0 }}
           animate={{ rotateX: 0, y: 0, opacity: 1 }}
           transition={{ duration: 1.5, delay: 0.4, type: 'spring', stiffness: 100 }}
           style={{ transformPerspective: 1200 }}
        >
          <div className="w-full md:w-2/3 bg-[var(--color-bg-light)] p-8 relative flex flex-col justify-between">
             <div className="absolute right-0 top-0 bottom-0 w-8 border-l-2 border-dashed border-[var(--color-text-muted)] opacity-30" />
             <div className="flex justify-between items-center mb-8">
               <img src={`${import.meta.env.BASE_URL}images/qema-logo.png`} className="w-12 h-12 object-contain" />
               <span className="ar-text text-2xl font-bold text-[var(--color-bg-dark)]">قمة النظائر</span>
             </div>
             <div className="flex justify-between items-center text-[var(--color-bg-dark)]">
                <div>
                   <h3 className="ar-text text-[var(--color-text-muted)] mb-1 text-sm">الراكب</h3>
                   <p className="ar-text text-2xl font-bold">ضيف مميز</p>
                </div>
                <div className="text-right">
                   <h3 className="ar-text text-[var(--color-text-muted)] mb-1 text-sm">الوجهة</h3>
                   <p className="ar-text text-2xl font-bold text-[var(--color-primary)]">العالم بين يديك</p>
                </div>
             </div>
          </div>
          <div className="w-full md:w-1/3 bg-[var(--color-primary)] p-8 flex flex-col justify-center items-center relative">
             <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 rounded-full z-10 hidden md:block backdrop-blur-sm" />
             <div className="absolute -left-4 -top-4 w-8 h-8 bg-black/20 rounded-full z-10 hidden md:block backdrop-blur-sm" />
             <div className="absolute -left-4 -bottom-4 w-8 h-8 bg-black/20 rounded-full z-10 hidden md:block backdrop-blur-sm" />
             
             <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 1.5, type: 'spring' }}
             >
                <div className="w-32 h-32 bg-white rounded-lg p-2 shadow-inner">
                  <div className="w-full h-full bg-[var(--color-bg-dark)] relative flex flex-wrap gap-1 p-2 justify-center items-center">
                    {/* Fake QR code grid */}
                    {Array.from({length: 16}).map((_, i) => (
                      <motion.div 
                        key={i}
                        className="w-[20%] h-[20%] bg-white rounded-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: Math.random() > 0.3 ? 1 : 0 }}
                        transition={{ duration: 0.5, delay: 2 + (i * 0.05) }}
                      />
                    ))}
                  </div>
                </div>
             </motion.div>
             <p className="ar-text text-white font-bold mt-4 text-center text-lg">تذكرتك جاهزة</p>
          </div>
        </motion.div>

        <div className="text-center">
           <div className="overflow-hidden mb-4">
             <motion.h2
               className="ar-text text-5xl md:text-7xl font-bold text-white drop-shadow-lg"
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               transition={{ duration: 1, delay: 1, ease: [0.16, 1, 0.3, 1] }}
             >
               التذكرة الإلكترونية
             </motion.h2>
           </div>
           <motion.p
             className="ar-text text-xl md:text-2xl text-[var(--color-gold-light)] drop-shadow-md"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 1, delay: 1.3 }}
           >
             حجزك وإصدار تذكرتك في ثوانٍ معدودة
           </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
