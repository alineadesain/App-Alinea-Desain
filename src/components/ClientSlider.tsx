import React, { useState, useEffect, useRef } from 'react';
import { Building2, ChevronLeft, ChevronRight, Award, ShieldCheck } from 'lucide-react';
import { ClientPartner } from '../types';

interface ClientSliderProps {
  clients: ClientPartner[];
}

export const ClientSlider: React.FC<ClientSliderProps> = ({ clients }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto slide step every 3 seconds
  useEffect(() => {
    if (clients.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % clients.length);
    }, 3200);

    return () => clearInterval(interval);
  }, [clients.length, isPaused]);

  if (!clients || clients.length === 0) return null;

  return (
    <div
      className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 space-y-3"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
            Dipercaya 50+ Instansi & Klien
          </h3>
        </div>
        <span className="text-[10px] font-medium text-slate-400">
          Geser Otomatis
        </span>
      </div>

      {/* Infinite continuous marquee track */}
      <div className="relative overflow-hidden py-1">
        <div className="animate-marquee-loop flex gap-3">
          {/* Double the array for seamless infinite loop */}
          {[...clients, ...clients].map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="flex-shrink-0 flex items-center gap-3 bg-slate-50/90 hover:bg-teal-50/70 border border-slate-200/80 hover:border-teal-300 rounded-xl px-3.5 py-2.5 transition group max-w-[260px] shadow-2xs"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 p-0.5">
                {item.logo ? (
                  <img
                    src={item.logo}
                    alt={item.nama}
                    className="w-full h-full object-cover rounded-md group-hover:scale-105 transition"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Building2 className="w-5 h-5 text-teal-600" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <h4 className="font-bold text-xs text-slate-800 truncate">
                    {item.nama}
                  </h4>
                  {item.kategori && (
                    <span className="text-[9px] px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded font-semibold flex-shrink-0">
                      {item.kategori}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 leading-tight">
                  {item.keterangan || 'Pesanan cetak berkala & merchandise'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Active Card Spotlight */}
      <div className="bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-cyan-50/90 border border-teal-100 rounded-xl p-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-xs">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-800 text-xs truncate">
              {clients[currentIndex]?.nama}
            </div>
            <div className="text-[10px] text-slate-600 line-clamp-1">
              {clients[currentIndex]?.keterangan}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 pl-2 flex-shrink-0">
          <button
            onClick={() =>
              setCurrentIndex(
                (prev) => (prev - 1 + clients.length) % clients.length
              )
            }
            className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:border-teal-400 text-slate-600 hover:text-teal-700 flex items-center justify-center transition text-xs shadow-2xs"
            aria-label="Sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() =>
              setCurrentIndex((prev) => (prev + 1) % clients.length)
            }
            className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:border-teal-400 text-slate-600 hover:text-teal-700 flex items-center justify-center transition text-xs shadow-2xs"
            aria-label="Berikutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
