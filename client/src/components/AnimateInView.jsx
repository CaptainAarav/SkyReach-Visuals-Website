import { useInView } from '../hooks/useInView.js';

/**
 * Wraps children and runs an entrance animation when the element enters the viewport.
 * Uses reveal + animate-fade-in-up by default so content loads with animation on scroll.
 */
export default function AnimateInView({
  children,
  className = '',
  animation = 'animate-fade-in-up',
  as: Tag = 'div',
}) {
  const [ref, inView] = useInView({ threshold: 0.08, rootMargin: '0px 0px -30px 0px', triggerOnce: true });

  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? animation : ''} ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}
