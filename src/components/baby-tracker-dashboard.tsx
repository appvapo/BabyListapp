
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import BottomNav from '@/components/bottom-nav';
import TrackingView from '@/components/tracking-view';
import ChartsView from '@/components/charts-view';
import AppointmentsView, { AppointmentsViewHandle } from '@/components/appointments-view';
import MommyTipsView from '@/components/mommy-tips-view';
import SettingsView from '@/components/settings-view';
import { Baby, LineChart, CalendarDays, FileText, Settings, Wand2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Child, ActivityEvent, Treatment, Appointment, UserSettings } from '@/lib/types';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { useIsMobile } from '@/hooks/use-mobile';
import { Header } from '@/components/ui/header';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getChildren, addChild, getActivities, addActivityToDB, deleteActivityFromDB, getTreatments, addTreatmentToDB, updateTreatmentInDB, deleteTreatmentFromDB, getAppointments, addAppointmentToDB, updateAppointmentInDB, deleteAppointmentFromDB, resetChildData, getUserSettings, updateUserSettings } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import TransitionScreen from '@/components/transition-screen';
import { useTheme } from 'next-themes';

export type View = 'tracker' | 'charts' | 'appointments' | 'tips';

export interface NavItem {
  id: View;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: 'tracker', label: 'Suivi', icon: Baby },
  { id: 'charts', label: 'Stats', icon: LineChart },
  { id: 'appointments', label: 'R.D.V', icon: CalendarDays },
  { id: 'tips', label: 'Astuces', icon: Wand2 },
];

type ChildData = {
  activities: ActivityEvent[];
  treatments: Treatment[];
  appointments: Appointment[];
};

