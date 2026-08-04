import useReveal from '../../hooks/useReveal';
import styles from './Reveal.module.css';

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
      className={`${styles.reveal} ${visible ? styles.visible : ''} ${className}`.trim()}
      data-delay={delay || undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
