import { type HTMLMotionProps, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { haptic } from '@/lib/device';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'soft';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  children?: ReactNode;
  full?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-mist-50 text-ink-900 hover:bg-white',
  secondary: 'glass text-mist-50 hover:bg-white/12',
  soft: 'bg-white/10 text-mist-50 hover:bg-white/15',
  ghost: 'text-mist-50/80 hover:text-mist-50 hover:bg-white/6',
};

const SIZES: Record<Size, string> = {
  sm: 'min-h-11 px-4 text-[13px] gap-1.5',
  md: 'h-12 px-6 text-[15px] gap-2',
  lg: 'h-14 px-8 text-base gap-2.5',
};

export function Button({ variant = 'primary', size = 'md', icon, children, className, full, onClick, ...rest }: ButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold tracking-[-0.005em] transition-colors duration-300 disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        full && 'w-full',
        className,
      )}
      onClick={(e) => {
        haptic(6);
        onClick?.(e);
      }}
      {...rest}
    >
      {icon}
      {children}
    </motion.button>
  );
}

interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  label: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'glass' | 'plain' | 'solid';
}

const ICON_SIZES = { sm: 'size-9', md: 'size-11', lg: 'size-14', xl: 'size-20' };

export function IconButton({ label, children, size = 'md', variant = 'glass', className, onClick, ...rest }: IconButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 520, damping: 28 }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-300',
        ICON_SIZES[size],
        variant === 'glass' && 'glass text-mist-50 hover:bg-white/12',
        variant === 'plain' && 'text-mist-50/85 hover:bg-white/8 hover:text-mist-50',
        variant === 'solid' && 'bg-mist-50 text-ink-900 hover:bg-white',
        className,
      )}
      onClick={(e) => {
        haptic(5);
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
