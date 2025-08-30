
"use client";

import { useState, useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, CheckCircle2, PlusCircle, AlertTriangle, ChevronLeft, ChevronRight, Trash2, Circle, CheckCircle, ChevronDown, ChevronUp, Clock, Info, Calendar as CalendarIconLucide, StickyNote, Bell, Repeat, Repeat1, Pill, Plus, History, Edit, List, Baby, Eye } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, isSameDay, isToday, isBefore, startOfToday, isAfter, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subMonths, endOfYear, getYear, getMonth, formatISO, parse, addYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Treatment, Appointment } from '@/lib/types';
import Fade from 'embla-carousel-fade';

interface AppointmentsViewProps {
  childId: string;
  onModalToggle: (isOpen: boolean) => void;
  className?: string;
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<Appointment>;
  updateAppointment: (appointment: Appointment) => Promise<void>;
  deleteAppointment: (appointmentId: string) => Promise<void>;
}

export interface AppointmentsViewHandle {
  centerSelectedDate: () => void;
}

const WeekDay = ({ day, isSelected, isPast, onClick, hasAppointment, hasImportantAppointment }: { day: Date; isSelected: boolean, isPast: boolean, onClick: () => void, hasAppointment: boolean, hasImportantAppointment: boolean }) => {
    return (
        <button
            onClick={onClick}
            disabled={isPast}
            className={cn(
                "flex flex-col items-center justify-center w-14 h-20 rounded-2xl transition-all relative flex-shrink-0 snap-center",
                isToday(day) && !isSelected && 'bg-primary/20 text-primary-foreground font-bold',
                isSelected && 'bg-primary text-primary-foreground',
                isPast && "opacity-50 cursor-not-allowed"
            )}
        >
            <span className="text-xs uppercase">{format(day, 'EEE', { locale: fr })}</span>
            <span className={cn("text-lg")}>{format(day, 'd')}</span>
             {(hasAppointment || hasImportantAppointment) && (
                <div className={cn(
                    "absolute bottom-2 h-1.5 w-1.5 rounded-full",
                    hasImportantAppointment ? "bg-destructive" : "bg-primary",
                    isSelected && "bg-primary-foreground"
                )} />
            )}
        </button>
    );
};


