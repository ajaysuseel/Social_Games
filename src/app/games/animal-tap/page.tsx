import { Card, CardContent } from '@/components/ui/card';
import { AnimalTapClient } from './client';

export default function AnimalTapPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight text-primary">
          Animal Tap
        </h1>
        <p className="text-muted-foreground text-lg">
          Tap the animals as they appear on the screen! A game for improving reaction time.
        </p>
      </header>
      <Card>
        <CardContent className="p-2 md:p-4">
          <AnimalTapClient />
        </CardContent>
      </Card>
    </div>
  );
}
