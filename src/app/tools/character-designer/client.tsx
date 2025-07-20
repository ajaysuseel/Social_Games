'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useFormState, useFormStatus } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Wand2, AlertTriangle } from 'lucide-react';
import type { CharacterDesignOutput } from '@/ai/flows/character-design';

type FormState = {
  data?: CharacterDesignOutput;
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
          <Wand2 className="mr-2" /> Generate Character
        </>
      )}
    </Button>
  );
}

type CharacterDesignerClientProps = {
  handleGenerateCharacter: (formData: FormData) => Promise<FormState>;
};

export function CharacterDesignerClient({ handleGenerateCharacter }: CharacterDesignerClientProps) {
  const [state, formAction] = useFormState(handleGenerateCharacter, undefined);
  const { pending } = useFormStatus();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Design Your Character</CardTitle>
          <CardDescription>Enter a type of animal to begin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="animalType">Animal Type</Label>
              <Input
                id="animalType"
                name="animalType"
                placeholder="e.g., cat, dog, bear"
                required
              />
            </div>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Character</CardTitle>
          <CardDescription>Your character will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          {pending && (
            <div className="space-y-4">
              <Skeleton className="w-full h-64 rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
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
            <div className="space-y-4">
              <div className="relative w-full aspect-square rounded-lg overflow-hidden border">
                <Image
                  src={state.data.characterImage}
                  alt="Generated Character"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
              <p className="text-sm text-muted-foreground">{state.data.characterDescription}</p>
            </div>
          )}
          {!pending && !state?.data && !state?.error && (
             <div className="text-center text-muted-foreground py-16">
                Your generated character will be displayed here.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
