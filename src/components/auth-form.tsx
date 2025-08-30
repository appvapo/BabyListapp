
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Baby } from 'lucide-react';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: "Compte créé !", description: "Vous allez être redirigé.", duration: 1200 });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Connexion réussie !", duration: 1200 });
      }
      router.push('/');
    } catch (error: any) {
      let errorMessage = "Une erreur est survenue. Veuillez réessayer.";
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          errorMessage = "L'email ou le mot de passe est incorrect. Veuillez vérifier vos informations.";
          break;
        case 'auth/email-already-in-use':
          errorMessage = "Cette adresse e-mail est déjà utilisée par un autre compte.";
          break;
        case 'auth/weak-password':
          errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
          break;
        case 'auth/invalid-email':
          errorMessage = "L'adresse e-mail n'est pas valide.";
          break;
        default:
          errorMessage = "Une erreur d'authentification est survenue. Veuillez réessayer.";
          break;
      }
      toast({
        variant: "destructive",
        title: "Erreur d'authentification",
        description: errorMessage,
        duration: 2500
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
                <Baby className="h-8 w-8 text-primary"/>
                <CardTitle className="text-3xl">BabyList</CardTitle>
            </div>
          <CardDescription>
            {mode === 'login' ? 'Connectez-vous à votre compte' : 'Créez un nouveau compte'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="pseudo@babylist.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
               {mode === 'signup' && (
                <p className="text-xs text-muted-foreground pt-1">
                  Doit contenir au moins une majuscule et un caractère spécial.
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Chargement...' : (mode === 'login' ? 'Se connecter' : "S'inscrire")}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          {mode === 'login' ? (
            <p>Pas de compte ? <Link href="/signup" className="underline">Inscrivez-vous</Link></p>
          ) : (
            <p>Déjà un compte ? <Link href="/login" className="underline">Connectez-vous</Link></p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

    
