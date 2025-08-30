
import { Baby } from 'lucide-react';

export default function TransitionScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="flex items-center gap-4 mb-4">
        <Baby className="h-12 w-12 text-primary animate-pulse" />
        <h1 className="text-5xl font-bold tracking-tight">BabyList</h1>
      </div>
      <p className="text-muted-foreground">Chargement des données...</p>
    </div>
  );
}

    