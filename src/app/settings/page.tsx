'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';
import { useSettings } from '@/hooks/use-settings';
import { Moon, Sun } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { soundEnabled, setSoundEnabled, animationsEnabled, setAnimationsEnabled } = useSettings();
  
  useEffect(() => {
    setMounted(true);
  }, []);


  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight text-primary">
          Settings
        </h1>
        <p className="text-muted-foreground text-lg">
          Customize the application to fit your sensory preferences.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Adjust the look and feel of the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5" />
              <Label htmlFor="theme-switch">Light / Dark Mode</Label>
              <Moon className="w-5 h-5" />
            </div>
            {mounted ? (
              <Switch
                id="theme-switch"
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                aria-label="Toggle theme"
              />
            ) : (
              <Skeleton className="h-6 w-11 rounded-full" />
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Accessibility</CardTitle>
          <CardDescription>Control features that might affect sensory experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <Label htmlFor="sound-switch">Enable Sounds</Label>
             {mounted ? (
              <Switch
                id="sound-switch"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
                aria-label="Toggle sounds"
              />
             ) : (
               <Skeleton className="h-6 w-11 rounded-full" />
             )}
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <Label htmlFor="animation-switch">Enable Animations</Label>
            {mounted ? (
              <Switch
                id="animation-switch"
                checked={animationsEnabled}
                onCheckedChange={setAnimationsEnabled}
                aria-label="Toggle animations"
              />
            ) : (
              <Skeleton className="h-6 w-11 rounded-full" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
