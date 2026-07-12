/**
 * Legacy route: /apply-visa/:id
 * The main application flow now goes directly to /apply-visa/terms/:id from visa/[id].tsx.
 * This screen redirects to the terms screen to avoid dead routes.
 */
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useColors } from '@/hooks/useColors';

export default function ApplyVisaRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();

  useEffect(() => {
    if (id) {
      router.replace(`/apply-visa/terms/${id}` as any);
    }
  }, [id]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
