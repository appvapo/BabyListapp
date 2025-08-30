
"use client";

import { useState, useMemo, useEffect } from 'react';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Baby, Moon, Sun, Trash2, Bell, Download, Calendar as CalendarIcon, Check, X, UserPlus, Edit, LogOut, KeyRound } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import type { CheckedState } from "@radix-ui/react-checkbox"
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { format, isAfter, parseISO, isWithinInterval, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Child, ActivityEvent, Treatment, UserSettings } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { addChild, updateChild, deleteChild } from '@/lib/firestore';


interface SettingsViewProps {
    child?: Child;
    activities: ActivityEvent[];
    treatments: Treatment[];
    children: Child[];
    setChildren: React.Dispatch<React.SetStateAction<Child[]>>;
    selectedChild: string;
    onChildChange: (id: string) => void;
    onResetData: () => void;
    settings: UserSettings | null;
    onSettingsChange: (settings: Partial<UserSettings>) => void;
}

export default function SettingsView({ child, activities, treatments, children, setChildren, selectedChild, onChildChange, onResetData, settings, onSettingsChange }: SettingsViewProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isManageChildOpen, setIsManageChildOpen] = useState(false);
  const [childName, setChildName] = useState('');
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();


  const [dataToDownload, setDataToDownload] = useState({
    diapers: true,
    feeding: true,
    sleep: true,
    treatments: true,
  });
  const [downloadPeriod, setDownloadPeriod] = useState('7d');

  useEffect(() => {
    if (editingChild) {
      setChildName(editingChild.name);
    }
  }, [editingChild]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
    toast({ title: 'Déconnexion réussie', duration: 1200 });
  };
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPasswordLoading(true);

    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Les nouveaux mots de passe ne correspondent pas.', duration: 1200 });
      setIsPasswordLoading(false);
      return;
    }
    if (!user || !user.email) {
       toast({ variant: 'destructive', title: 'Erreur', description: 'Utilisateur non trouvé.', duration: 1200 });
       setIsPasswordLoading(false);
       return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      toast({ title: 'Mot de passe mis à jour !', description: 'Votre mot de passe a été modifié avec succès.', duration: 1200 });
      setIsChangePasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Le mot de passe actuel est incorrect ou une autre erreur s'est produite.", duration: 1200 });
    } finally {
      setIsPasswordLoading(false);
    }
  };


  const handleDownload = () => {
    let activityDataToExport: ActivityEvent[] = [];
    const now = new Date();
    switch (downloadPeriod) {
        case '7d':
            activityDataToExport = activities.filter(a => isAfter(parseISO(a.date), subDays(now, 7)));
            break;
        case '30d':
            activityDataToExport = activities.filter(a => isAfter(parseISO(a.date), subDays(now, 30)));
            break;
        case 'this_month':
            activityDataToExport = activities.filter(a => isWithinInterval(parseISO(a.date), { start: startOfMonth(now), end: endOfMonth(now) }));
            break;
        case 'last_month':
            const lastMonth = subDays(now, 30);
            activityDataToExport = activities.filter(a => isWithinInterval(parseISO(a.date), { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }));
            break;
        case 'all':
        default:
            activityDataToExport = activities;
            break;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    const headers: string[] = ["Date", "Heure", "Type", "Détails", "Note"];
    csvContent += headers.join(",") + "\n";

    const dataToCsv = (data: any[], type: string) => {
        let rows = '';
        data.forEach(item => {
            if (type === 'activities' && dataToDownload[item.type as keyof typeof dataToDownload]) {
                let details = '';
                let activityType = item.type;
                 switch(item.type) {
                    case 'diapers':
                        activityType = "Couche";
                        const diaperTypeMap = { wet: "Pipi", dirty: "Selles", both: "Pipi + Selles" };
                        details = `Type: ${diaperTypeMap[item.details.diaperType as keyof typeof diaperTypeMap] || item.details.diaperType}`;
                        break;
                    case 'feeding':
                        activityType = "Alimentation";
                        details = `Quantité: ${item.details.amount || 0}ml, Durée: ${item.details.duration || 0}min`;
                        break;
                    case 'sleep':
                        activityType = "Sommeil";
                        details = `Durée: ${item.details.duration || 0}h`;
                        break;
                }

                const row = [item.date, item.details.time, activityType, `"${details}"`, `"${item.details.note || ''}"`];
                rows += row.join(",") + "\n";
            } else if (type === 'treatments' && dataToDownload.treatments) {
                item.history.forEach((h: any) => {
                    const details = `Médicament: ${item.medication}, Dosage: ${item.dosage}, Fréquence: ${item.frequency}`;
                    const row = [h.date, h.time, 'Traitement', `"${details}"`, `"${item.notes || ''}"`];
                    rows += row.join(",") + "\n";
                });
            }
        });
        return rows;
    }

    csvContent += dataToCsv(activityDataToExport, 'activities');
    csvContent += dataToCsv(treatments, 'treatments');
    
    if (csvContent.length <= headers.join(",").length + 2) {
        toast({
            variant: "destructive",
            title: "Aucune donnée à exporter",
            description: "Veuillez sélectionner au moins un type de données à inclure.",
            duration: 1200
        });
        return;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `donnees_${child?.name || 'bebe'}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
        title: "Téléchargement terminé",
        description: "Vos données ont été exportées avec succès.",
        duration: 1200
    });
  };
  
  const handlePrepareManageChild = (child: Child | null) => {
    setEditingChild(child);
    setChildName(child ? child.name : '');
    setIsManageChildOpen(true);
  };

  const handleSaveChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName || !user) return;

    if (editingChild) {
      await updateChild(user.uid, editingChild.id, { name: childName });
      setChildren(children.map(c => c.id === editingChild.id ? { ...c, name: childName } : c));
      toast({ title: 'Profil mis à jour !', duration: 1200 });
    } else {
      const newChild = await addChild(user.uid, { name: childName });
      setChildren([...children, newChild]);
      onChildChange(newChild.id);
      toast({ title: 'Profil ajouté !', duration: 1200 });
    }
    setIsManageChildOpen(false);
  };
  
  const handleDeleteChild = async (childId: string) => {
    if (!user) return;
    await deleteChild(user.uid, childId);
    const remainingChildren = children.filter(c => c.id !== childId);
    setChildren(remainingChildren);
    onChildChange(remainingChildren.length > 0 ? remainingChildren[0].id : '');
    toast({ title: 'Profil supprimé !', variant: 'destructive', duration: 1200 });
    setIsManageChildOpen(false); // Close the manage dialog
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    onSettingsChange({ theme: newTheme });
  };
  
  const handleNotificationsChange = (enabled: boolean) => {
    onSettingsChange({ notifications: { enabled } });
  };

  if (!settings) return null;

  return (
      <div className="flex flex-col h-full">
        <SheetHeader className="p-6">
          <SheetTitle className="text-2xl">Réglages</SheetTitle>
          <SheetDescription>
            Personnalisez les paramètres de votre application et gérez les profils.
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-grow">
          <div className="space-y-6 py-4 px-6">
             <Dialog open={isManageChildOpen} onOpenChange={setIsManageChildOpen}>
              <div className="space-y-2">
                  <h4 className="font-semibold text-muted-foreground px-1">Profils</h4>
                  <div className="rounded-lg border p-3 bg-card">
                      <Label htmlFor="child-select" className="text-sm text-muted-foreground">
                          Enfant sélectionné
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                          <Select value={selectedChild} onValueChange={onChildChange}>
                              <SelectTrigger id="child-select" className="flex-grow h-11 text-base">
                                  <SelectValue placeholder="Choisir un enfant" />
                              </SelectTrigger>
                              <SelectContent>
                                  {children.map(child => (
                                    <SelectItem key={child.id} value={child.id} className="text-base">{child.name}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                          <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => handlePrepareManageChild(children.find(c => c.id === selectedChild) || null)} disabled={!child}>
                              <Edit className="h-5 w-5" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => handlePrepareManageChild(null)}>
                              <UserPlus className="h-5 w-5" />
                          </Button>
                      </div>
                  </div>
              </div>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-sm rounded-2xl flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{editingChild ? "Modifier le nom de l'enfant" : "Ajouter un enfant"}</DialogTitle>
                        <DialogDescription>
                            {editingChild ? `Modifiez le nom de ${editingChild.name}.` : "Ajoutez un nouveau profil pour un autre enfant."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveChild} className="flex-grow flex flex-col">
                        <div className="space-y-2 py-4 flex-grow">
                            <Label htmlFor="child-name">Nom de l'enfant</Label>
                            <Input
                                id="child-name"
                                value={childName}
                                onChange={(e) => setChildName(e.target.value)}
                                placeholder="Prénom de l'enfant"
                                className="text-lg h-12"
                            />
                        </div>
                        <DialogFooter className="mt-6 grid grid-cols-2 gap-4">
                           {editingChild && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button type="button" variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="rounded-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Confirmer la suppression</DialogTitle>
                                        <DialogDescription>
                                            Êtes-vous sûr de vouloir supprimer {editingChild.name} ? Toutes les données associées seront perdues.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
                                        <Button variant="destructive" onClick={() => handleDeleteChild(editingChild!.id)}>Supprimer</Button>
                                    </DialogFooter>
                                </DialogContent>
                              </Dialog>
                           )}
                           <Button type="button" variant="outline" onClick={() => setIsManageChildOpen(false)} className={cn("h-12", editingChild && "col-start-1")}>Annuler</Button>
                           <Button type="submit" className="h-12">Enregistrer</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

              <Separator />
              
              <div className="space-y-4">
                  <h4 className="font-semibold text-muted-foreground">Apparence</h4>
                  <div className="flex items-center justify-between rounded-lg border p-3 bg-card">
                      <div className="flex items-center gap-3">
                          {theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                          <Label htmlFor="theme-mode" className="text-base">
                              Thème sombre
                          </Label>
                      </div>
                      <Switch 
                        id="theme-mode"
                        checked={theme === 'dark'}
                        onCheckedChange={(checked) => handleThemeChange(checked ? 'dark' : 'light')}
                      />
                  </div>
              </div>
              
              <Separator />

              <div className="space-y-4">
                  <h4 className="font-semibold text-muted-foreground">Notifications</h4>
                  <div className="flex items-center justify-between rounded-lg border p-3 bg-card">
                      <div className="flex items-center gap-3">
                          <Bell className="h-5 w-5" />
                          <Label htmlFor="notifications-enabled" className="text-base">
                              Activer les notifications
                          </Label>
                      </div>
                      <Switch
                        id="notifications-enabled"
                        checked={settings.notifications?.enabled}
                        onCheckedChange={handleNotificationsChange}
                      />
                  </div>
              </div>

              <Separator />
               <div className="space-y-4">
                  <h4 className="font-semibold text-muted-foreground">Compte</h4>
                   <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                      <DialogTrigger asChild>
                          <button className="flex items-center justify-between rounded-lg border p-3 w-full text-left hover:bg-muted/50 transition-colors bg-card">
                              <div>
                                  <Label className="text-base font-medium cursor-pointer">Modifier le mot de passe</Label>
                                  <p className="text-sm text-muted-foreground">Changez le mot de passe de votre compte.</p>
                              </div>
                              <KeyRound className="h-5 w-5 text-primary" />
                          </button>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl">
                          <DialogHeader>
                              <DialogTitle>Modifier le mot de passe</DialogTitle>
                              <DialogDescription>
                                  Pour des raisons de sécurité, veuillez d'abord entrer votre mot de passe actuel.
                              </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleChangePassword} className="space-y-4 pt-4">
                              <div className="space-y-2">
                                  <Label htmlFor="current-password">Mot de passe actuel</Label>
                                  <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                              </div>
                               <div className="space-y-2">
                                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                                  <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                                   <p className="text-xs text-muted-foreground pt-1">
                                    Doit contenir au moins une majuscule et un caractère spécial.
                                  </p>
                              </div>
                               <div className="space-y-2">
                                  <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                              </div>
                              <DialogFooter>
                                  <Button type="button" variant="outline" onClick={() => setIsChangePasswordOpen(false)}>Annuler</Button>
                                  <Button type="submit" disabled={isPasswordLoading}>{isPasswordLoading ? "Chargement..." : "Modifier"}</Button>
                              </DialogFooter>
                          </form>
                      </DialogContent>
                  </Dialog>
                  <button className="flex items-center justify-between rounded-lg border p-3 w-full text-left hover:bg-muted/50 transition-colors bg-card" onClick={handleLogout}>
                      <div>
                          <Label className="text-base font-medium cursor-pointer text-destructive">Se déconnecter</Label>
                      </div>
                      <LogOut className="h-5 w-5 text-destructive" />
                  </button>
              </div>

              <Separator />
              
              <div className="space-y-4">
                  <h4 className="font-semibold text-muted-foreground">Données</h4>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center justify-between rounded-lg border p-3 w-full text-left hover:bg-muted/50 transition-colors bg-card">
                          <div>
                              <Label className="text-base font-medium cursor-pointer">Exporter les données</Label>
                              <p className="text-sm text-muted-foreground">Télécharge un fichier CSV de vos données.</p>
                          </div>
                          <Download className="h-5 w-5 text-primary" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-2 space-y-2">
                        <DropdownMenuLabel>Exporter les données</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-xs font-normal">Données à inclure</DropdownMenuLabel>
                            <DropdownMenuCheckboxItem
                                checked={dataToDownload.diapers}
                                onCheckedChange={(checked: CheckedState) => setDataToDownload(prev => ({...prev, diapers: !!checked}))}
                            >
                                Couches
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={dataToDownload.feeding}
                                onCheckedChange={(checked: CheckedState) => setDataToDownload(prev => ({...prev, feeding: !!checked}))}
                            >
                                Alimentation
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={dataToDownload.sleep}
                                onCheckedChange={(checked: CheckedState) => setDataToDownload(prev => ({...prev, sleep: !!checked}))}
                            >
                                Sommeil
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={dataToDownload.treatments}
                                onCheckedChange={(checked: CheckedState) => setDataToDownload(prev => ({...prev, treatments: !!checked}))}
                            >
                                Traitements
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <div className="space-y-1">
                            <Label className="px-2 text-xs font-normal text-muted-foreground">Période</Label>
                            <Select value={downloadPeriod} onValueChange={setDownloadPeriod}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir une période" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7d">Les 7 derniers jours</SelectItem>
                                    <SelectItem value="30d">Les 30 derniers jours</SelectItem>
                                    <SelectItem value="this_month">Ce mois-ci</SelectItem>
                                    <SelectItem value="last_month">Le mois dernier</SelectItem>
                                    <SelectItem value="all">Toutes les données</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DropdownMenuSeparator />
                        <Button className="w-full" onClick={handleDownload}>
                            <Download className="mr-2 h-4 w-4" />
                            Télécharger
                        </Button>
                    </DropdownMenuContent>
                </DropdownMenu>
                  
                <Dialog>
                    <DialogTrigger asChild>
                        <div className="flex items-center justify-between rounded-lg border p-3 bg-card hover:bg-muted/50 cursor-pointer">
                            <div>
                                <Label className="text-base font-medium cursor-pointer">Réinitialiser les données</Label>
                                <p className="text-sm text-muted-foreground">Supprime toutes les données de suivi pour l'enfant sélectionné.</p>
                            </div>
                            <Button variant="destructive" size="icon" className="pointer-events-none">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>Réinitialiser les données</DialogTitle>
                            <DialogDescription>
                                Êtes-vous sûr de vouloir supprimer toutes les données de suivi pour {child?.name}? Cette action est irréversible, mais le profil de l'enfant sera conservé.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Annuler</Button>
                            </DialogClose>
                            <DialogClose asChild>
                                <Button variant="destructive" onClick={onResetData}>Réinitialiser</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
              </div>
          </div>
        </ScrollArea>
        
        <footer className="mt-auto p-4 border-t bg-background">
            <div className="flex items-center justify-center gap-2 w-full">
              <Baby className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">BabyList</span>
            </div>
        </footer>
      </div>
  );
}
