
"use client";

import type { View, NavItem } from './baby-tracker-dashboard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  items: NavItem[];
  activeView: View;
  setActiveView: (view: View) => void;
}

export default function BottomNav({ items, activeView, setActiveView }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t bg-card/95 backdrop-blur-sm">
      <div className="grid h-20 max-w-lg grid-cols-4 mx-auto p-2">
        {items.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={cn(
              'flex h-full flex-col items-center justify-center gap-1 rounded-lg text-xs transition-all duration-200 ease-in-out',
              activeView === item.id
                ? 'font-semibold border-2 border-primary scale-105'
                : 'text-muted-foreground hover:bg-muted/50'
            )}
            onClick={() => setActiveView(item.id)}
            aria-current={activeView === item.id ? "page" : undefined}
          >
            <item.icon className={cn("h-5 w-5", activeView === item.id ? 'text-foreground' : 'text-muted-foreground')} />
            <span className={cn(activeView === item.id ? 'text-foreground' : 'text-muted-foreground')}>{item.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}




