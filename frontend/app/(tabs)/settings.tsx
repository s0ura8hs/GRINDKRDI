import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Switch, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Colors, getStreamColor } from '../../src/utils/colors';
import {
  loadMeta, saveMeta, loadRoadmap, deleteRoadmap,
  loadProgress,
} from '../../src/utils/storage';
import { AppMeta, RoadmapListItem } from '../../src/utils/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function SettingsScreen() {
  const [meta, setMeta] = useState<AppMeta | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadMeta().then(setMeta);
    }, [])
  );

  if (!meta) return null;

  const activeRoadmap = meta.roadmapList.find((r) => r.id === meta.activeRoadmapId);

  const handleSwitchRoadmap = async (id: string) => {
    const updated = { ...meta, activeRoadmapId: id };
    await saveMeta(updated);
    setMeta(updated);
    Alert.alert('Switched!', 'Roadmap changed. Go to Today to see it.');
  };

  const handleDeleteRoadmap = async (item: RoadmapListItem) => {
    // Can't delete the last remaining roadmap
    if (meta.roadmapList.length <= 1) {
      Alert.alert('Cannot Delete', 'You need at least one roadmap.');
      return;
    }
    // If already confirming this item, execute delete
    if (confirmDeleteId === item.id) {
      await deleteRoadmap(item.id);
      const newList = meta.roadmapList.filter((r) => r.id !== item.id);
      const newActiveId = meta.activeRoadmapId === item.id ? newList[0].id : meta.activeRoadmapId;
      const updated = { ...meta, roadmapList: newList, activeRoadmapId: newActiveId };
      await saveMeta(updated);
      setMeta(updated);
      setConfirmDeleteId(null);
    } else {
      // First tap — show confirmation state
      setConfirmDeleteId(item.id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handleRestoreDefault = async () => {
    const alreadyExists = meta.roadmapList.some((r) => r.id === 'default');
    if (alreadyExists) return;
    const updated = { ...meta };
    updated.roadmapList.push({
      id: 'default',
      name: '8-Month Engineering Roadmap',
      isDefault: true,
      streamCount: 4,
      totalDays: 224,
      createdAt: '2026-01-01T00:00:00Z',
    });
    await saveMeta(updated);
    setMeta(updated);
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Enable notifications in your device settings.');
        return;
      }
      await scheduleReminder(meta.settings.reminderHour, meta.settings.reminderMinute);
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    const updated = { ...meta, settings: { ...meta.settings, notificationsEnabled: enabled } };
    await saveMeta(updated);
    setMeta(updated);
  };

  const handleChangeTime = async (delta: number, field: 'reminderHour' | 'reminderMinute') => {
    let h = meta.settings.reminderHour;
    let m = meta.settings.reminderMinute;
    if (field === 'reminderHour') {
      h = (h + delta + 24) % 24;
    } else {
      m = (m + delta + 60) % 60;
    }
    const updated = { ...meta, settings: { ...meta.settings, reminderHour: h, reminderMinute: m } };
    await saveMeta(updated);
    setMeta(updated);
    if (updated.settings.notificationsEnabled) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await scheduleReminder(h, m);
    }
  };

  const formatHour = (h: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12} ${ampm}`;
  };

  return (
    <SafeAreaView style={styles.container} testID="settings-screen">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        {/* Current Roadmap */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>ACTIVE ROADMAP</Text>
          {activeRoadmap && (
            <View style={styles.activeRoadmapCard}>
              <Text style={styles.activeRoadmapName}>{activeRoadmap.name}</Text>
              <Text style={styles.activeRoadmapSub}>
                {activeRoadmap.streamCount} streams · {activeRoadmap.totalDays} days
                {activeRoadmap.isDefault ? ' · Default' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Roadmaps */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>MY ROADMAPS</Text>
            <TouchableOpacity
              style={styles.importBtn}
              onPress={() => router.push('/import')}
              testID="import-roadmap-btn"
            >
              <Feather name="plus" size={16} color={Colors.surface} />
              <Text style={styles.importBtnText}>Import</Text>
            </TouchableOpacity>
          </View>
          {meta.roadmapList.map((item) => {
            const isActive = item.id === meta.activeRoadmapId;
            return (
              <View key={item.id} style={[styles.roadmapItem, isActive && styles.roadmapItemActive]}>
                <TouchableOpacity
                  style={styles.roadmapItemContent}
                  onPress={() => handleSwitchRoadmap(item.id)}
                  testID={`roadmap-switch-${item.id}`}
                >
                  <View style={styles.roadmapItemLeft}>
                    {isActive && <Feather name="check-circle" size={18} color={Colors.success} />}
                    {!isActive && <Feather name="circle" size={18} color={Colors.textDim} />}
                    <View>
                      <Text style={styles.roadmapItemName}>{item.name}</Text>
                      <Text style={styles.roadmapItemSub}>
                        {item.streamCount} streams · {item.totalDays} days
                        {item.isDefault ? ' · Default' : ''}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                {meta.roadmapList.length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleDeleteRoadmap(item)}
                    style={[
                      styles.deleteBtn,
                      confirmDeleteId === item.id && styles.deleteBtnConfirm,
                    ]}
                    testID={`roadmap-delete-${item.id}`}
                  >
                    {confirmDeleteId === item.id ? (
                      <Text style={styles.deleteBtnConfirmText}>Tap to confirm</Text>
                    ) : (
                      <Feather name="trash-2" size={16} color={Colors.danger} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          {/* Restore Default Roadmap */}
          {!meta.roadmapList.some((r) => r.id === 'default') && (
            <TouchableOpacity
              style={styles.restoreBtn}
              onPress={handleRestoreDefault}
              testID="restore-default-btn"
            >
              <Feather name="refresh-cw" size={16} color={Colors.textPrimary} />
              <Text style={styles.restoreBtnText}>Restore 8-Month Engineering Roadmap</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notifications */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>DAILY REMINDER</Text>
          <View style={styles.notifRow}>
            <View>
              <Text style={styles.notifLabel}>Push Notification</Text>
              <Text style={styles.notifSub}>Get reminded to grind daily</Text>
            </View>
            <Switch
              value={meta.settings.notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: Colors.border, true: Colors.success }}
              thumbColor={Colors.surface}
              testID="notifications-toggle"
            />
          </View>
          {meta.settings.notificationsEnabled && (
            <View style={styles.timePickerRow}>
              <Text style={styles.timeLabel}>Reminder Time</Text>
              <View style={styles.timePicker}>
                <TouchableOpacity onPress={() => handleChangeTime(-1, 'reminderHour')} style={styles.timeArrow} testID="hour-down">
                  <Feather name="chevron-down" size={18} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.timeValue} testID="reminder-time">
                  {formatHour(meta.settings.reminderHour)}:{meta.settings.reminderMinute.toString().padStart(2, '0')}
                </Text>
                <TouchableOpacity onPress={() => handleChangeTime(1, 'reminderHour')} style={styles.timeArrow} testID="hour-up">
                  <Feather name="chevron-up" size={18} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* JSON Format Guide */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>IMPORT FORMAT</Text>
          <Text style={styles.formatText}>
            {`{
  "name": "Your Roadmap",
  "streams": [
    { "name": "Stream 1", "duration": "30 min" },
    { "name": "Stream 2", "duration": "45 min" }
  ],
  "weeks": [
    {
      "month": 1,
      "monthTitle": "Month 1 — Title",
      "days": [
        { "Stream 1": "Topic", "Stream 2": "Topic" }
      ]
    }
  ]
}`}
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

async function scheduleReminder(hour: number, minute: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 Time to GRIND!',
      body: 'Your daily engineering tasks are waiting. Keep the streak alive!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  scrollContent: { padding: 24 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 20 },
  sectionCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, borderWidth: 2, borderColor: Colors.border, marginBottom: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: Colors.textDim, letterSpacing: 2, marginBottom: 12 },
  activeRoadmapCard: { backgroundColor: Colors.appBg, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: Colors.border },
  activeRoadmapName: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  activeRoadmapSub: { fontSize: 12, color: Colors.textSecondary },
  importBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.textPrimary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, gap: 4 },
  importBtnText: { fontSize: 12, fontWeight: '700', color: Colors.surface },
  roadmapItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, marginBottom: 8 },
  roadmapItemActive: { borderColor: Colors.success, backgroundColor: Colors.successBg },
  roadmapItemContent: { flex: 1 },
  roadmapItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roadmapItemName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  roadmapItemSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  deleteBtn: { padding: 10, borderRadius: 10, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  deleteBtnConfirm: { backgroundColor: Colors.dangerBg, borderWidth: 1.5, borderColor: Colors.danger, paddingHorizontal: 12 },
  deleteBtnConfirmText: { fontSize: 11, fontWeight: '800', color: Colors.danger },
  restoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', backgroundColor: Colors.appBg },
  restoreBtnText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  notifRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  notifSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  timePickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  timeLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  timePicker: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeArrow: { padding: 8, backgroundColor: Colors.appBg, borderRadius: 10 },
  timeValue: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, fontVariant: ['tabular-nums'], minWidth: 80, textAlign: 'center' },
  formatText: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: Colors.textSecondary, backgroundColor: Colors.appBg, padding: 14, borderRadius: 12, lineHeight: 18 },
});
