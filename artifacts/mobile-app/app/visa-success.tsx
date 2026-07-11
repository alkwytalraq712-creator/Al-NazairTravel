import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export default function VisaSuccessScreen() {
  const { appId, ref, dest } = useLocalSearchParams<{ appId: string; ref: string; dest?: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  // Entrance animations
  const scale = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#0a1628', '#0f2040', '#0a1628']}
        style={{ flex: 1, paddingTop }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Animated check icon */}
          <Animated.View style={{ alignItems: 'center', marginBottom: 32, transform: [{ scale }], opacity }}>
            <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(34,197,94,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(34,197,94,0.3)' }}>
              <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(34,197,94,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
              </View>
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View style={{ alignItems: 'center', marginBottom: 32, opacity, transform: [{ translateY: slideUp }] }}>
            <Text style={{ color: '#fff', fontFamily: 'Tajawal_800ExtraBold', fontSize: 26, textAlign: 'center', marginBottom: 10 }}>
              تم تقديم طلبك بنجاح! 🎉
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Tajawal_400Regular', fontSize: 15, textAlign: 'center', lineHeight: 24 }}>
              {dest ? `طلب تأشيرة ${dest}` : 'طلب التأشيرة'} في مرحلة المراجعة{'\n'}سيتواصل معك فريقنا قريباً
            </Text>
          </Animated.View>

          {/* Reference number card */}
          <Animated.View style={{ opacity, transform: [{ translateY: slideUp }] }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 12 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Tajawal_400Regular', fontSize: 13, textAlign: 'center', marginBottom: 10 }}>
                رقم مرجع الطلب
              </Text>
              <Text style={{ color: '#60a5fa', fontFamily: 'Tajawal_800ExtraBold', fontSize: 22, textAlign: 'center', letterSpacing: 1.5 }}>
                {ref ?? '—'}
              </Text>
            </View>

            {/* Status steps */}
            <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 32 }}>
              {[
                { icon: 'checkmark-circle', color: '#22c55e', label: 'تم استلام الطلب', done: true },
                { icon: 'time-outline', color: '#f59e0b', label: 'قيد المراجعة من الفريق', done: false },
                { icon: 'send-outline', color: '#6366f1', label: 'التقديم للسفارة', done: false },
                { icon: 'ribbon-outline', color: '#10b981', label: 'إصدار التأشيرة', done: false },
              ].map((step, i) => (
                <View key={i} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingVertical: 9, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                  <Ionicons name={step.icon as any} size={20} color={step.done ? step.color : 'rgba(255,255,255,0.25)'} />
                  <Text style={{ flex: 1, color: step.done ? '#fff' : 'rgba(255,255,255,0.4)', fontFamily: step.done ? 'Tajawal_700Bold' : 'Tajawal_400Regular', fontSize: 14, textAlign: 'right' }}>
                    {step.label}
                  </Text>
                  {step.done && (
                    <View style={{ backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: '#22c55e', fontFamily: 'Tajawal_700Bold', fontSize: 11 }}>مكتمل</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Action buttons */}
          <Animated.View style={{ gap: 12, opacity, transform: [{ translateY: slideUp }] }}>
            {/* Track application */}
            <TouchableOpacity
              onPress={() => router.replace(`/visa-application/${appId}` as any)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#1a56db', '#1d4ed8']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, paddingVertical: 17, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10 }}
              >
                <Ionicons name="document-text-outline" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontFamily: 'Tajawal_700Bold', fontSize: 16 }}>
                  متابعة الطلب
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Go home */}
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)' as any)}
              activeOpacity={0.8}
              style={{ borderRadius: 16, paddingVertical: 16, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.04)' }}
            >
              <Ionicons name="home-outline" size={20} color="rgba(255,255,255,0.7)" />
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Tajawal_700Bold', fontSize: 16 }}>
                العودة للصفحة الرئيسية
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
