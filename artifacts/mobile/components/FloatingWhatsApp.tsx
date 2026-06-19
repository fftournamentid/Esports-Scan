import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTournament } from '@/context/TournamentContext';

export default function FloatingWhatsApp() {
  const { firebaseUser } = useAuth();
  const { paymentSettings } = useTournament();
  const insets = useSafeAreaInsets();

  if (!firebaseUser || !paymentSettings.whatsappNumber) return null;

  const handlePress = () => {
    Linking.openURL(`https://wa.me/${paymentSettings.whatsappNumber}`).catch(() => {});
  };

  return (
    <View
      style={[
        styles.wrapper,
        { bottom: Math.max(insets.bottom, 20) + 80, right: 16 },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={styles.btn}
      >
        <Feather name="message-circle" size={26} color="#FFF" />
      </TouchableOpacity>
    </View>
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
