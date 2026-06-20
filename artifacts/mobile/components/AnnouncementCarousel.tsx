import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Announcement, subscribeActiveAnnouncements } from '@/services/announcementService';
import { useColors } from '@/hooks/useColors';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 32;
const AUTO_SCROLL_INTERVAL = 4200;

const TYPE_META: Record<Announcement['type'], { icon: React.ComponentProps<typeof Feather>['name']; color: string; label: string }> = {
  info:    { icon: 'info',        color: '#4DA6FF', label: 'INFO' },
  warning: { icon: 'alert-triangle', color: '#FF6B00', label: 'NOTICE' },
  success: { icon: 'check-circle', color: '#30D158', label: 'UPDATE' },
  promo:   { icon: 'gift',        color: '#FFD700', label: 'PROMO' },
  event:   { icon: 'zap',         color: '#FF3B30', label: 'EVENT' },
};

export default function AnnouncementCarousel() {
  const colors = useColors();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef(0);

  useEffect(() => {
    const unsub = subscribeActiveAnnouncements(setAnnouncements);
    return unsub;
  }, []);

  useEffect(() => {
    countRef.current = announcements.length;
    if (announcements.length > 0 && current >= announcements.length) {
      setCurrent(0);
    }
  }, [announcements]);

  const scrollTo = useCallback((index: number) => {
    scrollRef.current?.scrollTo({ x: index * CARD_W, animated: true });
    setCurrent(index);
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return;
    timerRef.current = setInterval(() => {
      const next = (countRef.current + 1 > 0)
        ? (current + 1) % countRef.current
        : 0;
      scrollTo(next);
    }, AUTO_SCROLL_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current, announcements.length, scrollTo]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / CARD_W);
    if (idx !== current && idx >= 0 && idx < announcements.length) {
      setCurrent(idx);
    }
  };

  if (announcements.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_W}
        contentContainerStyle={{ gap: 0 }}
        style={{ width: CARD_W }}
      >
        {announcements.map((a) => {
          const meta = TYPE_META[a.type] ?? TYPE_META.info;
          return (
            <BannerCard key={a.id} announcement={a} meta={meta} colors={colors} width={CARD_W} />
          );
        })}
      </ScrollView>

      {announcements.length > 1 && (
        <View style={styles.dots}>
          {announcements.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => scrollTo(i)}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === current ? colors.primary : colors.border,
                    width: i === current ? 18 : 6,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function BannerCard({
  announcement: a,
  meta,
  colors,
  width,
}: {
  announcement: Announcement;
  meta: { icon: React.ComponentProps<typeof Feather>['name']; color: string; label: string };
  colors: ReturnType<typeof useColors>;
  width: number;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!a.pinned) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [a.pinned]);

  return (
    <View
      style={[
        cardStyles.card,
        {
          width,
          backgroundColor: colors.card,
          borderColor: meta.color + '55',
        },
      ]}
    >
      <View style={[cardStyles.strip, { backgroundColor: meta.color }]} />

      <View style={cardStyles.body}>
        <View style={cardStyles.top}>
          <View style={[cardStyles.typePill, { backgroundColor: meta.color + '20', borderColor: meta.color + '44' }]}>
            <Feather name={meta.icon} size={10} color={meta.color} />
            <Text style={[cardStyles.typeText, { color: meta.color }]}>{meta.label}</Text>
          </View>

          {a.pinned && (
            <Animated.View style={[cardStyles.pinnedPill, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '44', opacity: pulseAnim }]}>
              <Feather name="bookmark" size={9} color={colors.primary} />
              <Text style={[cardStyles.pinnedText, { color: colors.primary }]}>PINNED</Text>
            </Animated.View>
          )}
        </View>

        <Text style={[cardStyles.title, { color: colors.foreground }]} numberOfLines={1}>
          {a.title}
        </Text>
        <Text style={[cardStyles.message, { color: colors.mutedForeground }]} numberOfLines={2}>
          {a.message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 4, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 5, marginTop: 8, alignItems: 'center', height: 6 },
  dot: { height: 6, borderRadius: 3 },
});

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    marginBottom: 2,
  },
  strip: { height: 3 },
  body: { padding: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1,
  },
  typeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  pinnedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, borderWidth: 1,
  },
  pinnedText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  title: { fontSize: 15, fontWeight: '800', marginBottom: 4, lineHeight: 20 },
  message: { fontSize: 12, lineHeight: 18 },
});
