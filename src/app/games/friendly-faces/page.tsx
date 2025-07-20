import { FriendlyFacesGameClient } from './client';

export default function FriendlyFacesPage() {
  return (
    <div className="flex flex-col gap-8 h-full">
      <header className="space-y-2 flex-shrink-0">
        <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight text-primary">
          Friendly Faces
        </h1>
        <p className="text-muted-foreground text-lg">
          Wave back to the friendly animals to say hello! A game to practice social greetings.
        </p>
      </header>
      <div className="flex-grow relative">
        <FriendlyFacesGameClient />
      </div>
    </div>
  );
}
