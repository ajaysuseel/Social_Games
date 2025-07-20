import { Card, CardContent } from '@/components/ui/card';
import { FriendlyFacesGame } from './client';

export default function FriendlyFacesPage() {
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
          <FriendlyFacesGame />
        </CardContent>
      </Card>
    </div>
  );
}
