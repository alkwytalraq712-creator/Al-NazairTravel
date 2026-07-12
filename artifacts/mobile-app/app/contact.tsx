import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useGetCompanySettings, useListBranches } from '@workspace/api-client-react';
import type { CompanySettings, Branch } from '@workspace/api-client-react';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const GOLD  = '#C9A060';
const NAVY  = '#060B18';
const NAVY2 = '#0C1628';
const NAVY3 = '#121F38';

function ActionBtn({
  icon, label, color, onPress,
}: { icon: string; label: string; color: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.actionBtn}>
      <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color: colors.foreground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function BranchCard({ branch, colors, index }: { branch: Branch; colors: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: index * 100,
      useNativeDriver: true,
      bounciness: 10,
    }).start();
  }, [anim, index]);

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [expanded, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  const callPhone = (n: string) => Linking.openURL(`tel:${n}`).catch(() => {});
  const openWA = (n: string) => Linking.openURL(`https://wa.me/${n.replace(/\D/g, '')}`).catch(() => {});
  const openMail = (e: string) => Linking.openURL(`mailto:${e}`).catch(() => {});
  const openMaps = (u: string) => Linking.openURL(u).catch(() => {});

  const gradientPairs: readonly [string, string][] = [
    ['#3B82F6', '#2563EB'],
    ['#10B981', '#059669'],
    ['#8B5CF6', '#6D28D9'],
    ['#F59E0B', '#D97706'],
    ['#EF4444', '#DC2626'],
  ];
  const colorPair = gradientPairs[index % gradientPairs.length];

  return (
    <Animated.View style={[
      styles.branchCard,
      { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.foreground },
      {
        opacity: anim,
        transform: [{
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })
        }]
      }
    ]}>
      <TouchableOpacity 
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setExpanded(x => !x);
        }} 
        activeOpacity={0.8}
      >
        <View style={styles.branchHeader}>
          <LinearGradient colors={colorPair} style={styles.branchGradientStrip} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
          <View style={styles.branchHeaderInner}>
            <View style={styles.branchHeaderLeft}>
              <View style={[styles.branchIconWrap, { backgroundColor: colors.background }]}>
                <Ionicons name="location" size={20} color={colorPair[0]} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.branchName, { color: colors.foreground }]}>{branch.name}</Text>
                  {branch.isMain && (
                    <View style={[styles.mainBadge, { backgroundColor: GOLD + '20' }]}>
                      <Text style={[styles.mainBadgeText, { color: GOLD }]}>رئيسي</Text>
                    </View>
                  )}
                </View>
                {(branch.city || branch.country) && (
                  <Text style={[styles.branchCity, { color: colors.mutedForeground }]}>
                    {[branch.city, branch.country].filter(Boolean).join('، ')}
                  </Text>
                )}
                {branch.status === 'closed' && (
                  <Text style={styles.closedTag}>مغلق مؤقتاً</Text>
                )}
              </View>
            </View>
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.branchBody}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {branch.address ? (
            <View style={styles.infoRow}>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{branch.address}</Text>
              <Ionicons name="map" size={16} color={colors.mutedForeground} />
            </View>
          ) : null}

          {branch.workHours ? (
            <View style={styles.infoRow}>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {branch.workDays ? `${branch.workDays} · ` : ''}{branch.workHours}
              </Text>
              <Ionicons name="time" size={16} color={colors.mutedForeground} />
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            {branch.phone && (
              <ActionBtn icon="call" label="اتصال" color="#22C55E" onPress={() => callPhone(branch.phone!)} />
            )}
            {branch.whatsapp && (
              <ActionBtn icon="logo-whatsapp" label="واتساب" color="#25D366" onPress={() => openWA(branch.whatsapp!)} />
            )}
            {branch.email && (
              <ActionBtn icon="mail" label="بريد" color="#6366F1" onPress={() => openMail(branch.email!)} />
            )}
            {branch.googleMapsUrl && (
              <ActionBtn icon="navigate" label="خرائط" color="#EF4444" onPress={() => openMaps(branch.googleMapsUrl!)} />
            )}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

function CompanyCard({ s, colors }: { s: CompanySettings; colors: any }) {
  const callPhone = (n?: string | null) => n && Linking.openURL(`tel:${n}`).catch(() => {});
  const openWA = (n?: string | null) => n && Linking.openURL(`https://wa.me/${n.replace(/\D/g, '')}`).catch(() => {});
  const openMail = (e?: string | null) => e && Linking.openURL(`mailto:${e}`).catch(() => {});
  const openUrl = (u?: string | null) => u && Linking.openURL(u).catch(() => {});

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  return (
    <Animated.View style={[
      styles.companyCard,
      { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.foreground, opacity: anim }
    ]}>
      {s.logoUrl ? (
        <View style={[styles.logoWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Image source={{ uri: s.logoUrl }} style={styles.companyLogo} contentFit="contain" />
        </View>
      ) : null}
      <Text style={[styles.companyName, { color: colors.foreground }]}>{s.companyName || 'قمة النظائر'}</Text>
      {s.about ? <Text style={[styles.companyAbout, { color: colors.mutedForeground }]}>{s.about}</Text> : null}

      {(s.workHours || s.workDays) ? (
        <View style={[styles.hoursWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="time" size={18} color={GOLD} />
          <Text style={[styles.hoursText, { color: colors.foreground }]}>
            {s.workDays ? `${s.workDays}  ` : ''}{s.workHours ?? ''}
          </Text>
        </View>
      ) : null}

      <View style={styles.companyActions}>
        {s.phonePrimary && (
          <ActionBtn icon="call" label="اتصال" color="#22C55E" onPress={() => callPhone(s.phonePrimary)} />
        )}
        {s.whatsapp && (
          <ActionBtn icon="logo-whatsapp" label="واتساب" color="#25D366" onPress={() => openWA(s.whatsapp)} />
        )}
        {s.emailSupport && (
          <ActionBtn icon="mail" label="بريد" color="#6366F1" onPress={() => openMail(s.emailSupport)} />
        )}
        {s.websiteUrl && (
          <ActionBtn icon="globe" label="الموقع" color="#3B82F6" onPress={() => openUrl(s.websiteUrl)} />
        )}
        {s.googleMapsUrl && (
          <ActionBtn icon="navigate" label="خرائط" color="#EF4444" onPress={() => openUrl(s.googleMapsUrl)} />
        )}
      </View>

      {[
        { key: 'instagram', icon: 'logo-instagram', color: '#E1306C' },
        { key: 'tiktok', icon: 'logo-tiktok', color: colors.foreground },
        { key: 'facebook', icon: 'logo-facebook', color: '#1877F2' },
        { key: 'twitter', icon: 'logo-twitter', color: '#1DA1F2' },
        { key: 'snapchat', icon: 'logo-snapchat', color: '#EAB308' },
        { key: 'youtube', icon: 'logo-youtube', color: '#FF0000' },
        { key: 'telegram', icon: 'paper-plane', color: '#26A5E4' },
      ].filter(({ key }) => !!(s as any)[key]).length > 0 && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border, width: '100%', marginVertical: 16 }]} />
          <View style={styles.socialRow}>
            {[
              { key: 'instagram', icon: 'logo-instagram', color: '#E1306C' },
              { key: 'tiktok', icon: 'logo-tiktok', color: colors.foreground },
              { key: 'facebook', icon: 'logo-facebook', color: '#1877F2' },
              { key: 'twitter', icon: 'logo-twitter', color: '#1DA1F2' },
              { key: 'snapchat', icon: 'logo-snapchat', color: '#EAB308' },
              { key: 'youtube', icon: 'logo-youtube', color: '#FF0000' },
              { key: 'telegram', icon: 'paper-plane', color: '#26A5E4' },
            ].filter(({ key }) => !!(s as any)[key]).map(({ key, icon, color }) => (
              <TouchableOpacity
                key={key}
                onPress={() => openUrl((s as any)[key])}
                style={[styles.socialBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                activeOpacity={0.75}
              >
                <Ionicons name={icon as any} size={22} color={color} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </Animated.View>
  );
}

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
      <LinearGradient colors={[NAVY, NAVY2, NAVY3]} style={[styles.headerGradient, { paddingTop: paddingTop + 12 }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>اتصل بنا</Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          {settings && <CompanyCard s={settings as CompanySettings} colors={colors} />}

          {visibleBranches.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>فروعنا</Text>
              {visibleBranches.map((branch, index) => (
                <BranchCard key={branch.id} branch={branch} colors={colors} index={index + 1} />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerGradient: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 20,
    marginBottom: 16,
  },
  headerInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Tajawal_800ExtraBold',
    textAlign: 'center',
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  companyCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  logoWrap: {
    width: 90,
    height: 90,
    borderRadius: 22,
    borderWidth: 1,
    padding: 8,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyLogo: { width: '100%', height: '100%' },
  companyName: { fontSize: 22, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center', marginBottom: 8 },
  companyAbout: { fontSize: 14, fontFamily: 'Tajawal_500Medium', textAlign: 'center', lineHeight: 24, marginBottom: 16 },
  hoursWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  hoursText: { fontSize: 14, fontFamily: 'Tajawal_700Bold' },
  companyActions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  socialRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  socialBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Tajawal_800ExtraBold',
    textAlign: 'right',
    marginBottom: 16,
    paddingHorizontal: 8,
  },

  branchCard: {
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  branchHeader: {
    flexDirection: 'row-reverse',
  },
  branchGradientStrip: {
    width: 6,
  },
  branchHeaderInner: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  branchHeaderLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  branchIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchName: { fontSize: 16, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'right' },
  branchCity: { fontSize: 13, fontFamily: 'Tajawal_500Medium', textAlign: 'right', marginTop: 4 },
  mainBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  mainBadgeText: { fontSize: 11, fontFamily: 'Tajawal_700Bold' },
  closedTag: { fontSize: 12, color: '#EF4444', fontFamily: 'Tajawal_700Bold', textAlign: 'right', marginTop: 4 },
  divider: { height: 1, marginVertical: 16 },
  branchBody: { paddingHorizontal: 16, paddingBottom: 16 },
  infoRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  infoText: { fontSize: 14, fontFamily: 'Tajawal_500Medium', flex: 1, textAlign: 'right', lineHeight: 22, marginTop: -2 },
  actionsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12, marginTop: 8 },

  actionBtn: { alignItems: 'center', gap: 6, minWidth: 64 },
  actionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, fontFamily: 'Tajawal_700Bold' },
});
