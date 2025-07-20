import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hand, Smile, MousePointer2, ArrowRight } from 'lucide-react';

const games = [
  {
    title: 'Animal Tap',
    description: 'Improve reaction time by tapping the animals as they appear.',
    href: '/games/animal-tap',
    icon: Hand,
  },
  {
    title: 'Friendly Faces',
    description: 'Practice social greetings by meeting new friends with a simple click.',
    href: '/games/friendly-faces',
    icon: Smile,
  },
  {
    title: 'Bubble Harmony',
    description: 'Practice turn-taking by popping bubbles in a shared activity.',
    href: '/games/turn-taking',
    icon: MousePointer2,
  },
];

export default function GamesPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight text-primary">
          Choose a Game
        </h1>
        <p className="text-muted-foreground text-lg">
          Select an activity to start playing and practicing social skills.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <Card key={game.title} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <game.icon className="w-8 h-8 text-accent" />
                <span className="font-headline">{game.title}</span>
              </CardTitle>
              <CardDescription>
                {game.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-end">
              <Link href={game.href} passHref className="w-full">
                <Button className="w-full">
                  Play Now <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
