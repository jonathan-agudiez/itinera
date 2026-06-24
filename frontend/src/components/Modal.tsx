import { useEffect, type ReactNode } from 'react';

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <span className="eyebrow">Itinera</span>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">×</button>
        </header>
        {children}
      </section>
    </div>
  );
}
