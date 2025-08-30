
"use client";
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, TooltipProps } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { GlassWater, Droplets, BedDouble, Download, Calendar as CalendarIcon, TrendingUp, TrendingDown, Minus, AlertTriangle, Maximize, Minimize, History, Pill, Plus, Settings, BarChart2, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { CheckedState } from "@radix-ui/react-checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format, parseISO, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval, subWeeks, add, subDays, startOfDay, differenceInDays, parse, startOfMonth, endOfMonth, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { ActivityEvent, DailyData, WeeklyData, Treatment, UserSettings } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

type Period = 'daily' | 'weekly';
type DownloadableData = "diapers" | "feeding" | "sleep" | "treatments";
type ChartDataKey = keyof typeof chartConfig;
type ManualFeedType = 'bottle' | 'breastfeeding';

const chartConfig = {
  diapers: { label: "Couches", color: "hsl(var(--chart-1))", icon: Droplets },
  feeding: { label: "Alimentation", color: "hsl(var(--chart-2))", icon: GlassWater },
  sleep: { label: "Sommeil", color: "hsl(var(--chart-3))", icon: BedDouble },
} satisfies ChartConfig

const StatCard = ({ title, value, change, period, unit, onClick, isSelected, onAdd, significantDropThreshold }: { title: string, value: number, change: number, period: string, unit: string, onClick?: () => void, isSelected?: boolean, onAdd: () => void, significantDropThreshold: number }) => {
    const TrendIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
    const changeColor = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground';
    const changeText = change !== 0 ? `${change > 0 ? '+' : ''}${change.toFixed(1)}% vs ${period}` : `Aucun changement`;
    const isSignificantDrop = change < -significantDropThreshold;

    const cardContent = (
      <div className="flex flex-col h-full justify-between">
          <div className="flex items-start justify-between gap-2">
              <button onClick={onClick} className="flex-grow text-left">
                <span className="text-xs font-medium text-muted-foreground">{title}</span>
                <p className="font-bold text-base text-foreground">{value.toFixed(0)}<span className="text-xs text-muted-foreground font-normal ml-1">{unit}</span></p>
              </button>
               <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onAdd}>
                    <Plus className="w-4 h-4" />
                    <span className="sr-only">Ajouter une entrée</span>
                </Button>
          </div>
          <button onClick={onClick} className="flex-grow text-left w-full">
            <div className="flex items-center justify-between text-xs mt-1">
                <div className={cn("flex items-center", changeColor)}>
                    <TrendIcon className="h-3 w-3 mr-1" />
                    <span>{changeText}</span>
                </div>
                {isSignificantDrop && (
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild>
                             <span className="cursor-help"><AlertTriangle className="h-4 w-4 text-destructive" /></span>
                          </TooltipTrigger>
                          <TooltipContent>
                              <p>Baisse significative</p>
                          </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
                )}
            </div>
          </button>
      </div>
  );

    return (
        <Card className={cn("flex-1 p-2", isSelected && "ring-2 ring-primary bg-muted/50")}>
            {cardContent}
        </Card>
    );
};


interface ChartsViewProps {
    childId: string;
    onModalToggle: (isOpen: boolean) => void;
    className?: string;
    allActivities: ActivityEvent[];
    treatments: Treatment[];
    addActivity: (activity: Omit<ActivityEvent, 'id'>, date?: Date) => Promise<void>;
    settings: UserSettings | null;
    onSettingsChange: (settings: Partial<UserSettings>) => void;
}

