'use client';
import {
  Card,
  CardContent,
  CardHeader,
  EnterEmail,
  AuthenticateEmailOtp,
  ChooseOrganization,
  CreateOrganization,
} from '@ui';
import { useAuthManager } from '@/utils/hooks/use-auth-manager';
import Image from 'next/image';

export default function LoginPage() {
  const {
    authStep,
    AuthStep,
    email,
    sendDiscoveryEmailOtp,
    authenticateDiscoveryEmailOtp,
    discoveredOrganizations,
    exchangeIntermediateSessionToken,
    intermediateSessionToken,
    completeSignup,
  } = useAuthManager();

  return (
    <div className="relative flex h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_40%,transparent_100%)] bg-[size:40px_40px]" />

      <div className="absolute right-0 bottom-0 left-0 -z-20 h-64 bg-gradient-to-b from-transparent via-[rgba(12,151,151,0.05)] to-[rgba(12,151,151,0.1)] backdrop-blur-[2px]"></div>
      <Card className="w-full max-w-md">
        <CardHeader className="mb-2 flex items-center justify-center">
          <Image
            src="/orbbit-logo-long.png"
            alt="Orbbit"
            width={100}
            height={25}
            priority
          />
        </CardHeader>
        <CardContent>
          {authStep === AuthStep.Email && (
            <EnterEmail
              onSubmit={(params) => sendDiscoveryEmailOtp.mutate(params)}
              isLoading={sendDiscoveryEmailOtp.isPending}
              description="Enter your business email to continue"
              emailPlaceholder="business@company.com"
            />
          )}

          {authStep === AuthStep.Otp && (
            <AuthenticateEmailOtp
              email={email}
              onSubmit={(params) => authenticateDiscoveryEmailOtp.mutate(params)}
              onResend={() => sendDiscoveryEmailOtp.mutateAsync({ email })}
              isVerifying={authenticateDiscoveryEmailOtp.isPending}
              isResending={sendDiscoveryEmailOtp.isPending}
            />
          )}

          {authStep === AuthStep.ChooseOrganization && (
            <ChooseOrganization
              organizations={discoveredOrganizations}
              onContinue={(organizationId, memberId) =>
                exchangeIntermediateSessionToken.mutate({
                  organizationId,
                  memberId,
                  intermediateSessionToken: intermediateSessionToken || '',
                })
              }
              isLoading={exchangeIntermediateSessionToken.isPending}
              isSuccess={exchangeIntermediateSessionToken.isSuccess}
            />
          )}

          {authStep === AuthStep.CreateOrganization && (
            <CreateOrganization
              email={email}
              intermediateSessionToken={intermediateSessionToken || ''}
              onSubmit={(params) =>
                completeSignup.mutate({
                  intermediateSessionToken: params.intermediateSessionToken,
                  organizationName: params.organization.name,
                  givenName: params.member.givenName,
                  familyName: params.member.familyName,
                })
              }
              isLoading={completeSignup.isPending}
              isSuccess={completeSignup.isSuccess}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
