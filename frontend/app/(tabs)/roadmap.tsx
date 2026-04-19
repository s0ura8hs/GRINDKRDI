import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, getStreamColor, getStreamIcon } from '../../src/utils/colors';
import { useRoadmap, getDayStatus } from '../../src/hooks/useRoadmap';
import { isDayComplete } from '../../src/utils/storage';

export default function RoadmapScreen() {
  const { data, loading } = useRoadmap();
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [selectedStreamIdx, setSelectedStreamIdx] = useState(0);
  const router = useRouter();

  if (loading || !data) return null;

  const { roadmap, progress, days } = data;
  const streamKeys = roadmap.streams.map((s) => s.key);
  const totalDone = days.filter((d) => isDayComplete(progress, d.id, streamKeys)).length;

  // Get unique months
  const months: number[] = [];
  days.forEach((d) => { if (!months.includes(d.monthNum)) months.push(d.monthNum); });

  // Get month titles
  const monthTitles: Record<number, string> = {};
  roadmap.weeks.forEach((w) => { monthTitles[w.month] = w.monthTitle; });

  // Auto-expand active month on first render
  if (expandedMonth === null && days.length > 0) {
    const currentDay = days.find((d) => getDayStatus(days, progress, streamKeys, d.id) === 'active');
    if (currentDay) setExpandedMonth(currentDay.monthNum);
    else setExpandedMonth(months[0] || 1);
  }

  const selectedStream = roadmap.streams[selectedStreamIdx];

  return (
    <SafeAreaView style={styles.container} testID="roadmap-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Roadmap</Text>
        <Text style={styles.headerStat}>{totalDone}/{days.length} days</Text>
      </View>

      {/* Stream Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {roadmap.streams.map((s, idx) => {
          const active = selectedStreamIdx === idx;
          const sc = getStreamColor(idx);
          return (
            <TouchableOpacity
              key={s.key}
              style={[styles.filterPill, active && { backgroundColor: sc.bg, borderColor: sc.border }]}
              onPress={() => setSelectedStreamIdx(idx)}
              testID={`filter-${s.key}`}
            >
              <Feather name={getStreamIcon(idx) as any} size={14} color={active ? sc.text : Colors.textDim} />
              <Text style={[styles.filterPillText, active && { color: sc.text }]}>{s.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Month List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.monthList}>
        {months.map((m) => {
          const monthDays = days.filter((d) => d.monthNum === m);
          const doneDays = monthDays.filter((d) => isDayComplete(progress, d.id, streamKeys)).length;
          const pct = Math.round((doneDays / monthDays.length) * 100);
          const isExpanded = expandedMonth === m;

          // Get unique weeks in this month
          const weekNums: number[] = [];
          monthDays.forEach((d) => { if (!weekNums.includes(d.weekNum)) weekNums.push(d.weekNum); });

          return (
            <View key={m} style={styles.monthCard} testID={`month-${m}`}>
              <TouchableOpacity
                style={styles.monthHeader}
                onPress={() => setExpandedMonth(isExpanded ? null : m)}
                testID={`month-toggle-${m}`}
              >
                <View style={styles.monthHeaderLeft}>
                  <Text style={styles.monthNum}>M{m}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.monthTitle} numberOfLines={1}>
                      {(monthTitles[m] || `Month ${m}`).replace(/^Month \d+ — /, '')}
                    </Text>
                    <Text style={styles.monthSub}>{doneDays}/{monthDays.length} days · {pct}%</Text>
                  </View>
                </View>
                <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textSecondary} />
              </TouchableOpacity>

              <View style={styles.miniBarBg}>
                <View style={[styles.miniBarFill, { width: `${pct}%` }]} />
              </View>

              {isExpanded && weekNums.map((w) => {
                const weekDays = days.filter((d) => d.weekNum === w && d.monthNum === m);
                return (
                  <View key={w} style={styles.weekSection}>
                    <Text style={styles.weekLabel}>WEEK {w}</Text>
                    <View style={styles.dayGrid}>
                      {weekDays.map((d) => {
                        const status = getDayStatus(days, progress, streamKeys, d.id);
                        return (
                          <TouchableOpacity
                            key={d.id}
                            style={[
                              styles.dayCell,
                              status === 'complete' && styles.dayCellComplete,
                              status === 'active' && styles.dayCellActive,
                              status === 'backlog' && styles.dayCellBacklog,
                              status === 'locked' && styles.dayCellLocked,
                            ]}
                            onPress={() => { if (status !== 'locked') router.push(`/day/${d.dayNum}`); }}
                            disabled={status === 'locked'}
                            testID={`day-cell-${d.dayNum}`}
                          >
                            <Text style={[
                              styles.dayCellNum,
                              (status === 'complete' || status === 'active' || status === 'backlog') && { color: Colors.surface },
                              status === 'locked' && { color: Colors.lockedText },
                            ]}>{d.dayNum}</Text>
                            <Text style={[
                              styles.dayCellTopic,
                              (status === 'complete' || status === 'active' || status === 'backlog') && { color: 'rgba(255,255,255,0.8)' },
                              status === 'locked' && { color: Colors.lockedText },
                            ]} numberOfLines={2}>{(d.topics[selectedStream?.key] || '').split(':')[0]}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  headerStat: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  filterRow: { maxHeight: 52, marginBottom: 12 },
  filterContent: { paddingHorizontal: 24, gap: 8, flexDirection: 'row' },
  filterPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, gap: 6 },
  filterPillText: { fontSize: 13, fontWeight: '700', color: Colors.textDim },
  monthList: { paddingHorizontal: 24 },
  monthCard: { backgroundColor: Colors.surface, borderRadius: 20, borderWidth: 2, borderColor: Colors.border, marginBottom: 12, overflow: 'hidden' },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  monthHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  monthNum: { fontSize: 16, fontWeight: '900', color: Colors.textPrimary, backgroundColor: Colors.appBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, overflow: 'hidden' },
  monthTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  monthSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  miniBarBg: { height: 4, backgroundColor: Colors.border, marginHorizontal: 16, borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
  miniBarFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 2 },
  weekSection: { paddingHorizontal: 16, paddingBottom: 14 },
  weekLabel: { fontSize: 11, fontWeight: '800', color: Colors.textDim, letterSpacing: 1.5, marginBottom: 8, marginTop: 8 },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayCell: { width: '13%', aspectRatio: 1, borderRadius: 12, backgroundColor: Colors.appBg, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', padding: 4 },
  dayCellComplete: { backgroundColor: Colors.success, borderColor: Colors.success },
  dayCellActive: { backgroundColor: Colors.textPrimary, borderColor: Colors.textPrimary },
  dayCellBacklog: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  dayCellLocked: { backgroundColor: Colors.locked, borderColor: Colors.border, opacity: 0.5 },
  dayCellNum: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  dayCellTopic: { fontSize: 7, color: Colors.textSecondary, textAlign: 'center' },
});
