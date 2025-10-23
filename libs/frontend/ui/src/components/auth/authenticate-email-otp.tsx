'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from '../shadcn';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Inline Zod schema for OTP validation
const AuthenticateEmailOtpParamsSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Code must be exactly 6 digits'),
});

type AuthenticateEmailOtpParams = z.infer<
  typeof AuthenticateEmailOtpParamsSchema
>;

export interface AuthenticateEmailOtpProps {
  email: string;
  onSubmit: (params: AuthenticateEmailOtpParams) => void;
  onResend: () => Promise<void>;
  isVerifying?: boolean;
  isResending?: boolean;
  heading?: string;
  description?: string;
}

export function AuthenticateEmailOtp({
  email,
  onSubmit,
  onResend,
  isVerifying = false,
  isResending = false,
  heading = 'Enter the 6-digit code',
  description,
}: AuthenticateEmailOtpProps) {
  const [resendCooldown, setResendCooldown] = useState(0);

  const form = useForm<AuthenticateEmailOtpParams>({
    resolver: zodResolver(AuthenticateEmailOtpParamsSchema),
    defaultValues: {
      email,
      code: '',
    },
  });

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    try {
      await onResend();

      // Set 60 second cooldown
      setResendCooldown(60);

      // Start cooldown timer
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      // Error is already handled by the mutation's onError
    }
  };

  useEffect(() => {
    // Cleanup timer on unmount
    return () => {
      setResendCooldown(0);
    };
  }, []);

  const displayDescription =
    description || `We sent a verification code to ${email}`;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex h-full flex-col justify-between space-y-12"
      >
        <div className="flex-1 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
          <p className="text-muted-foreground">{displayDescription}</p>
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="flex flex-col items-center">
                <FormControl>
                  <InputOTP maxLength={6} {...field}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isResending}
              className="text-muted-foreground text-sm hover:underline disabled:text-gray-400 disabled:no-underline"
            >
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : "Didn't receive code? Resend"}
            </button>
          </div>

          <p className="text-muted-foreground pt-2 text-center text-xs">
            Check your spam folder if you don't see the email
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isVerifying}
        >
          {isVerifying ? 'Verifying...' : 'Continue'}
        </Button>
      </form>
    </Form>
  );
}
