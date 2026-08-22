import { useState } from "react";
import { Construction, Mail, Heart, UserPlus, CheckCircle2 } from "lucide-react";
import logoAhoraWhite from "@/assets/logo-ahora-white.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Tipo = "amigo" | "socio";

const emptyForm = {
  nombre: "",
  apellidos: "",
  email: "",
  telefono: "",
  dni: "",
  localidad: "",
  cuota: "",
  mensaje: "",
};

export function MaintenanceScreen() {
  const { toast } = useToast();
  const [tipo, setTipo] = useState<Tipo | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipo) return;
    if (!form.nombre.trim() || !form.apellidos.trim() || !form.email.trim()) {
      toast({ title: "Faltan datos", description: "Nombre, apellidos y email son obligatorios.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("registro-mantenimiento", {
        body: { tipo, ...form },
      });
      if (error) throw error;
      setSent(true);
    } catch {
      toast({
        title: "No se pudo enviar",
        description: "Inténtalo de nuevo o escríbenos a info@ahoraorg.es",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-primary p-6">
      <div className="relative mx-auto flex min-h-full max-w-xl flex-col items-center justify-center py-10 text-center">
        {/* Decorative glows */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-64 h-64 rounded-full bg-secondary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-64 h-64 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative w-full flex flex-col items-center gap-8">
          <img
            src={logoAhoraWhite}
            alt="AHORA"
            className="h-16 md:h-20 drop-shadow-[0_0_30px_rgba(241,196,15,0.3)]"
            width="232"
            height="80"
          />

          <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center">
            <Construction className="h-10 w-10 text-secondary" />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-extrabold text-primary-foreground leading-tight">
              Web en mantenimiento
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 leading-relaxed">
              Estamos mejorando la web para ofrecerte una mejor experiencia.
              <br className="hidden md:block" />
              Volvemos en breve.
            </p>
          </div>

          {/* Registro por email durante el mantenimiento */}
          <div className="w-full rounded-2xl border border-primary-foreground/20 bg-primary-foreground/5 p-6 text-left">
            {sent ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <CheckCircle2 className="h-10 w-10 text-secondary" />
                <p className="text-primary-foreground font-semibold">¡Solicitud enviada!</p>
                <p className="text-sm text-primary-foreground/70">
                  Te hemos enviado un correo de confirmación. Tramitaremos tu alta manualmente y te contactaremos en breve.
                </p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-center text-sm text-primary-foreground/80">
                  Mientras tanto, puedes registrarte por correo:
                </p>

                {!tipo ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      onClick={() => setTipo("amigo")}
                      className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold"
                    >
                      <Heart className="mr-2 h-4 w-4" /> Hazte Amigo
                    </Button>
                    <Button
                      onClick={() => setTipo("socio")}
                      variant="outline"
                      className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 font-semibold"
                    >
                      <UserPlus className="mr-2 h-4 w-4" /> Hazte Socio
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm font-semibold text-secondary">
                      {tipo === "socio" ? "Solicitud de socio/a" : "Registro como amigo/a"}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="nombre" className="text-primary-foreground/80">Nombre *</Label>
                        <Input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} maxLength={100}
                          className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="apellidos" className="text-primary-foreground/80">Apellidos *</Label>
                        <Input id="apellidos" name="apellidos" value={form.apellidos} onChange={handleChange} maxLength={100}
                          className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-primary-foreground/80">Email *</Label>
                      <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} maxLength={255}
                        className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="telefono" className="text-primary-foreground/80">Teléfono</Label>
                        <Input id="telefono" name="telefono" type="tel" value={form.telefono} onChange={handleChange} maxLength={30}
                          className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="localidad" className="text-primary-foreground/80">Localidad</Label>
                        <Input id="localidad" name="localidad" value={form.localidad} onChange={handleChange} maxLength={120}
                          className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" />
                      </div>
                    </div>
                    {tipo === "socio" && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="dni" className="text-primary-foreground/80">DNI</Label>
                          <Input id="dni" name="dni" value={form.dni} onChange={handleChange} maxLength={20}
                            className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="cuota" className="text-primary-foreground/80">Cuota deseada</Label>
                          <Select
                            name="cuota"
                            value={form.cuota}
                            onValueChange={(value) => setForm((prev) => ({ ...prev, cuota: value }))}
                          >
                            <SelectTrigger
                              id="cuota"
                              className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground focus:ring-secondary [&>span]:text-primary-foreground/40 data-[state=open]:bg-primary-foreground/10"
                            >
                              <SelectValue placeholder="Selecciona una cuota" />
                            </SelectTrigger>
                            <SelectContent className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                              <SelectItem value="5€ mensual" className="focus:bg-primary-foreground/20 focus:text-primary-foreground">5€ mensual</SelectItem>
                              <SelectItem value="50€ anual" className="focus:bg-primary-foreground/20 focus:text-primary-foreground">50€ anual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label htmlFor="mensaje" className="text-primary-foreground/80">Mensaje (opcional)</Label>
                      <Textarea id="mensaje" name="mensaje" value={form.mensaje} onChange={handleChange} maxLength={1000} rows={3}
                        className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" />
                    </div>
                    <p className="text-xs text-primary-foreground/50">
                      Tus datos se envían por correo a la asociación para tramitar tu alta manualmente.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setTipo(null)}
                        className="text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                      >
                        Volver
                      </Button>
                      <Button
                        type="submit"
                        disabled={sending}
                        className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold"
                      >
                        {sending ? "Enviando..." : "Enviar solicitud"}
                      </Button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>

          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground/90">
            <Mail className="h-4 w-4 text-secondary" />
            <span className="text-sm md:text-base font-medium">info@ahoraorg.es</span>
          </div>

          <p className="text-sm text-primary-foreground/50">Disculpa las molestias.</p>
        </div>
      </div>
    </div>
  );
}
