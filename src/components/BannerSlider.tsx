import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { BannerSlide } from '../types';

interface BannerSliderProps {
  banners: BannerSlide[];
  onActionClick: (target: 'order' | 'products' | 'contact') => void;
}

export const BannerSlider: React.FC<BannerSliderProps> = ({ banners, onActionClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length, isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  if (!banners || banners.length === 0) return null;

  const current = banners[currentIndex];

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-md group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
          className={`relative min-h-[175px] bg-gradient-to-br ${current.bgGradient || 'from-teal-700 to-slate-900'} p-5 text-white flex flex-col justify-between overflow-hidden`}
        >
          {/* Subtle background graphic */}
          {current.imageUrl && (
            <div className="absolute inset-0 opacity-15 mix-blend-overlay">
              <img
                src={current.imageUrl}
                alt="Banner graphic"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          {/* Tag & Content */}
          <div className="relative z-10 space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-teal-100 uppercase tracking-wider border border-white/25">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>{current.tag}</span>
            </div>

            <h2 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight drop-shadow-xs">
              {current.title}
            </h2>

            <p className="text-xs text-teal-50 line-clamp-2 leading-relaxed max-w-[90%] opacity-90">
              {current.description}
            </p>
          </div>

          {/* Action CTA & slide progress */}
          <div className="relative z-10 pt-3 flex items-center justify-between">
            <button
              onClick={() => onActionClick(current.actionTarget)}
              className="inline-flex items-center gap-1.5 bg-white text-teal-900 hover:bg-teal-50 font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-md transition transform active:scale-95"
            >
              <span>{current.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-700" />
            </button>

            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {banners.map((b, idx) => (
                <button
                  key={b.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'w-5 bg-white'
                      : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next controls */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-xs opacity-0 group-hover:opacity-100 transition"
            aria-label="Previous Banner"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-xs opacity-0 group-hover:opacity-100 transition"
            aria-label="Next Banner"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};
