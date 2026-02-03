import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserMinus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SolicitudBaja() {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (motivo.trim().length < 10) {
      toast.error("Por favor, indica un motivo más detallado (mínimo 10 caracteres)");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sesión no válida");
        return;
      }

      const response = await supabase.functions.invoke("solicitar-baja", {
        body: { motivo },
      });

      if (response.error) {
        throw new Error(response.error.message || "Error al enviar la solicitud");
      }

      toast.success("Solicitud de baja enviada correctamente. Recibirás un email de confirmación.");
      setOpen(false);
      setConfirmOpen(false);
      setMotivo("");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al enviar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = () => {
    if (motivo.trim().length < 10) {
      toast.error("Por favor, indica un motivo más detallado (mínimo 10 caracteres)");
      return;
    }
    setConfirmOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
            <UserMinus className="h-4 w-4 mr-2" />
            Solicitar baja
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar baja de socio</DialogTitle>
            <DialogDescription>
              Lamentamos que quieras dejarnos. Por favor, indícanos el motivo de tu baja para poder mejorar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo de la baja *</Label>
              <Textarea
                id="motivo"
                placeholder="Cuéntanos por qué deseas darte de baja..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 10 caracteres. Tu feedback nos ayuda a mejorar.
              </p>
            </div>

            <div className="bg-muted/50 p-3 rounded-md text-sm space-y-2">
              <p className="font-medium">¿Qué ocurrirá?</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Se notificará a la Junta Directiva</li>
                <li>Recibirás un email de confirmación</li>
                <li>Tu solicitud será procesada manualmente</li>
                <li>Te confirmaremos cuando la baja sea efectiva</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRequestSubmit}
              disabled={loading || motivo.trim().length < 10}
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmas tu solicitud de baja?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción enviará tu solicitud a la Junta Directiva. Podrás seguir accediendo a tu cuenta hasta que la baja sea procesada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Confirmar solicitud"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
