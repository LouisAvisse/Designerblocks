import React from 'react';
import type { UserData, FileStats, SelectionStats } from '../../types';

interface Props {
  user: UserData | null;
  file: FileStats | null;
  selection: SelectionStats | null;
}

export function DesignerCard({ user, file, selection }: Props) {
  if (!user || !file || !selection) return null;

  return (
    <div className="designer-card" id="designer-card">
      {/* Header */}
      <div className="card-header">
        {user.photoUrl ? (
          <img className="card-avatar" src={user.photoUrl} alt={user.name} />
        ) : (
          <div className="card-avatar-placeholder">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div className="card-user-name">{user.name}</div>
          <div className="card-user-file">{file.fileName}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="card-stats">
        <div className="card-stat">
          <div className="num">{file.totalNodes.toLocaleString()}</div>
          <div className="lbl">Nodes</div>
        </div>
        <div className="card-stat">
          <div className="num">{file.totalFrames.toLocaleString()}</div>
          <div className="lbl">Frames</div>
        </div>
        <div className="card-stat">
          <div className="num">{file.totalComponents.toLocaleString()}</div>
          <div className="lbl">Components</div>
        </div>
      </div>

      {/* Footer */}
      <div className="card-footer">
        <div className="card-brand">Statistigma</div>
        <div className="card-page">{file.pageName}</div>
      </div>
    </div>
  );
}
