'use server';
import { generateCalmingSound } from '@/ai/flows/sound-design';
import { SoundDesignerClient } from './client';

async function handleGenerateSound(formData: FormData) {
  'use server';
  const theme = formData.get('theme') as string;
  const activity = formData.get('activity') as string;

  if (!theme || !activity) {
    return { error: 'Please fill out all fields.' };
  }

  try {
    const result = await generateCalmingSound({ theme, activity });
    return { data: result };
  } catch (e: any) {
    console.error(e);
    return { error: e.message || 'Failed to generate sound.' };
  }
}

export default async function SoundDesignerPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight text-primary">
          Sound Designer
        </h1>
        <p className="text-muted-foreground text-lg">
          Generate calming sounds for positive reinforcement in games.
        </p>
      </header>
      <SoundDesignerClient handleGenerateSound={handleGenerateSound} />
    </div>
  );
}
