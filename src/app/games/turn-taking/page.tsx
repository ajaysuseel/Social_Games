import { Card, CardContent } from '@/components/ui/card';
import { BubbleHarmonyGame } from './client';

export default function TurnTakingPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight text-primary">
          Bubble Harmony
        </h1>
        <p className="text-muted-foreground text-lg">
          Take turns popping bubbles. A game for practicing turn-taking.
        </p>
      </header>
      <Card>
        <CardContent className="p-0">
          <BubbleHarmonyGame />
        </CardContent>
      </Card>
    </div>
  );
}
