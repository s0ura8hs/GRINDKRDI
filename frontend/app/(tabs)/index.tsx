import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, getStreamColor, getStreamIcon } from '../../src/utils/colors';
import { useRoadmap, getDayStatus } from '../../src/hooks/useRoadmap';
import {
  saveProgress, ensureDay, isDayComplete, getCurrentDayId,
  recalcStreak, getBacklogDays, parseDurationSeconds,
} from '../../src/utils/storage';

export default function TodayScreen() {
  const { data, loading, reload } = useRoadmap();
  const [timers, setTimers] = useState<Record<string, { running: boolean; remaining: number }>>({});
  const intervalRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(intervalRefs.current).forEach(clearInterval);
    };
  }, []);

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.textPrimary} />
      </SafeAreaView>
    );
  }

  const { roadmap, progress, days, meta } = data;
  const streamKeys = roadmap.streams.map((s) => s.key);
  const currentDayId = getCurrentDayId(days, progress, streamKeys);
  const currentDay = days.find((d) => d.id === currentDayId)!;
  const totalDone = days.filter((d) => isDayComplete(progress, d.id, streamKeys)).length;
  const backlogCount = getBacklogDays(days, progress, streamKeys).length;
  const streak = recalcStreak(days, progress, streamKeys);
  const progressPct = Math.round((totalDone / days.length) * 100);
  const dayProg = ensureDay(progress, currentDayId, streamKeys);
  const allDone = isDayComplete(progress, currentDayId, streamKeys);
  const tasksCompleted = streamKeys.filter((k) => dayProg.tasks[k]?.done).length;

  const handleUploadProof = async (streamKey: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0].base64) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      const newProgress = { ...progress };
      ensureDay(newProgress, currentDayId, streamKeys).tasks[streamKey].proof = base64;
      await saveProgress(meta.activeRoadmapId, newProgress);
      reload();
    }
  };

  const handleMarkDone = async (streamKey: string) => {
    if (!dayProg.tasks[streamKey]?.proof) {
      Alert.alert('Proof Required', 'Upload a photo proof first!');
      return;
    }
    if (dayProg.tasks[streamKey]?.done) return;
    const newProgress = { ...progress };
    const dp = ensureDay(newProgress, currentDayId, streamKeys);
    dp.tasks[streamKey].done = true;
    if (streamKeys.every((k) => dp.tasks[k]?.done)) {
      dp.completedAt = new Date().toISOString();
    }
    await saveProgress(meta.activeRoadmapId, newProgress);
    // Stop timer if running
    if (intervalRefs.current[streamKey]) {
      clearInterval(intervalRefs.current[streamKey]);
      delete intervalRefs.current[streamKey];
    }
    setTimers((prev) => {
      const next = { ...prev };
      delete next[streamKey];
      return next;
    });
    reload();
  };

  const toggleTimer = (streamKey: string, durationStr: string) => {
    const t = timers[streamKey];
    if (t && t.running) {
      // Pause
      if (intervalRefs.current[streamKey]) clearInterval(intervalRefs.current[streamKey]);
      setTimers((prev) => ({ ...prev, [streamKey]: { ...prev[streamKey], running: false } }));
    } else if (t && !t.running) {
      // Resume
      const id = setInterval(() => {
        setTimers((prev) => {
          const cur = prev[streamKey];
          if (!cur || cur.remaining <= 1) {
            clearInterval(intervalRefs.current[streamKey]);
            delete intervalRefs.current[streamKey];
            Alert.alert('Timer Done!', `Time's up for this task!`);
            return { ...prev, [streamKey]: { running: false, remaining: 0 } };
          }
          return { ...prev, [streamKey]: { running: true, remaining: cur.remaining - 1 } };
        });
      }, 1000);
      intervalRefs.current[streamKey] = id;
      setTimers((prev) => ({ ...prev, [streamKey]: { ...prev[streamKey], running: true } }));
    } else {
      // Start new
      const totalSec = parseDurationSeconds(durationStr);
      const id = setInterval(() => {
        setTimers((prev) => {
          const cur = prev[streamKey];
          if (!cur || cur.remaining <= 1) {
            clearInterval(intervalRefs.current[streamKey]);
            delete intervalRefs.current[streamKey];
            Alert.alert('Timer Done!', `Time's up for this task!`);
            return { ...prev, [streamKey]: { running: false, remaining: 0 } };
          }
          return { ...prev, [streamKey]: { running: true, remaining: cur.remaining - 1 } };
        });
      }, 1000);
      intervalRefs.current[streamKey] = id;
      setTimers((prev) => ({ ...prev, [streamKey]: { running: true, remaining: totalSec } }));
    }
  };

  const resetTimer = (streamKey: string, durationStr: string) => {
    if (intervalRefs.current[streamKey]) {
      clearInterval(intervalRefs.current[streamKey]);
      delete intervalRefs.current[streamKey];
    }
    setTimers((prev) => {
      const next = { ...prev };
      delete next[streamKey];
      return next;
    });
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} testID="today-screen">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo} testID="grind-logo">GRIND</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{roadmap.name}</Text>
          </View>
          <TouchableOpacity style={styles.streakBadge} testID="streak-badge">
            <Text style={styles.streakFlame}>🔥</Text>
            <Text style={styles.streakNum}>{streak}</Text>
            <Text style={styles.streakLabel}>streak</Text>
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={styles.progressSection} testID="progress-section">
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <Text style={styles.progressPct}>{progressPct}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
          </View>
          <View style={styles.progressStats}>
            <Text style={styles.statText}><Text style={styles.statBold}>{totalDone}</Text> / {days.length} days</Text>
            <Text style={styles.statText}><Text style={styles.statBold}>{Math.floor(totalDone / 7)}</Text> / {roadmap.totalWeeks} wks</Text>
            {backlogCount > 0 && <Text style={[styles.statText, { color: Colors.danger }]}>{backlogCount} backlog</Text>}
          </View>
        </View>

        {/* Day Header */}
        <View style={styles.dayHeader} testID="current-day-header">
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>DAY {currentDay.dayNum}</Text>
          </View>
          <Text style={styles.dayTitle}>{currentDay.monthTitle}</Text>
          <Text style={styles.daySubtitle}>
            Month {currentDay.monthNum} · Week {currentDay.weekNum} · {tasksCompleted}/{roadmap.streams.length} tasks
          </Text>
        </View>

        {/* Day Complete Banner */}
        {allDone && (
          <View style={styles.completeBanner} testID="day-complete-banner">
            <Text style={styles.bannerIcon}>🎯</Text>
            <View><Text style={styles.bannerTitle}>DAY COMPLETE</Text><Text style={styles.bannerSub}>Discipline compounds.</Text></View>
          </View>
        )}

        {/* Task Cards */}
        {roadmap.streams.map((stream, idx) => {
          const tp = dayProg.tasks[stream.key] || { done: false, proof: null };
          const sc = getStreamColor(idx);
          const iconName = getStreamIcon(idx);
          const timer = timers[stream.key];

          return (
            <View key={stream.key} style={[styles.taskCard, tp.done && styles.taskCardDone]} testID={`task-card-${stream.key}`}>
              <View style={styles.taskCardTop}>
                <View style={[styles.streamPill, { backgroundColor: sc.bg }]}>
                  <Feather name={iconName as any} size={14} color={sc.text} />
                  <Text style={[styles.streamPillText, { color: sc.text }]}>{stream.name}</Text>
                </View>
                <Text style={styles.durationText}>{stream.duration}</Text>
                {tp.done && (
                  <View style={styles.doneBadgeIcon}>
                    <Feather name="check" size={12} color={Colors.successDark} />
                  </View>
                )}
              </View>

              <Text style={styles.topicText}>{currentDay.topics[stream.key] || '—'}</Text>

              {/* Timer */}
              {!tp.done && (
                <View style={styles.timerRow}>
                  <TouchableOpacity
                    style={[styles.timerBtn, timer?.running && styles.timerBtnActive]}
                    onPress={() => toggleTimer(stream.key, stream.duration)}
                    testID={`timer-${stream.key}`}
                  >
                    <Feather name={timer?.running ? 'pause' : 'play'} size={14} color={timer?.running ? Colors.surface : Colors.textPrimary} />
                    <Text style={[styles.timerBtnText, timer?.running && { color: Colors.surface }]}>
                      {timer ? formatTime(timer.remaining) : stream.duration}
                    </Text>
                  </TouchableOpacity>
                  {timer && (
                    <TouchableOpacity style={styles.timerReset} onPress={() => resetTimer(stream.key, stream.duration)} testID={`timer-reset-${stream.key}`}>
                      <Feather name="rotate-ccw" size={14} color={Colors.textDim} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Proof & Done */}
              <View style={styles.taskCardActions}>
                {tp.proof ? (
                  <View style={styles.proofRow}>
                    <Image source={{ uri: tp.proof }} style={styles.proofThumb} />
                    <Text style={styles.proofLabel}>Proof uploaded</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.uploadBtn, { borderColor: sc.border }]}
                    onPress={() => handleUploadProof(stream.key)}
                    testID={`upload-proof-${stream.key}`}
                  >
                    <Feather name="camera" size={16} color={sc.text} />
                    <Text style={[styles.uploadBtnText, { color: sc.text }]}>Upload Proof</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.markDoneBtn, tp.proof && !tp.done && styles.markDoneBtnReady, tp.done && styles.markDoneBtnDone]}
                  onPress={() => handleMarkDone(stream.key)}
                  disabled={tp.done}
                  testID={`mark-done-${stream.key}`}
                >
                  <Text style={[styles.markDoneBtnText, tp.proof && !tp.done && styles.markDoneBtnTextReady, tp.done && styles.markDoneBtnTextDone]}>
                    {tp.done ? '✓ Completed' : 'Mark Done'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  scrollContent: { padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 28, fontWeight: '900', color: Colors.textPrimary, letterSpacing: 3 },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, maxWidth: 200 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.streakBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24, borderWidth: 1, borderColor: '#fde68a', gap: 6 },
  streakFlame: { fontSize: 18 },
  streakNum: { fontSize: 18, fontWeight: '800', color: Colors.streakText },
  streakLabel: { fontSize: 11, color: Colors.streakText, fontWeight: '600' },
  progressSection: { backgroundColor: Colors.surface, borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 2, borderColor: Colors.border },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  progressPct: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  progressBarBg: { height: 12, backgroundColor: Colors.border, borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.textPrimary, borderRadius: 6 },
  progressStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  statText: { fontSize: 12, color: Colors.textSecondary },
  statBold: { fontWeight: '800', color: Colors.textPrimary },
  dayHeader: { marginBottom: 20 },
  dayBadge: { backgroundColor: Colors.textPrimary, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, marginBottom: 10 },
  dayBadgeText: { color: Colors.surface, fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  dayTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  daySubtitle: { fontSize: 13, color: Colors.textSecondary },
  completeBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successBg, borderWidth: 2, borderColor: Colors.success, borderRadius: 20, padding: 16, marginBottom: 20, gap: 14 },
  bannerIcon: { fontSize: 28 },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: Colors.successDark },
  bannerSub: { fontSize: 12, color: Colors.successDark, opacity: 0.8 },
  taskCard: { backgroundColor: Colors.surface, borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 2, borderColor: Colors.border },
  taskCardDone: { backgroundColor: Colors.successBg, borderColor: Colors.success },
  taskCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  streamPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  streamPillText: { fontSize: 12, fontWeight: '700' },
  durationText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', flex: 1, textAlign: 'right' },
  doneBadgeIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.successBg, borderWidth: 2, borderColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  topicText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, lineHeight: 22, marginBottom: 12 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  timerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.appBg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 8, borderWidth: 1.5, borderColor: Colors.border },
  timerBtnActive: { backgroundColor: Colors.timerBg, borderColor: Colors.timerBg },
  timerBtnText: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
  timerReset: { padding: 10 },
  taskCardActions: { gap: 10 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, paddingVertical: 14, gap: 8 },
  uploadBtnText: { fontSize: 14, fontWeight: '700' },
  proofRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  proofThumb: { width: 56, height: 56, borderRadius: 12, borderWidth: 2, borderColor: Colors.border },
  proofLabel: { fontSize: 13, color: Colors.successDark, fontWeight: '600' },
  markDoneBtn: { backgroundColor: Colors.locked, borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: Colors.border },
  markDoneBtnReady: { backgroundColor: Colors.textPrimary, borderColor: Colors.textPrimary },
  markDoneBtnDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  markDoneBtnText: { fontSize: 14, fontWeight: '800', color: Colors.lockedText, letterSpacing: 0.5 },
  markDoneBtnTextReady: { color: Colors.surface },
  markDoneBtnTextDone: { color: Colors.surface },
});
