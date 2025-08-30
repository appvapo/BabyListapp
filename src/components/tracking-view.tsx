
"use client";
import { BedDouble, Droplets, History, Bell, Repeat, Repeat1, LineChart as LineChartIcon, Minus, Plus, Clock, Pencil, Baby, GlassWater, Pill, Edit, List, Trash2, CalendarDays, CheckCircle, Circle, AlertTriangle, StickyNote, Calendar as CalendarIconLucide, Maximize, Minimize } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, differenceInMinutes, parse, formatISO, parseISO, isSameDay, subDays, startOfDay, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { ActivityLog, Treatment, ActivityEvent } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';


type Activity = 'diapers' | 'feeding' | 'sleep';
type DiaperType = 'wet' | 'dirty' | 'both';
type ChartDataKey = keyof typeof chartConfig;
type Period = 'daily' | 'weekly';
type FeedType = 'bottle' | 'breastfeeding';
type BreastfeedingSide = 'left' | 'right';
type SleepMode = 'timer' | 'manual';


const chartConfig = {
  diapers: { label: "Couches", color: "hsl(var(--chart-1))", icon: Droplets },
  feeding: { label: "Alimentation (ml)", color: "hsl(var(--chart-2))", icon: GlassWater },
  sleep: { label: "Sommeil (h)", color: "hsl(var(--chart-3))", icon: BedDouble },
} satisfies ChartConfig

interface TrackingViewProps {
  childId: string;
  onModalToggle: (isOpen: boolean) => void;
  className?: string;
  allActivities: ActivityEvent[];
  treatments: Treatment[];
  addActivity: (activity: Omit<ActivityEvent, 'id'>, date?: Date) => void;
  deleteActivity: (activityId: string) => void;
  dailyDropThreshold: number;
  addTreatment: (treatment: Omit<Treatment, 'id'>) => Promise<Treatment>;
  updateTreatment: (treatment: Treatment) => Promise<void>;
  deleteTreatment: (treatmentId: string) => Promise<void>;
}

const quantityOptions = Array.from({ length: 28 }, (_, i) => (i + 3) * 10); // 30ml to 300ml

