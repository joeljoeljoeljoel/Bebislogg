import { type ReactNode, useEffect, useRef } from 'react';
import './BottomSheet.css';

/** A sheet from the bottom. A tap outside or Escape closes it. */
export function BottomSheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const sheet = useRef<HTMLDivElement>(null);
  // Only a tap that both starts and ends on the scrim closes the sheet. The
  // release of the long press that opened it must not.
  const downOnScrim = useRef(false);

  useEffect(() => {
    sheet.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="sheet-scrim"
      onPointerDown={(e) => (downOnScrim.current = e.target === e.currentTarget)}
      onClick={(e) => e.target === e.currentTarget && downOnScrim.current && onClose()}
    >
      <div ref={sheet} className="sheet" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        <span className="sheet-handle" />
        {children}
      </div>
    </div>
  );
}
