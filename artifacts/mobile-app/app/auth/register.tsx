import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import CountryPickerModal from '@/components/CountryPickerModal';
import { DEFAULT_COUNTRY, NATIONALITIES, type Country } from '@/lib/countries';
import { useColors } from '@/hooks/useColors';

const GOLD   = '#E97900';
const GOLD2  = '#F5A030';

function NationalityPickerModal({
  visible, selected, onSelect, onClose,
}: { visible: boolean; selected: string; onSelect: (n: string) => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? NATIONALITIES.filter(n => n.includes(query.trim()))
    : NATIONALITIES;

  function pick(n: string) { onSelect(n); setQuery(''); onClose(); }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={natStyles.backdrop} onPress={onClose} />
      <View style={[natStyles.sheet, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Platform.OS === 'ios' ? insets.bottom : 16 }]}>
        <View style={[natStyles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={[natStyles.closeBtn, { backgroundColor: colors.input }]}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[natStyles.title, { color: colors.foreground }]}>اختر الجنسية</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={[natStyles.searchWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.mutedForeground} style={{ marginLeft: 10 }} />
          <TextInput
            style={[natStyles.searchInput, { color: colors.foreground }]}
            placeholder="ابحث عن الجنسية..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            textAlign="right"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={{ paddingHorizontal: 12 }}>
              <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={filtered}
          keyExtractor={item => item}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[natStyles.item, { borderBottomColor: colors.border }, selected === item && { backgroundColor: colors.accent }]}
              onPress={() => pick(item)}
              activeOpacity={0.7}
            >
              {selected === item && (
                <Ionicons name="checkmark" size={20} color={colors.primary} style={{ marginLeft: 8 }} />
              )}
              <Text style={[natStyles.itemText, { color: selected === item ? colors.primary : colors.foreground }]}>{item}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Tajawal_500Medium', fontSize: 16 }}>لا توجد نتائج</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { register } = useAuth();
  const paddingTop = Platform.OS === 'web' ? 67 : insets.top;

  const [fullName,     setFullName]     = useState('');
  const [country,      setCountry]      = useState<Country>(DEFAULT_COUNTRY);
  const [phone,        setPhone]        = useState('');
  const [email,        setEmail]        = useState('');
  const [nationality,  setNationality]  = useState('');
  const [password,     setPassword]     = useState('');
  const [confirmPass,  setConfirmPass]  = useState('');
  const [showPass,     setShowPass]     = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [showDialPicker, setShowDialPicker] = useState(false);
  const [showNatPicker,  setShowNatPicker]  = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors,       setErrors]       = useState<Record<string, string>>({});
  const [agreedTerms,  setAgreedTerms]  = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, speed: 12, bounciness: 4, useNativeDriver: true })
    ]).start();
  }, [fadeAnim, slideAnim]);

  const inputBorder = (field: string) =>
    errors[field] ? colors.destructive : focusedField === field ? colors.primary : colors.border;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!fullName.trim())      e.fullName = 'الاسم مطلوب';
    if (!phone.trim())         e.phone    = 'رقم الهاتف مطلوب';
    if (!nationality.trim())   e.nationality = 'الجنسية مطلوبة';
    if (!password)             e.password = 'كلمة المرور مطلوبة';
    if (password.length < 6)   e.password = 'يجب أن تكون 6 أحرف على الأقل';
    if (password !== confirmPass) e.confirmPass = 'كلمتا المرور غير متطابقتين';
    if (!agreedTerms)          e.terms = 'يجب الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    const fullPhone = country.dial + phone.replace(/^0+/, '').trim();
    setLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        phone: fullPhone,
        email: email.trim() || undefined,
        password,
        nationality: nationality || undefined,
      } as any);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('خطأ في التسجيل', e?.message ?? 'حدث خطأ، يرجى المحاولة مجدداً');
    } finally {
      setLoading(false);
    }
  }

  function clearError(field: string) {
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Animated.ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* Brand */}
          <View style={styles.brandWrap}>
            <Image
              source={require('@/assets/images/company-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.brandName, { color: colors.foreground }]}>إنشاء حساب جديد</Text>
            <Text style={[styles.brandSub, { color: colors.mutedForeground }]}>انضم إلى قمة النظائر للسفريات والسياحة</Text>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

            {/* Full Name */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>الاسم الكامل <Text style={{ color: colors.destructive }}>*</Text></Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: inputBorder('fullName') }]}>
                <Ionicons name="person-outline" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="الاسم الكامل"
                  placeholderTextColor={colors.mutedForeground}
                  value={fullName}
                  onChangeText={v => { setFullName(v); clearError('fullName'); }}
                  textAlign="right"
                  onFocus={() => setFocusedField('fullName')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {errors.fullName && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.fullName}</Text>}
            </View>

            {/* Phone */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>رقم الهاتف <Text style={{ color: colors.destructive }}>*</Text></Text>
              <View style={[styles.phoneRow, { backgroundColor: colors.input, borderColor: inputBorder('phone') }]}>
                <TouchableOpacity
                  style={styles.countryBtn}
                  onPress={() => setShowDialPicker(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <Text style={[styles.countryDial, { color: colors.primary }]}>{country.dial}</Text>
                  <Ionicons name="chevron-down" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
                <View style={[styles.phoneDivider, { backgroundColor: colors.border }]} />
                <TextInput
                  style={[styles.phoneInput, { color: colors.foreground }]}
                  placeholder="رقم الهاتف"
                  placeholderTextColor={colors.mutedForeground}
                  value={phone}
                  onChangeText={v => { setPhone(v); clearError('phone'); }}
                  keyboardType="phone-pad"
                  textAlign="right"
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {errors.phone && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.phone}</Text>}
            </View>

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>البريد الإلكتروني <Text style={{ fontSize: 12, color: colors.mutedForeground }}>(اختياري)</Text></Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: inputBorder('email') }]}>
                <Ionicons name="mail-outline" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="example@email.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textAlign="right"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Nationality */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>الجنسية <Text style={{ color: colors.destructive }}>*</Text></Text>
              <TouchableOpacity
                style={[styles.selectorWrap, { backgroundColor: colors.input, borderColor: inputBorder('nationality') }]}
                onPress={() => setShowNatPicker(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} style={{ marginLeft: 10 }} />
                <Text style={[styles.selectorText, { color: nationality ? colors.foreground : colors.mutedForeground }]}>
                  {nationality || 'اختر جنسيتك'}
                </Text>
                <Ionicons name="flag-outline" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
              </TouchableOpacity>
              {errors.nationality && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.nationality}</Text>}
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>كلمة المرور <Text style={{ color: colors.destructive }}>*</Text></Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: inputBorder('password') }]}>
                <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.mutedForeground} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="6 أحرف على الأقل"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={v => { setPassword(v); clearError('password'); }}
                  secureTextEntry={!showPass}
                  textAlign="right"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  {[1,2,3,4].map(i => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            password.length >= i * 3
                              ? password.length >= 10 ? colors.success
                                : password.length >= 7 ? colors.warning
                                : colors.destructive
                              : colors.input,
                        },
                      ]}
                    />
                  ))}
                  <Text style={[styles.strengthLabel, { color: colors.mutedForeground }]}>
                    {password.length >= 10 ? 'قوية' : password.length >= 7 ? 'جيدة' : 'ضعيفة'}
                  </Text>
                </View>
              )}
              {errors.password && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.password}</Text>}
            </View>

            {/* Confirm password */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>تأكيد كلمة المرور <Text style={{ color: colors.destructive }}>*</Text></Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: inputBorder('confirmPass') }]}>
                <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.mutedForeground} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="أعد إدخال كلمة المرور"
                  placeholderTextColor={colors.mutedForeground}
                  value={confirmPass}
                  onChangeText={v => { setConfirmPass(v); clearError('confirmPass'); }}
                  secureTextEntry={!showConfirm}
                  textAlign="right"
                  onFocus={() => setFocusedField('confirmPass')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {errors.confirmPass && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.confirmPass}</Text>}
            </View>

            {/* Terms checkbox */}
            <TouchableOpacity
              style={[
                styles.checkboxRow,
                { backgroundColor: colors.card, borderColor: errors.terms ? colors.destructive : colors.border }
              ]}
              onPress={() => { setAgreedTerms(v => !v); if (errors.terms) setErrors(p => { const n={...p}; delete n.terms; return n; }); }}
              activeOpacity={0.75}
            >
              <View style={[styles.checkbox, { backgroundColor: colors.input, borderColor: colors.border }, agreedTerms && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                {agreedTerms && <Ionicons name="checkmark" size={16} color={colors.primaryForeground} />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.foreground }]}>
                أوافق على{' '}
                <Text
                  style={[styles.checkboxLink, { color: colors.primary }]}
                  onPress={(e) => { e.stopPropagation?.(); router.push('/legal/terms' as any); }}
                >
                  شروط الاستخدام
                </Text>
                {' '}و{' '}
                <Text
                  style={[styles.checkboxLink, { color: colors.primary }]}
                  onPress={(e) => { e.stopPropagation?.(); router.push('/legal/privacy' as any); }}
                >
                  سياسة الخصوصية
                </Text>
              </Text>
            </TouchableOpacity>
            {errors.terms && (
              <Text style={[styles.errorText, { textAlign: 'center', marginTop: -4, marginBottom: 12, color: colors.destructive }]}>
                {errors.terms}
              </Text>
            )}

            {/* Submit button */}
            <TouchableOpacity
              style={[styles.submitBtn, (loading || !agreedTerms) && { opacity: agreedTerms ? 0.75 : 0.45 }]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={loading}
            >
              <LinearGradient
                colors={agreedTerms ? [GOLD, GOLD2] : ['#555', '#444']}
                style={styles.btnGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {loading
                  ? <ActivityIndicator size="small" color="#0B1628" />
                  : (
                    <>
                      <Ionicons name="person-add-outline" size={22} color={agreedTerms ? '#0B1628' : 'rgba(255,255,255,0.5)'} />
                      <Text style={[styles.submitBtnText, !agreedTerms && { color: 'rgba(255,255,255,0.5)' }]}>إنشاء الحساب</Text>
                    </>
                  )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={[styles.consentLine, { color: colors.mutedForeground }]}>
              بإنشائك حسابًا، فإنك توافق على{' '}
              <Text
                style={[styles.consentLink, { color: colors.primary }]}
                onPress={() => router.push('/legal/terms' as any)}
              >
                شروط الاستخدام
              </Text>
              {' '}و{' '}
              <Text
                style={[styles.consentLink, { color: colors.primary }]}
                onPress={() => router.push('/legal/privacy' as any)}
              >
                سياسة الخصوصية
              </Text>
            </Text>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>أو</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Google */}
            <TouchableOpacity
              style={[styles.googleBtn, { backgroundColor: colors.input, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => Alert.alert('قريباً', 'التسجيل بجوجل قيد الإعداد')}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={[styles.googleText, { color: colors.foreground }]}>المتابعة عبر Google</Text>
            </TouchableOpacity>

            {/* Login link */}
            <View style={styles.loginRow}>
              <TouchableOpacity onPress={() => router.replace('/auth/login')} activeOpacity={0.7}>
                <Text style={[styles.loginLink, { color: colors.primary }]}>تسجيل الدخول</Text>
              </TouchableOpacity>
              <Text style={[styles.loginHint, { color: colors.mutedForeground }]}>لديك حساب بالفعل؟</Text>
            </View>
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      <CountryPickerModal
        visible={showDialPicker}
        selected={country}
        onSelect={setCountry}
        onClose={() => setShowDialPicker(false)}
      />
      <NationalityPickerModal
        visible={showNatPicker}
        selected={nationality}
        onSelect={setNationality}
        onClose={() => setShowNatPicker(false)}
      />
    </View>
  );
}

const natStyles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, maxHeight: '85%' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontFamily: 'Tajawal_800ExtraBold', fontSize: 18 },
  searchWrap: { flexDirection: 'row-reverse', alignItems: 'center', borderRadius: 16, borderWidth: 1, margin: 16, paddingVertical: 4 },
  searchInput: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontFamily: 'Tajawal_500Medium', fontSize: 16 },
  item: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  itemText: { flex: 1, fontFamily: 'Tajawal_700Bold', fontSize: 16, textAlign: 'right' },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  brandWrap: { alignItems: 'center', paddingVertical: 24 },
  logo: { width: 150, height: 128, marginBottom: 16 },
  brandName: { fontSize: 24, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center' },
  brandSub: { fontSize: 14, fontFamily: 'Tajawal_500Medium', textAlign: 'center', marginTop: 4 },
  card: { borderRadius: 24, borderWidth: 1, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.15, shadowRadius: 32, elevation: 10 },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontFamily: 'Tajawal_700Bold', textAlign: 'right', marginBottom: 8 },
  errorText: { fontFamily: 'Tajawal_500Medium', fontSize: 12, textAlign: 'right', marginTop: 6 },
  inputWrap: { flexDirection: 'row-reverse', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 },
  inputIcon: { marginLeft: 10 },
  eyeBtn: { padding: 8, marginLeft: 4 },
  input: { flex: 1, paddingVertical: 16, fontFamily: 'Tajawal_500Medium', fontSize: 16 },
  phoneRow: { flexDirection: 'row-reverse', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  countryBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 16 },
  countryFlag: { fontSize: 22 },
  countryDial: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 15 },
  phoneDivider: { width: 1 },
  phoneInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 16, fontFamily: 'Tajawal_500Medium', fontSize: 16 },
  selectorWrap: { flexDirection: 'row-reverse', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 16 },
  selectorText: { flex: 1, fontFamily: 'Tajawal_500Medium', fontSize: 16, textAlign: 'right' },
  strengthRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 10 },
  strengthBar: { flex: 1, height: 6, borderRadius: 3 },
  strengthLabel: { fontFamily: 'Tajawal_700Bold', fontSize: 13, marginRight: 6 },
  checkboxRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 12 },
  checkbox: { width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkboxLabel: { flex: 1, fontFamily: 'Tajawal_500Medium', fontSize: 14, textAlign: 'right', lineHeight: 22 },
  checkboxLink: { fontFamily: 'Tajawal_800ExtraBold', textDecorationLine: 'underline' },
  consentLine: { fontFamily: 'Tajawal_500Medium', fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: -6, marginBottom: 20 },
  consentLink: { fontFamily: 'Tajawal_700Bold', textDecorationLine: 'underline' },
  submitBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  btnGradient: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  submitBtnText: { color: '#0B1628', fontFamily: 'Tajawal_800ExtraBold', fontSize: 18 },
  divider: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontFamily: 'Tajawal_500Medium', fontSize: 14 },
  googleBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  googleIcon: { color: '#EA4335', fontFamily: 'Tajawal_800ExtraBold', fontSize: 20, width: 28, textAlign: 'center' },
  googleText: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 16 },
  loginRow: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8 },
  loginHint: { fontFamily: 'Tajawal_500Medium', fontSize: 15 },
  loginLink: { fontFamily: 'Tajawal_800ExtraBold', fontSize: 15 },
});
