import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGetCompanySettings, useListBranches } from '@workspace/api-client-react';
import type { CompanySettings, Branch } from '@workspace/api-client-react';

// ─── Action Button ─────────────────────────────────────────────────────────────

function ActionBtn({
  icon, label, color, onPress,
}: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.actionBtn}>
      <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Branch Card ──────────────────────────────────────────────────────────────

function BranchCard({ branch, colors }: { branch: Branch; colors: any }) {
  const [expanded, setExpanded] = useState(false);

  const callPhone = (n: string) => Linking.openURL(`tel:${n}`).catch(() => {});
  const openWA = (n: string) => Linking.openURL(`https://wa.me/${n.replace(/\D/g, '')}`).catch(() => {});
  const openMail = (e: string) => Linking.openURL(`mailto:${e}`).catch(() => {});
  const openMaps = (u: string) => Linking.openURL(u).catch(() => {});

  return (
    <View style={[styles.branchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <TouchableOpacity onPress={() => setExpanded(x => !x)} activeOpacity={0.8}>
        <View style={styles.branchHeader}>
          <View style={styles.branchHeaderLeft}>
            <View style={styles.branchIconWrap}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.branchName, { color: colors.foreground }]}>{branch.name}</Text>
                {branch.isMain && (
                  <View style={[styles.mainBadge, { backgroundColor: colors.primary + '22' }]}>
                    <Text style={[styles.mainBadgeText, { color: colors.primary }]}>رئيسي</Text>
                  </View>
                )}
              </View>
              {(branch.city || branch.country) && (
                <Text style={[styles.branchCity, { color: colors.mutedForeground }]}>
                  {[branch.city, branch.country].filter(Boolean).join('، ')}
                </Text>
              )}
              {branch.status === 'closed' && (
                <Text style={[styles.closedTag]}>مغلق مؤقتاً</Text>
              )}
            </View>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18} color={colors.mutedForeground}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Details */}
      {expanded && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {branch.address ? (
            <View style={styles.infoRow}>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{branch.address}</Text>
              <Ionicons name="map-outline" size={14} color={colors.mutedForeground} />
            </View>
          ) : null}

          {branch.workHours ? (
            <View style={styles.infoRow}>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {branch.workDays ? `${branch.workDays} · ` : ''}{branch.workHours}
              </Text>
              <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            {branch.phone && (
              <ActionBtn icon="call-outline" label="اتصال" color="#22c55e" onPress={() => callPhone(branch.phone!)} />
            )}
            {branch.whatsapp && (
              <ActionBtn icon="logo-whatsapp" label="واتساب" color="#25D366" onPress={() => openWA(branch.whatsapp!)} />
            )}
            {branch.email && (
              <ActionBtn icon="mail-outline" label="بريد" color="#6366f1" onPress={() => openMail(branch.email!)} />
            )}
            {branch.googleMapsUrl && (
              <ActionBtn icon="navigate-outline" label="خرائط" color="#ef4444" onPress={() => openMaps(branch.googleMapsUrl!)} />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Company Info Card ────────────────────────────────────────────────────────

function CompanyCard({ s, colors }: { s: CompanySettings; colors: any }) {
  const callPhone = (n?: string | null) => n && Linking.openURL(`tel:${n}`).catch(() => {});
  const openWA = (n?: string | null) => n && Linking.openURL(`https://wa.me/${n.replace(/\D/g, '')}`).catch(() => {});
  const openMail = (e?: string | null) => e && Linking.openURL(`mailto:${e}`).catch(() => {});
  const openUrl = (u?: string | null) => u && Linking.openURL(u).catch(() => {});

  return (
    <View style={[styles.companyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {s.logoUrl ? (
        <Image source={{ uri: s.logoUrl }} style={styles.companyLogo} resizeMode="contain" />
      ) : null}
      <Text style={[styles.companyName, { color: colors.foreground }]}>{s.companyName || 'قمة النظائر'}</Text>
      {s.about ? <Text style={[styles.companyAbout, { color: colors.mutedForeground }]}>{s.about}</Text> : null}

      {/* Work Hours */}
      {(s.workHours || s.workDays) ? (
        <View style={[styles.hoursRow, { backgroundColor: colors.muted + '50', borderColor: colors.border }]}>
          <Ionicons name="time-outline" size={15} color={colors.primary} />
          <Text style={[styles.hoursText, { color: colors.foreground }]}>
            {s.workDays ? `${s.workDays}  ` : ''}{s.workHours ?? ''}
          </Text>
        </View>
      ) : null}

      {/* Quick actions */}
      <View style={styles.companyActions}>
        {s.phonePrimary && (
          <ActionBtn icon="call-outline" label="اتصال" color="#22c55e" onPress={() => callPhone(s.phonePrimary)} />
        )}
        {s.whatsapp && (
          <ActionBtn icon="logo-whatsapp" label="واتساب" color="#25D366" onPress={() => openWA(s.whatsapp)} />
        )}
        {s.emailSupport && (
          <ActionBtn icon="mail-outline" label="بريد" color="#6366f1" onPress={() => openMail(s.emailSupport)} />
        )}
        {s.websiteUrl && (
          <ActionBtn icon="globe-outline" label="الموقع" color="#3b82f6" onPress={() => openUrl(s.websiteUrl)} />
        )}
        {s.googleMapsUrl && (
          <ActionBtn icon="navigate-outline" label="خرائط" color="#ef4444" onPress={() => openUrl(s.googleMapsUrl)} />
        )}
      </View>

      {/* Social Links */}
      {[
        { key: 'instagram', icon: 'logo-instagram', color: '#E1306C' },
        { key: 'tiktok', icon: 'logo-tiktok', color: '#000000' },
        { key: 'facebook', icon: 'logo-facebook', color: '#1877F2' },
        { key: 'twitter', icon: 'logo-twitter', color: '#1DA1F2' },
        { key: 'snapchat', icon: 'logo-snapchat', color: '#FFFC00' },
        { key: 'youtube', icon: 'logo-youtube', color: '#FF0000' },
        { key: 'telegram', icon: 'paper-plane-outline', color: '#26A5E4' },
      ].filter(({ key }) => !!(s as any)[key]).length > 0 && (
        <View style={styles.socialRow}>
          {[
            { key: 'instagram', icon: 'logo-instagram', color: '#E1306C' },
            { key: 'tiktok', icon: 'logo-tiktok', color: '#000000' },
            { key: 'facebook', icon: 'logo-facebook', color: '#1877F2' },
            { key: 'twitter', icon: 'logo-twitter', color: '#1DA1F2' },
            { key: 'snapchat', icon: 'logo-snapchat', color: '#FFFC00' },
            { key: 'youtube', icon: 'logo-youtube', color: '#FF0000' },
            { key: 'telegram', icon: 'paper-plane-outline', color: '#26A5E4' },
          ].filter(({ key }) => !!(s as any)[key]).map(({ key, icon, color }) => (
            <TouchableOpacity
              key={key}
              onPress={() => openUrl((s as any)[key])}
              style={[styles.socialBtn, { borderColor: colors.border }]}
              activeOpacity={0.75}
            >
              <Ionicons name={icon as any} size={20} color={color} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ContactScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const { data: settings, isLoading: settingsLoading } = useGetCompanySettings();
  const { data: branches = [], isLoading: branchesLoading } = useListBranches();

  const isLoading = settingsLoading || branchesLoading;
  const visibleBranches = (branches as Branch[])
    .filter(b => b.isVisible)
    .sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0) || a.sortOrder - b.sortOrder);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>اتصل بنا</Text>
        <View style={{ width: 32 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {settings && <CompanyCard s={settings as CompanySettings} colors={colors} />}

          {visibleBranches.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>فروعنا</Text>
              {visibleBranches.map(branch => (
                <BranchCard key={branch.id} branch={branch} colors={colors} />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, gap: 12 },
  backBtn: { width: 32, alignItems: 'center' },
  headerTitle: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },

  companyCard: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 20, alignItems: 'center' },
  companyLogo: { width: 80, height: 80, borderRadius: 12, marginBottom: 10 },
  companyName: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  companyAbout: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  hoursRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginBottom: 14 },
  hoursText: { fontSize: 13, fontWeight: '500' },
  companyActions: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 12 },
  socialRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 },
  socialBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  sectionTitle: { fontSize: 16, fontWeight: '700', textAlign: 'right', marginBottom: 12 },

  branchCard: { borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  branchHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  branchHeaderLeft: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10, flex: 1 },
  branchIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#2563eb22', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  branchName: { fontSize: 15, fontWeight: '700', textAlign: 'right' },
  branchCity: { fontSize: 12, textAlign: 'right', marginTop: 2 },
  mainBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  mainBadgeText: { fontSize: 10, fontWeight: '700' },
  closedTag: { fontSize: 11, color: '#ef4444', textAlign: 'right', marginTop: 2 },
  divider: { height: 1, marginBottom: 12 },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  infoText: { fontSize: 12, flex: 1, textAlign: 'right', lineHeight: 18 },
  actionsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginTop: 6 },

  actionBtn: { alignItems: 'center', gap: 4 },
  actionIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '600' },
});
