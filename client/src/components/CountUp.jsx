import { useEffect, useState } from 'react';
import { useInView } from '../hooks/useInView.js';

/**
 * Animates a number from 0 (or fromValue) to value when the element enters the viewport.
 * @param {number} value - Target number
 * @param {number} duration - Animation duration in ms
 * @param {number} decimals - Decimal places (e.g. 2 for money)
 * @param {string} prefix - e.g. "£"
 * @param {string} suffix - e.g. ".00"
 * @param {number} fromValue - Start value (default 0)
 */
export default function CountUp({
  value,
  duration = 1500,
  decimals = 0,
  prefix = '',
  suffix = '',
  fromValue = 0,
  className = '',
}) {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });
  const [displayValue, setDisplayValue] = useState(fromValue);
  const startRef = useState(() => ({ started: false }))[0];

  useEffect(() => {
    startRef.started = false;
  }, [value, startRef]);

  useEffect(() => {
    if (!inView || startRef.started) return;
    startRef.started = true;

    const start = fromValue;
    const end = typeof value === 'number' ? value : parseFloat(value) || 0;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - (1 - progress) ** 3;
      const current = start + (end - start) * eased;
      setDisplayValue(current);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [inView, value, duration, fromValue, startRef]);

  const formatted =
    decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue);

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
