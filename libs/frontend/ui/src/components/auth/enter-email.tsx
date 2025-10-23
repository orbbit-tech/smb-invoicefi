'use client';

import {
  Button,
  Input,
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from '../shadcn';
import { Mail } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Inline Zod schema for email validation
const SendEmailOtpParamsSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type SendEmailOtpParams = z.infer<typeof SendEmailOtpParamsSchema>;

export interface EnterEmailProps {
  onSubmit: (params: SendEmailOtpParams) => void;
  isLoading?: boolean;
  heading?: string;
  description?: string;
  emailPlaceholder?: string;
  submitButtonText?: string;
}

export function EnterEmail({
  onSubmit,
  isLoading = false,
  heading = 'Log in or Sign up',
  description = 'Enter your email to continue',
  emailPlaceholder = 'your.email@company.com',
  submitButtonText = 'Continue',
}: EnterEmailProps) {
  const form = useForm<SendEmailOtpParams>({
    resolver: zodResolver(SendEmailOtpParamsSchema),
    defaultValues: {
      email: '',
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex h-full flex-col justify-between space-y-12"
      >
        <div className="flex-1 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
          <p className="text-muted-foreground">{description}</p>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <div className="relative">
                  <div className="text-muted-foreground absolute top-3 left-3">
                    <Mail className="h-5 w-5" />
                  </div>
                  <FormControl>
                    <Input
                      placeholder={emailPlaceholder}
                      {...field}
                      className="h-10 pl-10"
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? 'Sending...' : submitButtonText}
        </Button>
      </form>
    </Form>
  );
}