export default function TrackingView({ 
  childId, 
  onModalToggle, 
  className, 
  allActivities, 
  treatments, 
  addActivity, 
  deleteActivity, 
  dailyDropThreshold,
  addTreatment,
  updateTreatment,
  deleteTreatment
}: TrackingViewProps) {
  const { toast } = useToast();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  
  // Diapers state
  const [selectedDiaperType, setSelectedDiaperType] = useState<DiaperType | null>(null);
  const [diaperNote, setDiaperNote] = useState('');

  // Feeding state
  const [feedType, setFeedType] = useState<FeedType>('bottle');
  const [feedAmount, setFeedAmount] = useState('');
  const [feedNote, setFeedNote] = useState('');
  const [breastfeedingTimer, setBreastfeedingTimer] = useState<{ side: BreastfeedingSide, startTime: number } | null>(null);
  const [breastfeedingElapsedTime, setBreastfeedingElapsedTime] = useState(0);
  
  // Sleep state
  const [sleepMode, setSleepMode] = useState<SleepMode>('timer');
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sleepStartTime, setSleepStartTime] = useState('');
  const [sleepEndTime, setSleepEndTime] = useState('');
  const [sleepNote, setSleepNote] = useState('');

  // Treatment State
  const [isTreatmentFormOpen, setIsTreatmentFormOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [isTreatmentDetailOpen, setIsTreatmentDetailOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
    // Treatment Form State
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [treatmentStartDate, setTreatmentStartDate] = useState<Date | undefined>();
  const [treatmentEndDate, setTreatmentEndDate] = useState<Date | undefined>();
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [treatmentIsActive, setTreatmentIsActive] = useState(true);

  const [visibleChart, setVisibleChart] = useState<ChartDataKey>('diapers');
  const [isSleepReminderRecurrent, setIsSleepReminderRecurrent] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [isReminderSheetOpen, setIsReminderSheetOpen] = useState(false);
  const [overviewPeriod, setOverviewPeriod] = useState<Period>('daily');


  const buttonClass = "transition-transform duration-200 ease-in-out active:scale-95 transform-gpu";

  useEffect(() => {
    onModalToggle(isTreatmentFormOpen || isTreatmentDetailOpen || isReminderSheetOpen);
  }, [isTreatmentFormOpen, isTreatmentDetailOpen, isReminderSheetOpen, onModalToggle]);

  useEffect(() => {
    // Set initial date on client to avoid hydration mismatch
    if (isTreatmentFormOpen) {
      setTreatmentStartDate(new Date());
    }
  }, [isTreatmentFormOpen]);


  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (sleepTimer) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - sleepTimer);
      }, 1000);
    } else {
        setElapsedTime(0);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [sleepTimer]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (breastfeedingTimer) {
      interval = setInterval(() => {
        setBreastfeedingElapsedTime(Date.now() - breastfeedingTimer.startTime);
      }, 1000);
    } else {
        setBreastfeedingElapsedTime(0);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [breastfeedingTimer]);
  
  useEffect(() => {
    if (!carouselApi) {
      return
    }

    const onSelect = () => {
      const currentChart = Object.keys(chartConfig)[carouselApi.selectedScrollSnap()] as ChartDataKey
      setVisibleChart(currentChart)
    };
 
    carouselApi.on("select", onSelect);
    
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi])

  const recentActivities = useMemo(() => {
    return [...allActivities]
        .sort((a, b) => parseISO(`${b.date}T${b.details.time || '00:00'}`).getTime() - parseISO(`${a.date}T${a.details.time || '00:00'}`).getTime())
        .slice(0, 5);
  }, [allActivities]);


  const handleDiaperLog = () => {
    if (!selectedDiaperType) {
        toast({ variant: "destructive", description: "Veuillez sélectionner un type de couche.", duration: 1200 });
        return;
    }
    addActivity({
        type: 'diapers',
        date: format(new Date(), 'yyyy-MM-dd'),
        details: {
            time: format(new Date(), 'HH:mm'),
            diaperType: selectedDiaperType,
            note: diaperNote,
        }
    });

    toast({ title: 'Couche enregistrée !', duration: 1200 });
    setSelectedActivity(null);
    setDiaperNote('');
  }

  const handleFeedLog = () => {
    if (feedAmount) {
        const activityData: any = {
            type: 'feeding',
            date: format(new Date(), 'yyyy-MM-dd'),
            details: {
                time: format(new Date(), 'HH:mm'),
                amount: Number(feedAmount),
                note: feedNote,
            }
        };
        addActivity(activityData);
      toast({ title: 'Biberon enregistré !', duration: 1200 });
      setSelectedActivity(null);
      setFeedNote('');
    } else {
      toast({
        variant: "destructive",
        description: "Veuillez entrer une quantité.",
        duration: 1200
      });
    }
  }

  const handleSleepTimer = () => {
    if (sleepTimer) {
        const duration = (Date.now() - sleepTimer) / (1000 * 60 * 60); // in hours
        addActivity({
            type: 'sleep',
            date: format(new Date(), 'yyyy-MM-dd'),
            details: {
                time: format(new Date(sleepTimer), 'HH:mm'),
                duration: duration,
                note: 'Suivi avec le chronomètre'
            }
        });
        toast({ title: 'Dodo terminé et enregistré !', duration: 1200 });
        setSleepTimer(null);
        setSelectedActivity(null);
    } else {
        setSleepTimer(Date.now());
        toast({ 
          title: "Suivi du sommeil",
          description: "Le suivi du sommeil a commencé.",
          duration: 1200,
        });
    }
  }

  const handleManualSleepLog = () => {
    if (!sleepStartTime || !sleepEndTime) {
      toast({ variant: "destructive", description: "Veuillez entrer une heure de début et de fin.", duration: 1200 });
      return;
    }

    const today = new Date();
    const startDate = parse(sleepStartTime, 'HH:mm', today);
    let endDate = parse(sleepEndTime, 'HH:mm', today);

    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    const durationMins = differenceInMinutes(endDate, startDate);
    if(durationMins < 0) {
        toast({ variant: "destructive", description: "L'heure de fin doit être après l'heure de début.", duration: 1200 });
        return;
    }
    
    addActivity({
        type: 'sleep',
        date: format(new Date(), 'yyyy-MM-dd'),
        details: {
            time: sleepStartTime,
            duration: durationMins / 60, // in hours
            note: sleepNote,
        }
    });

    toast({ title: 'Dodo enregistré !', duration: 1200 });
    setSelectedActivity(null);
    setSleepEndTime('');
    setSleepNote('');
  }

  const handleBreastfeeding = (side: BreastfeedingSide) => {
    if (breastfeedingTimer && breastfeedingTimer.side === side) {
      // Stop timer
      const durationMins = (Date.now() - breastfeedingTimer.startTime) / (1000 * 60);
      const activityData: any = {
        type: 'feeding',
        date: format(new Date(), 'yyyy-MM-dd'),
        details: {
          time: format(new Date(breastfeedingTimer.startTime), 'HH:mm'),
          duration: durationMins, // Store duration in minutes for breastfeeding
          note: `Sein ${side === 'left' ? 'gauche' : 'droit'}`
        }
      };
      addActivity(activityData);
      toast({ title: `Allaitement enregistré !`, duration: 1200});
      setBreastfeedingTimer(null);
      setSelectedActivity(null);
    } else {
      // Start timer for this side
      setBreastfeedingTimer({ side, startTime: Date.now() });
      toast({ 
          title: `Allaitement - Sein ${side === 'left' ? 'Gauche' : 'Droit'}`,
          description: "Le chronomètre est lancé.",
          duration: 1200,
      });
    }
  };


  const formatElapsedTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  const toggleActivity = (activity: Activity) => {
    setSelectedActivity(prev => prev === activity ? null : activity);
    setSelectedDiaperType(null);
  }

  const getDiaperNotePlaceholder = () => {
    switch (selectedDiaperType) {
      case 'wet': return "ex: Urine très claire";
      case 'dirty': return "ex: Selles plus liquides";
      case 'both': return "ex: Érythème fessier";
      default: return "Ajouter une note...";
    }
  }

  // Treatment functions
  const openTreatmentForm = (treatment: Treatment | null = null) => {
    if (treatment) {
        setEditingTreatment(treatment);
        setMedication(treatment.medication);
        setDosage(treatment.dosage);
        setFrequency(treatment.frequency);
        setTreatmentStartDate(treatment.startDate);
        setTreatmentEndDate(treatment.endDate);
        setTreatmentNotes(treatment.notes || '');
        setTreatmentIsActive(treatment.active);
    } else {
        setEditingTreatment(null);
        setMedication('');
        setDosage('');
        setFrequency('');
        setTreatmentStartDate(new Date());
        setTreatmentEndDate(undefined);
        setTreatmentNotes('');
        setTreatmentIsActive(true);
    }
    setIsTreatmentFormOpen(true);
    setIsTreatmentDetailOpen(false); // Close detail if editing from there
  };
  
  const handleSaveTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medication || !dosage || !frequency || !treatmentStartDate) return;

    let treatmentData: Omit<Treatment, 'id' | 'history'> & { id?: string; history?: any } = {
        medication,
        dosage,
        frequency,
        startDate: treatmentStartDate,
        notes: treatmentNotes,
        active: treatmentIsActive,
    };

    if (treatmentEndDate) {
        treatmentData.endDate = treatmentEndDate;
    }

    if (editingTreatment) {
        await updateTreatment({ ...editingTreatment, ...treatmentData });
    } else {
        await addTreatment({ ...treatmentData, history: [] });
    }

    setIsTreatmentFormOpen(false);
  };

  const logDose = async (treatmentId: string) => {
    const treatmentToUpdate = treatments.find(t => t.id === treatmentId);
    if (!treatmentToUpdate) return;
    
    const newHistory = [...treatmentToUpdate.history, { date: formatISO(new Date(), { representation: 'date' }), time: format(new Date(), 'HH:mm') }];
    const updatedTreatment = { ...treatmentToUpdate, history: newHistory };
    
    await updateTreatment(updatedTreatment);

    if (selectedTreatment?.id === treatmentId) {
        setSelectedTreatment(updatedTreatment);
    }

    toast({ title: "Prise enregistrée", description: "La prise de médicament a été enregistrée.", duration: 1200 });
  };
  
  const wasDoseTakenToday = useCallback((treatment: Treatment) => {
      const todayStr = formatISO(new Date(), { representation: 'date' });
      return treatment.history.some(h => h.date === todayStr);
  }, []);
  
   const handleOpenTreatmentDetail = (treatment: Treatment) => {
    setSelectedTreatment(treatment);
    setIsTreatmentDetailOpen(true);
  };
  
  const handleDeleteTreatment = async (treatmentId: string) => {
    await deleteTreatment(treatmentId);
    setIsTreatmentDetailOpen(false);
  };

  const handleDeleteActivity = (activityId: string) => {
    deleteActivity(activityId);
    toast({
        title: 'Activité supprimée',
        description: 'L\'activité a été retirée de votre historique.',
        variant: 'destructive',
        duration: 1200
    });
  };

  const handleQuantityButtonClick = useCallback((amount: number) => {
      setFeedAmount(amount.toString());
  }, []);
  
  const sortedTreatments = useMemo(() => {
    return [...treatments].sort((a, b) => {
        const aTaken = wasDoseTakenToday(a);
        const bTaken = wasDoseTakenToday(b);

        if (aTaken === bTaken) {
            if (a.active === b.active) {
                return a.medication.localeCompare(b.medication);
            }
            return a.active ? -1 : 1;
        }

        return aTaken ? 1 : -1; // Not taken first
    });
  }, [treatments, wasDoseTakenToday]);

  const renderActivityControls = () => {
    if (!selectedActivity) return null;

    return (
        <div className="mt-4 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-5 data-[state=open]:animate-in data-[state=open]:fade-in-50 data-[state=open]:slide-in-from-bottom-5 duration-500">
            <div className={cn("p-4 rounded-lg", "bg-card border")}>
                {selectedActivity === 'diapers' && (
                    <div className="space-y-4">
                        <Tabs 
                            value={selectedDiaperType || ""} 
                            onValueChange={(v) => setSelectedDiaperType(v as DiaperType)}
                            className="w-full"
                        >
                            <TabsList className="grid w-full grid-cols-3 h-auto gap-2 bg-transparent p-0">
                                <TabsTrigger 
                                    value="wet" 
                                    className={cn("text-5xl h-24 border-2 p-0 transition-all duration-200 transform-gpu hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-muted text-muted-foreground border-primary/20", selectedDiaperType === 'wet' && "scale-105")}>
                                    <span className={cn("transition-transform duration-200", selectedDiaperType === 'wet' && "scale-110")}>💧</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="dirty" 
                                    className={cn("text-5xl h-24 border-2 p-0 transition-all duration-200 transform-gpu hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-muted text-muted-foreground border-primary/20", selectedDiaperType === 'dirty' && "scale-105")}>
                                    <span className={cn("transition-transform duration-200", selectedDiaperType === 'dirty' && "scale-110")}>💩</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="both" 
                                    className={cn("text-4xl h-24 border-2 p-0 transition-all duration-200 transform-gpu hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-muted text-muted-foreground border-primary/20", selectedDiaperType === 'both' && "scale-105")}>
                                    <span className={cn("transition-transform duration-200", selectedDiaperType === 'both' && "scale-110")}>💧+💩</span>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                         {selectedDiaperType && (
                             <div className="space-y-4 animate-in fade-in-50 mt-4">
                                 <Textarea 
                                    placeholder={getDiaperNotePlaceholder()}
                                    value={diaperNote}
                                    onChange={(e) => setDiaperNote(e.target.value)}
                                    className="bg-background resize-none"
                                    rows={1}
                                 />
                                <Button className={cn("w-full", buttonClass)} variant="default" onClick={handleDiaperLog}>Enregistrer</Button>
                            </div>
                        )}
                    </div>
                )}
                {selectedActivity === 'feeding' && (
                    <div className="space-y-4 animate-in fade-in-50">
                        <Tabs value={feedType} onValueChange={(v) => setFeedType(v as FeedType)} className="w-full">
                             <TabsList className="grid w-full grid-cols-2 bg-muted">
                                <TabsTrigger value="bottle" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Biberon</TabsTrigger>
                                <TabsTrigger value="breastfeeding" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Allaitement</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        
                        {feedType === 'bottle' && (
                            <div className="space-y-4 animate-in fade-in-50">
                                <div>
                                    <Label htmlFor="feed-amount" className="text-xs text-muted-foreground">Quantité (ml)</Label>
                                    <div className="w-full overflow-x-auto no-scrollbar rounded-md h-14 flex items-center mask-gradient">
                                        <div className="flex w-max space-x-2 p-2 -m-2">
                                            {quantityOptions.map(q => (
                                                <Button 
                                                    key={q}
                                                    variant={feedAmount === q.toString() ? 'default' : 'outline'}
                                                    onClick={() => handleQuantityButtonClick(q)}
                                                    className={cn(
                                                        "h-10 w-14 flex-shrink-0 font-semibold transition-all duration-200 transform-gpu hover:scale-110 active:scale-95",
                                                        feedAmount === q.toString() ? "scale-110" : "scale-100"
                                                    )}
                                                >
                                                    {q}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-1/3 font-semibold" type="button">
                                                {feedAmount ? `${feedAmount} ml` : 'Manuel'}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-[280px] rounded-lg">
                                            <DialogHeader>
                                                <DialogTitle>Quantité manuelle</DialogTitle>
                                            </DialogHeader>
                                            <Input
                                                id="manual-feed-amount"
                                                type="number"
                                                placeholder="Entrer quantité (ml)"
                                                value={feedAmount}
                                                onChange={(e) => setFeedAmount(e.target.value)}
                                                className="text-center text-lg h-12 no-spinners"
                                            />
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button className="w-full">Valider</Button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <Textarea 
                                        id="feed-note"
                                        placeholder="Ajouter une note..."
                                        value={feedNote}
                                        onChange={(e) => setFeedNote(e.target.value)}
                                        className="bg-background resize-none flex-1"
                                        rows={1}
                                    />
                                </div>
                                <Button className={cn("w-full border-2 border-primary/50", buttonClass)} variant="default" onClick={handleFeedLog}>Enregistrer Biberon</Button>
                            </div>
                        )}

                        {feedType === 'breastfeeding' && (
                            <div className="space-y-4 animate-in fade-in-50">
                                <div className="grid grid-cols-2 gap-4">
                                    <Button 
                                        variant="outline"
                                        onClick={() => handleBreastfeeding('left')}
                                        className={cn(
                                            "h-20 text-base border-2",
                                            breastfeedingTimer?.side === 'left' ? "border-primary bg-primary/10" : "bg-background"
                                        )}
                                    >
                                        Sein Gauche
                                    </Button>
                                    <Button 
                                        variant="outline"
                                        onClick={() => handleBreastfeeding('right')}
                                        className={cn(
                                            "h-20 text-base border-2",
                                            breastfeedingTimer?.side === 'right' ? "border-primary bg-primary/10" : "bg-background"
                                        )}
                                    >
                                        Sein Droit
                                    </Button>
                                </div>
                                 {breastfeedingTimer && (
                                    <div className="p-4 mt-2 text-center rounded-lg bg-primary/20 animate-in fade-in-50">
                                        <p className="text-sm text-primary/80 dark:text-primary-foreground/80">
                                            Durée sein {breastfeedingTimer.side === 'left' ? 'gauche' : 'droit'}
                                        </p>
                                        <p className="text-2xl font-mono font-bold text-primary dark:text-primary-foreground">
                                            {formatElapsedTime(breastfeedingElapsedTime)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {selectedActivity === 'sleep' && (
                     <div className="space-y-4 animate-in fade-in-50">
                          <Tabs value={sleepMode} onValueChange={(v) => setSleepMode(v as SleepMode)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-muted">
                                <TabsTrigger value="timer" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Clock className="w-4 h-4 mr-1" />Chronomètre
                                </TabsTrigger>
                                <TabsTrigger value="manual" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Pencil className="w-4 h-4 mr-1" />Manuel
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        
                        {sleepMode === 'timer' && (
                            <div className="flex flex-col items-center gap-4 animate-in fade-in-50">
                                <Button className={cn("w-full border-2 border-primary/50", buttonClass)} variant="default" onClick={handleSleepTimer}>
                                    {sleepTimer ? `Arrêter` : `Commencer`}
                                </Button>
                                {sleepTimer && 
                                    <p className="mt-2 text-2xl font-mono font-bold text-center text-primary dark:text-primary-foreground bg-primary/20 rounded-md py-2 w-full">
                                        {formatElapsedTime(elapsedTime)}
                                    </p>
                                }
                            </div>
                        )}

                        {sleepMode === 'manual' && (
                            <div className="space-y-4 animate-in fade-in-50">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 items-end">
                                    <div className="space-y-1">
                                        <Label htmlFor="start-time">Début</Label>
                                        <Input id="start-time" type="time" value={sleepStartTime} onChange={(e) => setSleepStartTime(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="end-time">Fin</Label>
                                        <Input id="end-time" type="time" value={sleepEndTime} onChange={(e) => setSleepEndTime(e.target.value)} />
                                    </div>
                                    <div className="space-y-1 col-span-2 md:col-span-1">
                                        <Label htmlFor="sleep-note">Note</Label>
                                        <Input 
                                            id="sleep-note"
                                            placeholder="Agitée"
                                            value={sleepNote}
                                            onChange={(e) => setSleepNote(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button className={cn("w-full", buttonClass)} variant="outline" onClick={handleManualSleepLog}>Enregistrer le sommeil</Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
  }

  const data = useMemo(() => {
    const today = startOfDay(new Date());
    if (overviewPeriod === 'weekly') {
        const start = startOfWeek(today, { weekStartsOn: 1 });
        const end = endOfWeek(today, { weekStartsOn: 1 });
        const weekDays = eachDayOfInterval({ start, end });

        return weekDays.map(day => {
            const dayActivities = allActivities.filter(a => isSameDay(parseISO(a.date), day));
            return {
                name: format(day, 'E', { locale: fr }),
                diapers: dayActivities.filter(a => a.type === 'diapers').length,
                feeding: dayActivities.filter(a => a.type === 'feeding').reduce((sum, a) => sum + (a.details.amount || 0), 0),
                sleep: dayActivities.filter(a => a.type === 'sleep').reduce((sum, a) => sum + (a.details.duration || 0), 0),
            };
        });
    } else { // daily
        const hours = [0, 3, 6, 9, 12, 15, 18, 21];
        return hours.map(hour => {
            const hourActivities = allActivities.filter(a => {
                const activityDate = parseISO(a.date);
                if (!isSameDay(activityDate, today)) return false;

                const activityHour = parseInt(a.details.time.split(':')[0]);
                return activityHour >= hour && activityHour < hour + 3;
            });
            return {
                name: `${hour}h`,
                diapers: hourActivities.filter(a => a.type === 'diapers').length,
                feeding: hourActivities.filter(a => a.type === 'feeding').reduce((sum, a) => sum + (a.details.amount || 0), 0),
                sleep: hourActivities.filter(a => a.type === 'sleep').reduce((sum, a) => sum + (a.details.duration || 0), 0),
            };
        });
    }
  }, [allActivities, overviewPeriod]);
  
  const recentActivitiesForDisplay = useMemo(() => {
    return recentActivities.map(activity => {
        const Icon = activity.type === 'diapers' ? Droplets : activity.type === 'feeding' ? GlassWater : BedDouble;
        let title = '';
        let description = '';

        switch(activity.type) {
            case 'diapers':
                title = 'Changement de couche';
                let diaperTypeText = '';
                switch(activity.details.diaperType) {
                    case 'wet': diaperTypeText = 'Pipi'; break;
                    case 'dirty': diaperTypeText = 'Caca'; break;
                    case 'both': diaperTypeText = 'Pipi + Caca'; break;
                    default: diaperTypeText = activity.details.diaperType || ''; break;
                }
                description = `Type: ${diaperTypeText}`;
                if (activity.details.note) description += ` - ${activity.details.note}`;
                break;
            case 'feeding':
                if (activity.details.amount) {
                    title = `Biberon`;
                    description = `Quantité: ${activity.details.amount}ml`;
                } else {
                    title = `Allaitement`;
                    description = `Durée: ${activity.details.duration?.toFixed(0)} min`;
                }
                if (activity.details.note) description += ` - ${activity.details.note}`;
                break;
            case 'sleep':
                title = 'Sommeil';
                const duration = activity.details.duration || 0;
                const hours = Math.floor(duration);
                const minutes = Math.round((duration - hours) * 60);
                description = `Durée: ${hours}h ${minutes}m`;
                if (activity.details.note) description += ` - ${activity.details.note}`;
                break;
        }
        return { ...activity, display: { Icon, title, description }};
    });
  }, [recentActivities]);

  const summaryStats = useMemo(() => {
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);

    const todayActivities = allActivities.filter(a => isSameDay(parseISO(a.date), today));
    const yesterdayActivities = allActivities.filter(a => isSameDay(parseISO(a.date), yesterday));

    const getTotals = (activities: ActivityEvent[]) => ({
        diapers: activities.filter(a => a.type === 'diapers').length,
        feeding: activities.filter(a => a.type === 'feeding').reduce((sum, a) => sum + (a.details.amount || 0), 0),
        sleep: activities.filter(a => a.type === 'sleep').reduce((sum, a) => sum + (a.details.duration || 0), 0),
    });

    const todayTotals = getTotals(todayActivities);
    const yesterdayTotals = getTotals(yesterdayActivities);
    return {
        diapers: { value: todayTotals.diapers, change: yesterdayTotals.diapers ? ((todayTotals.diapers - yesterdayTotals.diapers) / yesterdayTotals.diapers) * 100 : 0 },
        feeding: { value: todayTotals.feeding, change: yesterdayTotals.feeding ? ((todayTotals.feeding - yesterdayTotals.feeding) / yesterdayTotals.feeding) * 100 : 0 },
        sleep: { value: todayTotals.sleep, change: yesterdayTotals.sleep ? ((todayTotals.sleep - yesterdayTotals.sleep) / (yesterdayTotals.sleep || 1)) * 100 : 0 },
    };
  }, [allActivities]);

  const isSignificantDrop = useMemo(() => {
    return (
        summaryStats.diapers.change < -dailyDropThreshold ||
        summaryStats.feeding.change < -dailyDropThreshold ||
        summaryStats.sleep.change < -dailyDropThreshold
    );
  }, [summaryStats, dailyDropThreshold]);
  
  return (
    <div className={cn("space-y-6", className)}>
      <div className="relative flex justify-center items-center p-3 rounded-lg bg-card border">
          <h1 className="text-2xl font-bold text-center">Suivi Quotidien</h1>
          <div className="absolute right-3">
            <Sheet open={isReminderSheetOpen} onOpenChange={setIsReminderSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent className="flex flex-col p-0 rounded-l-2xl">
                    <SheetHeader className="p-6">
                        <SheetTitle>Configurer les rappels</SheetTitle>
                        <SheetDescription>
                            Gérez les notifications pour ne rien oublier.
                        </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="flex-grow p-6 pt-0">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between rounded-lg border p-3 bg-card">
                              <div className="flex items-center gap-3">
                                <Bell className="h-5 w-5" />
                                <Label htmlFor="notifications-enabled" className="text-base">Activer les rappels</Label>
                              </div>
                              <Switch id="notifications-enabled" />
                          </div>
                            <Separator />
                            <div className="space-y-4">
                                <h4 className="font-semibold text-muted-foreground px-1">Rappels par activité</h4>
                                <div className="space-y-2 rounded-lg border p-3 bg-card">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="diapers-notif">Couches</Label>
                                        <Switch id="diapers-notif" />
                                    </div>
                                    <Select>
                                        <SelectTrigger><SelectValue placeholder="Toutes les 3 heures" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Toutes les heures</SelectItem>
                                            <SelectItem value="2">Toutes les 2 heures</SelectItem>
                                            <SelectItem value="3">Toutes les 3 heures</SelectItem>
                                            <SelectItem value="4">Toutes les 4 heures</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 rounded-lg border p-3 bg-card">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="feeding-notif">Alimentation</Label>
                                        <Switch id="feeding-notif" />
                                    </div>
                                    <Select>
                                        <SelectTrigger><SelectValue placeholder="Toutes les 3 heures" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="2">Toutes les 2 heures</SelectItem>
                                            <SelectItem value="3">Toutes les 3 heures</SelectItem>
                                            <SelectItem value="4">Toutes les 4 heures</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 rounded-lg border p-3 bg-card">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="sleep-notif">Sommeil</Label>
                                        <Switch id="sleep-notif" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input id="sleep-time" type="time" defaultValue="20:00" className="w-full" />
                                        <Button variant="outline" size="icon" onClick={() => setIsSleepReminderRecurrent(!isSleepReminderRecurrent)}>
                                            {isSleepReminderRecurrent ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
                                            <span className="sr-only">Rendre récurrent</span>
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2 rounded-lg border p-3 bg-card">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="treatments-notif">Traitements</Label>
                                        <Switch id="treatments-notif" />
                                    </div>
                                    <p className="text-xs text-muted-foreground pt-1">Les rappels de traitement sont basés sur la fréquence que vous avez définie pour chaque médicament.</p>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                    <SheetFooter className="p-4 border-t bg-background mt-auto">
                        <div className="flex items-center justify-center gap-2 w-full">
                          <Baby className="h-6 w-6 text-primary" />
                          <span className="text-lg font-bold">BabyList</span>
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
          </div>
        </div>
      
        <div className="grid grid-cols-3 gap-2">
            <button
                className={cn(
                    "cursor-pointer hover:bg-muted/80 transition-all duration-300 ease-in-out aspect-square flex flex-col items-center justify-center p-2 gap-y-4 rounded-lg",
                    "hover:scale-105 active:scale-100",
                    selectedActivity === 'diapers' ? 'bg-muted shadow-inner scale-105' : 'bg-card'
                )}
                onClick={() => toggleActivity('diapers')}
            >
                <Droplets className={cn("w-14 h-14 text-primary transition-transform duration-300", selectedActivity === 'diapers' && "scale-110")} />
                <span className="text-sm font-medium text-center">Couches</span>
            </button>
            <button
                className={cn(
                    "cursor-pointer hover:bg-muted/80 transition-all duration-300 ease-in-out aspect-square flex flex-col items-center justify-center p-2 gap-y-4 rounded-lg",
                    "hover:scale-105 active:scale-100",
                    selectedActivity === 'feeding' ? 'bg-muted shadow-inner scale-105' : 'bg-card'
                )}
                onClick={() => toggleActivity('feeding')}
            >
                <GlassWater className={cn("w-14 h-14 text-primary transition-transform duration-300", selectedActivity === 'feeding' && "scale-110")} />
                <span className="text-sm font-medium text-center">Alimentation</span>
            </button>
            <button
                className={cn(
                    "cursor-pointer hover:bg-muted/80 transition-all duration-300 ease-in-out aspect-square flex flex-col items-center justify-center p-2 gap-y-4 rounded-lg",
                    "hover:scale-105 active:scale-100",
                    selectedActivity === 'sleep' ? 'bg-muted shadow-inner scale-105' : 'bg-card'
                )}
                onClick={() => toggleActivity('sleep')}
            >
                <BedDouble className={cn("w-14 h-14 text-primary transition-transform duration-300", selectedActivity === 'sleep' && "scale-110")} />
                <span className="text-sm font-medium text-center">Sommeil</span>
            </button>
        </div>

      {renderActivityControls()}

      <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b p-3">
              <div className="flex items-center gap-3">
                <Pill className="w-6 h-6 text-primary" />
                <CardTitle className="text-base">Suivi des Traitements</CardTitle>
              </div>
              <Dialog open={isTreatmentFormOpen} onOpenChange={setIsTreatmentFormOpen}>
                <DialogTrigger asChild>
                    <Button size="icon" variant="outline" onClick={() => openTreatmentForm()}>
                        <Plus className="w-4 h-4" />
                        <span className="sr-only">Ajouter un traitement</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[90vw] sm:max-w-[425px] rounded-lg">
                  <DialogHeader>
                    <DialogTitle>{editingTreatment ? "Modifier le traitement" : "Ajouter un traitement"}</DialogTitle>
                    <DialogDescription>
                      Remplissez les détails concernant le médicament et le suivi.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSaveTreatment} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="medication">Médicament</Label>
                      <Input id="medication" value={medication} onChange={(e) => setMedication(e.target.value)} placeholder="ex: Paracétamol" required/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dosage">Dosage</Label>
                        <Input id="dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="ex: 1 pipette" required/>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="frequency">Fréquence</Label>
                        <Input id="frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="ex: 2 fois/jour" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date de début</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !treatmentStartDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIconLucide className="mr-2 h-4 w-4" />
                              {treatmentStartDate ? format(treatmentStartDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={treatmentStartDate}
                              onSelect={setTreatmentStartDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Date de fin (optionnel)</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !treatmentEndDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIconLucide className="mr-2 h-4 w-4" />
                              {treatmentEndDate ? format(treatmentEndDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={treatmentEndDate}
                              onSelect={setTreatmentEndDate}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="treatment-notes">Notes</Label>
                      <Input id="treatment-notes" value={treatmentNotes} onChange={(e) => setTreatmentNotes(e.target.value)} placeholder="ex: Après le repas" />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-2">
                        <Switch id="treatment-active" checked={treatmentIsActive} onCheckedChange={setTreatmentIsActive} />
                        <Label htmlFor="treatment-active">Traitement actif</Label>              </div>
                      <Button type="submit">Enregistrer</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
          </CardHeader>
          <CardContent className="p-3">
            <ScrollArea className="h-[100px]">
                {treatments.length > 0 ? (
                    <div className="space-y-2">
                        {sortedTreatments.map(treatment => (
                          <div key={treatment.id} className={cn("flex items-center gap-4 text-left p-2 rounded-lg transition-colors border", !treatment.active && "opacity-50", "bg-muted/50 hover:bg-muted border-primary/50")}>
                            <button className="flex-1 text-left" onClick={() => handleOpenTreatmentDetail(treatment)}>
                              <div>
                                  <p className="font-semibold">{treatment.medication}</p>
                                  <p className="text-xs text-muted-foreground">{treatment.dosage} - {treatment.frequency}</p>
                              </div>
                            </button>
                            <Button 
                                size="icon" 
                                variant={wasDoseTakenToday(treatment) ? 'default' : 'outline'} 
                                className="h-9 w-9 rounded-full" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  logDose(treatment.id);
                                }}
                                disabled={wasDoseTakenToday(treatment) || !treatment.active}
                              >
                                {wasDoseTakenToday(treatment) ? <CheckCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            </Button>
                          </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-muted-foreground">Aucun traitement en cours.</p>
                    </div>
                )}
            </ScrollArea>
          </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-start justify-between p-3 border-b">
            <div className="flex-1 pr-2">
              <div className="flex items-center gap-2">
                  <LineChartIcon className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-base">{overviewPeriod === 'daily' ? 'Aperçu de la journée' : 'Aperçu de la semaine'}</CardTitle>
                    <CardDescription className="text-xs">{chartConfig[visibleChart].label}</CardDescription>
                  </div>
              </div>
            </div>
             <div className="flex items-center gap-2">
                <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg">
                    <Button variant={overviewPeriod === 'daily' ? 'default' : 'ghost'} size="sm" onClick={() => setOverviewPeriod('daily')} className="h-7 px-2 text-xs">24h</Button>
                    <Button variant={overviewPeriod === 'weekly' ? 'default' : 'ghost'} size="sm" onClick={() => setOverviewPeriod('weekly')} className="h-7 px-2 text-xs">7j</Button>
                </div>
                {isSignificantDrop && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="sr-only">Baisse significative détectée</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Baisse significative par rapport à hier.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                )}
                <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setIsChartExpanded(!isChartExpanded)}>
                    {isChartExpanded ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </Button>
            </div>
        </CardHeader>
        <CardContent className="p-3 pt-2">
            <Carousel setApi={setCarouselApi} className="w-full">
                <CarouselContent>
                    {(Object.keys(chartConfig) as ChartDataKey[]).map((key) => (
                        <CarouselItem key={key}>
                            <div className={cn("relative transition-all duration-300", isChartExpanded ? "h-[250px]" : "h-[150px]")}>
                                <ChartContainer config={chartConfig} className="h-full w-full">
                                    <LineChart accessibilityLayer data={data} margin={{ top: 5, right: 5, left: -20, bottom: isChartExpanded ? 5 : -15 }}>
                                        <CartesianGrid vertical={false} />
                                        {isChartExpanded && <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} fontSize={12} />}
                                        {isChartExpanded && <YAxis tickLine={false} axisLine={false} fontSize={12} />}
                                        <ChartTooltip cursor={true} content={<ChartTooltipContent indicator="dot" />} />
                                        <Line type="monotone" dataKey={key} stroke={`var(--color-${key})`} strokeWidth={2} dot={false} name={chartConfig[key].label} />
                                    </LineChart>
                                </ChartContainer>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
             <div className="flex justify-center gap-4 mt-2">
                {Object.keys(chartConfig).map(key => (
                    <div key={key} className={cn("w-2 h-2 rounded-full transition-colors", visibleChart === key ? 'bg-primary' : 'bg-muted')}/>
                ))}
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b p-3">
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            <CardTitle className="text-base">Activités Récentes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          {recentActivitiesForDisplay.length > 0 ? (
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-4">
                {recentActivitiesForDisplay.map((activity, index) => (
                  <div key={activity.id} className="flex items-center gap-4 animate-in fade-in-0 slide-in-from-top-5" style={{animationDelay: `${index * 100}ms`, animationFillMode: 'both'}}>
                    <div className="p-2 rounded-full bg-muted">
                        <activity.display.Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold">{activity.display.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.display.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground whitespace-nowrap">{activity.details.time}</p>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground opacity-100" onClick={() => handleDeleteActivity(activity.id)}>
                            <Trash2 className="w-4 h-4" />
                            <span className="sr-only">Supprimer</span>
                        </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-center text-muted-foreground py-4">Aucune activité enregistrée pour le moment.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isTreatmentDetailOpen} onOpenChange={setIsTreatmentDetailOpen}>
          <DialogContent className="max-w-[90vw] sm:max-w-md rounded-lg">
              {selectedTreatment && (
                  <>
                      <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/20">
                                <Pill className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg">{selectedTreatment.medication}</DialogTitle>
                                <DialogDescription>
                                    {selectedTreatment.dosage} - {selectedTreatment.frequency}
                                </DialogDescription>
                            </div>
                        </div>
                      </DialogHeader>
                      <div className="space-y-4 py-4 text-sm">
                        <div className="grid grid-cols-2 gap-4 text-muted-foreground">
                            <div className="flex items-center gap-2">
                               <CalendarDays className="w-4 h-4"/>
                               <span>Début: {format(selectedTreatment.startDate, 'dd/MM/yy', {locale: fr})}</span>
                            </div>
                             {selectedTreatment.endDate && (
                                <div className="flex items-center gap-2">
                                   <CalendarDays className="w-4 h-4"/>
                                   <span>Fin: {format(selectedTreatment.endDate, 'dd/MM/yy', {locale: fr})}</span>
                                </div>
                             )}
                        </div>
                        {selectedTreatment.notes && 
                          <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                              <StickyNote className="w-4 h-4 mt-0.5 text-muted-foreground"/>
                              <p className="italic text-muted-foreground flex-1">{selectedTreatment.notes}</p>
                          </div>
                        }
                        
                        <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2"><List className="w-4 h-4"/> Historique des prises</h4>
                            {selectedTreatment.history.length > 0 ? (
                                <ScrollArea className="h-28 pr-4 border rounded-md p-3 bg-muted/50 mt-2">
                                  <ul className="space-y-2 text-xs">
                                    {[...selectedTreatment.history].reverse().map((h, i) => (
                                      <li key={i} className="flex justify-between">
                                        <span>{format(new Date(h.date), 'eeee d MMMM', {locale: fr})}</span> 
                                        <span className="font-mono text-muted-foreground">{h.time}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </ScrollArea>
                            ) : (
                                <p className="text-muted-foreground text-center text-sm py-4">Aucune prise enregistrée.</p>
                            )}
                        </div>
                      </div>
                      <DialogFooter className="grid grid-cols-2 gap-2 pt-4 border-t">
                        <Button variant="outline" className="w-full border-primary/80 border-2" onClick={() => openTreatmentForm(selectedTreatment)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                             <Button variant="destructive" className="w-full">
                                <Trash2 className="h-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-lg">
                            <DialogHeader>
                                <DialogTitle>Confirmer la suppression</DialogTitle>
                                <DialogDescription>
                                    Êtes-vous sûr de vouloir supprimer le traitement "{selectedTreatment.medication}" ? Cette action est irréversible.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Annuler</Button>
                                </DialogClose>
                                <Button variant="destructive" onClick={() => handleDeleteTreatment(selectedTreatment.id)}>Supprimer</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </DialogFooter>
                  </>
              )}
          </DialogContent>
      </Dialog>
    </div>
  );
}



    
