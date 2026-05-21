import { z } from 'zod';
import type { infer as ZodInfer } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Enter your full name'),
    email: z.string().email('Enter a valid email address'),
    phone: z
      .string()
      .min(9, 'Enter a valid Zimbabwe phone number')
      .regex(/^(\+?263|0)?[7][1-9][0-9]{7}$/, 'Enter a valid Zimbabwe mobile number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    role: z.enum(['farmer', 'buyer', 'both'], { required_error: 'Select your role' }),
    province: z.string().min(1, 'Select your province'),
  })
  .refine((data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = ZodInfer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = ZodInfer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  phone: z
    .string()
    .min(9, 'Enter your phone number')
    .regex(/^(\+?263|0)?[7][1-9][0-9]{7}$/, 'Enter a valid Zimbabwe mobile number'),
  code: z.string().optional(),
});

export type ForgotPasswordFormData = ZodInfer<typeof forgotPasswordSchema>;
