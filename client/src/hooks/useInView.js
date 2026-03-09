import { useEffect, useState, useRef } from 'react';

/**
 * Returns a ref and whether the element is in the viewport.
 * Once inView becomes true, it stays true (animations don't reverse on scroll out).
 * @param {Object} options - { rootMargin?: string, threshold?: number, triggerOnce?: boolean }
 */
export function useInView(options = {}) {
  const { rootMargin = '0px 0px -40px 0px', threshold = 0.1, triggerOnce = true } = options;
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        } else if (!triggerOnce) {
          setInView(false);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold, triggerOnce]);

  return [ref, inView];
}
