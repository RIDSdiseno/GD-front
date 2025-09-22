import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  images: string[];           // rutas absolutas desde /public
  intervalMs?: number;        // tiempo entre cambios (ms)
  pauseOnHover?: boolean;     // pausa al pasar el mouse
  showControls?: boolean;     // flechas
  showIndicators?: boolean;   // bullets
  className?: string;         // clases extra si necesitas
};

const LoginCarousel: React.FC<Props> = ({
  images,
  intervalMs = 4000,
  pauseOnHover = true,
  showControls = true,
  showIndicators = true,
  className = "",
}) => {
  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);
  const timer = useRef<number | null>(null);

  // Preload para evitar parpadeos
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  const next = () => setIdx((i) => (i + 1) % images.length);
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);

  // Respeta prefers-reduced-motion
  const reducedMotion = useMemo(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    []
  );

  // Autoplay
  useEffect(() => {
    if (reducedMotion || images.length <= 1) return;
    if (pauseOnHover && hover) return;
    timer.current = window.setInterval(next, intervalMs);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [hover, intervalMs, images.length, reducedMotion, pauseOnHover]);

  if (!images.length) return null;

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      onMouseEnter={() => pauseOnHover && setHover(true)}
      onMouseLeave={() => pauseOnHover && setHover(false)}
      aria-roledescription="carousel"
    >
      {/* Slides en stack con cross-fade */}
      <div className="absolute inset-0">
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`Evento ${i + 1}`}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 will-change-[opacity] ${i === idx ? "opacity-100" : "opacity-0"}`}
            draggable={false}
          />
        ))}
      </div>

      {/* Overlay para contraste de textos encima */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/45 via-black/30 to-transparent md:from-black/35 md:via-black/25" />

      {/* Controles */}
      {showControls && images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/35 hover:bg-black/45 text-white p-2 backdrop-blur ring-1 ring-white/20"
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/35 hover:bg-black/45 text-white p-2 backdrop-blur ring-1 ring-white/20"
            aria-label="Siguiente"
          >
            ›
          </button>
        </>
      )}

      {/* Indicadores */}
      {showIndicators && images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Ir a la imagen ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-2 bg-white/60 hover:bg-white/80"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LoginCarousel;
