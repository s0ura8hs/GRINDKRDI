// ==========================================
// Dynamic Roadmap Types - Supports custom streams
// ==========================================

export interface StreamConfig {
  name: string;
  key: string;
  duration: string;
}

export interface WeekData {
  month: number;
  week: number;
  monthTitle: string;
  days: Record<string, string>[];
}

export interface RoadmapConfig {
  id: string;
  name: string;
  streams: StreamConfig[];
  totalWeeks: number;
  totalDays: number;
  weeks: WeekData[];
  isDefault: boolean;
  createdAt: string;
}

export interface DayInfo {
  id: string;
  dayNum: number;
  weekNum: number;
  monthNum: number;
  monthTitle: string;
  topics: Record<string, string>;
}

export interface TaskProgress {
  done: boolean;
  proof: string | null;
}

export interface DayProgress {
  tasks: Record<string, TaskProgress>;
  completedAt: string | null;
}

export interface RoadmapListItem {
  id: string;
  name: string;
  isDefault: boolean;
  streamCount: number;
  totalDays: number;
  createdAt: string;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
}

export interface AppMeta {
  activeRoadmapId: string;
  roadmapList: RoadmapListItem[];
  settings: AppSettings;
}

export type DayStatus = 'complete' | 'backlog' | 'active' | 'locked';

export interface RoadmapData {
  meta: AppMeta;
  roadmap: RoadmapConfig;
  progress: Record<string, DayProgress>;
  days: DayInfo[];
}
