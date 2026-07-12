import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useListActiveBanners } from '@workspace/api-client-react';

const { width, height } = Dimensions.get('window');

// Fallback images when no banners loaded yet
const FALLBACKS = [
  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&q=85',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85',
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&q=85',
  'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&q=85',
];

const SLIDE_INTERVAL = 4500; // ms between slides
const FADE_DURATION = 900;   // ms for crossfade

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading } = useAuth();

  // ── Banners from API ────────────────────────────────────────────
  const { data: banners } = useListActiveBanners();

  const images: string[] = banners && banners.length > 0
    ? banners.map((b) => b.imageUrl)
    : FALLBACKS;

  // ── Crossfade state ─────────────────────────────────────────────
  // Two layers: bottom (always visible) + top (fading in)
  const [bottomIdx, setBottomIdx] = useState(0);
  const [topIdx, setTopIdx]       = useState(1);
  const [dotIdx, setDotIdx]       = useState(0);
  const topOpacity   = useRef(new Animated.Value(0)).current;
  const isAnimating  = useRef(false);

  // Reset when images list changes (e.g. banners loaded)
  useEffect(() => {
    setBottomIdx(0);
    setTopIdx(1 % images.length);
    setDotIdx(0);
    topOpacity.setValue(0);
    isAnimating.current = false;
  }, [images.length]);

  // Auto-advance slideshow
  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      if (isAnimating.current) return;
      isAnimating.current = true;

      // Fade top layer in
      Animated.timing(topOpacity, {
        toValue: 1,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start(() => {
        setBottomIdx(topIdx);
        const next = (topIdx + 1) % images.length;
        setTopIdx(next);
        setDotIdx(topIdx);
        topOpacity.setValue(0);
        isAnimating.current = false;
      });
    }, SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, [images, topIdx]);

  // ── Auth redirect ───────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading]);

  // While the auth check runs (or right after a successful auth, before the
  // redirect to the tabs fires) never render a blank white screen — show the
  // branded dark background with the logo. A plain `return null` here caused a
  // permanent white screen whenever the /api/auth/me request was slow or
  // unreachable from the device.
  if (isLoading || isAuthenticated) {
    return (
      <View style={styles.splash}>
        <Image
          source={require('@/assets/images/logo_transparent.png')}
          style={styles.splashLogo}
          resizeMode="contain"
        />
      </View>
    );
  }

  const paddingTop    = Platform.OS === 'web' ? 44 : insets.top;
  const paddingBottom = Platform.OS === 'web' ? 32 : insets.bottom + 16;

  return (
    <View style={styles.root}>

      {/* ── Background: two stacked image layers ───────────────── */}
      <View style={StyleSheet.absoluteFill}>
        {/* Bottom layer — always fully visible */}
        <Image
          source={{ uri: images[bottomIdx] }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        {/* Top layer — fades in over the bottom */}
        <Animated.Image
          source={{ uri: images[topIdx] }}
          style={[StyleSheet.absoluteFill, { opacity: topOpacity }]}
          resizeMode="cover"
        />
      </View>

      {/* ── Dark gradient overlay ───────────────────────────────── */}
      <LinearGradient
        colors={[
          'rgba(4,7,20,0.72)',
          'rgba(4,7,20,0.55)',
          'rgba(4,7,20,0.30)',
          'rgba(4,7,20,0.72)',
          'rgba(4,7,20,0.93)',
          'rgba(4,7,20,0.98)',
        ]}
        locations={[0, 0.18, 0.38, 0.58, 0.78, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Content ─────────────────────────────────────────────── */}
      <View style={[styles.screen, { paddingTop, paddingBottom }]}>

        {/* Dot indicators — top right */}
        {images.length > 1 && (
          <View style={styles.dotsRow}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === dotIdx ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        )}

        {/* ── Logo ───────────────────────────────────────────────── */}
        <View style={styles.logoWrap}>
          <Image
            source={require('@/assets/images/logo_transparent.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Spacer pushes text/buttons to bottom */}
        <View style={{ flex: 1 }} />

        {/* ── Brand text ─────────────────────────────────────────── */}
        <View style={styles.textBlock}>
          <Text style={styles.brandName}>قمة النظائر للسفر والسياحة</Text>
          <Text style={styles.tagline}>نسافر بك بثقة... وننجز رحلتك باحتراف</Text>
        </View>

        {/* ── Buttons ─────────────────────────────────────────────── */}
        <View style={styles.btnGroup}>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => router.push('/auth/register')}
            activeOpacity={0.85}
          >
            <Text style={styles.registerBtnText}>إنشاء حساب جديد</Text>
          </TouchableOpacity>
        </View>

        {/* ── Bottom links ────────────────────────────────────────── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomItem}>
            <Ionicons name="globe-outline" size={16} color="rgba(255,255,255,0.50)" />
            <Text style={styles.bottomItemText}>العربية</Text>
          </TouchableOpacity>
          <View style={styles.bottomDot} />
          <TouchableOpacity style={styles.bottomItem}>
            <Ionicons name="headset-outline" size={16} color="rgba(255,255,255,0.50)" />
            <Text style={styles.bottomItemText}>الدعم</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050810',
  },
  splash: {
    flex: 1,
    backgroundColor: '#050810',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 260,
    height: 140,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  // ── Dots ───────────────────────────────────────────────────────
  dotsRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 8,
    minHeight: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 22,
    backgroundColor: '#F08015',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  // ── Logo ────────────────────────────────────────────────────────
  logoWrap: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 370,
    height: 190,
  },

  // ── Text ────────────────────────────────────────────────────────
  textBlock: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 26,
    paddingHorizontal: 4,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 23,
    fontFamily: 'Tajawal_800ExtraBold',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 8,
  },
  tagline: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 14,
    fontFamily: 'Tajawal_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Buttons ─────────────────────────────────────────────────────
  btnGroup: {
    width: '100%',
    gap: 13,
    marginBottom: 22,
  },
  loginBtn: {
    width: '100%',
    backgroundColor: '#F08015',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    elevation: 6,
  },
  loginBtnText: {
    color: '#fff',
    fontFamily: 'Tajawal_800ExtraBold',
    fontSize: 17,
    letterSpacing: 0.3,
  },
  registerBtn: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.40)',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Tajawal_700Bold',
    fontSize: 16,
  },

  // ── Bottom bar ───────────────────────────────────────────────────
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingTop: 2,
  },
  bottomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bottomItemText: {
    color: 'rgba(255,255,255,0.50)',
    fontFamily: 'Tajawal_500Medium',
    fontSize: 13,
  },
  bottomDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
});
