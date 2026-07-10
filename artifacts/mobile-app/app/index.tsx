import React, { useEffect } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading } = useAuth();
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) return null;
  if (isAuthenticated) return null;

  if (!isDark) {
    // Light mode welcome
    return (
      <View style={[styles.lightScreen, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.lightLogoWrap}>
          <Image source={require('@/assets/images/logo_transparent.png')} style={styles.lightLogo} resizeMode="contain" />
        </View>
        <Text style={styles.lightTagline}>أهلاً بك في</Text>
        <Text style={styles.lightBrand}>قمة النظائر للسفريات والسياحة</Text>
        <Text style={styles.lightSub}>نسافر بك بثقة... وننجز رحلتك باحتراف</Text>

        <View style={styles.btnGroup}>
          <TouchableOpacity
            style={styles.lightLoginBtn}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.lightLoginBtnText}>تسجيل الدخول</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.lightRegisterBtn}
            onPress={() => router.push('/auth/register')}
            activeOpacity={0.8}
          >
            <Text style={styles.lightRegisterBtnText}>إنشاء حساب جديد</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomItem}>
            <Ionicons name="language-outline" size={18} color="#5B6680" />
            <Text style={styles.bottomItemTextLight}>العربية</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomItem}>
            <Ionicons name="headset-outline" size={18} color="#5B6680" />
            <Text style={styles.bottomItemTextLight}>الدعم</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Dark mode golden welcome
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#080C18', '#0A1020', '#0D1428', '#080C18']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative golden glow top */}
      <View style={styles.glowTop} />

      {/* Decorative cityline gradient at bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(200,150,42,0.08)', 'rgba(200,150,42,0.18)']}
        style={styles.cityGlow}
      />

      {/* Decorative bottom arch */}
      <View style={styles.archBg} />

      <View style={[styles.content, { paddingTop: (Platform.OS === 'web' ? 60 : insets.top) + 24, paddingBottom: insets.bottom + 24 }]}>

        {/* Top skip — RTL: text on right, arrow points left (forward) */}
        <TouchableOpacity style={styles.skipBtn} onPress={() => router.push('/auth/login')}>
          <Ionicons name="chevron-forward" size={16} color="#C8962A" />
          <Text style={styles.skipText}>تخطي</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoGlowRing} />
          <Image
            source={require('@/assets/images/logo_transparent.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Taglines */}
        <View style={styles.textBlock}>
          <Text style={styles.welcomeSmall}>أهلاً بك في</Text>
          <Text style={styles.brandName}>قمة النظائر للسفريات والسياحة</Text>
          <View style={styles.goldDivider} />
          <Text style={styles.tagline}>نسافر بك بثقة...</Text>
          <Text style={styles.tagline}>وننجز رحلتك باحتراف</Text>
        </View>

        {/* Plane icon decoration */}
        <View style={styles.planeRow}>
          <View style={styles.dashedLine} />
          <View style={styles.planeCircle}>
            <Ionicons name="airplane" size={28} color="#C8962A" style={{ transform: [{ rotate: '-45deg' }] }} />
          </View>
          <View style={styles.dashedLine} />
        </View>

        {/* Buttons */}
        <View style={styles.btnGroup}>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#D4A32A', '#C8962A', '#B8821A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginBtnGradient}
            >
              <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => router.push('/auth/register')}
            activeOpacity={0.8}
          >
            <Text style={styles.registerBtnText}>إنشاء حساب جديد</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomItem}>
            <Ionicons name="language-outline" size={18} color="#C8962A" />
            <Text style={styles.bottomItemText}>العربية</Text>
          </TouchableOpacity>
          <View style={styles.bottomDot} />
          <TouchableOpacity style={styles.bottomItem}>
            <Ionicons name="headset-outline" size={18} color="#C8962A" />
            <Text style={styles.bottomItemText}>الدعم</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080C18' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 28 },

  // Decorative
  glowTop: {
    position: 'absolute', top: -60, left: width * 0.2, right: width * 0.2,
    height: 200, borderRadius: 100,
    backgroundColor: 'rgba(200,150,42,0.07)',
  },
  cityGlow: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.35,
  },
  archBg: {
    position: 'absolute', bottom: -height * 0.08, left: -width * 0.1, right: -width * 0.1,
    height: height * 0.22, borderRadius: width * 0.6,
    backgroundColor: 'rgba(200,150,42,0.06)',
    borderTopWidth: 1, borderTopColor: 'rgba(200,150,42,0.15)',
  },

  // Skip
  skipBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginBottom: 8 },
  skipText: { color: '#C8962A', fontFamily: 'Tajawal_500Medium', fontSize: 14 },

  // Logo
  logoContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 24 },
  logoGlowRing: {
    position: 'absolute',
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: 'rgba(200,150,42,0.2)',
  },
  logo: { width: 160, height: 80 },

  // Text
  textBlock: { alignItems: 'center', marginBottom: 20 },
  welcomeSmall: { color: '#C8962A', fontSize: 15, fontFamily: 'Tajawal_500Medium', marginBottom: 4 },
  brandName: { color: '#F0E8D4', fontSize: 20, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center', lineHeight: 30 },
  goldDivider: { width: 60, height: 2, backgroundColor: '#C8962A', borderRadius: 2, marginVertical: 12 },
  tagline: { color: '#9AA8C0', fontSize: 15, fontFamily: 'Tajawal_400Regular', textAlign: 'center', lineHeight: 24 },

  // Plane row
  planeRow: { flexDirection: 'row', alignItems: 'center', width: '80%', marginBottom: 24 },
  dashedLine: { flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(200,150,42,0.3)' },
  planeCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(200,150,42,0.12)',
    borderWidth: 1, borderColor: 'rgba(200,150,42,0.3)',
    justifyContent: 'center', alignItems: 'center', marginHorizontal: 10,
  },

  // Buttons
  btnGroup: { width: '100%', gap: 12, marginBottom: 'auto' },
  loginBtn: { borderRadius: 14, overflow: 'hidden', elevation: 4, shadowColor: '#C8962A', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
  loginBtnGradient: { paddingVertical: 17, alignItems: 'center', borderRadius: 14 },
  loginBtnText: { color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 17, letterSpacing: 0.5 },
  registerBtn: {
    paddingVertical: 16, borderRadius: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#C8962A',
    backgroundColor: 'rgba(200,150,42,0.07)',
  },
  registerBtnText: { color: '#C8962A', fontFamily: 'Tajawal_700Bold', fontSize: 16 },

  // Bottom bar
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingTop: 20, marginTop: 16 },
  bottomItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bottomItemText: { color: '#C8962A', fontFamily: 'Tajawal_500Medium', fontSize: 13 },
  bottomItemTextLight: { color: '#5B6680', fontFamily: 'Tajawal_500Medium', fontSize: 13 },
  bottomDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(200,150,42,0.4)' },

  // Light mode
  lightScreen: { flex: 1, backgroundColor: '#F6F9FB', alignItems: 'center', paddingHorizontal: 28 },
  lightLogoWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lightLogo: { width: 180, height: 80 },
  lightTagline: { color: '#F08015', fontSize: 15, fontFamily: 'Tajawal_500Medium', marginBottom: 4 },
  lightBrand: { color: '#0D1526', fontSize: 20, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center', marginBottom: 8 },
  lightSub: { color: '#5B6680', fontSize: 14, fontFamily: 'Tajawal_400Regular', textAlign: 'center', marginBottom: 36 },
  lightLoginBtn: { width: '100%', borderRadius: 14, paddingVertical: 17, alignItems: 'center', backgroundColor: '#F08015' },
  lightLoginBtnText: { color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 17 },
  lightRegisterBtn: { width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#F08015' },
  lightRegisterBtnText: { color: '#F08015', fontFamily: 'Tajawal_700Bold', fontSize: 16 },
});
