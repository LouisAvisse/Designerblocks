import React, { useCallback, useEffect, useState } from 'react';
import { drawDesignerCard, dataUrlToBytes } from './drawCard';
import ActivityHeatmap, { View } from './ActivityHeatmap';
import type { UserData, FileStats, SelectionStats } from '../types';

const SLOT_MASK = 'linear-gradient(to bottom, transparent 0%, black 45%)';

function SlotDigit({ digit, delay }: { digit: number; delay: number }) {
  const [displayDigit, setDisplayDigit] = useState<number | string>(0);
  const [isSpinning, setIsSpinning] = useState(true);

  useEffect(() => {
    setIsSpinning(true);

    // Start randomized "gambling" phase
    let spinCount = 0;
    const maxSpins = 10 + Math.floor(Math.random() * 5);
    const spinInterval = setInterval(() => {
      setDisplayDigit(Math.floor(Math.random() * 10));
      spinCount++;

      if (spinCount >= maxSpins) {
        clearInterval(spinInterval);
        // Settle on real digit
        setTimeout(() => {
          setDisplayDigit(digit);
          setIsSpinning(false);
        }, 50);
      }
    }, 40 + Math.random() * 40);

    return () => clearInterval(spinInterval);
  }, [digit, delay]);

  return (
    <span className={`slot-digit ${isSpinning ? 'is-spinning' : 'is-settled'}`}>
      {displayDigit}
    </span>
  );
}

function SlotNumber({ value }: { value: number }) {
  const formatted = value.toLocaleString();
  const totalDigits = (formatted.match(/\d/g) ?? []).length;
  let digitIdx = 0;

  return (
    <span className="slot-number">
      {formatted.split('').map((char, i) => {
        if (/\d/.test(char)) {
          const idx = digitIdx++;
          const delay = (totalDigits - 1 - idx) * 60;
          return <SlotDigit key={i} digit={parseInt(char)} delay={delay} />;
        }
        return <span key={i} className="slot-sep">{char}</span>;
      })}
    </span>
  );
}

interface ProjectStats {
  nodes: number;
  frames: number;
  components: number;
}

