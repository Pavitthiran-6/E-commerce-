import React, {
  createContext,
  useContext,
  useRef,
  type RefObject,
} from "react";
import { useSmoothScroll } from "../hooks/useSmoothScroll";

interface SmoothScrollContextValue {
  /** The resolved scrollable container ref (null = window scroll) */
  containerRef: RefObject<HTMLDivElement | null>;
}

/** Exported so CinematicText and other consumers can useContext() directly with null-safe access */
export const SmoothScrollContext = createContext<SmoothScrollContextValue | null>(null);

interface SmoothScrollProviderProps {
  children: React.ReactNode;
  /** Optional: pass an existing ref to a custom scroll container.
   *  If omitted, smooth scroll is applied to document.documentElement (window). */
  containerRef?: RefObject<HTMLDivElement | null>;
  /** Lerp ease factor. 0.09 = Apple-smooth, 0.12 = snappy. Default: 0.09 */
  ease?: number;
}

export function SmoothScrollProvider({
  children,
  containerRef: externalRef,
  ease = 0.09,
}: SmoothScrollProviderProps) {
  // Use the provided ref if available, otherwise it defaults to window scroll
  useSmoothScroll(externalRef, ease);

  return (
    <SmoothScrollContext.Provider value={{ containerRef: externalRef || { current: null } }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}

/**
 * useSmoothScrollContext — consume the scroll container ref anywhere in the tree.
 *
 * Example in a future page:
 *   const { containerRef } = useSmoothScrollContext();
 *   const { scrollYProgress } = useScroll({ container: containerRef });
 */
export function useSmoothScrollContext(): SmoothScrollContextValue {
  const ctx = useContext(SmoothScrollContext);
  if (!ctx) {
    throw new Error(
      "useSmoothScrollContext must be used inside <SmoothScrollProvider>"
    );
  }
  return ctx;
}