export default function ChartsView({ childId, onModalToggle, className, allActivities, treatments, addActivity, settings, onSettingsChange }: ChartsViewProps) {
  const [period, setPeriod] = useState<Period>('daily');
  const [periodCarouselApi, setPeriodCarouselApi] = useState<CarouselApi>();

  const [dataToDownload, setDataToDownload] = useState({
    diapers: true,
    feeding: true,
    sleep: true,
    treatments: true,
  });
  const [downloadPeriod, setDownloadPeriod] = useState('7d');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [visibleChart, setVisibleChart] = useState<ChartDataKey>('diapers');
  const [selectedDayData, setSelectedDayData] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [manualEntryType, setManualEntryType] = useState<ChartDataKey | null>(null);
  const [manualEntryDate, setManualEntryDate] = useState<Date | undefined>(undefined);
  const [manualEntryTime, setManualEntryTime] = useState('');
  const [manualEntryNote, setManualEntryNote] = useState('');
  const [diaperType, setDiaperType] = useState<'wet' | 'dirty' | 'both'>('wet');
  const [feedAmount, setFeedAmount] = useState('');
  const [sleepDuration, setSleepDuration] = useState('');
  const [manualFeedType, setManualFeedType] = useState<ManualFeedType>('bottle');
  const [breastfeedingDuration, setBreastfeedingDuration] = useState('');
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);

  const dailyDropThreshold = settings?.charts?.dailyDropThreshold ?? 15;
  const weeklyDropThreshold = settings?.charts?.weeklyDropThreshold ?? 10;
  
  const setDailyDropThreshold = (value: number) => onSettingsChange({ charts: { ...settings?.charts, dailyDropThreshold: value } });
  const setWeeklyDropThreshold = (value: number) => onSettingsChange({ charts: { ...settings?.charts, weeklyDropThreshold: value } });


  const { toast } = useToast();

  useEffect(() => {
    // Set initial date on client to avoid hydration mismatch
    setManualEntryDate(new Date());
    setManualEntryTime(format(new Date(), 'HH:mm'));
  }, []);

  useEffect(() => {
    onModalToggle(isThresholdModalOpen || isHistoryOpen || isDetailModalOpen || isManualEntryOpen);
  }, [isThresholdModalOpen, isHistoryOpen, isDetailModalOpen, isManualEntryOpen, onModalToggle]);

  const sortedActivities = useMemo(() => {
    return [...allActivities].sort((a, b) => parseISO(`${b.date}T${b.details.time || '00:00'}`).getTime() - parseISO(`${a.date}T${a.details.time || '00:00'}`).getTime());
  }, [allActivities]);
  
  useEffect(() => {
    if (!periodCarouselApi) return;
    const onSelect = () => {
      const newPeriod = periodCarouselApi.selectedScrollSnap() === 0 ? 'daily' : 'weekly';
      if (newPeriod !== period) {
        setPeriod(newPeriod);
      }
    };
    periodCarouselApi.on('select', onSelect);
    return () => periodCarouselApi.off('select', onSelect);
  }, [periodCarouselApi, period]);

  const handlePeriodChange = useCallback((newPeriod: Period) => {
    if (newPeriod !== period) {
        setPeriod(newPeriod);
        const newIndex = newPeriod === 'daily' ? 0 : 1;
        periodCarouselApi?.scrollTo(newIndex);
    }
  }, [period, periodCarouselApi]);
  
  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const payload = data.activePayload[0].payload;
      const today = startOfDay(new Date());

      if (period === 'weekly') {
          const dayIndex = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].indexOf(payload.name);
          const start = startOfWeek(today, { weekStartsOn: 1 });
          const clickedDate = add(start, { days: dayIndex });

          const activitiesForDay = allActivities.filter(a => isSameDay(parseISO(a.date), clickedDate));
          setSelectedDayData({ date: format(clickedDate, 'yyyy-MM-dd'), activities: activitiesForDay });
          setIsDetailModalOpen(true);
      } else { // daily
          const hour = parseInt(payload.name.replace('h', ''));
          const activitiesForHour = allActivities.filter(a => {
              const activityDate = parseISO(a.date);
              if (!isSameDay(activityDate, today)) return false;
              const activityHour = parseInt(a.details.time.split(':')[0]);
              return activityHour >= hour && activityHour < hour + 3;
          });
          
          setSelectedDayData({ name: payload.name, activities: activitiesForHour });
          setIsDetailModalOpen(true);
      }
    }
  };
  
   const dailyData = useMemo(() => {
    const today = startOfDay(new Date());
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
  }, [allActivities]);

  const weeklyData = useMemo(() => {
    const today = startOfDay(new Date());
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
  }, [allActivities]);


  const dailySummaryStats = useMemo(() => {
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
        diapers: { value: todayTotals.diapers, change: yesterdayTotals.diapers ? ((todayTotals.diapers - yesterdayTotals.diapers) / yesterdayTotals.diapers) * 100 : 0, unit: '' },
        feeding: { value: todayTotals.feeding, change: yesterdayTotals.feeding ? ((todayTotals.feeding - yesterdayTotals.feeding) / yesterdayTotals.feeding) * 100 : 0, unit: 'ml' },
        sleep: { value: todayTotals.sleep, change: yesterdayTotals.sleep ? ((todayTotals.sleep - yesterdayTotals.sleep) / yesterdayTotals.sleep) * 100 : 0, unit: 'h' },
    };
  }, [allActivities]);

  const weeklySummaryStats = useMemo(() => {
    const today = startOfDay(new Date());
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const lastWeekStart = subWeeks(thisWeekStart, 1);
    const lastWeekEnd = endOfWeek(lastWeekStart, { weekStartsOn: 1 });
    
    const thisWeekActivities = allActivities.filter(a => isWithinInterval(parseISO(a.date), { start: thisWeekStart, end: today }));
    const lastWeekActivities = allActivities.filter(a => isWithinInterval(parseISO(a.date), { start: lastWeekStart, end: lastWeekEnd }));
    
    const thisWeekDays = differenceInDays(today, thisWeekStart) + 1;

    const getTotals = (activities: ActivityEvent[]) => ({
        diapers: activities.filter(a => a.type === 'diapers').length,
        feeding: activities.filter(a => a.type === 'feeding').reduce((sum, a) => sum + (a.details.amount || 0), 0),
        sleep: activities.filter(a => a.type === 'sleep').reduce((sum, a) => sum + (a.details.duration || 0), 0),
    });

    const thisWeekAvg = {
        diapers: getTotals(thisWeekActivities).diapers / thisWeekDays,
        feeding: getTotals(thisWeekActivities).feeding / thisWeekDays,
        sleep: getTotals(thisWeekActivities).sleep / thisWeekDays,
    };
    const lastWeekAvg = {
        diapers: getTotals(lastWeekActivities).diapers / 7,
        feeding: getTotals(lastWeekActivities).feeding / 7,
        sleep: getTotals(lastWeekActivities).sleep / 7,
    };

    return {
        diapers: { value: thisWeekAvg.diapers, change: lastWeekAvg.diapers ? ((thisWeekAvg.diapers - lastWeekAvg.diapers) / lastWeekAvg.diapers) * 100 : 0, unit: '/jour' },
        feeding: { value: thisWeekAvg.feeding, change: lastWeekAvg.feeding ? ((thisWeekAvg.feeding - lastWeekAvg.feeding) / lastWeekAvg.feeding) * 100 : 0, unit: 'ml/jour' },
        sleep: { value: thisWeekAvg.sleep, change: lastWeekAvg.sleep ? ((thisWeekAvg.sleep - lastWeekAvg.sleep) / lastWeekAvg.sleep) * 100 : 0, unit: 'h/jour' },
    };
  }, [allActivities]);


  const handleDownload = () => {
    let activityDataToExport: ActivityEvent[] = [];
    const now = new Date();
    switch (downloadPeriod) {
        case '7d':
            activityDataToExport = allActivities.filter(a => isAfter(parseISO(a.date), subDays(now, 7)));
            break;
        case '30d':
            activityDataToExport = allActivities.filter(a => isAfter(parseISO(a.date), subDays(now, 30)));
            break;
        case 'this_month':
            activityDataToExport = allActivities.filter(a => isWithinInterval(parseISO(a.date), { start: startOfMonth(now), end: endOfMonth(now) }));
            break;
        case 'last_month':
            const lastMonth = subDays(now, 30);
            activityDataToExport = allActivities.filter(a => isWithinInterval(parseISO(a.date), { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }));
            break;
        case 'all':
        default:
            activityDataToExport = allActivities;
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
                        if (item.details.amount) {
                            details = `Quantité: ${item.details.amount || 0}ml`;
                        } else {
                            details = `Durée: ${item.details.duration || 0}min`;
                        }
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
    link.setAttribute("download", `donnees_${childId}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
        title: "Téléchargement terminé",
        description: "Vos données ont été exportées avec succès.",
        duration: 1200
    });
  };
  
   const renderActivityDetails = (activity: ActivityEvent) => {
    const details = [];
    if (activity.details.time) {
        details.push(`Heure: ${activity.details.time}`);
    }
    if (activity.type === 'diapers' && activity.details.diaperType) {
        let typeText = '';
        switch(activity.details.diaperType) {
            case 'wet': typeText = 'Pipi'; break;
            case 'dirty': typeText = 'Caca'; break;
            case 'both': typeText = 'Pipi + Caca'; break;
        }
        details.push(`Type: ${typeText}`);
    }
    if (activity.type === 'feeding' && activity.details.amount) {
        details.push(`Quantité: ${activity.details.amount}ml`);
    }
     if (activity.type === 'feeding' && activity.details.duration) { // For breastfeeding
        details.push(`Durée: ${activity.details.duration} min`);
    }
    if (activity.type === 'sleep' && activity.details.duration) {
        details.push(`Durée: ${activity.details.duration.toFixed(1)}h`);
    }
    
    return (
        <>
            <p className="text-sm text-muted-foreground">{details.join(' - ')}</p>
            {activity.details.note && <p className="text-xs text-muted-foreground italic pt-1">Note: {activity.details.note}</p>}
        </>
    );
  }

  const handleOpenManualEntry = (type: ChartDataKey) => {
    setManualEntryType(type);
    setManualEntryDate(new Date());
    setManualEntryTime(format(new Date(), 'HH:mm'));
    setManualEntryNote('');
    setDiaperType('wet');
    setFeedAmount('');
    setSleepDuration('');
    setManualFeedType('bottle');
    setBreastfeedingDuration('');
    setIsManualEntryOpen(true);
  };

  const handleSaveManualEntry = async () => {
    if (!manualEntryType || !manualEntryDate || !manualEntryTime) {
      toast({ variant: "destructive", description: "Veuillez remplir tous les champs requis.", duration: 1200 });
      return;
    }

    let details: any = { time: manualEntryTime, note: manualEntryNote };
    let toastTitle = '';

    switch (manualEntryType) {
      case 'diapers':
        details.diaperType = diaperType;
        toastTitle = 'Couche enregistrée !';
        break;
      case 'feeding':
        if (manualFeedType === 'bottle') {
          if (!feedAmount) {
            toast({ variant: "destructive", description: "Veuillez entrer une quantité.", duration: 1200 });
            return;
          }
          details.amount = Number(feedAmount);
          delete details.duration;
          toastTitle = 'Biberon enregistré !';
        } else {
          if (!breastfeedingDuration) {
            toast({ variant: "destructive", description: "Veuillez entrer une durée.", duration: 1200 });
            return;
          }
          details.duration = Number(breastfeedingDuration);
          delete details.amount;
          toastTitle = 'Allaitement enregistré !';
        }
        break;
      case 'sleep':
        if (!sleepDuration) {
          toast({ variant: "destructive", description: "Veuillez entrer une durée.", duration: 1200 });
          return;
        }
        details.duration = Number(sleepDuration);
        toastTitle = 'Dodo enregistré !';
        break;
    }
    
    await addActivity({
        type: manualEntryType,
        date: format(manualEntryDate, 'yyyy-MM-dd'),
        details
    }, manualEntryDate);

    toast({ title: toastTitle, duration: 1200 });
    setIsManualEntryOpen(false);
  };

  const getThresholdColor = (value: number) => {
    if (value >= 15) return 'hsl(0, 72%, 51%)'; // Red for 15%
    const percentage = value / 15;
    // From green (120) to red (0)
    const hue = (1 - percentage) * 120;
    return `hsl(${hue}, 100%, 45%)`;
  };

  const renderView = (currentPeriod: Period) => {
    const summaryStats = currentPeriod === 'daily' ? dailySummaryStats : weeklySummaryStats;
    const chartData = currentPeriod === 'daily' ? dailyData : weeklyData;
    const comparisonText = currentPeriod === 'daily' ? 'hier' : 'sem. dernière';
    const significantDropThreshold = currentPeriod === 'daily' ? dailyDropThreshold : weeklyDropThreshold;

    return (
        <div className="space-y-4">
            <Card className="border-primary/50">
                <CardHeader className="p-3 pb-2 flex-row items-center justify-between border-b">
                    <CardTitle className="text-sm">Résumé {currentPeriod === 'daily' ? 'du jour' : 'de la semaine'}</CardTitle>
                    <div className="flex items-center gap-2">
                        <Dialog open={isThresholdModalOpen} onOpenChange={setIsThresholdModalOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-8 h-8">
                                    <AlertTriangle className="w-4 h-4 text-destructive/80" />
                                    <span className="sr-only">Régler le seuil d'alerte</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle>Seuils d'Alerte de Baisse</DialogTitle>
                                    <DialogDescription>
                                        Définissez quand une alerte de baisse significative doit être affichée pour les comparaisons journalières et hebdomadaires.
                                    </DialogDescription>
                                </DialogHeader>
                                <Tabs defaultValue="daily" className="w-full pt-4">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="daily">Journalier</TabsTrigger>
                                        <TabsTrigger value="weekly">Hebdomadaire</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="daily" className="mt-4">
                                        <div className="p-4 rounded-lg bg-muted/50 border space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="daily-threshold" className="flex items-center gap-2">
                                                    <CalendarIcon className="w-4 h-4" />
                                                    <span>Baisse vs. la veille</span>
                                                </Label>
                                                <span
                                                    className="font-bold text-lg"
                                                    style={{ color: getThresholdColor(dailyDropThreshold) }}
                                                >-{dailyDropThreshold}%</span>
                                            </div>
                                            <Slider
                                                id="daily-threshold"
                                                min={5}
                                                max={50}
                                                step={1}
                                                value={[dailyDropThreshold]}
                                                onValueChange={(value) => setDailyDropThreshold(value[0])}
                                            />
                                            <p className="text-xs text-muted-foreground text-center">
                                                Alerte si la valeur du jour est inférieure de <span className="font-bold">{dailyDropThreshold}%</span> à celle de la veille.
                                            </p>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="weekly" className="mt-4">
                                        <div className="p-4 rounded-lg bg-muted/50 border space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="weekly-threshold" className="flex items-center gap-2">
                                                    <CalendarDays className="w-4 h-4" />
                                                    <span>Baisse vs. sem. dernière</span>
                                                </Label>
                                                <span
                                                    className="font-bold text-lg"
                                                    style={{ color: getThresholdColor(weeklyDropThreshold) }}
                                                >-{weeklyDropThreshold}%</span>
                                            </div>
                                            <Slider
                                                id="weekly-threshold"
                                                min={5}
                                                max={50}
                                                step={1}
                                                value={[weeklyDropThreshold]}
                                                onValueChange={(value) => setWeeklyDropThreshold(value[0])}
                                            />
                                            <p className="text-xs text-muted-foreground text-center">
                                                Alerte si la moyenne de la semaine est inférieure de <span className="font-bold">{weeklyDropThreshold}%</span> à celle de la semaine précédente.
                                            </p>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                                <DialogFooter className="mt-4">
                                    <Button onClick={() => setIsThresholdModalOpen(false)} className="w-full">Terminé</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-8 h-8">
                                    <History className="w-4 h-4" />
                                    <span className="sr-only">Voir l'historique complet</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[90vw] sm:max-w-lg rounded-lg">
                                <DialogHeader>
                                    <DialogTitle>Historique complet</DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="h-[60vh] pr-4 -mx-6 px-6 mt-4">
                                    <div className="space-y-4">
                                        {sortedActivities.map((activity, index) => {
                                            const Icon = activity.type === 'diapers' ? Droplets : activity.type === 'feeding' ? GlassWater : BedDouble;
                                            let title = `Activité: ${activity.type}`;
                                            if (activity.type === 'diapers') title = "Changement de couche";
                                            if (activity.type === 'feeding') title = "Alimentation";
                                            if (activity.type === 'sleep') title = "Sommeil";
                                            return (
                                                <div key={activity.id} className="p-3 rounded-lg bg-muted/50 flex items-start gap-3">
                                                    <div className="p-2 rounded-full bg-background mt-1">
                                                        <Icon className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div className="flex-grow">
                                                        <div className="flex justify-between items-baseline">
                                                            <h4 className="font-semibold capitalize">{title}</h4>
                                                            <span className="text-xs text-muted-foreground">{format(parseISO(activity.date), "dd/MM")}</span>
                                                        </div>
                                                        {renderActivityDetails(activity)}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent className="p-2 space-y-2">
                    <StatCard title="Couches" value={summaryStats.diapers.value} change={summaryStats.diapers.change} period={comparisonText} unit={summaryStats.diapers.unit} onClick={() => setVisibleChart('diapers')} isSelected={visibleChart === 'diapers'} onAdd={() => handleOpenManualEntry('diapers')} significantDropThreshold={significantDropThreshold} />
                    <StatCard title="Alimentation" value={summaryStats.feeding.value} change={summaryStats.feeding.change} period={comparisonText} unit={summaryStats.feeding.unit} onClick={() => setVisibleChart('feeding')} isSelected={visibleChart === 'feeding'} onAdd={() => handleOpenManualEntry('feeding')} significantDropThreshold={significantDropThreshold} />
                    <StatCard title="Sommeil" value={summaryStats.sleep.value} change={summaryStats.sleep.change} period={comparisonText} unit={summaryStats.sleep.unit} onClick={() => setVisibleChart('sleep')} isSelected={visibleChart === 'sleep'} onAdd={() => handleOpenManualEntry('sleep')} significantDropThreshold={significantDropThreshold} />
                </CardContent>
            </Card>
            <Card className="border-primary/50">
                <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
                    <div className="flex-1 pr-2">
                        <CardTitle className="text-sm">Détails sur {currentPeriod === 'daily' ? '24 heures' : 'la semaine'}</CardTitle>
                        <CardDescription className="text-xs">{chartConfig[visibleChart].label}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setIsChartExpanded(!isChartExpanded)}>
                        {isChartExpanded ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </Button>
                </CardHeader>
                <CardContent className="p-3 pt-2">
                    <Tabs defaultValue="diapers" value={visibleChart} onValueChange={(value) => setVisibleChart(value as ChartDataKey)} className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="diapers">Couches</TabsTrigger>
                        <TabsTrigger value="feeding">Alim.</TabsTrigger>
                        <TabsTrigger value="sleep">Sommeil</TabsTrigger>
                      </TabsList>
                       {(Object.keys(chartConfig) as ChartDataKey[]).map((key) => (
                        <TabsContent value={key} key={key} className="mt-4">
                            <div className={cn("relative transition-all duration-300", isChartExpanded ? "h-[250px]" : "h-[150px]")}>
                                <ChartContainer config={chartConfig} className="absolute inset-0">
                                    <BarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }} onClick={handleChartClick}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} fontSize={12} />
                                        <YAxis tickLine={false} axisLine={false} fontSize={12} />
                                        <ChartTooltip cursor={true} content={<ChartTooltipContent indicator="dot" />} />
                                        <Bar dataKey={key} fill={`var(--color-${key})`} radius={4} name={chartConfig[key].label} />
                                    </BarChart>
                                </ChartContainer>
                            </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative flex justify-center items-center p-3 rounded-lg bg-card border">
        <h1 className="text-2xl font-bold">Statistiques</h1>
        <div className="absolute right-3">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Télécharger les données</span>
                    </Button>
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
        </div>
      </div>
      
      <Tabs value={period} onValueChange={(v) => handlePeriodChange(v as Period)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily">Journalier</TabsTrigger>
            <TabsTrigger value="weekly">Hebdomadaire</TabsTrigger>
        </TabsList>
      </Tabs>

      <Carousel setApi={setPeriodCarouselApi} opts={{watchDrag: false}}>
        <CarouselContent>
            <CarouselItem>{renderView('daily')}</CarouselItem>
            <CarouselItem>{renderView('weekly')}</CarouselItem>
        </CarouselContent>
      </Carousel>
      
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>
                 {selectedDayData && selectedDayData.date
                  ? `Détails pour le ${format(parseISO(selectedDayData.date), "eeee d MMMM", { locale: fr })}`
                  : `Détails pour ${selectedDayData?.name}`
                }
            </DialogTitle>
            <DialogDescription>
              {period === 'weekly' && selectedDayData?.date && `Date: ${format(parseISO(selectedDayData.date), "dd/MM/yyyy")}`}
              {period === 'daily' && "Activités enregistrées dans cette tranche horaire."}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4 -mx-6 px-6">
            <div className="space-y-3 py-4">
                {selectedDayData && selectedDayData.activities.length > 0 ? (
                    selectedDayData.activities.map((activity: ActivityEvent) => {
                        const Icon = activity.type === 'diapers' ? Droplets : activity.type === 'feeding' ? GlassWater : BedDouble;
                        let title = `Activité: ${activity.type}`;
                        if (activity.type === 'diapers') title = "Changement de couche";
                        if (activity.type === 'feeding') title = "Alimentation";
                        if (activity.type === 'sleep') title = "Sommeil";

                        return (
                        <div key={activity.id} className="p-3 rounded-lg bg-muted/50 flex items-start gap-3">
                           <div className="p-2 rounded-full bg-background mt-1">
                             <Icon className="w-5 h-5 text-primary" />
                           </div>
                           <div className="flex-grow">
                             <h4 className="font-semibold capitalize">{title}</h4>
                             {renderActivityDetails(activity)}
                           </div>
                        </div>
                    )})
                ) : (
                    <p className="text-center text-muted-foreground py-8">Aucune activité enregistrée pour cette période.</p>
                )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
       <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>Ajout manuel : {manualEntryType && chartConfig[manualEntryType].label}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manual-date">Date</Label>
                 <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !manualEntryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {manualEntryDate ? format(manualEntryDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={manualEntryDate}
                        onSelect={setManualEntryDate}
                        locale={fr}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
              </div>
              <div>
                <Label htmlFor="manual-time">Heure</Label>
                <Input id="manual-time" type="time" value={manualEntryTime} onChange={(e) => setManualEntryTime(e.target.value)} />
              </div>
            </div>

            {manualEntryType === 'diapers' && (
              <div>
                <Label>Type de couche</Label>
                <Select value={diaperType} onValueChange={(v) => setDiaperType(v as any)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="wet">Pipi</SelectItem>
                        <SelectItem value="dirty">Caca</SelectItem>
                        <SelectItem value="both">Pipi + Caca</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            )}
             {manualEntryType === 'feeding' && (
              <div className="space-y-4">
                <Tabs value={manualFeedType} onValueChange={(v) => setManualFeedType(v as ManualFeedType)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bottle">Biberon</TabsTrigger>
                    <TabsTrigger value="breastfeeding">Allaitement</TabsTrigger>
                  </TabsList>
                </Tabs>
                {manualFeedType === 'bottle' ? (
                  <div className="animate-in fade-in-50">
                    <Label htmlFor="manual-feed-amount">Quantité (ml)</Label>
                    <Input id="manual-feed-amount" type="number" value={feedAmount} onChange={(e) => setFeedAmount(e.target.value)} placeholder="120" />
                  </div>
                ) : (
                  <div className="animate-in fade-in-50">
                    <Label htmlFor="manual-breastfeeding-duration">Durée (minutes)</Label>
                    <Input id="manual-breastfeeding-duration" type="number" value={breastfeedingDuration} onChange={(e) => setBreastfeedingDuration(e.target.value)} placeholder="15" />
                  </div>
                )}
              </div>
            )}
            {manualEntryType === 'sleep' && (
              <div>
                <Label htmlFor="manual-sleep-duration">Durée (heures)</Label>
                <Input id="manual-sleep-duration" type="number" value={sleepDuration} onChange={(e) => setSleepDuration(e.target.value)} placeholder="1.5" step="0.5" />
              </div>
            )}

            <div>
              <Label htmlFor="manual-note">Note (optionnel)</Label>
              <Input id="manual-note" value={manualEntryNote} onChange={(e) => setManualEntryNote(e.target.value)} placeholder="Ajouter une note..."/>
            </div>
          </div>
          <DialogFooter>
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button variant="outline" onClick={() => setIsManualEntryOpen(false)} className="border-2 border-primary/80">Annuler</Button>
              <Button onClick={handleSaveManualEntry}>Enregistrer</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-primary/50">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
                <Pill className="w-5 h-5" />
                Historique des Traitements
            </CardTitle>
        </CardHeader>
        <CardContent>
             {treatments.length > 0 ? (
                 <Accordion type="single" collapsible className="w-full">
                     {treatments.map((treatment) => (
                         <AccordionItem value={`item-${treatment.id}`} key={treatment.id} className="border-primary/50">
                             <AccordionTrigger>
                                 <div className="flex flex-col items-start text-left">
                                     <span className="font-semibold">{treatment.medication}</span>
                                     <span className="text-xs text-muted-foreground font-normal">{treatment.dosage} - {treatment.frequency}</span>
                                 </div>
                             </AccordionTrigger>
                             <AccordionContent>
                                 {treatment.history.length > 0 ? (
                                     <ul className="space-y-2 text-sm text-muted-foreground pl-4 border-l ml-2">
                                         {[...treatment.history].reverse().map((h, i) => (
                                             <li key={i} className="flex justify-between items-center pl-4 relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-primary/50 before:rounded-full">
                                                 <span>{format(new Date(h.date), 'eeee d MMMM yyyy', { locale: fr })}</span>
                                                 <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded-md">{h.time}</span>
                                             </li>
                                         ))}
                                     </ul>
                                 ) : (
                                     <p className="text-sm text-muted-foreground text-center py-2">Aucune prise enregistrée pour ce traitement.</p>
                                 )}
                             </AccordionContent>
                         </AccordionItem>
                     ))}
                 </Accordion>
             ) : (
                 <p className="text-sm text-muted-foreground text-center py-4">Aucun traitement en cours.</p>
             )}
        </CardContent>
      </Card>
    </div>
  );
}
