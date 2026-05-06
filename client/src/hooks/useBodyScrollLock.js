import { useEffect } from 'react';

/**
 * Prevent the page behind a modal from scrolling while the overlay is mounted.
 */
export function useBodyScrollLock(locked = true) {
  useEffect(() => {
    if (!locked) return;
    const html = document.documentElement;
    const body = document.body;
    const prevBody = body.style.overflow;
    const prevHtml = html.style.overflow;
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prevBody;
      html.style.overflow = prevHtml;
    };
  }, [locked]);
}
