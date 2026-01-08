import { 
  LayoutDashboard, 
  ArrowUpDown, 
  FileText, 
  PiggyBank,
  BarChart3, 
  Tag, 
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export type ContabilidadSection = 
  | "dashboard" 
  | "transacciones" 
  | "facturas" 
  | "tesoreria"
  | "cobros"
  | "informes" 
  | "categorias" 
  | "proveedores";

interface ContabilidadSidebarProps {
  activeSection: ContabilidadSection;
  onSectionChange: (section: ContabilidadSection) => void;
}

const menuItems = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "transacciones" as const, label: "Transacciones", icon: ArrowUpDown },
  { id: "facturas" as const, label: "Facturas", icon: FileText },
  { id: "tesoreria" as const, label: "Tesorería", icon: PiggyBank },
  { id: "cobros" as const, label: "Cobros Cuotas", icon: Receipt },
  { id: "informes" as const, label: "Informes", icon: BarChart3 },
];

const configItems = [
  { id: "categorias" as const, label: "Categorías", icon: Tag },
  { id: "proveedores" as const, label: "Proveedores", icon: Building2 },
];

export const ContabilidadSidebar = ({ 
  activeSection, 
  onSectionChange 
}: ContabilidadSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "bg-card border-r flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Header */}
      <div className={cn(
        "h-14 border-b flex items-center px-4",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <span className="font-semibold text-lg">Contabilidad</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Main menu */}
      <nav className="flex-1 p-2 space-y-1">
        {!collapsed && (
          <span className="text-xs font-medium text-muted-foreground px-3 py-2 block">
            Principal
          </span>
        )}
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={activeSection === item.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 h-10",
              collapsed && "justify-center px-2",
              activeSection === item.id && "bg-primary/10 text-primary hover:bg-primary/15"
            )}
            onClick={() => onSectionChange(item.id)}
          >
            <item.icon className={cn("h-4 w-4 shrink-0", activeSection === item.id && "text-primary")} />
            {!collapsed && <span>{item.label}</span>}
          </Button>
        ))}

        <div className="pt-4">
          {!collapsed && (
            <span className="text-xs font-medium text-muted-foreground px-3 py-2 block">
              Configuración
            </span>
          )}
          {configItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-10",
                collapsed && "justify-center px-2",
                activeSection === item.id && "bg-primary/10 text-primary hover:bg-primary/15"
              )}
              onClick={() => onSectionChange(item.id)}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", activeSection === item.id && "text-primary")} />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          ))}
        </div>
      </nav>

      {/* Footer info */}
      {!collapsed && (
        <div className="p-4 border-t">
          <div className="text-xs text-muted-foreground text-center">
            Gestión financiera
          </div>
        </div>
      )}
    </aside>
  );
};
