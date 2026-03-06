// ---- Message types between sandbox (code.ts) and UI (React) ----

export interface UserData {
  name: string;
  photoUrl: string | null;
  color: string;
}

export interface FileStats {
  fileName: string;
  pageName: string;   // current page name
  pageCount: number;  // total pages in project
  // Current page totals (always available immediately)
  pageNodes: number;
  pageFrames: number;
  pageComponents: number;
}

export interface SelectionStats {
  count: number;
  types: Record<string, number>;
}

// Messages from code.ts → UI
export interface PluginDataMessage {
  type: 'plugin-data';
  user: UserData;
  file: FileStats;
}

// Sent separately (async) once all pages have been loaded
export interface ProjectStatsMessage {
  type: 'project-stats';
  projectNodes: number;
  projectFrames: number;
  projectComponents: number;
}

export interface SelectionStatsMessage {
  type: 'selection-stats';
  selection: SelectionStats;
}

// Activity log: map of 'YYYY-MM-DD' → change count
export interface ActivityDataMessage {
  type: 'activity-data';
  data: Record<string, number>;
}

// Messages from UI → code.ts
export interface RefreshMessage {
  type: 'refresh';
}

export interface PlaceCardMessage {
  type: 'place-card';
  bytes: number[];
}

export interface ResizeMessage {
  type: 'resize';
  width: number;
  height: number;
}

export type UIToPluginMessage = RefreshMessage | PlaceCardMessage | ResizeMessage;
export type PluginToUIMessage = PluginDataMessage | ProjectStatsMessage | ActivityDataMessage | SelectionStatsMessage;
