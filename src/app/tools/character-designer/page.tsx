'use server';
import { generateCharacter } from '@/ai/flows/character-design';
import { CharacterDesignerClient } from './client';

async function handleGenerateCharacter(formData: FormData) {
  'use server';
  const animalType = formData.get('animalType') as string;
  if (!animalType) {
    return { error: 'Please enter an animal type.' };
  }
  try {
    const result = await generateCharacter({ animalType });
    return { data: result };
  } catch (e: any) {
    console.error(e);
    return { error: e.message || 'Failed to generate character.' };
  }
}

export default async function CharacterDesignerPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight text-primary">
          Character Designer
        </h1>
        <p className="text-muted-foreground text-lg">
          Create a non-scary animal character with a neutral expression.
        </p>
      </header>
      <CharacterDesignerClient handleGenerateCharacter={handleGenerateCharacter} />
    </div>
  );
}
