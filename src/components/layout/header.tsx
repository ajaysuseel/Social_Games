import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Home,
  Gamepad2,
  Wand2,
  Settings,
  Menu,
  Cat,
  Music,
  MousePointer2
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';

const menuItems = [
  { label: 'Dashboard', href: '/', icon: Home },
  { label: 'Games', icon: Gamepad2, subItems: [{ label: 'Turn-Taking', href: '/games/turn-taking', icon: MousePointer2 }] },
  { label: 'Creative Tools', icon: Wand2, subItems: [{ label: 'Character Designer', href: '/tools/character-designer', icon: Cat }, { label: 'Sound Designer', href: '/tools/sound-designer', icon: Music }] },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base font-headline">
          <div className="w-6 h-6 bg-primary rounded-md"></div>
          <span>Sensory Social</span>
        </Link>
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4 font-headline">
              <div className="w-8 h-8 bg-primary rounded-lg"></div>
              <span>Sensory Social</span>
            </Link>
            {menuItems.map((item) =>
              item.subItems ? (
                <Accordion type="single" collapsible className="w-full" key={item.label}>
                  <AccordionItem value={item.label} className="border-b-0">
                    <AccordionTrigger className="hover:no-underline font-normal text-lg">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pl-8 pt-2 flex flex-col gap-2">
                      {item.subItems.map(subItem => (
                         <Link href={subItem.href} className="text-muted-foreground hover:text-foreground" key={subItem.href}>
                           <div className="flex items-center gap-3">
                             <subItem.icon className="w-4 h-4" />
                             {subItem.label}
                           </div>
                         </Link>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground"
                  key={item.href}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
