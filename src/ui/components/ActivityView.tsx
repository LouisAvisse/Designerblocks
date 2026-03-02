import React from 'react';
import type { UserData, FileStats, SelectionStats } from '../../types';

interface Props {
  user: UserData | null;
  file: FileStats | null;
  selection: SelectionStats | null;
  onRefresh: () => void;
}

export function ActivityView({ user, file, selection, onRefresh }: Props) {
  if (!user || !file || !selection) {
    return (
      <div className="empty-state">
        <div className="icon">⏳</div>
        <p>Loading your workspace…</p>
      </div>
    );
  }

  const typeEntries = Object.entries(selection.types);

  return (
    <div>
      {/* User Header */}
      <div className="user-header fade-in">
        {user.photoUrl ? (
          <img className="user-avatar" src={user.photoUrl} alt={user.name} />
        ) : (
          <div className="user-avatar-placeholder">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="user-info">
          <h2>{user.name}</h2>
          <span>Working in Figma</span>
        </div>
      </div>

      {/* File Info */}
      <div className="glass-card fade-in">
        <div className="section-label">
          <span className="icon">📄</span> File
        </div>
        <div className="stat-row">
          <span className="stat-label">File</span>
          <span className="stat-value">{file.fileName}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Page</span>
          <span className="stat-value">{file.pageName}</span>
        </div>
      </div>

      {/* Selection */}
      <div className="glass-card fade-in">
        <div className="section-label">
          <span className="icon">🎯</span> Selection
        </div>
        {selection.count === 0 ? (
          <div className="stat-row">
            <span className="stat-label" style={{ color: 'var(--text-muted)' }}>
              Nothing selected
            </span>
          </div>
        ) : (
          <>
            <div className="stat-row">
              <span className="stat-label">Selected layers</span>
              <span className="stat-value accent">{selection.count}</span>
            </div>
            {typeEntries.length > 0 && (
              <div className="type-badges">
                {typeEntries.map(([type, count]) => (
                  <span key={type} className="type-badge">
                    {formatType(type)} × {count}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Page Stats */}
      <div className="glass-card fade-in">
        <div className="section-label">
          <span className="icon">📊</span> Page Stats
        </div>
        <div className="stat-row">
          <span className="stat-label">Total nodes</span>
          <span className="stat-value">{file.totalNodes.toLocaleString()}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Frames</span>
          <span className="stat-value">{file.totalFrames.toLocaleString()}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Components</span>
          <span className="stat-value">{file.totalComponents.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function formatType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}
