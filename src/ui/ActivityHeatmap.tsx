import React, { useState, useMemo } from 'react';

export type View = 'year' | 'month' | 'week';

interface Props {
  data: Record<string, number>;
  view: View;
  offset: number;
  onViewChange: (v: View) => void;
  onOffsetChange: (o: number | ((prev: number) => number)) => void;
}

function dateKey(d: Date): string {
  const pad = (n: number) => n < 10 ? `0${n}` : `${n}`;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getLevel(count: number): number {
  if (!count) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

const COLORS = [
  'rgba(255,255,255,0.06)', // level 0
  'rgba(60,255,160,0.3)',    // level 1
  'rgba(60,255,160,0.55)',   // level 2
  'rgba(60,255,160,0.8)',    // level 3
  'rgba(60,255,160,1)',      // level 4
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_ABR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ActivityHeatmap({ data, view, offset, onViewChange, onOffsetChange }: Props) {

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // ---- Logic: Rolling Windows & Dynamic Levels ----

  const processedData = useMemo(() => {
    const daysVisible = view === 'year' ? 365 : view === 'month' ? 30 : 7;
    const endPoint = addDays(today, offset * daysVisible);
    const startPoint = addDays(endPoint, -(daysVisible - 1));

    // 1. Generate every day in range
    const cells: { date: Date; key: string; count: number }[] = [];
    let d = new Date(startPoint);
    while (d <= endPoint) {
      const k = dateKey(d);
      cells.push({ date: new Date(d), key: k, count: data[k] ?? 0 });
      d = addDays(d, 1);
    }

    // 2. Dynamic Buckets (GitHub Rule)
    const maxCount = Math.max(...cells.map(c => c.count), 0);
    const getLevelDynamic = (count: number) => {
      if (count === 0 || maxCount === 0) return 0;
      const step = maxCount / 4;
      if (count <= step) return 1;
      if (count <= step * 2) return 2;
      if (count <= step * 3) return 3;
      return 4;
    };

    const cellsWithLevel = cells.map(c => ({ ...c, level: getLevelDynamic(c.count) }));
    const totalChanges = cells.reduce((sum, c) => sum + c.count, 0);

    // 3. View-specific formatting (Years need columns)
    if (view === 'year') {
      // Find the first Monday before startPoint for grid alignment
      let startGrid = new Date(startPoint);
      const dow = startGrid.getDay();
      startGrid = addDays(startGrid, -(dow === 0 ? 6 : dow - 1));

      const columns: { date: Date; key: string; count: number; level: number; inRange: boolean }[][] = [];
      let cur = new Date(startGrid);
      const gridEnd = addDays(endPoint, (7 - (endPoint.getDay() || 7)));

      while (cur <= gridEnd) {
        const col: any[] = [];
        for (let i = 0; i < 7; i++) {
          const k = dateKey(cur);
          const count = data[k] ?? 0;
          col.push({
            date: new Date(cur),
            key: k,
            count,
            level: getLevelDynamic(count),
            inRange: cur >= startPoint && cur <= endPoint
          });
          cur = addDays(cur, 1);
        }
        columns.push(col);
      }

      const monthLabels: { col: number; label: string }[] = [];
      let prevM = -1;
      columns.forEach((col, ci) => {
        const m = col[0].date.getMonth();
        if (m !== prevM) {
          monthLabels.push({ col: ci, label: MONTHS[m] });
          prevM = m;
        }
      });

      return { type: 'year' as const, columns, monthLabels, totalChanges, maxCount };
    }

    if (view === 'month') {
      const label = `${MONTHS[startPoint.getMonth()]} ${startPoint.getDate()} – ${MONTHS[endPoint.getMonth()]} ${endPoint.getDate()}, ${endPoint.getFullYear()}`;
      return { type: 'month' as const, cells: cellsWithLevel, label, totalChanges, maxCount };
    }

    // Week view
    const label = `${MONTHS[startPoint.getMonth()]} ${startPoint.getDate()} – ${MONTHS[endPoint.getMonth()]} ${endPoint.getDate()}`;
    return { type: 'week' as const, days: cellsWithLevel.map((c, i) => ({ ...c, label: DAY_ABR[i] })), label, totalChanges, maxCount };

  }, [view, offset, today, data]);

  const navLabel = processedData.type === 'year'
    ? `${addDays(today, offset * 365 - 364).getFullYear()} – ${addDays(today, offset * 365).getFullYear()}`
    : processedData.label;

  return (
    <div className="heatmap-card fade-in">
      {/* Header */}
      <div className="heatmap-header">
        <div className="heatmap-title-row">
          <span className="heatmap-title">Activity</span>
          <span className="heatmap-changes">{processedData.totalChanges} changes</span>
        </div>
        <div className="heatmap-tabs">
          {(['year', 'month', 'week'] as View[]).map(v => (
            <button
              key={v}
              className={`heatmap-tab${view === v ? ' heatmap-tab-active' : ''}`}
              onClick={() => { onViewChange(v); onOffsetChange(0); }}
            >
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="heatmap-nav">
        <button className="heatmap-nav-btn" onClick={() => onOffsetChange(o => o - 1)}>‹</button>
        <span className="heatmap-nav-label">{navLabel}</span>
        <button className="heatmap-nav-btn" disabled={offset >= 0} onClick={() => onOffsetChange(o => o + 1)}>›</button>
      </div>

      {/* Year grid */}
      {processedData.type === 'year' && (
        <div className="heatmap-year-container">
          {processedData.columns.map((col, ci) => (
            <div key={ci} className="heatmap-year-col">
              <span className="heatmap-year-month-lbl">
                {processedData.monthLabels.find(ml => ml.col === ci)?.label ?? ''}
              </span>
              {col.map((cell, ri) => (
                <div
                  key={ri}
                  className="heatmap-cell"
                  style={{
                    opacity: cell.inRange ? 1 : 0.1,
                    background: COLORS[cell.level]
                  }}
                  title={`${cell.key}: ${cell.count} changes`}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Month grid (Rolling 30 days) */}
      {processedData.type === 'month' && (
        <div className="heatmap-month-wrap">
          <div className="heatmap-month-grid rolling-grid">
            {processedData.cells.map((cell, i) => (
              <div
                key={i}
                className="heatmap-month-cell"
                style={{ background: COLORS[cell.level] }}
                title={`${cell.key}: ${cell.count} changes`}
              >
                <span className="heatmap-day-num" style={{ opacity: cell.count > 0 ? 0 : 0.4 }}>
                  {cell.date.getDate()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Week grid */}
      {processedData.type === 'week' && (
        <div className="heatmap-week-wrap">
          {processedData.days.map(d => (
            <div key={d.key} className="heatmap-week-day">
              <div className="heatmap-week-bar-wrap">
                <div
                  className="heatmap-week-bar"
                  style={{
                    height: `${Math.max(d.count ? 6 : 2, Math.round((d.count / (processedData.maxCount || 1)) * 44))}px`,
                    background: COLORS[d.level],
                  }}
                />
              </div>
              <span className="heatmap-week-count">{d.count > 0 ? d.count : ''}</span>
              <span className={`heatmap-week-day-lbl${dateKey(d.date) === dateKey(today) ? ' heatmap-today-lbl' : ''}`}>{d.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="heatmap-legend">
        <span className="heatmap-legend-lbl">Less</span>
        {COLORS.map((c, i) => (
          <div key={i} className="heatmap-legend-dot" style={{ background: c }} />
        ))}
        <span className="heatmap-legend-lbl">More</span>
      </div>
    </div>
  );
}
