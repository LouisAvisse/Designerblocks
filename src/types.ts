// ---- Message types between sandbox (code.ts) and UI (React) ----

export interface UserData {
  name: string;
  photoUrl: string | null;
  color: string;
}

export interface FileStats {
  fileName: string;
  pageName: string;
  totalNodes: number;
  totalFrames: number;
  totalComponents: number;
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
  selection: SelectionStats;
}

// Messages from UI → code.ts
export interface RefreshMessage {
  type: 'refresh';
}

export interface ExportCardMessage {
  type: 'export-card';
}

export interface ResizeMessage {
  type: 'resize';
  width: number;
  height: number;
}

export type UIToPluginMessage = RefreshMessage | ExportCardMessage | ResizeMessage;
export type PluginToUIMessage = PluginDataMessage;
