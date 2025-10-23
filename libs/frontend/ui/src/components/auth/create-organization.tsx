'use client';

import {
  Button,
  Input,
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel,
} from '../shadcn';
import { Loader2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Inline Zod schema for organization creation
const CompleteSignupParamsSchema = z.object({
  intermediateSessionToken: z.string().min(1),
  organization: z.object({
    name: z.string().min(1, 'Organization name is required'),
  }),
  member: z.object({
    email: z.string().email(),
    givenName: z.string().min(1, 'First name is required'),
    familyName: z.string().min(1, 'Last name is required'),
  }),
});

type CompleteSignupParams = z.infer<typeof CompleteSignupParamsSchema>;

export interface CreateOrganizationProps {
  email: string;
  intermediateSessionToken: string;
  onSubmit: (params: CompleteSignupParams) => void;
  isLoading?: boolean;
  isSuccess?: boolean;
  heading?: string;
  description?: string;
  organizationLabel?: string;
  emailLabel?: string;
  firstNameLabel?: string;
  lastNameLabel?: string;
  submitButtonText?: string;
}

export function CreateOrganization({
  email,
  intermediateSessionToken,
  onSubmit,
  isLoading = false,
  isSuccess = false,
  heading = 'Create Organization',
  description = 'Set up your organization to get started',
  organizationLabel = 'Organization Name',
  emailLabel = 'Email',
  firstNameLabel = 'First Name',
  lastNameLabel = 'Last Name',
  submitButtonText = 'Create Organization',
}: CreateOrganizationProps) {
  const form = useForm<CompleteSignupParams>({
    resolver: zodResolver(CompleteSignupParamsSchema),
    defaultValues: {
      intermediateSessionToken: intermediateSessionToken || '',
      organization: {
        name: '',
      },
      member: {
        email: email || '',
        givenName: '',
        familyName: '',
      },
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex h-full flex-col justify-between space-y-12"
      >
        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="organization.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{organizationLabel}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input {...field} className="h-10" />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="member.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{emailLabel}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        placeholder="business@company.com"
                        {...field}
                        disabled
                        className="bg-muted h-10"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="member.givenName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{firstNameLabel}</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input {...field} className="h-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="member.familyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{lastNameLabel}</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input {...field} className="h-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading || isSuccess}
          >
            {isLoading || isSuccess ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              submitButtonText
            )}
          </Button>
          {isSuccess && (
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              Redirecting to dashboard...
            </p>
          )}
        </div>
      </form>
    </Form>
  );
}
