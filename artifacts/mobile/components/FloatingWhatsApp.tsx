import { Feather } from '@expo/vector-icons';
import React, { useRef } from 'react';
import {
  Animated,
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

export default function FloatingWhatsApp() {
  const { firebaseUser } = useAuth();
  const { paymentSettings } = useTournament();
  const insets = useSafeAreaInsets();

  const pan = useRef(new Animated.ValueXY()).current;
  const isDragging = useRef(false);

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
      onPanResponderRelease: () => {
        pan.flattenOffset();
        if (!isDragging.current) {
          handlePress();
        }
      },
    }),
  ).current;

  if (!firebaseUser || !paymentSettings.whatsappNumber) return null;

  const bottom = Math.max(insets.bottom, 20) + 80;

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.wrapper, { bottom, right: 16 }]} pointerEvents="box-none">
        <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={styles.btn}>
          <Feather name="message-circle" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { bottom, right: 16 },
        { transform: pan.getTranslateTransform() },
      ]}
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
  },
  btn: {
    width: 54,
    height: 54,
    borderRadius: 27,
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
