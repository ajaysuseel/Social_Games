'use client';
import {
  Home,
  Gamepad2,
  Wand2,
  Settings,
  Cat,
  Music,
  MousePointer2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    label: 'Games',
    icon: Gamepad2,
    subItems: [
      {
        label: 'Turn-Taking',
        href: '/games/turn-taking',
        icon: MousePointer2,
      },
    ],
  },
  {
    label: 'Creative Tools',
    icon: Wand2,
    subItems: [
      {
        label: 'Character Designer',
        href: '/tools/character-designer',
        icon: Cat,
      },
      {
        label: 'Sound Designer',
        href: '/tools/sound-designer',
        icon: Music,
      },
    ],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  const isSubItemActive = (subItems: { href: string }[]) => {
    return subItems.some((item) => pathname === item.href);
  };

  const defaultAccordionValue = menuItems
    .filter((item) => item.subItems && isSubItemActive(item.subItems))
    .map((item) => item.label);

  return (
    <aside className="hidden md:flex flex-col w-64 p-4 border-r bg-card h-full">
      <div className="flex items-center gap-2 pb-4 border-b">
        <div className="w-8 h-8 bg-primary rounded-lg"></div>
        <h1 className="text-xl font-bold font-headline">Sensory Social</h1>
      </div>
      <nav className="flex flex-col gap-2 mt-4 flex-1">
        <Accordion
          type="multiple"
          className="w-full"
          defaultValue={defaultAccordionValue}
        >
          {menuItems.map((item) =>
            item.subItems ? (
              <AccordionItem value={item.label} key={item.label} className="border-b-0">
                <AccordionTrigger className={cn(
                  "py-2 px-3 rounded-md hover:no-underline hover:bg-muted font-normal",
                  isSubItemActive(item.subItems) && "font-semibold bg-muted"
                )}>
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-8 pt-2 flex flex-col gap-1">
                  {item.subItems.map((subItem) => (
                    <Link href={subItem.href} passHref key={subItem.href}>
                      <Button
                        variant={pathname === subItem.href ? 'secondary' : 'ghost'}
                        className="w-full justify-start gap-3"
                        size="sm"
                      >
                        <subItem.icon className="w-4 h-4" />
                        {subItem.label}
                      </Button>
                    </Link>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ) : (
              <Link href={item.href} passHref key={item.href}>
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-3"
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Button>
              </Link>
            )
          )}
        </Accordion>
      </nav>
    </aside>
  );
}
