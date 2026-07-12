/**
 * Register Screen — professional dark-luxury design.
 * Fields: full name, phone (any country), email (optional),
 *         nationality (all world countries in Arabic), password.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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

// ─── Design tokens ────────────────────────────────────────────────────────────
const GOLD   = '#C9A060';
const GOLD2  = '#E8C07A';
const DARK   = '#0B1628';
const DARK2  = '#0F1E36';
const DARK3  = '#162035';
const BORDER = 'rgba(201,160,96,0.15)';
const MUTED  = 'rgba(255,255,255,0.48)';
const WHITE  = '#FFFFFF';
const INPUT_BG = 'rgba(255,255,255,0.06)';
const ERROR  = '#EF4444';

// ─── Nationality picker modal ──────────────────────────────────────────────────
function NationalityPickerModal({
  visible, selected, onSelect, onClose,
}: { visible: boolean; selected: string; onSelect: (n: string) => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? NATIONALITIES.filter(n => n.includes(query.trim()))
    : NATIONALITIES;

  function pick(n: string) { onSelect(n); setQuery(''); onClose(); }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={natStyles.backdrop} onPress={onClose} />
      <View style={[natStyles.sheet, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 16 }]}>
        <View style={natStyles.header}>
          <TouchableOpacity onPress={onClose} style={natStyles.closeBtn}>
            <Ionicons name="close" size={22} color={MUTED} />
          </TouchableOpacity>
          <Text style={natStyles.title}>اختر الجنسية</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={natStyles.searchWrap}>
          <Ionicons name="search" size={16} color={MUTED} style={{ marginLeft: 8 }} />
          <TextInput
            style={natStyles.searchInput}
            placeholder="ابحث عن الجنسية..."
            placeholderTextColor={MUTED}
            value={query}
            onChangeText={setQuery}
            textAlign="right"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={{ paddingHorizontal: 8 }}>
              <Ionicons name="close-circle" size={16} color={MUTED} />
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
              style={[natStyles.item, selected === item && natStyles.itemActive]}
              onPress={() => pick(item)}
              activeOpacity={0.7}
            >
              {selected === item && (
                <Ionicons name="checkmark" size={16} color={GOLD} style={{ marginLeft: 4 }} />
              )}
              <Text style={natStyles.itemText}>{item}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Text style={{ color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 14 }}>لا توجد نتائج</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
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

  const inputBorder = (field: string) =>
    errors[field] ? ERROR + '80' : focusedField === field ? 'rgba(201,160,96,0.4)' : BORDER;

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
    <LinearGradient colors={[DARK, DARK2, '#111E35']} style={[styles.screen, { paddingTop }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand ──────────────────────────────────────────────────────── */}
          <View style={styles.brandWrap}>
            <View style={styles.logoCircle}>
              <LinearGradient colors={[GOLD, GOLD2]} style={styles.logoGradient}>
                <Ionicons name="person-add" size={26} color={DARK} />
              </LinearGradient>
            </View>
            <Text style={styles.brandName}>إنشاء حساب جديد</Text>
            <Text style={styles.brandSub}>انضم إلى قمة للسفر والسياحة</Text>
          </View>

          {/* ── Card ───────────────────────────────────────────────────────── */}
          <View style={styles.card}>

            {/* Full Name */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>الاسم الكامل <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrap, { borderColor: inputBorder('fullName') }]}>
                <Ionicons name="person-outline" size={18} color={MUTED} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="الاسم الكامل"
                  placeholderTextColor={MUTED}
                  value={fullName}
                  onChangeText={v => { setFullName(v); clearError('fullName'); }}
                  textAlign="right"
                  onFocus={() => setFocusedField('fullName')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
            </View>

            {/* Phone */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>رقم الهاتف <Text style={styles.required}>*</Text></Text>
              <View style={[styles.phoneRow, { borderColor: inputBorder('phone') }]}>
                <TouchableOpacity
                  style={styles.countryBtn}
                  onPress={() => setShowDialPicker(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <Text style={styles.countryDial}>{country.dial}</Text>
                  <Ionicons name="chevron-down" size={12} color={MUTED} />
                </TouchableOpacity>
                <View style={styles.phoneDivider} />
                <TextInput
                  style={styles.phoneInput}
                  placeholder="رقم الهاتف"
                  placeholderTextColor={MUTED}
                  value={phone}
                  onChangeText={v => { setPhone(v); clearError('phone'); }}
                  keyboardType="phone-pad"
                  textAlign="right"
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* Email (optional) */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>البريد الإلكتروني <Text style={styles.optional}>(اختياري)</Text></Text>
              <View style={[styles.inputWrap, { borderColor: inputBorder('email') }]}>
                <Ionicons name="mail-outline" size={18} color={MUTED} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="example@email.com"
                  placeholderTextColor={MUTED}
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
              <Text style={styles.label}>الجنسية <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={[styles.selectorWrap, { borderColor: inputBorder('nationality') }]}
                onPress={() => setShowNatPicker(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-down" size={16} color={MUTED} style={{ marginLeft: 8 }} />
                <Text style={[styles.selectorText, !nationality && { color: MUTED }]}>
                  {nationality || 'اختر جنسيتك'}
                </Text>
                <Ionicons name="flag-outline" size={18} color={MUTED} style={styles.inputIcon} />
              </TouchableOpacity>
              {errors.nationality && <Text style={styles.errorText}>{errors.nationality}</Text>}
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>كلمة المرور <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrap, { borderColor: inputBorder('password') }]}>
                <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={MUTED} />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder="6 أحرف على الأقل"
                  placeholderTextColor={MUTED}
                  value={password}
                  onChangeText={v => { setPassword(v); clearError('password'); }}
                  secureTextEntry={!showPass}
                  textAlign="right"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {/* Strength indicator */}
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
                              ? password.length >= 10 ? '#22c55e'
                                : password.length >= 7 ? GOLD
                                : ERROR
                              : 'rgba(255,255,255,0.08)',
                        },
                      ]}
                    />
                  ))}
                  <Text style={styles.strengthLabel}>
                    {password.length >= 10 ? 'قوية' : password.length >= 7 ? 'جيدة' : 'ضعيفة'}
                  </Text>
                </View>
              )}
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Confirm password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>تأكيد كلمة المرور <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrap, { borderColor: inputBorder('confirmPass') }]}>
                <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={MUTED} />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder="أعد إدخال كلمة المرور"
                  placeholderTextColor={MUTED}
                  value={confirmPass}
                  onChangeText={v => { setConfirmPass(v); clearError('confirmPass'); }}
                  secureTextEntry={!showConfirm}
                  textAlign="right"
                  onFocus={() => setFocusedField('confirmPass')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {errors.confirmPass && <Text style={styles.errorText}>{errors.confirmPass}</Text>}
            </View>

            {/* ── Terms checkbox (mandatory) ─────────────────────────── */}
            <TouchableOpacity
              style={[styles.checkboxRow, errors.terms && styles.checkboxRowError]}
              onPress={() => { setAgreedTerms(v => !v); if (errors.terms) setErrors(p => { const n={...p}; delete n.terms; return n; }); }}
              activeOpacity={0.75}
            >
              {/* Box */}
              <View style={[styles.checkbox, agreedTerms && styles.checkboxChecked]}>
                {agreedTerms && <Ionicons name="checkmark" size={13} color={DARK} />}
              </View>
              {/* Label */}
              <Text style={styles.checkboxLabel}>
                أوافق على{' '}
                <Text
                  style={styles.checkboxLink}
                  onPress={(e) => { e.stopPropagation?.(); router.push('/legal/terms' as any); }}
                >
                  شروط الاستخدام
                </Text>
                {' '}و{' '}
                <Text
                  style={styles.checkboxLink}
                  onPress={(e) => { e.stopPropagation?.(); router.push('/legal/privacy' as any); }}
                >
                  سياسة الخصوصية
                </Text>
                {' '}الخاصة بالتطبيق
              </Text>
            </TouchableOpacity>
            {errors.terms && (
              <Text style={[styles.errorText, { textAlign: 'center', marginTop: -4, marginBottom: 8 }]}>
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
                  ? <ActivityIndicator size="small" color={DARK} />
                  : (
                    <>
                      <Ionicons name="person-add-outline" size={20} color={agreedTerms ? DARK : 'rgba(255,255,255,0.5)'} />
                      <Text style={[styles.submitBtnText, !agreedTerms && { color: 'rgba(255,255,255,0.5)' }]}>إنشاء الحساب</Text>
                    </>
                  )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Consent line below button */}
            <Text style={styles.consentLine}>
              بإنشائك حسابًا، فإنك توافق على{' '}
              <Text
                style={styles.consentLink}
                onPress={() => router.push('/legal/terms' as any)}
              >
                شروط الاستخدام
              </Text>
              {' '}و{' '}
              <Text
                style={styles.consentLink}
                onPress={() => router.push('/legal/privacy' as any)}
              >
                سياسة الخصوصية
              </Text>
              {' '}الخاصة بتطبيق قمة النظائر للسفريات والسياحة.
            </Text>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>أو</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google */}
            <TouchableOpacity
              style={styles.googleBtn}
              activeOpacity={0.8}
              onPress={() => Alert.alert('قريباً', 'تسجيل الدخول بجوجل قيد الإعداد')}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>المتابعة عبر Google</Text>
            </TouchableOpacity>

            {/* Login link */}
            <View style={styles.loginRow}>
              <TouchableOpacity onPress={() => router.replace('/auth/login')} activeOpacity={0.7}>
                <Text style={styles.loginLink}>تسجيل الدخول</Text>
              </TouchableOpacity>
              <Text style={styles.loginHint}>لديك حساب بالفعل؟</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country dial picker */}
      <CountryPickerModal
        visible={showDialPicker}
        selected={country}
        onSelect={setCountry}
        onClose={() => setShowDialPicker(false)}
      />
      {/* Nationality picker */}
      <NationalityPickerModal
        visible={showNatPicker}
        selected={nationality}
        onSelect={setNationality}
        onClose={() => setShowNatPicker(false)}
      />
    </LinearGradient>
  );
}

