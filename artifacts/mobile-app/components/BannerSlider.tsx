import React, { useRef, useState, useEffect } from 'react';
import { FlatList, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import type { Banner } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

const BANNER_H = 200;

interface Props {
  banners: Banner[];
  renderOverlay?: (banner: Banner, index: number) => React.ReactNode;
}

export function BannerSlider({ banners, renderOverlay }: Props) {
  const colors = useColors();
  const [idx, setIdx] = useState(0);
  const [width, setWidth] = useState(0);
  const listRef = useRef<FlatList<Banner>>(null);

  useEffect(() => {
    if (!banners.length || !width) return;
    const timer = setInterval(() => {
      const next = (idx + 1) % banners.length;
      setIdx(next);
      listRef.current?.scrollToOffset({ offset: next * width, animated: true });
    }, 3500);
    return () => clearInterval(timer);
  }, [idx, banners.length, width]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (!banners.length) {
    return (
      <View style={[styles.placeholder, { backgroundColor: colors.muted }]} />
    );
  }

  return (
    <View onLayout={onLayout}>
      {width > 0 && (
        <FlatList
          ref={listRef}
          data={banners}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={banners.length > 1}
          keyExtractor={(b) => String(b.id)}
          onMomentumScrollEnd={(e) => {
            const newIdx = Math.round(e.nativeEvent.contentOffset.x / width);
            setIdx(newIdx);
          }}
          renderItem={({ item, index }) => (
            <View style={{ width }}>
              <Image
                source={{ uri: item.imageUrl }}
                style={[styles.image, { width }]}
                contentFit="cover"
                placeholder={{ uri: 'data:image/png;base64,iVBORw0KGgo=' }}
              />
              {renderOverlay?.(item, index)}
            </View>
          )}
        />
      )}
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
  image: { height: BANNER_H },
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
