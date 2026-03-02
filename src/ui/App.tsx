import React, { useCallback, useEffect, useState } from 'react';
import { drawDesignerCard, dataUrlToBytes } from './drawCard';
import type { UserData, FileStats, SelectionStats } from '../types';

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [file, setFile] = useState<FileStats | null>(null);
  const [selection, setSelection] = useState<SelectionStats | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (!msg) return;
      if (msg.type === 'plugin-data') {
        setUser(msg.user);
        setFile(msg.file);
        setSelection(msg.selection);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const postToPlugin = (msg: Record<string, unknown>) => {
    parent.postMessage({ pluginMessage: msg }, '*');
  };

  const generateImage = useCallback((): string | null => {
    if (!user || !file) return null;
    try {
      return drawDesignerCard({
        userName: user.name,
        fileName: file.fileName,
        pageName: file.pageName,
        totalNodes: file.totalNodes,
        totalFrames: file.totalFrames,
        totalComponents: file.totalComponents,
        userInitial: user.name.charAt(0).toUpperCase(),
      });
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Export failed');
      return null;
    }
  }, [user, file]);

  const handleDownload = useCallback(() => {
    const dataUrl = generateImage();
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `designerblocks-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    showToast('Downloaded ✓');
  }, [generateImage]);

  const handlePlaceOnCanvas = useCallback(() => {
    const dataUrl = generateImage();
    if (!dataUrl) return;
    setIsExporting(true);
    // Send image bytes to sandbox which will create a Figma image node
    const bytes = Array.from(dataUrlToBytes(dataUrl));
    postToPlugin({ type: 'place-card', bytes });
    showToast('Placed on canvas ✓');
    setTimeout(() => setIsExporting(false), 500);
  }, [generateImage]);

  const handleShareTwitter = useCallback(() => {
    // Place on canvas first so user can grab it
    handlePlaceOnCanvas();
    const text = encodeURIComponent(
      `Designing in Figma ✦ ${file?.totalNodes.toLocaleString() ?? '—'} nodes · ${file?.totalFrames.toLocaleString() ?? '—'} frames\n\n#Designerblocks`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  }, [handlePlaceOnCanvas, file]);

  if (!user || !file || !selection) {
    return (
      <div className="app">
        <div className="empty-state">
          <div style={{ fontSize: 20, opacity: 0.25 }}>◈</div>
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  const selTypes = Object.entries(selection.types);

  return (
    <div className="app">
      {/* User */}
      <div className="user-row fade-in">
        {user.photoUrl ? (
          <img className="user-avatar" src={user.photoUrl} alt={user.name} />
        ) : (
          <div className="user-avatar-placeholder">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div className="user-name">{user.name}</div>
          <div className="user-file">{file.fileName}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid fade-in">
        <div className="stat-cell">
          <div className="stat-num">{file.totalNodes.toLocaleString()}</div>
          <div className="stat-label">Nodes</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{file.totalFrames.toLocaleString()}</div>
          <div className="stat-label">Frames</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{file.totalComponents.toLocaleString()}</div>
          <div className="stat-label">Comps</div>
        </div>
      </div>

      {/* Info */}
      <div className="info-section fade-in">
        <div className="info-row">
          <span className="info-key">Page</span>
          <span className="info-val">{file.pageName}</span>
        </div>
        <div className="divider" />
        <div className="info-row">
          <span className="info-key">Selected</span>
          {selection.count === 0 ? (
            <span className="info-val" style={{ color: 'var(--text-tertiary)' }}>—</span>
          ) : (
            <div className="selection-row">
              <span className="info-val" style={{ color: 'var(--green)' }}>
                {selection.count}
              </span>
              {selTypes.map(([type, count]) => (
                <span className="sel-badge" key={type}>
                  {type.toLowerCase().replace(/_/g, ' ')} × {count}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="action-bar fade-in">
        <button className="btn btn-primary" onClick={handlePlaceOnCanvas} disabled={isExporting}>
          Place on Canvas
        </button>
        <button className="btn btn-secondary" onClick={handleDownload} disabled={isExporting}>
          ↓ PNG
        </button>
      </div>

      {/* Footer */}
      <div className="plugin-footer fade-in">
        <span>Designerblocks</span>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
