import { Card, CardContent } from '@/components/ui/card';
import { FriendlyFacesGameClient } from './client';
import { generateCharacterVideo } from '@/ai/flows/character-design';

export default function FriendlyFacesPage() {
  async function handleGenerateVideo(animalType: string) {
    'use server';
    try {
      const result = await generateCharacterVideo({ animalType });
      return result.videoUrl;
    } catch (e) {
      console.error(e);
      // In case of error, we can return an empty string and the client can handle it.
      return '';
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
          <FriendlyFacesGameClient handleGenerateVideo={handleGenerateVideo} />
        </CardContent>
      </Card>
    </div>
  );
}
