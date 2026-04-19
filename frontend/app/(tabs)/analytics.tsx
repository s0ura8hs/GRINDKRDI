import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Share, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, getStreamColor } from '../../src/utils/colors';
import { useRoadmap } from '../../src/hooks/useRoadmap';
import { isDayComplete, getBacklogDays, recalcStreak } from '../../src/utils/storage';

export default function AnalyticsScreen() {
  const { data, loading } = useRoadmap();

  if (loading || !data) return null;

  const { roadmap, progress, days } = data;
  const streamKeys = roadmap.streams.map((s) => s.key);
  const totalDone = days.filter((d) => isDayComplete(progress, d.id, streamKeys)).length;
  const totalBacklog = getBacklogDays(days, progress, streamKeys).length;
  const totalPct = Math.round((totalDone / days.length) * 100);
  const streak = recalcStreak(days, progress, streamKeys);
  const weeksDone = Math.floor(totalDone / 7);

  // Per-stream stats
  const streamStats = roadmap.streams.map((s, idx) => {
    let done = 0;
    days.forEach((d) => {
      const p = progress[d.id];
      if (p && p.tasks[s.key] && p.tasks[s.key].done) done++;
    });
    return { ...s, idx, done, total: days.length, pct: Math.round((done / days.length) * 100) };
  });

  // Monthly stats
  const months: number[] = [];
  days.forEach((d) => { if (!months.includes(d.monthNum)) months.push(d.monthNum); });
  const monthTitles: Record<number, string> = {};
  roadmap.weeks.forEach((w) => { monthTitles[w.month] = w.monthTitle; });

  const monthStats = months.map((m) => {
    const mDays = days.filter((d) => d.monthNum === m);
    const done = mDays.filter((d) => isDayComplete(progress, d.id, streamKeys)).length;
    return { month: m, total: mDays.length, done, pct: Math.round((done / mDays.length) * 100) };
  });

  const handleShare = async () => {
    const streamLines = streamStats.map((s) => `  ${s.name}: ${s.pct}%`).join('\n');
    const monthLines = monthStats.map((m) => {
      const title = (monthTitles[m.month] || `Month ${m.month}`).replace(/^Month \d+ — /, '');
      return `  M${m.month} ${title}: ${m.pct}% (${m.done}/${m.total})`;
    }).join('\n');

    const msg = `🔥 GRIND Tracker Update!\n\n📊 ${roadmap.name}\n\n✅ Progress: ${totalPct}% Complete\n🔥 Streak: ${streak} Days\n📅 Days: ${totalDone}/${days.length}\n📆 Weeks: ${weeksDone}/${roadmap.totalWeeks}\n${totalBacklog > 0 ? `⚠️ Backlog: ${totalBacklog} days\n` : ''}\n📈 Stream Progress:\n${streamLines}\n\n📊 Monthly Progress:\n${monthLines}\n\n#GRIND #Accountability`;

    try {
      await Share.share({ message: msg });
    } catch (e: any) {
      Alert.alert('Error', 'Failed to share');
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="analytics-screen">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Analytics</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} testID="share-progress-btn">
            <Feather name="share-2" size={16} color={Colors.surface} />
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Overview Cards */}
        <View style={styles.overviewGrid}>
          <View style={[styles.overviewCard, { borderColor: Colors.success }]}>
            <Text style={styles.overviewLabel}>Days Done</Text>
            <Text style={[styles.overviewValue, { color: Colors.success }]}>{totalDone}</Text>
            <Text style={styles.overviewSub}>/ {days.length}</Text>
          </View>
          <View style={[styles.overviewCard, { borderColor: Colors.streak }]}>
            <Text style={styles.overviewLabel}>Streak</Text>
            <Text style={[styles.overviewValue, { color: Colors.streakText }]}>{streak}</Text>
            <Text style={styles.overviewSub}>days</Text>
          </View>
          <View style={[styles.overviewCard, { borderColor: Colors.danger }]}>
            <Text style={styles.overviewLabel}>Backlog</Text>
            <Text style={[styles.overviewValue, { color: totalBacklog > 0 ? Colors.danger : Colors.textDim }]}>{totalBacklog}</Text>
            <Text style={styles.overviewSub}>days</Text>
          </View>
          <View style={[styles.overviewCard, { borderColor: Colors.textPrimary }]}>
            <Text style={styles.overviewLabel}>Weeks</Text>
            <Text style={[styles.overviewValue, { color: Colors.textPrimary }]}>{weeksDone}</Text>
            <Text style={styles.overviewSub}>/ {roadmap.totalWeeks}</Text>
          </View>
        </View>

        {/* Overall Progress */}
        <View style={styles.sectionCard} testID="overall-progress">
          <Text style={styles.sectionTitle}>OVERALL PROGRESS</Text>
          <View style={styles.bigProgressRow}>
            <Text style={styles.bigPct}>{totalPct}%</Text>
            <View style={{ flex: 1 }}>
              <View style={styles.bigBarBg}>
                <View style={[styles.bigBarFill, { width: `${totalPct}%` }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Stream Breakdown */}
        <View style={styles.sectionCard} testID="stream-breakdown">
          <Text style={styles.sectionTitle}>STREAM BREAKDOWN</Text>
          {streamStats.map((ss) => {
            const sc = getStreamColor(ss.idx);
            return (
              <View key={ss.key} style={styles.streamRow}>
                <View style={[styles.streamDot, { backgroundColor: sc.text }]} />
                <Text style={styles.streamName} numberOfLines={1}>{ss.name}</Text>
                <View style={styles.streamBarBg}>
                  <View style={[styles.streamBarFill, { width: `${ss.pct}%`, backgroundColor: sc.text }]} />
                </View>
                <Text style={styles.streamPct}>{ss.pct}%</Text>
              </View>
            );
          })}
        </View>

        {/* Monthly Breakdown */}
        <View style={styles.sectionCard} testID="monthly-breakdown">
          <Text style={styles.sectionTitle}>MONTHLY BREAKDOWN</Text>
          <View style={styles.monthGrid}>
            {monthStats.map((ms) => {
              const title = (monthTitles[ms.month] || `Month ${ms.month}`).replace(/^Month \d+ — /, '');
              return (
                <View key={ms.month} style={[styles.monthStatCard, ms.pct === 100 && { borderColor: Colors.success }]}>
                  <Text style={styles.monthStatLabel}>M{ms.month}</Text>
                  <Text style={styles.monthStatTitle} numberOfLines={1}>{title}</Text>
                  <Text style={[styles.monthStatPct, ms.pct === 100 && { color: Colors.success }, ms.pct > 50 && ms.pct < 100 && { color: Colors.streakText }]}>{ms.pct}%</Text>
                  <View style={styles.monthMiniBar}>
                    <View style={[styles.monthMiniBarFill, { width: `${ms.pct}%` }, ms.pct === 100 && { backgroundColor: Colors.success }]} />
                  </View>
                  <Text style={styles.monthStatDays}>{ms.done}/{ms.total} days</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  scrollContent: { padding: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  shareBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.textPrimary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, gap: 6 },
  shareBtnText: { fontSize: 13, fontWeight: '700', color: Colors.surface },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  overviewCard: { flex: 1, minWidth: '45%', backgroundColor: Colors.surface, borderRadius: 20, padding: 16, borderWidth: 2, alignItems: 'center' },
  overviewLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5, marginBottom: 6 },
  overviewValue: { fontSize: 32, fontWeight: '900' },
  overviewSub: { fontSize: 12, color: Colors.textDim, marginTop: 2 },
  sectionCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, borderWidth: 2, borderColor: Colors.border, marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: Colors.textDim, letterSpacing: 2, marginBottom: 16 },
  bigProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bigPct: { fontSize: 36, fontWeight: '900', color: Colors.textPrimary },
  bigBarBg: { height: 16, backgroundColor: Colors.border, borderRadius: 8, overflow: 'hidden' },
  bigBarFill: { height: '100%', backgroundColor: Colors.textPrimary, borderRadius: 8 },
  streamRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  streamDot: { width: 10, height: 10, borderRadius: 5 },
  streamName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, width: 100 },
  streamBarBg: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  streamBarFill: { height: '100%', borderRadius: 4 },
  streamPct: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, width: 36, textAlign: 'right' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  monthStatCard: { width: '47%', backgroundColor: Colors.appBg, borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: Colors.border },
  monthStatLabel: { fontSize: 11, fontWeight: '800', color: Colors.textDim, letterSpacing: 1 },
  monthStatTitle: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, marginTop: 2, marginBottom: 8 },
  monthStatPct: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary },
  monthMiniBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginVertical: 8 },
  monthMiniBarFill: { height: '100%', backgroundColor: Colors.textPrimary, borderRadius: 2 },
  monthStatDays: { fontSize: 11, color: Colors.textSecondary },
});
