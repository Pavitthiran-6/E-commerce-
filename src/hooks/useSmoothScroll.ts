import { useEffect } from 'react';
import Lenis from 'lenis';

export function useSmoothScroll(containerRef?: React.RefObject<HTMLDivElement | null>, ease = 0.09) {
  useEffect(() => {
    // Only apply smooth scrolling on desktop (min-width: 1024px)
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    
    let lenis: Lenis | null = null;
    let animationFrameId: number;

    const initLenis = () => {
      if (mediaQuery.matches) {
        if (!lenis) {
          lenis = new Lenis({
            // If containerRef is provided, use it. Otherwise defaults to Window
            wrapper: containerRef?.current || window,
            content: containerRef?.current?.firstElementChild as HTMLElement || document.documentElement,
            lerp: ease,
            smoothWheel: true,
          });

          const raf = (time: number) => {
            lenis?.raf(time);
            animationFrameId = requestAnimationFrame(raf);
          };

          animationFrameId = requestAnimationFrame(raf);
        }
      } else {
        if (lenis) {
          lenis.destroy();
          lenis = null;
          cancelAnimationFrame(animationFrameId);
        }
      }
    };

    // Initialize on mount
    initLenis();

    // Re-evaluate on resize
    mediaQuery.addEventListener('change', initLenis);

    return () => {
      mediaQuery.removeEventListener('change', initLenis);
      if (lenis) {
        lenis.destroy();
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [containerRef, ease]);
}
