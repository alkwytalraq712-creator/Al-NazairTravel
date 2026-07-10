import React, { useRef, useState, useEffect } from 'react';
import { Dimensions, FlatList, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import type { Banner } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

const { width: SCREEN_W } = Dimensions.get('window');
const BANNER_H = 200;

interface Props {
  banners: Banner[];
}

export function BannerSlider({ banners }: Props) {
  const colors = useColors();
  const [idx, setIdx] = useState(0);
  const listRef = useRef<FlatList<Banner>>(null);

  useEffect(() => {
    if (!banners.length) return;
    const timer = setInterval(() => {
      const next = (idx + 1) % banners.length;
      setIdx(next);
      listRef.current?.scrollToOffset({ offset: next * SCREEN_W, animated: true });
    }, 3500);
    return () => clearInterval(timer);
  }, [idx, banners.length]);

  if (!banners.length) {
    return (
      <View style={[styles.placeholder, { backgroundColor: colors.muted }]} />
    );
  }

  return (
    <View>
      <FlatList
        ref={listRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={banners.length > 1}
        keyExtractor={(b) => String(b.id)}
        onMomentumScrollEnd={(e) => {
          const newIdx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          setIdx(newIdx);
        }}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            contentFit="cover"
            placeholder={{ uri: 'data:image/png;base64,iVBORw0KGgo=' }}
          />
        )}
      />
      {banners.length > 1 && (
        <View style={styles.dots}>
          {banners.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === idx ? colors.primary : '#ffffff80' },
                i === idx && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { height: BANNER_H, borderRadius: 12, margin: 16 },
  image: { width: SCREEN_W, height: BANNER_H },
  dots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 18 },
});
