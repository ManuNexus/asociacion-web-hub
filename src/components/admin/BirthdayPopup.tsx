import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Cake, Mail, Loader2, PartyPopper } from "lucide-react";
import { format, isToday, isTomorrow, isYesterday, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Socio {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  fecha_nacimiento: string | null;
}

interface BirthdaySocio extends Socio {
  birthdayType: "yesterday" | "today" | "tomorrow";
}

export function BirthdayPopup() {
  const [open, setOpen] = useState(false);
  const [birthdaySocios, setBirthdaySocios] = useState<BirthdaySocio[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchBirthdaySocios();
  }, []);

  const fetchBirthdaySocios = async () => {
    const { data, error } = await supabase
      .from("socios")
      .select("id, nombre, apellidos, email, fecha_nacimiento")
      .eq("activo", true)
      .not("fecha_nacimiento", "is", null);

    if (error) {
      console.error("Error fetching socios:", error);
      return;
    }

    const today = new Date();
    const birthdayList: BirthdaySocio[] = [];

    data?.forEach((socio) => {
      if (!socio.fecha_nacimiento) return;

      // Parse the date and create a date in current year
      const birthDate = parseISO(socio.fecha_nacimiento);
      const birthdayThisYear = new Date(
        today.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate()
      );

      if (isYesterday(birthdayThisYear)) {
        birthdayList.push({ ...socio, birthdayType: "yesterday" });
      } else if (isToday(birthdayThisYear)) {
        birthdayList.push({ ...socio, birthdayType: "today" });
      } else if (isTomorrow(birthdayThisYear)) {
        birthdayList.push({ ...socio, birthdayType: "tomorrow" });
      }
    });

    setBirthdaySocios(birthdayList);

    // Auto-open if there are birthdays
    if (birthdayList.length > 0) {
      // Check if already dismissed today
      const dismissedKey = `birthday_popup_dismissed_${format(today, "yyyy-MM-dd")}`;
      if (!sessionStorage.getItem(dismissedKey)) {
        setOpen(true);
      }
    }
  };

  const handleClose = () => {
    const today = new Date();
    const dismissedKey = `birthday_popup_dismissed_${format(today, "yyyy-MM-dd")}`;
    sessionStorage.setItem(dismissedKey, "true");
    setOpen(false);
  };

  const handleSendBirthdayEmail = async (socio: BirthdaySocio) => {
    setSendingId(socio.id);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      const { error } = await supabase.functions.invoke("send-birthday-email", {
        body: {
          email: socio.email,
          nombre: socio.nombre,
        },
      });

      if (error) throw error;

      setSentIds((prev) => new Set([...prev, socio.id]));
      toast({
        title: "¡Felicitación enviada!",
        description: `Se ha enviado un email a ${socio.nombre}`,
      });
    } catch (error: any) {
      console.error("Error sending birthday email:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo enviar el email",
      });
    } finally {
      setSendingId(null);
    }
  };

  const getBirthdayLabel = (type: "yesterday" | "today" | "tomorrow") => {
    switch (type) {
      case "yesterday":
        return { text: "Ayer", className: "text-muted-foreground" };
      case "today":
        return { text: "¡Hoy!", className: "text-primary font-bold" };
      case "tomorrow":
        return { text: "Mañana", className: "text-muted-foreground" };
    }
  };

  const calculateAge = (fechaNacimiento: string) => {
    const birthDate = parseISO(fechaNacimiento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Sort: today first, then tomorrow, then yesterday
  const sortedSocios = [...birthdaySocios].sort((a, b) => {
    const order = { today: 0, tomorrow: 1, yesterday: 2 };
    return order[a.birthdayType] - order[b.birthdayType];
  });

  if (birthdaySocios.length === 0) {
    return null;
  }

  return (
    <>
      {/* Floating button to reopen */}
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 gap-2 shadow-lg"
          variant="default"
        >
          <Cake className="h-4 w-4" />
          <span className="hidden sm:inline">Cumpleaños ({birthdaySocios.length})</span>
          <span className="sm:hidden">{birthdaySocios.length}</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5 text-primary" />
              Cumpleaños de socios
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {sortedSocios.map((socio) => {
              const label = getBirthdayLabel(socio.birthdayType);
              const isSent = sentIds.has(socio.id);
              const isSending = sendingId === socio.id;

              return (
                <div
                  key={socio.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Cake className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {socio.nombre} {socio.apellidos}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className={label.className}>{label.text}</span>
                      {socio.fecha_nacimiento && (
                        <span className="ml-2">
                          · Cumple {calculateAge(socio.fecha_nacimiento) + (socio.birthdayType === "yesterday" ? 0 : socio.birthdayType === "today" ? 1 : 1)} años
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={isSent ? "secondary" : "default"}
                    onClick={() => handleSendBirthdayEmail(socio)}
                    disabled={isSending || isSent}
                    className="gap-1"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isSent ? (
                      <>
                        <Mail className="h-4 w-4" />
                        Enviado
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Felicitar
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
