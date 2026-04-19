import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppMeta,
  RoadmapConfig,
  DayProgress,
  DayInfo,
  RoadmapListItem,
  AppSettings,
} from './types';
import { SYLLABUS } from '../data/syllabus';

const META_KEY = 'grind_meta_v3';
const roadmapKey = (id: string) => `grind_roadmap_${id}`;
const progressKey = (id: string) => `grind_progress_${id}`;

// ===================== DEFAULT ROADMAP =====================

export function getDefaultRoadmap(): RoadmapConfig {
  return {
    id: 'default',
    name: '8-Month Engineering Roadmap',
    streams: [
      { name: 'DSA', key: 'dsa', duration: '45 min' },
      { name: 'Backend', key: 'backend', duration: '60 min' },
      { name: 'Data / Analytics', key: 'data', duration: '30 min' },
      { name: 'Cloud / DevOps', key: 'cloud', duration: '15-30 min' },
    ],
    totalWeeks: SYLLABUS.totalWeeks,
    totalDays: SYLLABUS.totalDays,
    weeks: SYLLABUS.weeks.map((w) => ({
      month: w.month,
      week: w.week,
      monthTitle: w.monthTitle,
      days: w.days.map((d) => ({
        dsa: d.dsa,
        backend: d.backend,
        data: d.data,
        cloud: d.cloud,
      })),
    })),
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  };
}

// ===================== DEFAULT META =====================

function defaultMeta(): AppMeta {
  return {
    activeRoadmapId: 'default',
    roadmapList: [
      {
        id: 'default',
        name: '8-Month Engineering Roadmap',
        isDefault: true,
        streamCount: 4,
        totalDays: 224,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
    settings: {
      notificationsEnabled: false,
      reminderHour: 9,
      reminderMinute: 0,
    },
  };
}

// ===================== META OPERATIONS =====================

export async function loadMeta(): Promise<AppMeta> {
  try {
    const raw = await AsyncStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw);

    // Try migrate old data
    const migrated = await migrateOldData();
    if (migrated) return migrated;

    const meta = defaultMeta();
    await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
    return meta;
  } catch {
    return defaultMeta();
  }
}

export async function saveMeta(meta: AppMeta): Promise<void> {
  await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
}

// ===================== ROADMAP OPERATIONS =====================

export async function loadRoadmap(id: string): Promise<RoadmapConfig> {
  if (id === 'default') return getDefaultRoadmap();
  try {
    const raw = await AsyncStorage.getItem(roadmapKey(id));
    if (raw) return JSON.parse(raw);
    return getDefaultRoadmap();
  } catch {
    return getDefaultRoadmap();
  }
}

export async function saveRoadmap(roadmap: RoadmapConfig): Promise<void> {
  if (roadmap.isDefault) return;
  await AsyncStorage.setItem(roadmapKey(roadmap.id), JSON.stringify(roadmap));
}

export async function deleteRoadmap(id: string): Promise<void> {
  await AsyncStorage.multiRemove([roadmapKey(id), progressKey(id)]);
}

// ===================== PROGRESS OPERATIONS =====================

export async function loadProgress(
  roadmapId: string
): Promise<Record<string, DayProgress>> {
  try {
    const raw = await AsyncStorage.getItem(progressKey(roadmapId));
    if (raw) return JSON.parse(raw);
    return {};
  } catch {
    return {};
  }
}

export async function saveProgress(
  roadmapId: string,
  progress: Record<string, DayProgress>
): Promise<void> {
  await AsyncStorage.setItem(progressKey(roadmapId), JSON.stringify(progress));
}

// ===================== HELPER FUNCTIONS =====================

export function buildDays(roadmap: RoadmapConfig): DayInfo[] {
  const days: DayInfo[] = [];
  let dayNum = 1;
  roadmap.weeks.forEach((week, wi) => {
    week.days.forEach((dayTopics) => {
      days.push({
        id: `d${dayNum}`,
        dayNum,
        weekNum: wi + 1,
        monthNum: week.month,
        monthTitle: week.monthTitle,
        topics: dayTopics,
      });
      dayNum++;
    });
  });
  return days;
}

export function defaultDayProgress(streamKeys: string[]): DayProgress {
  const tasks: Record<string, { done: boolean; proof: string | null }> = {};
  streamKeys.forEach((k) => {
    tasks[k] = { done: false, proof: null };
  });
  return { tasks, completedAt: null };
}

export function ensureDay(
  progress: Record<string, DayProgress>,
  dayId: string,
  streamKeys: string[]
): DayProgress {
  if (!progress[dayId]) {
    progress[dayId] = defaultDayProgress(streamKeys);
  }
  // Ensure all stream keys exist (in case roadmap was updated)
  streamKeys.forEach((k) => {
    if (!progress[dayId].tasks[k]) {
      progress[dayId].tasks[k] = { done: false, proof: null };
    }
  });
  return progress[dayId];
}

export function isDayComplete(
  progress: Record<string, DayProgress>,
  dayId: string,
  streamKeys: string[]
): boolean {
  const p = progress[dayId];
  if (!p) return false;
  return streamKeys.every((k) => p.tasks[k] && p.tasks[k].done);
}

export function getBacklogDays(
  days: DayInfo[],
  progress: Record<string, DayProgress>,
  streamKeys: string[]
): string[] {
  const backlog: string[] = [];
  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    if (!isDayComplete(progress, d.id, streamKeys)) {
      const anyAfterComplete = days
        .slice(i + 1)
        .some((dd) => isDayComplete(progress, dd.id, streamKeys));
      if (anyAfterComplete) backlog.push(d.id);
      else break;
    }
  }
  return backlog;
}

