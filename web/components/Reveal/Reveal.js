import useReveal from '../../hooks/useReveal';
import { cn } from '../../lib/utils';

const DELAY_MS = {
  1: 'delay-[60ms]',
  2: 'delay-[120ms]',
  3: 'delay-[180ms]',
  4: 'delay-[240ms]',
};

/**
 * Scroll-reveal wrapper for sections/cards.
 * as: 'div' | 'section' | 'article' | 'li'
 */
export default function Reveal({
  as: Tag = 'div',
  children,
  className = '',
  delay = 0,
  once = true,
  rootMargin,
  threshold,
  ...rest
}) {
  const { ref, visible } = useReveal({ once, rootMargin, threshold });

  return (
    <Tag
      ref={ref}
      className={cn(
        'transition-[opacity,transform] duration-700 ease-out will-change-[opacity,transform] motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[22px]',
        DELAY_MS[delay] || '',
        className
      )}
      data-delay={delay || undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
