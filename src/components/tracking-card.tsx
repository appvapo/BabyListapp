import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface TrackingCardProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}

export default function TrackingCard({ title, icon: Icon, children }: TrackingCardProps) {
  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden shadow-lg">
      <CardHeader className="flex flex-row items-center gap-4 bg-muted">
        <Icon className="w-8 h-8 text-primary" />
        <CardTitle className="font-headline">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  );
}
