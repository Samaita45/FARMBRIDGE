import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Modal, Pressable, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { SUPPORT_WHATSAPP_URL } from '@/constants/support';
import { DS } from '@/constants/design-system';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Password reset is unavailable until account recovery runs on the server.
 *
 * The previous implementation generated the reset code on the device, stored it
 * in unencrypted local storage, displayed it on screen and then verified it
 * against itself — so anyone holding the phone could take over any account. It
 * also never actually changed a password. Rather than leave a control that looks
 * like it works, this states the real position and offers the one route that
 * does work today.
 */
export function ForgotPasswordModal({ visible, onClose }: ForgotPasswordModalProps) {
  const contactSupport = () => {
    void Linking.openURL(SUPPORT_WHATSAPP_URL);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 justify-center bg-black/50 px-6" onPress={onClose}>
        <Pressable className="rounded-3xl bg-white p-6" onPress={(e) => e.stopPropagation()}>
          <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-primaryMid">
            <Ionicons name="lock-closed-outline" size={22} color={DS.colors.primary} />
          </View>

          <Text className="font-display text-xl text-dark">Password reset</Text>
          <Text className="mt-2 font-sans text-sm leading-5 text-gray-500">
            Self-service password reset isn’t available yet. Our team can verify your identity
            and restore access to your account.
          </Text>

          <View className="mt-4">
            <PrimaryButton
              title="Contact support"
              onPress={contactSupport}
              accessibilityLabel="Contact FarmBridge support to reset your password"
            />
          </View>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            className="mt-3 py-2">
            <Text className="text-center font-sans text-gray-500">Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