const AppointmentsView = forwardRef<AppointmentsViewHandle, AppointmentsViewProps>(({ childId, onModalToggle, className, appointments, addAppointment, updateAppointment, deleteAppointment }, ref) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDayAppointmentsOpen, setIsDayAppointmentsOpen] = useState(false);
  const [appointmentsForDay, setAppointmentsForDay] = useState<Appointment[]>([]);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [calendarCarouselApi, setCalendarCarouselApi] = useState<CarouselApi>();
  const [isReminderRecurrent, setIsReminderRecurrent] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [showFormCalendar, setShowFormCalendar] = useState(false);
  const [isReminderSheetOpen, setIsReminderSheetOpen] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("1d");
  const [manualReminderTime, setManualReminderTime] = useState("09:00");
  const [importantReminder, setImportantReminder] = useState(true);
  
  const { toast } = useToast();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set initial date on client to avoid hydration mismatch
    setSelectedDate(new Date());
  }, []);

  useEffect(() => {
    onModalToggle(isFormOpen || isDetailOpen || isDayAppointmentsOpen || isReminderSheetOpen);
  }, [isFormOpen, isDetailOpen, isDayAppointmentsOpen, onModalToggle, isReminderSheetOpen]);
  
  useEffect(() => {
    const pastAppointments = appointments.filter(apt => isBefore(apt.date, startOfToday()));

    if (pastAppointments.length > 3) {
        pastAppointments.sort((a, b) => b.date.getTime() - a.date.getTime());
        const appointmentsToDelete = pastAppointments.slice(3);
        appointmentsToDelete.forEach(apt => deleteAppointment(apt.id));
    }
  }, [appointments, deleteAppointment]);


  const scrollableDays = useMemo(() => {
    if (!selectedDate) return [];
    return eachDayOfInterval({
        start: subDays(startOfToday(), 15),
        end: addYears(new Date(), 5),
    })
  }, [selectedDate]);

  const handleSelectDate = useCallback((date: Date) => {
    if (!date) return;
    const today = startOfToday();
    if (isBefore(date, today) && !isSameDay(date, today)) {
        date = today;
    }
    setSelectedDate(date);
    
    const dayAppointments = appointments.filter(apt => isSameDay(apt.date, date) && !apt.completed);
    if (dayAppointments.length > 0) {
        setAppointmentsForDay(dayAppointments);
        setIsDayAppointmentsOpen(true);
    } else {
        handleOpenDialog(date);
    }
  }, [appointments]);

  const scrollToDate = useCallback((date: Date) => {
     if (scrollContainerRef.current) {
        const targetDayIndex = scrollableDays.findIndex(day => isSameDay(day, date));
        
        if (targetDayIndex !== -1) {
            const dayElement = scrollContainerRef.current.children[targetDayIndex] as HTMLElement;
            if(dayElement) {
                const containerWidth = scrollContainerRef.current.offsetWidth;
                const elementOffset = dayElement.offsetLeft;
                const elementWidth = dayElement.offsetWidth;
                
                const scrollTo = elementOffset - (containerWidth / 2) + (elementWidth / 2);
                
                scrollContainerRef.current.scrollTo({
                    left: scrollTo,
                    behavior: 'smooth',
                });
            }
        }
    }
  }, [scrollableDays]);

  useImperativeHandle(ref, () => ({
    centerSelectedDate: () => {
      if (selectedDate) {
        scrollToDate(selectedDate);
      }
    }
  }));

  useEffect(() => {
    if (selectedDate) {
        scrollToDate(selectedDate);
    }
  }, [selectedDate, scrollToDate]);

  useEffect(() => {
    if (!calendarCarouselApi) return;
    const onSelect = () => {
        const newMonthIndex = calendarCarouselApi.selectedScrollSnap();
        setCurrentMonth(addMonths(startOfToday(), newMonthIndex));
    };
    calendarCarouselApi.on('select', onSelect);
    return () => {
        calendarCarouselApi.off('select', onSelect);
    };
}, [calendarCarouselApi]);


  const handleScroll = useCallback(() => {
    if (isScrolling.current) {
      clearTimeout(isScrolling.current);
    }
    isScrolling.current = setTimeout(() => {
      if (scrollContainerRef.current && selectedDate) {
        const { scrollLeft, clientWidth, children } = scrollContainerRef.current;
        const center = scrollLeft + clientWidth / 2;
        
        let closestIndex = -1;
        let minDistance = Infinity;

        Array.from(children).forEach((child, index) => {
          const childEl = child as HTMLElement;
          const childCenter = childEl.offsetLeft + childEl.offsetWidth / 2;
          const distance = Math.abs(center - childCenter);
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
          }
        });
        
        if (closestIndex !== -1) {
          const newSelectedDate = scrollableDays[closestIndex];
           if (!isSameDay(newSelectedDate, selectedDate)) {
             const today = startOfToday();
             if (isBefore(newSelectedDate, today) && !isSameDay(newSelectedDate, today)) {
                 setSelectedDate(today);
             } else {
                 setSelectedDate(newSelectedDate);
             }
           }
        }
      }
    }, 150);
  }, [selectedDate, scrollableDays]);
  
  useEffect(() => {
      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer) {
          scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      }
      return () => {
          if (scrollContainer) {
              scrollContainer.removeEventListener('scroll', handleScroll);
          }
           if (isScrolling.current) {
               clearTimeout(isScrolling.current);
           }
      };
  }, [handleScroll]);

  // Form state
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [formDate, setFormDate] = useState<Date | undefined>();

  const resetForm = (date?: Date) => {
    setTitle('');
    setTime('');
    setNote('');
    setIsImportant(false);
    setEditingAppointmentId(null);
    setFormDate(date);
  };
  
  const handleOpenDialog = (date?: Date) => {
    resetForm(date || new Date());
    setIsFormOpen(true);
  }

  const handleOpenDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailOpen(true);
    setIsDayAppointmentsOpen(false); // Close day list if opening detail
  }

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !formDate || !time) return;

    if (isBefore(formDate, startOfToday()) && !isToday(formDate)) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Vous ne pouvez pas ajouter de rendez-vous à une date passée.",
            duration: 1200
        });
        return;
    }

    if (editingAppointmentId !== null) {
      // Update existing appointment
      const updatedAppointment: Appointment = {
        id: editingAppointmentId,
        title,
        date: formDate,
        time,
        note,
        important: isImportant,
        completed: false, // Assuming it's not completed on edit
      };
      await updateAppointment(updatedAppointment);
      toast({ title: "Rendez-vous mis à jour!", duration: 1200 });
    } else {
      // Add new appointment
      const newAppointmentData: Omit<Appointment, 'id'> = {
        title,
        date: formDate,
        time,
        completed: false,
        important: isImportant,
        note: note,
      };

      await addAppointment(newAppointmentData);
      toast({ title: "Rendez-vous ajouté!", duration: 1200 });
    }
    
    setIsFormOpen(false);
    resetForm();
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointmentId(appointment.id);
    setTitle(appointment.title);
    setTime(appointment.time);
    setNote(appointment.note || '');
    setIsImportant(appointment.important);
    setFormDate(appointment.date);
    setIsFormOpen(true);
    setIsDetailOpen(false);
    setIsDayAppointmentsOpen(false);
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    await deleteAppointment(appointmentId);
    setIsDetailOpen(false);
    toast({ title: "Rendez-vous supprimé!", duration: 1200 });
  };

  const upcomingAppointments = useMemo(() => {
    return appointments.filter(apt => isAfter(apt.date, new Date()) || isToday(apt.date)).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 3);
  }, [appointments]);

  const pastAppointments = useMemo(() => {
      return appointments
          .filter(apt => isBefore(apt.date, startOfToday()))
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 3);
  }, [appointments]);
  

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
        setSelectedDate(date);
        scrollToDate(date);
        setIsCalendarExpanded(false);
        const dayAppointments = appointments.filter(apt => isSameDay(apt.date, date) && !apt.completed);
        if (dayAppointments.length > 0) {
            setAppointmentsForDay(dayAppointments);
            setIsDayAppointmentsOpen(true);
        } else {
            handleOpenDialog(date);
        }
    }
  };

  const dayHasAppointment = useCallback((day: Date) => {
    return appointments.some(apt => isSameDay(apt.date, day) && !apt.completed);
  }, [appointments]);

  const dayHasImportantAppointment = useCallback((day: Date) => {
    return appointments.some(apt => isSameDay(apt.date, day) && apt.important && !apt.completed);
  }, [appointments]);
  
  if (!selectedDate) {
    return null; // or a loading spinner
  }


  return (
    <div className={cn("space-y-4", className)}>
       <div className="relative grid grid-cols-3 items-center p-1 rounded-lg bg-card border">
        <div className="flex justify-start items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => handleOpenDialog(selectedDate)}>
              <Plus className="h-4 w-4" />
              <span className="sr-only">Ajouter un RDV</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}>
                {isCalendarExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className="sr-only">Toggle calendar</span>
            </Button>
        </div>
        <h1 className="text-2xl font-bold text-center">Rendez-vous</h1>
        <div className="flex justify-end items-center gap-2">
           <Sheet open={isReminderSheetOpen} onOpenChange={setIsReminderSheetOpen}>
                <SheetTrigger asChild>
                     <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5" />
                         <span className="sr-only">Gérer les rappels</span>
                    </Button>
                </SheetTrigger>
                <SheetContent className="flex flex-col p-0 rounded-l-2xl">
                    <SheetHeader className="p-6">
                        <SheetTitle>Rappels de rendez-vous</SheetTitle>
                        <SheetDescription>
                            Configurez les notifications pour ne jamais manquer un rendez-vous important.
                        </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="flex-grow p-6 pt-0">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between rounded-lg border p-3 bg-card">
                                <div className="flex items-center gap-3">
                                    <Bell className="h-5 w-5" />
                                    <Label htmlFor="reminders-enabled" className="text-base font-medium">Activer les rappels</Label>
                                </div>
                                <Switch id="reminders-enabled" checked={remindersEnabled} onCheckedChange={setRemindersEnabled}/>
                            </div>
                            
                            <div className={cn("space-y-4", !remindersEnabled && "opacity-50 pointer-events-none")}>
                                 <Separator />
                                 <h4 className="font-semibold text-muted-foreground px-1">Options de rappel</h4>
                                <div className="space-y-2 rounded-lg border p-3 bg-card">
                                    <Label htmlFor="reminder-time">Rappel prédéfini</Label>
                                    <Select value={reminderTime} onValueChange={setReminderTime}>
                                        <SelectTrigger id="reminder-time">
                                            <SelectValue placeholder="Choisir un moment" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="30m">30 minutes avant</SelectItem>
                                            <SelectItem value="1h">1 heure avant</SelectItem>
                                            <SelectItem value="2h">2 heures avant</SelectItem>
                                            <SelectItem value="1d">1 jour avant</SelectItem>
                                            <SelectItem value="2d">2 jours avant</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 rounded-lg border p-3 bg-card">
                                    <Label htmlFor="manual-reminder-time">Heure manuelle du rappel</Label>
                                    <Input 
                                        id="manual-reminder-time" 
                                        type="time" 
                                        value={manualReminderTime} 
                                        onChange={(e) => setManualReminderTime(e.target.value)}
                                    />
                                </div>
                                
                                <div className="space-y-2 rounded-lg border p-3 bg-card border-destructive/50">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="important-reminder" className="font-semibold text-destructive flex items-center gap-2">
                                           <AlertTriangle className="h-4 w-4" />
                                           Alerte pour RDV important
                                        </Label>
                                        <Switch 
                                            id="important-reminder"
                                            checked={importantReminder}
                                            onCheckedChange={setImportantReminder}
                                        />
                                    </div>
                                    <div className={cn("pt-2", !importantReminder && "opacity-50 pointer-events-none")}>
                                      <Select defaultValue="double">
                                          <SelectTrigger id="important-reminder-action">
                                              <SelectValue placeholder="Choisir une action" />
                                          </SelectTrigger>
                                          <SelectContent>
                                              <SelectItem value="double">Doubler le rappel</SelectItem>
                                              <SelectItem value="persistent">Notification persistante</SelectItem>
                                              <SelectItem value="both">Les deux</SelectItem>
                                          </SelectContent>
                                      </Select>
                                    </div>
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
      
        <div className="relative mb-4">
            <div 
                ref={scrollContainerRef}
                className="flex items-center gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory"
            >
                {scrollableDays.map((day, index) => (
                    <div key={index} className="snap-center">
                        <WeekDay
                            day={day}
                            isSelected={isSameDay(day, selectedDate)}
                            isPast={isBefore(day, startOfToday())}
                            onClick={() => handleSelectDate(day)}
                            hasAppointment={dayHasAppointment(day)}
                            hasImportantAppointment={dayHasImportantAppointment(day)}
                        />
                    </div>
                ))}
            </div>
            <div
                onClick={() => handleSelectDate(selectedDate)}
                role="button"
                aria-label="Ajouter un rendez-vous pour la date sélectionnée"
                className="absolute inset-0 m-auto w-14 h-20 rounded-2xl border-2 border-primary cursor-pointer"
            />
        </div>
      
      {isCalendarExpanded && (
          <div className="mb-4 animate-in fade-in-50 flex justify-center">
            <div className="relative flex items-center justify-center">
              <Button variant="outline" size="icon" className="z-10" onClick={() => calendarCarouselApi?.scrollPrev()}><ChevronLeft className="h-4 w-4"/></Button>
              <Carousel 
                setApi={setCalendarCarouselApi}
                opts={{
                    startIndex: getMonth(currentMonth) - getMonth(startOfToday())
                }}
                plugins={[
                    Fade()
                ]}
                className="w-full max-w-xs"
                >
                <CarouselContent>
                    {Array.from({ length: 60 }).map((_, index) => {
                        const month = addMonths(startOfToday(), index);
                        return (
                            <CarouselItem key={index}>
                                <Card className="border-primary/50">
                                    <CardContent className="p-0">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={handleCalendarSelect}
                                            month={month}
                                            locale={fr}
                                            className="p-3 w-full"
                                            modifiers={{ 
                                                hasAppointment: (day) => dayHasAppointment(day),
                                                hasImportantAppointment: (day) => dayHasImportantAppointment(day),
                                            }}
                                            modifiersClassNames={{
                                                hasAppointment: 'has-appointment',
                                                hasImportantAppointment: 'has-important-appointment',
                                            }}
                                            classNames={{
                                                caption_label: "text-lg font-semibold",
                                                day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 !rounded-full",
                                                day_today: "bg-accent text-accent-foreground",
                                                nav: "hidden",
                                                head_row: "flex justify-around",
                                                row: "flex w-full mt-1",
                                                cell: "flex-1",
                                                day: "w-full h-9 p-0",
                                                day_content: "relative w-full h-full flex items-center justify-center",
                                            }}
                                        />
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                        )
                    })}
                </CarouselContent>
              </Carousel>
              <Button variant="outline" size="icon" className="z-10" onClick={() => calendarCarouselApi?.scrollNext()}><ChevronRight className="h-4 w-4"/></Button>
            </div>
          </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setShowFormCalendar(false); }}>
          <DialogContent className={cn("rounded-2xl", showFormCalendar && "max-w-xs")}>
              <DialogHeader>
                  <DialogTitle>
                    {editingAppointmentId ? "Modifier le rendez-vous" : "Ajouter un rendez-vous"}
                  </DialogTitle>
              </DialogHeader>
              {!showFormCalendar ? (
                <form onSubmit={handleSaveAppointment} className="space-y-4 animate-in fade-in-50">
                    <div className="space-y-2">
                        <Label htmlFor="title">Titre</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !formDate && "text-muted-foreground"
                                )}
                                onClick={(e) => { e.preventDefault(); setShowFormCalendar(true); }}
                            >
                                <CalendarIconLucide className="mr-2 h-4 w-4" />
                                {formDate ? format(formDate, "dd MMMM", { locale: fr }) : <span>Choisir une date</span>}
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="time">Heure</Label>
                                <span className='text-xs text-red-500'>Obligatoire</span>
                            </div>
                            <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="note">Note</Label>
                        <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ex: Vaccin ou Pédiatre" />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Switch id="important" checked={isImportant} onCheckedChange={setIsImportant} />
                            <Label htmlFor="important" className="font-bold text-destructive">Important</Label>
                        </div>
                    </div>
                    <DialogFooter className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="border-2 border-primary/80">Annuler</Button>
                        <Button type="submit">Enregistrer</Button>
                    </DialogFooter>
                </form>
              ) : (
                <div className="animate-in fade-in-50 flex justify-center">
                    <Calendar
                        mode="single"
                        selected={formDate}
                        onSelect={(date) => {
                            setFormDate(date);
                            setShowFormCalendar(false);
                        }}
                        locale={fr}
                        className="p-0"
                        classNames={{
                          row: "flex w-full mt-1",
                          cell: "flex-1",
                          day: "w-full h-9",
                          day_selected: "!rounded-full"
                        }}
                        initialFocus={false}
                    />
                </div>
              )}
          </DialogContent>
      </Dialog>
    
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="rounded-2xl w-[calc(100%-2rem)] sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>Détails du rendez-vous</DialogTitle>
                  <DialogDescription>
                    {selectedAppointment ? `Consultez ou modifiez les informations pour "${selectedAppointment.title}".` : ""}
                  </DialogDescription>
              </DialogHeader>
              {selectedAppointment && (
                  <div className="space-y-4 py-4">
                      <div className="font-bold text-lg">{selectedAppointment.title}</div>
                      <div><span className="font-semibold">Date :</span> {format(selectedAppointment.date, "eeee dd MMMM", { locale: fr })}</div>
                      <div><span className="font-semibold">Heure :</span> {selectedAppointment.time}</div>
                      {selectedAppointment.note && <div><span className="font-semibold">Note :</span> {selectedAppointment.note}</div>}
                      <div><Badge variant={selectedAppointment.important ? "destructive" : "secondary"}>{selectedAppointment.important ? "Important" : "Normal"}</Badge></div>
                      
                      <DialogFooter className="pt-4 grid grid-cols-2 gap-2">
                          <Button variant="outline" className="w-full border-primary/80 border-2" onClick={() => handleEditAppointment(selectedAppointment)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" className="w-full" onClick={() => handleDeleteAppointment(selectedAppointment.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                      </DialogFooter>
                  </div>
              )}
          </DialogContent>
      </Dialog>

      <Dialog open={isDayAppointmentsOpen} onOpenChange={setIsDayAppointmentsOpen}>
          <DialogContent className="rounded-2xl w-[calc(100%-2rem)] sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>Rendez-vous du {appointmentsForDay.length > 0 && format(appointmentsForDay[0].date, "dd MMMM", { locale: fr })}</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-3">
                  {appointmentsForDay.map(apt => (
                      <div key={apt.id} onClick={() => handleOpenDetail(apt)} className="flex items-center p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted">
                          <div className="flex-grow">
                              <div className="flex justify-between items-baseline">
                                  <p className="font-semibold">{apt.title}</p>
                                  <p className="text-sm font-mono text-muted-foreground">{apt.time}</p>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                  <p className="text-sm text-muted-foreground">{format(apt.date, "eeee, dd MMMM", { locale: fr })}</p>
                                  {apt.important && <Badge variant="destructive">Important</Badge>}
                              </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground ml-2" />
                      </div>
                  ))}
              </div>
              <DialogFooter>
                  <Button onClick={() => { setIsDayAppointmentsOpen(false); handleOpenDialog(selectedDate); }}>
                      <Plus className="mr-2 h-4 w-4" /> Ajouter un RDV
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <div className="space-y-6">
          <Card>
              <CardHeader className="border-b pb-4">
                  <CardTitle>Prochains Rendez-vous</CardTitle>
              </CardHeader>
              <CardContent>
                  {upcomingAppointments.length > 0 ? (
                      <div className="space-y-4 pt-4">
                          {upcomingAppointments.map((apt, index) => (
                              <div key={`${apt.id}-${index}`} onClick={() => handleOpenDetail(apt)} className="flex items-center p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted">
                                  <div className="flex-grow">
                                      <div className="flex justify-between items-baseline">
                                          <p className="font-semibold">{apt.title}</p>
                                          <p className="text-sm font-mono text-muted-foreground">{apt.time}</p>
                                      </div>
                                      <div className="flex justify-between items-center mt-1">
                                          <p className="text-sm text-muted-foreground">{format(apt.date, "eeee, dd MMMM", { locale: fr })}</p>
                                          {apt.important && <Badge variant="destructive">Important</Badge>}
                                      </div>
                                  </div>
                                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-2" />
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-muted-foreground text-center py-4">Aucun rendez-vous à venir.</p>
                  )}
              </CardContent>
          </Card>
          
          <Card>
              <CardHeader className="border-b pb-4">
                  <CardTitle>Derniers RDV Passés</CardTitle>
              </CardHeader>
              <CardContent>
                  {pastAppointments.length > 0 ? (
                    <div className="space-y-4 pt-4">
                      {pastAppointments.map(apt => (
                          <div key={apt.id} className="flex items-center p-3 rounded-lg bg-muted/30 opacity-70 cursor-not-allowed mb-2 last:mb-0">
                              <div className="flex-grow">
                                  <div className="flex justify-between items-baseline">
                                      <p className="font-semibold line-through">{apt.title}</p>
                                      <p className="text-sm font-mono text-muted-foreground line-through">{apt.time}</p>
                                  </div>
                                  <div className="flex justify-between items-center mt-1">
                                      <p className="text-sm text-muted-foreground line-through">{format(apt.date, "eeee, dd MMMM", { locale: fr })}</p>
                                      <Badge variant="secondary">Terminé</Badge>
                                  </div>
                              </div>
                          </div>
                      ))}
                    </div>
                  ) : (
                      <p className="text-muted-foreground text-center py-4">Aucun rendez-vous passé.</p>
                  )}
              </CardContent>
          </Card>
      </div>
    </div>
  );
});

AppointmentsView.displayName = "AppointmentsView";
export default AppointmentsView;
    

