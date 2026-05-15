import { memo } from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'rect' | 'circle' | 'text';
  className?: string;
  style?: React.CSSProperties;
}

const Skeleton = memo(({ width, height, variant = 'rect', className = '', style }: SkeletonProps) => {
  const baseStyle: React.CSSProperties = {
    width: width || '100%',
    height: height || '200px',
    borderRadius: variant === 'circle' ? '50%' : 'var(--border-radius-sm)',
    ...style
  };

  return (
    <div 
      className={`skeleton ${className}`} 
      style={baseStyle}
      aria-hidden="true"
    />
  );
});

Skeleton.displayName = 'Skeleton';

export default Skeleton;