export function getCurrentDayId(
  days: DayInfo[],
  progress: Record<string, DayProgress>,
  streamKeys: string[]
): string {
  for (let i = 0; i < days.length; i++) {
    if (!isDayComplete(progress, days[i].id, streamKeys)) return days[i].id;
  }
  return days[days.length - 1].id;
}

export function recalcStreak(
  days: DayInfo[],
  progress: Record<string, DayProgress>,
  streamKeys: string[]
): number {
  let streak = 0;
  for (let i = 0; i < days.length; i++) {
    if (isDayComplete(progress, days[i].id, streamKeys)) streak++;
    else break;
  }
  return streak;
}

export function parseDurationSeconds(duration: string): number {
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[1], 10) * 60 : 30 * 60;
}

// ===================== MIGRATION =====================

async function migrateOldData(): Promise<AppMeta | null> {
  try {
    const oldRaw = await AsyncStorage.getItem('grind_tracker_v2');
    if (!oldRaw) return null;

    const old = JSON.parse(oldRaw);
    const newProgress: Record<string, DayProgress> = {};

    if (old.progress) {
      for (const [dayId, dp] of Object.entries(old.progress) as any) {
        newProgress[dayId] = {
          tasks: {
            dsa: { done: dp.dsa?.done || false, proof: dp.dsa?.proof || null },
            backend: { done: dp.backend?.done || false, proof: dp.backend?.proof || null },
            data: { done: dp.data?.done || false, proof: dp.data?.proof || null },
            cloud: { done: dp.cloud?.done || false, proof: dp.cloud?.proof || null },
          },
          completedAt: dp.completedAt || null,
        };
      }
    }

    await saveProgress('default', newProgress);
    await AsyncStorage.removeItem('grind_tracker_v2');

    const meta = defaultMeta();
    await saveMeta(meta);
    return meta;
  } catch {
    return null;
  }
}

// ===================== IMPORT VALIDATION =====================

export function validateImportJSON(data: any): { valid: boolean; error?: string; roadmap?: RoadmapConfig } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid JSON: must be an object' };
  }
  if (!data.name || typeof data.name !== 'string') {
    return { valid: false, error: 'Missing or invalid "name" field' };
  }
  if (!Array.isArray(data.streams) || data.streams.length === 0) {
    return { valid: false, error: 'Missing or empty "streams" array' };
  }

  const streams = data.streams.map((s: any, i: number) => {
    if (typeof s === 'string') {
      return { name: s, key: s.toLowerCase().replace(/[^a-z0-9]/g, '_'), duration: '30 min' };
    }
    if (!s.name) return null;
    return {
      name: s.name,
      key: s.key || s.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      duration: s.duration || '30 min',
    };
  }).filter(Boolean);

  if (streams.length === 0) {
    return { valid: false, error: 'No valid streams found' };
  }

  if (!Array.isArray(data.weeks) || data.weeks.length === 0) {
    return { valid: false, error: 'Missing or empty "weeks" array' };
  }

  const streamKeys = streams.map((s: any) => s.key);
  const streamNames = streams.map((s: any) => s.name);
  let totalDays = 0;

  for (let i = 0; i < data.weeks.length; i++) {
    const w = data.weeks[i];
    if (!w.monthTitle) {
      return { valid: false, error: `Week ${i + 1}: missing "monthTitle"` };
    }
    if (!Array.isArray(w.days) || w.days.length === 0) {
      return { valid: false, error: `Week ${i + 1}: missing or empty "days" array` };
    }
    totalDays += w.days.length;
  }

  // Build the roadmap config
  const id = `custom_${Date.now()}`;
  const weeks = data.weeks.map((w: any, wi: number) => ({
    month: w.month || Math.floor(wi / 4) + 1,
    week: w.week || wi + 1,
    monthTitle: w.monthTitle,
    days: w.days.map((d: any) => {
      const topics: Record<string, string> = {};
      streams.forEach((s: any) => {
        topics[s.key] = d[s.name] || d[s.key] || '';
      });
      return topics;
    }),
  }));

  const roadmap: RoadmapConfig = {
    id,
    name: data.name,
    streams,
    totalWeeks: weeks.length,
    totalDays,
    weeks,
    isDefault: false,
    createdAt: new Date().toISOString(),
  };

  return { valid: true, roadmap };
}
