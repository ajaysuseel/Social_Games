import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gamepad2, Wand2, Settings, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight text-primary">
          Welcome to Sensory Social Games
        </h1>
        <p className="text-muted-foreground text-lg">
          A calm, safe, and engaging space to practice social skills.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Gamepad2 className="w-8 h-8 text-accent" />
              <span className="font-headline">Play Games</span>
            </CardTitle>
            <CardDescription>
              Explore games designed to practice turn-taking, joint attention, and more in a predictable, low-pressure environment.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-end">
            <Link href="/games/animal-tap" passHref className="w-full">
              <Button className="w-full">
                Start Playing <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Wand2 className="w-8 h-8 text-accent" />
              <span className="font-headline">Creative Tools</span>
            </CardTitle>
            <CardDescription>
              Use AI to design your own non-scary characters and generate calming sounds for a truly personalized experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col gap-2">
            <Link href="/tools/character-designer" passHref>
              <Button variant="secondary" className="w-full justify-start">Character Designer</Button>
            </Link>
            <Link href="/tools/sound-designer" passHref>
              <Button variant="secondary" className="w-full justify-start">Sound Designer</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-accent" />
              <span className="font-headline">Adjust Settings</span>
            </CardTitle>
            <CardDescription>
              Customize the app to your child's sensory needs. Toggle sounds, animations, and switch between light and dark modes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-end">
             <Link href="/settings" passHref className="w-full">
              <Button className="w-full" variant="outline">
                Go to Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