export default function BabyTrackerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { setTheme } = useTheme();
  const router = useRouter();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<View>('tracker');
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | undefined>(undefined);
  const [childData, setChildData] = useState<Record<string, ChildData>>({});
  const [currentChildData, setCurrentChildData] = useState<ChildData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const [api, setApi] = useState<CarouselApi>();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  
  const viewRefs = useRef<(HTMLDivElement | null)[]>([]);
  const appointmentsViewRef = useRef<AppointmentsViewHandle>(null);

 useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/signup');
      return;
    }

    const loadInitialData = async () => {
      setDataLoading(true);
      try {
        const [fetchedChildren, userSettings] = await Promise.all([
          getChildren(user.uid),
          getUserSettings(user.uid)
        ]);

        setChildren(fetchedChildren);
        
        const defaultSettings: UserSettings = {
          theme: 'system',
          charts: { dailyDropThreshold: 15, weeklyDropThreshold: 10 },
          notifications: { enabled: true },
        };

        const mergedSettings = { ...defaultSettings, ...userSettings };
        setSettings(mergedSettings);

        if (mergedSettings.theme) {
          setTheme(mergedSettings.theme);
        }

        if (fetchedChildren.length > 0) {
          const childIdToSelect = selectedChild || fetchedChildren[0].id;
          setSelectedChild(childIdToSelect);

          // Data for the selected child will be loaded by the other useEffect
        } else {
          setIsAddChildModalOpen(true);
          setDataLoading(false);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les données initiales.', duration: 1200 });
        setDataLoading(false);
      }
    };
    
    loadInitialData();
  }, [user, authLoading, router, toast, setTheme]);

  useEffect(() => {
    const loadDataForSelectedChild = async () => {
      if (selectedChild && user) {
        if (!childData[selectedChild]) {
          setDataLoading(true);
          try {
            const [activities, treatments, appointments] = await Promise.all([
              getActivities(user.uid, selectedChild),
              getTreatments(user.uid, selectedChild),
              getAppointments(user.uid, selectedChild),
            ]);
            const newChildData = { activities, treatments, appointments };
            setChildData(prev => ({
              ...prev,
              [selectedChild]: newChildData,
            }));
            setCurrentChildData(newChildData);
          } catch (error) {
            console.error("Error loading child data:", error);
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de charger les données de l'enfant.", duration: 1200 });
          } finally {
            setDataLoading(false);
          }
        } else {
            setCurrentChildData(childData[selectedChild]);
            setDataLoading(false);
        }
      } else if (!selectedChild) {
        setCurrentChildData(null);
        setDataLoading(false);
      }
    };
    
    loadDataForSelectedChild();
  }, [selectedChild, user, childData, toast]);


  const handleSelectChild = (childId: string) => {
    if(childId !== selectedChild) {
      setCurrentChildData(null); // Show transition screen
      setSelectedChild(childId);
    }
  };

  const handleUpdateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!user) return;
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    await updateUserSettings(user.uid, newSettings); // only send the partial update
  }, [user, settings]);


  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim() || !user) return;

    const newChildData = { name: newChildName.trim() };
    const newChild = await addChild(user.uid, newChildData);
    
    setChildren(prev => [...prev, newChild]);
    setChildData(prev => ({ ...prev, [newChild.id]: { activities: [], treatments: [], appointments: [] } }));
    handleSelectChild(newChild.id);
    setNewChildName('');
    setIsAddChildModalOpen(false);
    toast({ title: 'Enfant ajouté !', duration: 1200 });
  };

  const addActivity = useCallback(async (activity: Omit<ActivityEvent, 'id'>): Promise<void> => {
    if (!selectedChild || !user) return;
    const newActivity = await addActivityToDB(user.uid, selectedChild, activity as any);
    const newActivities = [newActivity, ...(currentChildData?.activities || [])];
    const newChildData = { ...currentChildData!, activities: newActivities };

    setChildData(prev => ({ ...prev, [selectedChild]: newChildData }));
    setCurrentChildData(newChildData);

  }, [user, selectedChild, currentChildData]);

  const deleteActivity = useCallback(async (activityId: string) => {
    if (!selectedChild || !user) return;
    await deleteActivityFromDB(user.uid, selectedChild, activityId);
    
    const newActivities = currentChildData!.activities.filter(activity => activity.id !== activityId);
    const newChildData = { ...currentChildData!, activities: newActivities };
    
    setChildData(prev => ({ ...prev, [selectedChild]: newChildData }));
    setCurrentChildData(newChildData);

  }, [user, selectedChild, currentChildData]);

  const addTreatment = useCallback(async (treatment: Omit<Treatment, 'id'>): Promise<Treatment> => {
    if (!selectedChild || !user) {
      throw new Error("No child selected or user not logged in");
    }
    const newTreatmentWithId = await addTreatmentToDB(user.uid, selectedChild, treatment);
    const newTreatments = [...(currentChildData?.treatments || []), newTreatmentWithId];
    const newChildData = { ...currentChildData!, treatments: newTreatments };
    
    setChildData(prev => ({ ...prev, [selectedChild]: newChildData }));
    setCurrentChildData(newChildData);
    toast({ title: "Traitement ajouté", duration: 1200 });
    return newTreatmentWithId;
  }, [user, selectedChild, currentChildData, toast]);

  const updateTreatment = useCallback(async (treatmentToUpdate: Treatment): Promise<void> => {
      if (!selectedChild || !user) return;
      await updateTreatmentInDB(user.uid, selectedChild, treatmentToUpdate.id, treatmentToUpdate);
      const newTreatments = currentChildData!.treatments.map(t => t.id === treatmentToUpdate.id ? treatmentToUpdate : t);
      const newChildData = { ...currentChildData!, treatments: newTreatments };
      
      setChildData(prev => ({ ...prev, [selectedChild]: newChildData }));
      setCurrentChildData(newChildData);

      toast({ title: "Traitement mis à jour", duration: 1200 });
  }, [user, selectedChild, currentChildData, toast]);

  const deleteTreatment = useCallback(async (treatmentId: string): Promise<void> => {
      if (!selectedChild || !user) return;
      await deleteTreatmentFromDB(user.uid, selectedChild, treatmentId);
      const newTreatments = currentChildData!.treatments.filter(t => t.id !== treatmentId);
      const newChildData = { ...currentChildData!, treatments: newTreatments };

      setChildData(prev => ({ ...prev, [selectedChild]: newChildData }));
      setCurrentChildData(newChildData);
      toast({ title: "Traitement supprimé", duration: 1200 });
  }, [user, selectedChild, currentChildData, toast]);

   const addAppointment = useCallback(async (appointment: Omit<Appointment, 'id'>): Promise<Appointment> => {
    if (!selectedChild || !user) {
        throw new Error("No child selected or user not logged in");
    }
    const newAppointmentWithId = await addAppointmentToDB(user.uid, selectedChild, appointment);
    const newAppointments = [...(currentChildData?.appointments || []), newAppointmentWithId];
    const newChildData = { ...currentChildData!, appointments: newAppointments };

    setChildData(prev => ({ ...prev, [selectedChild]: newChildData }));
    setCurrentChildData(newChildData);
    return newAppointmentWithId;
  }, [user, selectedChild, currentChildData]);

  const updateAppointment = useCallback(async (appointmentToUpdate: Appointment) => {
    if (!selectedChild || !user) return;
    await updateAppointmentInDB(user.uid, selectedChild, appointmentToUpdate.id, appointmentToUpdate);
    const newAppointments = currentChildData!.appointments.map(a => a.id === appointmentToUpdate.id ? appointmentToUpdate : a);
    const newChildData = { ...currentChildData!, appointments: newAppointments };
    
    setChildData(prev => ({ ...prev, [selectedChild]: newChildData }));
    setCurrentChildData(newChildData);

  }, [user, selectedChild, currentChildData]);

  const deleteAppointment = useCallback(async (appointmentId: string) => {
    if (!selectedChild || !user) return;
    await deleteAppointmentFromDB(user.uid, selectedChild, appointmentId);
    const newAppointments = currentChildData!.appointments.filter(a => a.id !== appointmentId);
    const newChildData = { ...currentChildData!, appointments: newAppointments };

    setChildData(prev => ({ ...prev, [selectedChild]: newChildData }));
    setCurrentChildData(newChildData);
  }, [user, selectedChild, currentChildData]);

  const handleResetData = useCallback(async () => {
    if (!selectedChild || !user) return;
    try {
        await resetChildData(user.uid, selectedChild);
        const newChildData = { activities: [], treatments: [], appointments: [] };
        
        setChildData(prev => ({ ...prev, [selectedChild]: newChildData }));
        setCurrentChildData(newChildData);
        toast({ title: 'Données réinitialisées', description: "Toutes les données de l'enfant ont été supprimées.", duration: 1200 });
    } catch (error) {
        console.error("Error resetting child data:", error);
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de réinitialiser les données.', duration: 1200 });
    }
  }, [user, selectedChild, toast]);


  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
        const newIndex = api.selectedScrollSnap();
        const newView = navItems[newIndex].id;
         if (newView !== activeView) {
            // Do not update view on carousel scroll to prevent loop
            // setActiveView(newView);
         }
    };
    
    api.on('select', onSelect);
    return () => {
        api.off('select', onSelect);
    };
  }, [api, activeView]);

  useEffect(() => {
    if (activeView === 'appointments') {
      appointmentsViewRef.current?.centerSelectedDate();
    }
  }, [activeView]);
  
  const handleViewChange = (newView: View) => {
    setActiveView(newView);
    const newIndex = navItems.findIndex(item => item.id === newView);
    api?.scrollTo(newIndex);
    viewRefs.current[newIndex]?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentChildName = children.find(c => c.id === selectedChild)?.name;

  if (authLoading || dataLoading || !user || !settings || !currentChildData && children.length > 0) {
    return <TransitionScreen />;
  }

  const renderView = (view: View) => {
    if (!selectedChild || !currentChildData) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <Baby className="w-16 h-16 text-primary mb-4" />
                <h2 className="text-xl font-semibold">Bienvenue !</h2>
                <p className="text-muted-foreground">Veuillez ajouter un enfant pour commencer le suivi.</p>
                <Button onClick={() => setIsAddChildModalOpen(true)} className="mt-4">Ajouter un enfant</Button>
            </div>
        );
    }

    const commonProps = {
      childId: selectedChild,
      onModalToggle: setIsModalOpen,
      className: "p-3 sm:p-6"
    };

    switch (view) {
      case 'tracker':
        return <TrackingView 
                  key={`tracker-${selectedChild}`} 
                  allActivities={currentChildData.activities}
                  treatments={currentChildData.treatments} 
                  addActivity={addActivity}
                  deleteActivity={deleteActivity}
                  dailyDropThreshold={settings.charts?.dailyDropThreshold ?? 15}
                  addTreatment={addTreatment}
                  updateTreatment={updateTreatment}
                  deleteTreatment={deleteTreatment}
                  {...commonProps} 
                />;
      case 'charts':
        return <ChartsView 
                  key={`charts-${selectedChild}`} 
                  allActivities={currentChildData.activities} 
                  treatments={currentChildData.treatments}
                  addActivity={addActivity}
                  settings={settings}
                  onSettingsChange={handleUpdateSettings}
                  {...commonProps} 
                />;
      case 'appointments':
        return <AppointmentsView
                  ref={appointmentsViewRef}
                  key={`appointments-${selectedChild}`} 
                  appointments={currentChildData.appointments}
                  addAppointment={addAppointment}
                  updateAppointment={updateAppointment}
                  deleteAppointment={deleteAppointment}
                  {...commonProps} 
                />;
      case 'tips':
        return <MommyTipsView key="tips" onModalToggle={setIsModalOpen} className="p-3 sm:p-6" />;
      default:
        return <div/>;
    }
  };

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col bg-background text-foreground md:border-x">
       <Header sticky>
          <div className="flex flex-1 items-center">
             <Select value={selectedChild} onValueChange={handleSelectChild} disabled={children.length === 0}>
                <SelectTrigger className="w-auto border-0 bg-transparent text-lg p-2 h-11">
                    <SelectValue>
                         <div className="flex items-center gap-2">
                            <span className="font-semibold">{currentChildName ? currentChildName.charAt(0).toUpperCase() + currentChildName.slice(1) : "Aucun enfant"}</span>
                         </div>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {children.map(child => (
                        <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2 rounded-md bg-primary/20 p-1 text-accent-foreground shadow-lg">
            <div className="flex items-center gap-1 px-3 py-1">
                <Baby className="h-5 w-5" />
                <span className="text-md font-bold">BabyList</span>
            </div>
            <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="group rounded-md h-8 w-8 bg-card/80 border-primary/50 hover:bg-card hover:border-primary">
                  <Settings className="h-5 w-5 transition-transform duration-500 group-hover:rotate-90" />
                </Button>
              </SheetTrigger>
              <SheetContent className="rounded-l-2xl p-0">
                  <SettingsView 
                    child={children.find(c => c.id === selectedChild)}
                    activities={currentChildData?.activities || []}
                    treatments={currentChildData?.treatments || []}
                    children={children}
                    setChildren={setChildren}
                    selectedChild={selectedChild || ''} 
                    onChildChange={handleSelectChild}
                    onResetData={handleResetData}
                    settings={settings}
                    onSettingsChange={handleUpdateSettings}
                  />
              </SheetContent>
            </Sheet>
          </div>
      </Header>
      <main className="flex-1 pb-20 flex flex-col min-h-0">
        <Carousel 
          setApi={setApi} 
          className="flex-1 min-h-0"
          opts={{
            align: 'start',
            loop: false,
            watchDrag: false,
          }}
        >
          <CarouselContent className="h-full">
            {navItems.map((item, index) => (
              <CarouselItem key={item.id} className="h-full basis-full">
                 <div ref={el => viewRefs.current[index] = el} className="h-full overflow-y-auto no-scrollbar">
                    {renderView(item.id)}
                 </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </main>

      {!isSettingsOpen && !isModalOpen && (
        <BottomNav
          items={navItems}
          activeView={activeView}
          setActiveView={handleViewChange}
        />
      )}

      <Dialog open={isAddChildModalOpen && !dataLoading} onOpenChange={(open) => {
        if (!open && children.length === 0) return; // Prevent closing if no child is added
        setIsAddChildModalOpen(open)
      }}>
        <DialogContent className="rounded-2xl">
            <DialogHeader>
                <DialogTitle>Ajouter votre premier enfant</DialogTitle>
                <DialogDescription>
                    Bienvenue ! Pour commencer, veuillez ajouter le profil de votre enfant.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddChild} className="space-y-4">
                <div>
                    <Label htmlFor="new-child-name">Nom de l'enfant</Label>
                    <Input 
                        id="new-child-name" 
                        value={newChildName} 
                        onChange={(e) => setNewChildName(e.target.value)}
                        placeholder="Prénom"
                        className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary/80"
                    />
                </div>
                <DialogFooter>
                    <Button type="submit" className="w-full">Ajouter</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
