import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Colors, getStreamColor } from '../src/utils/colors';
import {
  loadMeta, saveMeta, saveRoadmap, validateImportJSON,
} from '../src/utils/storage';
import { RoadmapConfig } from '../src/utils/types';

export default function ImportScreen() {
  const [parsed, setParsed] = useState<RoadmapConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handlePickFile = async () => {
    try {
      setError(null);
      setParsed(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      setFileName(asset.name);
      setLoading(true);

      let content: string;
      if (asset.uri.startsWith('data:')) {
        // Handle base64 data URI
        const base64 = asset.uri.split(',')[1];
        content = atob(base64);
      } else if (Platform.OS === 'web') {
        const resp = await fetch(asset.uri);
        content = await resp.text();
      } else {
        content = await FileSystem.readAsStringAsync(asset.uri);
      }

      const data = JSON.parse(content);
      const validation = validateImportJSON(data);

      if (!validation.valid) {
        setError(validation.error || 'Invalid JSON format');
        setLoading(false);
        return;
      }

      setParsed(validation.roadmap!);
      setLoading(false);
    } catch (e: any) {
      setError(`Failed to read file: ${e.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!parsed) return;

    try {
      setLoading(true);

      // Save the roadmap data
      await saveRoadmap(parsed);

      // Update meta
      const meta = await loadMeta();
      meta.roadmapList.push({
        id: parsed.id,
        name: parsed.name,
        isDefault: false,
        streamCount: parsed.streams.length,
        totalDays: parsed.totalDays,
        createdAt: parsed.createdAt,
      });
      meta.activeRoadmapId = parsed.id;
      await saveMeta(meta);

      setLoading(false);
      setImportSuccess(parsed.name);

      // Navigate back after a short delay so user sees success
      setTimeout(() => {
        router.back();
      }, 1200);
    } catch (e: any) {
      setError(`Import failed: ${e.message}`);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="import-screen">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="import-back-btn">
            <Feather name="x" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Import Roadmap</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Success Banner */}
        {importSuccess && (
          <View style={styles.successCard} testID="import-success">
            <Feather name="check-circle" size={24} color={Colors.successDark} />
            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>Imported Successfully!</Text>
              <Text style={styles.successSub}>"{importSuccess}" is now active. Returning...</Text>
            </View>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.infoCard}>
          <Feather name="info" size={18} color={Colors.textSecondary} />
          <Text style={styles.infoText}>
            Upload a JSON file with your custom roadmap. Define your own streams,
            months, weeks, and daily topics. The app will transform to match your data.
          </Text>
        </View>

        {/* File Picker */}
        <TouchableOpacity style={styles.pickBtn} onPress={handlePickFile} testID="pick-file-btn">
          <Feather name="upload" size={24} color={Colors.textPrimary} />
          <Text style={styles.pickBtnTitle}>
            {fileName ? fileName : 'Pick JSON File'}
          </Text>
          <Text style={styles.pickBtnSub}>
            {fileName ? 'Tap to pick a different file' : 'Select from your device'}
          </Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="large" color={Colors.textPrimary} style={{ marginTop: 20 }} />}

        {/* Error */}
        {error && (
          <View style={styles.errorCard} testID="import-error">
            <Feather name="alert-circle" size={16} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Preview */}
        {parsed && (
          <View style={styles.previewCard} testID="import-preview">
            <Text style={styles.previewTitle}>Preview</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Name</Text>
              <Text style={styles.previewValue}>{parsed.name}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Weeks</Text>
              <Text style={styles.previewValue}>{parsed.totalWeeks}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Total Days</Text>
              <Text style={styles.previewValue}>{parsed.totalDays}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Streams</Text>
              <Text style={styles.previewValue}>{parsed.streams.length}</Text>
            </View>

            <View style={styles.streamList}>
              {parsed.streams.map((s, idx) => {
                const sc = getStreamColor(idx);
                return (
                  <View key={s.key} style={[styles.streamChip, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                    <Text style={[styles.streamChipText, { color: sc.text }]}>{s.name}</Text>
                    <Text style={[styles.streamChipDur, { color: sc.text }]}>{s.duration}</Text>
                  </View>
                );
              })}
            </View>

            {/* Sample day preview */}
            {parsed.weeks.length > 0 && parsed.weeks[0].days.length > 0 && (
              <View style={styles.sampleDay}>
                <Text style={styles.sampleDayTitle}>Day 1 Preview</Text>
                {parsed.streams.map((s) => (
                  <View key={s.key} style={styles.sampleDayRow}>
                    <Text style={styles.sampleDayStream}>{s.name}:</Text>
                    <Text style={styles.sampleDayTopic} numberOfLines={1}>
                      {parsed.weeks[0].days[0][s.key] || '—'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Import Button */}
            <TouchableOpacity style={styles.importBtn} onPress={handleImport} testID="confirm-import-btn">
              <Feather name="download" size={18} color={Colors.surface} />
              <Text style={styles.importBtnText}>Import & Activate Roadmap</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Example Format */}
        <View style={styles.exampleCard}>
          <Text style={styles.exampleTitle}>Expected JSON Format</Text>
          <Text style={styles.exampleCode}>
            {`{
  "name": "My Roadmap",
  "streams": [
    { "name": "Marketing", "duration": "30 min" },
    { "name": "Design", "duration": "45 min" },
    { "name": "Coding", "duration": "60 min" }
  ],
  "weeks": [
    {
      "month": 1,
      "monthTitle": "Month 1 — Getting Started",
      "days": [
        {
          "Marketing": "Brand strategy basics",
          "Design": "Color theory",
          "Coding": "HTML fundamentals"
        },
        ...7 days per week
      ]
    },
    ...more weeks
  ]
}`}
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  scrollContent: { padding: 24 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: Colors.border, marginBottom: 20, gap: 12 },
  infoText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, flex: 1 },
  pickBtn: { alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 24, padding: 32, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', marginBottom: 20, gap: 8 },
  pickBtnTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  pickBtnSub: { fontSize: 12, color: Colors.textSecondary },
  errorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dangerBg, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: Colors.danger, marginBottom: 20, gap: 10 },
  errorText: { fontSize: 13, color: Colors.danger, fontWeight: '600', flex: 1 },
  successCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successBg, borderRadius: 14, padding: 16, borderWidth: 2, borderColor: Colors.success, marginBottom: 20, gap: 12 },
  successTitle: { fontSize: 15, fontWeight: '800', color: Colors.successDark },
  successSub: { fontSize: 12, color: Colors.successDark, marginTop: 2 },
  previewCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, borderWidth: 2, borderColor: Colors.success, marginBottom: 20 },
  previewTitle: { fontSize: 14, fontWeight: '800', color: Colors.successDark, marginBottom: 16, letterSpacing: 0.5 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  previewLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  previewValue: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  streamList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, marginBottom: 16 },
  streamChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, gap: 6 },
  streamChipText: { fontSize: 12, fontWeight: '700' },
  streamChipDur: { fontSize: 10, fontWeight: '600', opacity: 0.7 },
  sampleDay: { backgroundColor: Colors.appBg, borderRadius: 14, padding: 14, marginBottom: 16 },
  sampleDayTitle: { fontSize: 12, fontWeight: '800', color: Colors.textDim, letterSpacing: 1, marginBottom: 8 },
  sampleDayRow: { flexDirection: 'row', paddingVertical: 4, gap: 8 },
  sampleDayStream: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, width: 80 },
  sampleDayTopic: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  importBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.success, borderRadius: 16, paddingVertical: 16, gap: 8 },
  importBtnText: { fontSize: 14, fontWeight: '800', color: Colors.surface },
  exampleCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, borderWidth: 2, borderColor: Colors.border },
  exampleTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  exampleCode: { fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: Colors.textSecondary, backgroundColor: Colors.appBg, padding: 14, borderRadius: 12, lineHeight: 16 },
});