// ─── Nationality modal styles ──────────────────────────────────────────────────
const natStyles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: DARK2, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderTopColor: BORDER, maxHeight: '85%',
  },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { flex: 1, textAlign: 'center', color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 16 },
  searchWrap: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: DARK3, borderRadius: 12, borderWidth: 1, borderColor: BORDER, margin: 12,
  },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, color: WHITE, fontFamily: 'Tajawal_400Regular', fontSize: 14 },
  item: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  itemActive: { backgroundColor: 'rgba(201,160,96,0.08)' },
  itemText: { flex: 1, color: WHITE, fontFamily: 'Tajawal_500Medium', fontSize: 14, textAlign: 'right' },
});

// ─── Screen styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1, padding: 20, paddingBottom: 40 },

  brandWrap: { alignItems: 'center', paddingVertical: 20 },
  logoCircle: { marginBottom: 12 },
  logoGradient: {
    width: 66, height: 66, borderRadius: 33,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: GOLD, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  brandName: { color: WHITE, fontSize: 20, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center' },
  brandSub: { color: MUTED, fontSize: 12, fontFamily: 'Tajawal_400Regular', textAlign: 'center', marginTop: 2 },

  card: {
    backgroundColor: 'rgba(15,30,54,0.85)',
    borderRadius: 24, borderWidth: 1, borderColor: BORDER, padding: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 8,
  },

  fieldWrap: { marginBottom: 12 },
  label: { color: MUTED, fontSize: 12, fontFamily: 'Tajawal_500Medium', textAlign: 'right', marginBottom: 7 },
  required: { color: '#EF4444' },
  optional: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  errorText: { color: '#EF4444', fontFamily: 'Tajawal_400Regular', fontSize: 11, textAlign: 'right', marginTop: 4 },

  inputWrap: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: INPUT_BG, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14,
  },
  inputIcon: { marginLeft: 8 },
  eyeBtn: { padding: 4, marginLeft: 4 },
  input: { flex: 1, paddingVertical: 14, color: WHITE, fontFamily: 'Tajawal_400Regular', fontSize: 15 },

  phoneRow: {
    flexDirection: 'row-reverse', backgroundColor: INPUT_BG,
    borderRadius: 14, borderWidth: 1, overflow: 'hidden',
  },
  countryBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 14,
  },
  countryFlag: { fontSize: 20 },
  countryDial: { color: GOLD, fontFamily: 'Tajawal_700Bold', fontSize: 12 },
  phoneDivider: { width: 1, backgroundColor: BORDER },
  phoneInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, color: WHITE, fontFamily: 'Tajawal_400Regular', fontSize: 15 },

  selectorWrap: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: INPUT_BG, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14,
  },
  selectorText: { flex: 1, color: WHITE, fontFamily: 'Tajawal_400Regular', fontSize: 15, textAlign: 'right' },

  // Password strength
  strengthRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 6 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 11, marginRight: 4 },

  // Checkbox row
  checkboxRow: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(201,160,96,0.06)',
    borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(201,160,96,0.18)',
    padding: 14, marginBottom: 10,
  },
  checkboxRowError: {
    borderColor: ERROR + '80', backgroundColor: 'rgba(239,68,68,0.05)',
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: 'rgba(201,160,96,0.45)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexShrink: 0, marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: GOLD, borderColor: GOLD,
  },
  checkboxLabel: {
    flex: 1, color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Tajawal_500Medium', fontSize: 13.5,
    textAlign: 'right', lineHeight: 22,
  },
  checkboxLink: {
    color: GOLD, fontFamily: 'Tajawal_700Bold',
    textDecorationLine: 'underline',
  },

  // Consent line below button
  consentLine: {
    color: 'rgba(255,255,255,0.38)',
    fontFamily: 'Tajawal_400Regular',
    fontSize: 11.5, textAlign: 'center', lineHeight: 19,
    marginTop: -10, marginBottom: 14,
  },
  consentLink: {
    color: 'rgba(201,160,96,0.7)',
    fontFamily: 'Tajawal_500Medium',
    textDecorationLine: 'underline',
  },

  // Submit
  submitBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 10 },
  btnGradient: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
  },
  submitBtnText: { color: DARK, fontFamily: 'Tajawal_800ExtraBold', fontSize: 17 },

  // Divider
  divider: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: BORDER },
  dividerText: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 12 },

  // Google
  googleBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 13, borderRadius: 14,
    borderWidth: 1.5, borderColor: BORDER, backgroundColor: 'rgba(255,255,255,0.04)', marginBottom: 18,
  },
  googleIcon: { color: '#EA4335', fontFamily: 'Tajawal_800ExtraBold', fontSize: 18, width: 24, textAlign: 'center' },
  googleText: { color: WHITE, fontFamily: 'Tajawal_700Bold', fontSize: 15 },

  // Login link
  loginRow: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 6 },
  loginHint: { color: MUTED, fontFamily: 'Tajawal_400Regular', fontSize: 14 },
  loginLink: { color: GOLD, fontFamily: 'Tajawal_700Bold', fontSize: 14 },
});
