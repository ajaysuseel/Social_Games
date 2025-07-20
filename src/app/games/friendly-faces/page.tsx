import { Card, CardContent } from '@/components/ui/card';
import { FriendlyFacesGameClient } from './client';
import { generateCharacter } from '@/ai/flows/character-design';

export default function FriendlyFacesPage() {
  async function handleGenerate(animalType: string) {
    'use server';
    try {
      const result = await generateCharacter({ animalType });
      return result.characterImage;
    } catch (e) {
      console.error(e);
      // Return a placeholder or handle the error as appropriate
      return 'https://placehold.co/400x400.png';
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight text-primary">
          Friendly Faces
        </h1>
        <p className="text-muted-foreground text-lg">
          Wave back to the friendly animals to say hello! A game to practice social greetings.
        </p>
      </header>
      <Card>
        <CardContent className="p-0">
          <FriendlyFacesGameClient handleGenerate={handleGenerate} />
        </CardContent>
      </Card>
    </div>
  );
}
