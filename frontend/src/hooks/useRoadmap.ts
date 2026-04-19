import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  RoadmapData,
  DayStatus,
  DayInfo,
  DayProgress,
} from '../utils/types';
import {
  loadMeta,
  loadRoadmap,
  loadProgress,
  buildDays,
  isDayComplete,
  getBacklogDays,
  getCurrentDayId,
} from '../utils/storage';

export function useRoadmap() {
  const [data, setData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const meta = await loadMeta();
      const roadmap = await loadRoadmap(meta.activeRoadmapId);
      const progress = await loadProgress(meta.activeRoadmapId);
      const days = buildDays(roadmap);
      setData({ meta, roadmap, progress, days });
    } catch (e) {
      console.error('Failed to load roadmap data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  return { data, loading, reload };
}

export function getDayStatus(
  days: DayInfo[],
  progress: Record<string, DayProgress>,
  streamKeys: string[],
  dayId: string
): DayStatus {
  if (isDayComplete(progress, dayId, streamKeys)) return 'complete';
  const backlog = getBacklogDays(days, progress, streamKeys);
  if (backlog.includes(dayId)) return 'backlog';
  if (dayId === getCurrentDayId(days, progress, streamKeys)) return 'active';
  return 'locked';
}
