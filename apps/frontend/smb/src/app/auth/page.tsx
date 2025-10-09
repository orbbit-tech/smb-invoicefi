'use client';
import { Card, CardContent, CardHeader } from '@ui';

export default function LoginPage() {
  return (
    <div className="relative flex h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_40%,transparent_100%)] bg-[size:40px_40px]" />

      <div className="absolute right-0 bottom-0 left-0 -z-20 h-64 bg-gradient-to-b from-transparent via-[rgba(12,151,151,0.05)] to-[rgba(12,151,151,0.1)] backdrop-blur-[2px]"></div>
      <Card className="w-full max-w-md">
        <CardHeader className="mb-2">
          <h1 className="text-2xl font-bold">Orbbit SMB</h1>
        </CardHeader>
      </Card>
    </div>
  );
}
