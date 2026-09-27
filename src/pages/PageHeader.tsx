import { ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { IconButton } from '@/components/ui/Button';
import { Words } from '@/components/ui/Words';
import { useBack } from '@/lib/hooks';
import { EASE } from '@/lib/motion';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  subtitle,
  action,
  back,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  back?: boolean;
}) {
  const goBack = useBack();
  return (
    <header className="px-5 pt-safe pb-5 md:px-0 lg:pt-10">
      <div className={cn('flex items-center justify-between gap-3 pt-2', back || action ? 'min-h-12' : 'min-h-2 lg:min-h-0')}>
        {back ? (
          <IconButton label="Volver" onClick={goBack}>
            <ChevronLeft className="size-5" />
          </IconButton>
        ) : (
          <span />
        )}
        {action}
      </div>
      {title && (
        <h1 className="mt-3 font-display text-[40px] leading-[1.02] md:text-[52px]">
          <Words text={title} />
        </h1>
      )}
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
          className="mt-2 text-[15px] text-2"
        >
          {subtitle}
        </motion.p>
      )}
    </header>
  );
}
