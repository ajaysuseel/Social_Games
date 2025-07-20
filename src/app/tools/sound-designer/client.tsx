'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Music, AlertTriangle } from 'lucide-react';
import type { CalmingSoundOutput } from '@/ai/flows/sound-design';

type FormState = {
  data?: CalmingSoundOutput;
  error?: string;
} | undefined;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <span className="animate-spin mr-2">...</span> Generating...
        </>
      ) : (
        <>
          <Music className="mr-2" /> Generate Sound
        </>
      )}
    </Button>
  );
}

type SoundDesignerClientProps = {
  handleGenerateSound: (formData: FormData) => Promise<FormState>;
};

export function SoundDesignerClient({ handleGenerateSound }: SoundDesignerClientProps) {
  const [state, formAction] = useFormState(handleGenerateSound, undefined);
  const { pending } = useFormStatus();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Design Your Sound</CardTitle>
          <CardDescription>Describe the context for the sound.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Input
                id="theme"
                name="theme"
                placeholder="e.g., space, ocean, farm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity">Activity</Label>
              <Input
                id="activity"
                name="activity"
                placeholder="e.g., matching pairs, finding an object"
                required
              />
            </div>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Sound</CardTitle>
          <CardDescription>Your sound will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          {pending && (
            <div className="space-y-4">
              <Skeleton className="w-full h-14 rounded-lg" />
            </div>
          )}
          {state?.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          {state?.data && (
            <div>
              <audio controls className="w-full" src={state.data.media}>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
          {!pending && !state?.data && !state?.error && (
            <div className="text-center text-muted-foreground py-16">
              Your generated sound can be played here.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
