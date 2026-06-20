import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Linking,
  PanResponder,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTournament } from '@/context/TournamentContext';

const POS_KEY = 'ff_whatsapp_btn_pos';
const BTN_SIZE = 56;
const EDGE_PAD = 14;
const BOTTOM_NAV_HEIGHT = 64;

function clampX(x: number, screenW: number) {
  return Math.max(EDGE_PAD, Math.min(x, screenW - BTN_SIZE - EDGE_PAD));
}
function clampY(y: number, screenH: number, bottomPad: number) {
  return Math.max(EDGE_PAD, Math.min(y, screenH - BTN_SIZE - BOTTOM_NAV_HEIGHT - bottomPad - EDGE_PAD));
}

export default function FloatingWhatsApp() {
  const { firebaseUser, userProfile } = useAuth();
  const { paymentSettings } = useTournament();
  const insets = useSafeAreaInsets();

  const pan = useRef(new Animated.ValueXY()).current;
  const isDragging = useRef(false);
  const posRef = useRef({ x: 0, y: 0 });
  const [ready, setReady] = React.useState(false);

  const { width: screenW, height: screenH } = Dimensions.get('window');
  const bottomPad = Math.max(insets.bottom, 16);

  const defaultX = screenW - BTN_SIZE - EDGE_PAD;
  const defaultY = screenH - BTN_SIZE - BOTTOM_NAV_HEIGHT - bottomPad - EDGE_PAD;

  useEffect(() => {
    AsyncStorage.getItem(POS_KEY).then((raw) => {
      if (raw) {
        try {
          const { x, y } = JSON.parse(raw) as { x: number; y: number };
          const cx = clampX(x, screenW);
          const cy = clampY(y, screenH, bottomPad);
          posRef.current = { x: cx, y: cy };
          pan.setValue({ x: cx, y: cy });
        } catch {
          pan.setValue({ x: defaultX, y: defaultY });
          posRef.current = { x: defaultX, y: defaultY };
        }
      } else {
        pan.setValue({ x: defaultX, y: defaultY });
        posRef.current = { x: defaultX, y: defaultY };
      }
      setReady(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savePosition = (x: number, y: number) => {
    AsyncStorage.setItem(POS_KEY, JSON.stringify({ x, y })).catch(() => {});
  };

  const handlePress = () => {
    if (!paymentSettings.whatsappNumber) return;
    Linking.openURL(`https://wa.me/${paymentSettings.whatsappNumber}`).catch(() => {});
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isDragging.current = false;
        pan.setOffset({
          x: (pan.x as unknown as { _value: number })._value,
          y: (pan.y as unknown as { _value: number })._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5) {
          isDragging.current = true;
        }
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        const rawX = posRef.current.x + gestureState.dx;
        const rawY = posRef.current.y + gestureState.dy;
        const { width, height } = Dimensions.get('window');
        const cx = clampX(rawX, width);
        const cy = clampY(rawY, height, bottomPad);
        pan.setValue({ x: cx, y: cy });
        posRef.current = { x: cx, y: cy };
        savePosition(cx, cy);
        if (!isDragging.current) {
          handlePress();
        }
      },
    }),
  ).current;

  // Admins never see this button; wait for position to load
  if (!firebaseUser || !paymentSettings.whatsappNumber) return null;
  if (userProfile?.role === 'admin') return null;
  if (!ready) return null;

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.wrapper, { right: EDGE_PAD, bottom: BOTTOM_NAV_HEIGHT + bottomPad + EDGE_PAD }]} pointerEvents="box-none">
        <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={styles.btn}>
          <Feather name="message-circle" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View
      style={[styles.wrapper, { transform: pan.getTranslateTransform() }]}
      pointerEvents="box-none"
      {...panResponder.panHandlers}
    >
      <View style={styles.btn}>
        <Feather name="message-circle" size={26} color="#FFF" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: 9999,
    width: BTN_SIZE,
    height: BTN_SIZE,
  },
  btn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#25D366',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
