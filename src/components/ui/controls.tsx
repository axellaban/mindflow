import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { haptic } from '@/lib/device';
import { SPRING_GLIDE, SPRING_PRESS, press } from '@/lib/motion';
import { cn } from '@/lib/utils';

export function Slider({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  label,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  className?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      aria-label={label}
      className={cn('range', className)}
      min={min}
      max={max}
      step={step}
      value={value}
      style={{ ['--pct' as string]: `${pct}%` }}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        haptic(6);
        onChange(!checked);
      }}
      className={cn(
        'relative inline-flex h-[30px] w-[50px] shrink-0 items-center rounded-full p-[3px] transition-colors duration-300',
        checked ? 'bg-blush-400' : 'bg-white/14',
      )}
    >
      <motion.span
        layout
        transition={SPRING_PRESS}
        className={cn('block size-6 rounded-full bg-white shadow-md', checked && 'ml-auto')}
      />
    </button>
  );
}

export function Chip({
  active,
  children,
  onClick,
  icon,
  className,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      {...press}
      onClick={() => {
        haptic(5);
        onClick?.();
      }}
      aria-pressed={active}
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-medium transition-all duration-300',
        active ? 'bg-mist-50 text-ink-900' : 'bg-white/7 text-mist-50/85 hover:bg-white/12',
        className,
      )}
    >
      {icon}
      {children}
    </motion.button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('relative inline-flex rounded-full bg-white/7 p-1', className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => {
            haptic(5);
            onChange(o.value);
          }}
          className={cn(
            'relative z-10 h-9 flex-1 rounded-full px-4 text-[14px] font-semibold whitespace-nowrap transition-colors duration-300',
            value === o.value ? 'text-ink-900' : 'text-mist-50/70 hover:text-mist-50',
          )}
        >
          {value === o.value && (
            <motion.span
              layoutId={`seg-${options.map((x) => x.value).join('')}`}
              className="absolute inset-0 -z-10 rounded-full bg-mist-50"
              transition={SPRING_GLIDE}
            />
          )}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ProgressRing({
  value,
  size = 120,
  stroke = 3,
  color = 'rgb(253 243 245)',
  track = 'rgb(255 255 255 / 0.12)',
  children,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function SectionTitle({ title, action, className }: { title: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-3.5 flex items-end justify-between gap-4 px-5 md:px-0', className)}>
      <h2 className="font-display text-[22px] leading-tight md:text-[26px]">{title}</h2>
      {action}
    </div>
  );
}
