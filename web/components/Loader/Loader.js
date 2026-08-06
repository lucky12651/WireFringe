import { cn } from '../../lib/utils';

export default function Loader({ fullPage = false }) {
  return (
    <div
      className={cn(
        'flex justify-center items-center py-10 w-full',
        fullPage && 'fixed inset-0 bg-[#0a0a0a] z-[9999]'
      )}
    >
      <div className="w-8 h-8 border-2 border-line border-t-mint rounded-full animate-spin" />
    </div>
  );
}
