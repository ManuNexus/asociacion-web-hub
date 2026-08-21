import { Construction, Mail } from "lucide-react";
import logoAhoraWhite from "@/assets/logo-ahora-white.png";

export function MaintenanceScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary p-6">
      <div className="relative max-w-xl w-full text-center">
        {/* Decorative glows */}
        <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative flex flex-col items-center gap-8">
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

          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground/90">
            <Mail className="h-4 w-4 text-secondary" />
            <span className="text-sm md:text-base font-medium">
              info@ahoraorg.es
            </span>
          </div>

          <p className="text-sm text-primary-foreground/50">
            Disculpa las molestias.
          </p>
        </div>
      </div>
    </div>
  );
}