type Scope = 'project' | 'page';

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [file, setFile] = useState<FileStats | null>(null);
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
  const [scope, setScope] = useState<Scope>('project');
  const [toast, setToast] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [activityData, setActivityData] = useState<Record<string, number>>({});
  const [activityView, setActivityView] = useState<View>('year');
  const [activityOffset, setActivityOffset] = useState(0);
  const [selection, setSelection] = useState<SelectionStats | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCondensed, setIsCondensed] = useState(false);

  useEffect(() => {
    // Tell plugin backend to resize
    if (isCondensed) {
      postToPlugin({ type: 'resize', width: 300, height: 172 });
    } else {
      postToPlugin({ type: 'resize', width: 300, height: 460 });
    }
  }, [isCondensed]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (!msg) return;

      if (msg.type === 'plugin-data') {
        setUser(msg.user);
        setFile(prev => {
          // If the page ID or name changed, we clear project stats to signify a shift
          if (prev && prev.pageName !== msg.file.pageName) {
            setProjectStats(null);
          }
          return msg.file;
        });
      }

      if (msg.type === 'project-stats') {
        setProjectStats({
          nodes: msg.projectNodes,
          frames: msg.projectFrames,
          components: msg.projectComponents,
        });
      }

      if (msg.type === 'activity-data') {
        setActivityData(msg.data);
      }

      if (msg.type === 'selection-stats') {
        setSelection(msg.selection);
      }

      if (msg.type === 'project-syncing') {
        setIsSyncing(msg.isSyncing);
      }
    };
    window.addEventListener('message', handler);
    // UI is ready, ask for initial data
    parent.postMessage({ pluginMessage: { type: 'ui-ready' } }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const postToPlugin = (msg: Record<string, unknown>) => {
    parent.postMessage({ pluginMessage: msg }, '*');
  };

  // Active stats: project (may be loading) or page (always available)
  const activeStats = file
    ? scope === 'project'
      ? projectStats  // null while loading
      : { nodes: file.pageNodes, frames: file.pageFrames, components: file.pageComponents }
    : null;

  const generateImage = useCallback(async (): Promise<string | null> => {
    if (!user || !file) return null;
    // For project scope, fall back to page stats if project stats haven't loaded
    const stats = scope === 'project' && projectStats
      ? projectStats
      : { nodes: file.pageNodes, frames: file.pageFrames, components: file.pageComponents };
    try {
      return await drawDesignerCard({
        userName: user.name,
        photoUrl: user.photoUrl,
        fileName: file.fileName,
        pageName: scope === 'project'
          ? `${file.pageCount} page${file.pageCount !== 1 ? 's' : ''}`
          : file.pageName,
        totalNodes: stats.nodes,
        totalFrames: stats.frames,
        totalComponents: stats.components,
        userInitial: user.name.charAt(0).toUpperCase(),
        activityData,
        activityView,
        activityOffset,
      });
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Export failed');
      return null;
    }
  }, [user, file, projectStats, scope, activityData, activityView, activityOffset]);

  const handleDownload = useCallback(async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `designerblocks-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    showToast('Downloaded ✓');
  }, [generateImage]);

  const handlePlaceOnCanvas = useCallback(async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;
    setIsExporting(true);
    const bytes = Array.from(dataUrlToBytes(dataUrl));
    postToPlugin({ type: 'place-card', bytes });
    showToast('Placed on canvas ✓');
    setTimeout(() => setIsExporting(false), 500);
  }, [generateImage]);

  if (!user || !file) {
    return (
      <div className="app">
        <div className="empty-state">
          <div style={{ fontSize: 20, opacity: 0.25 }}>◈</div>
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  const isProjectLoading = scope === 'project' && projectStats === null;

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
        <div className="user-info">
          <div className="user-name">{user.name}</div>
          <div className="user-file">{file.fileName}</div>
        </div>
        <button
          className="condense-btn"
          onClick={() => setIsCondensed(!isCondensed)}
          title={isCondensed ? "Expand" : "Condense"}
        >
          {isCondensed ? '⤢' : '−'}
        </button>
      </div>

      {/* Scope toggle */}
      <div className="scope-toggle fade-in">
        <button
          className={`scope-btn${scope === 'project' ? ' scope-btn-active' : ''}`}
          onClick={() => setScope('project')}
        >
          Project
        </button>
        <button
          className={`scope-btn${scope === 'page' ? ' scope-btn-active' : ''}`}
          onClick={() => setScope('page')}
        >
          Page
        </button>
      </div>

      {/* Scope context label - hide in condensed mode */}
      {!isCondensed && (
        <div className="scope-context fade-in">
          {scope === 'project'
            ? `All ${file.pageCount} page${file.pageCount !== 1 ? 's' : ''}`
            : file.pageName}
          {isSyncing && <div className="sync-indicator" title="Syncing project stats..." />}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid fade-in">
        <div className="stat-cell">
          <div className="stat-num">
            {isProjectLoading ? <span className="stat-loading">—</span> : <SlotNumber value={activeStats!.nodes} />}
          </div>
          <div className="stat-label">Nodes</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">
            {isProjectLoading ? <span className="stat-loading">—</span> : <SlotNumber value={activeStats!.frames} />}
          </div>
          <div className="stat-label">Frames</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">
            {isProjectLoading ? <span className="stat-loading">—</span> : <SlotNumber value={activeStats!.components} />}
          </div>
          <div className="stat-label">Comps</div>
        </div>
      </div>

      {!isCondensed && (
        <>
          {/* Activity Chart */}
          <ActivityHeatmap
            data={activityData}
            view={activityView}
            offset={activityOffset}
            onViewChange={setActivityView}
            onOffsetChange={setActivityOffset}
          />

          {/* Actions */}
          <div className="action-bar fade-in">
            <button className="btn btn-secondary" onClick={handleDownload} disabled={isExporting}>
              Export PNG
            </button>
            <button className="btn btn-primary" onClick={handlePlaceOnCanvas} disabled={isExporting}>
              {isExporting ? 'Generating...' : 'Place in Figma'}
            </button>
          </div>

          <div className="plugin-footer fade-in">
            <span>Statistigma</span>
          </div>
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
