import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Modal, Pressable, Text, View } from 'react-native';

import { FormInput } from '@/components/forms/form-input';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useToast } from '@/components/ui/toast-provider';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validation';
import { sendPasswordResetCode, verifyResetCode } from '@/services/authService';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ visible, onClose }: ForgotPasswordModalProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [sentCode, setSentCode] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { phone: '', code: '' },
  });

  const onSendCode = async (data: ForgotPasswordFormData) => {
    try {
      const code = await sendPasswordResetCode(data.phone);
      setSentCode(code);
      setStep('code');
      showToast(`SMS code sent! (Demo: ${code})`, 'info');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to send code', 'error');
    }
  };

  const onVerifyCode = async (data: ForgotPasswordFormData) => {
    if (!data.code) {
      showToast('Enter the 6-digit code', 'warning');
      return;
    }
    const valid = await verifyResetCode(data.phone, data.code);
    if (valid) {
      showToast('Code verified! You can reset your password.', 'success');
      handleClose();
    } else {
      showToast('Invalid or expired code', 'error');
    }
  };

  const handleClose = () => {
    reset();
    setStep('phone');
    setSentCode(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 justify-center bg-black/50 px-6" onPress={handleClose}>
        <Pressable className="rounded-3xl bg-white p-6" onPress={(e) => e.stopPropagation()}>
          <Text className="font-display text-xl text-dark">Forgot Password</Text>
          <Text className="mt-2 font-sans text-sm text-gray-500">
            {step === 'phone'
              ? 'We will send a verification code via SMS to your registered number.'
              : 'Enter the 6-digit code sent to your phone.'}
          </Text>

          <View className="mt-4">
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  icon="call-outline"
                  placeholder="+263 77 123 4567"
                  keyboardType="phone-pad"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.phone?.message}
                  editable={step === 'phone'}
                />
              )}
            />
            {step === 'code' ? (
              <Controller
                control={control}
                name="code"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormInput
                    icon="key-outline"
                    placeholder="6-digit code"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
            ) : null}
          </View>

          {sentCode && step === 'code' ? (
            <Text className="mb-3 font-sans text-xs text-gray-400">
              Demo mode: your code is {sentCode}
            </Text>
          ) : null}

          <PrimaryButton
            title={step === 'phone' ? 'Send SMS Code' : 'Verify Code'}
            onPress={handleSubmit(step === 'phone' ? onSendCode : onVerifyCode)}
          />
          <Pressable onPress={handleClose} className="mt-3 py-2">
            <Text className="text-center font-sans text-gray-500">Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
