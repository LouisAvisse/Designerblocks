import React, { useCallback, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { DesignerCard } from './DesignerCard';
import type { UserData, FileStats, SelectionStats } from '../../types';

interface Props {
  user: UserData | null;
  file: FileStats | null;
  selection: SelectionStats | null;
}

export function ShareView({ user, file, selection }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const generateImage = useCallback(async (): Promise<string | null> => {
    const node = cardRef.current;
    if (!node) return null;

    try {
      setIsExporting(true);
      // Generate at 2x for crisp output
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        backgroundColor: '#0D0D1A',
      });
      return dataUrl;
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Export failed. Try again.');
      return null;
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleDownload = useCallback(async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `designerblocks-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    showToast('Image downloaded ✓');
  }, [generateImage]);

  const handleCopy = useCallback(async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      showToast('Copied to clipboard ✓');
    } catch {
      showToast('Copy failed — try downloading instead.');
    }
  }, [generateImage]);

  if (!user || !file) {
    return (
      <div className="empty-state">
        <div className="icon">⏳</div>
        <p>Loading your workspace…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="section-label fade-in">
        <span className="icon">🖼️</span> Preview
      </div>

      <div className="designer-card-wrapper fade-in" ref={cardRef}>
        <DesignerCard user={user} file={file} selection={selection} />
      </div>

      <div className="btn-group fade-in">
        <button
          className="btn-primary"
          onClick={handleDownload}
          disabled={isExporting}
        >
          {isExporting ? 'Generating…' : '↓ Download PNG'}
        </button>
        <button
          className="btn-secondary"
          onClick={handleCopy}
          disabled={isExporting}
        >
          📋 Copy to Clipboard
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
