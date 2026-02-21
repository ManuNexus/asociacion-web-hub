import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Trash2, Mail, Phone } from "lucide-react";
import { formatInMadrid } from "@/lib/timezone";

interface Amigo {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  created_at: string;
}

export const AdminAmigos = () => {
  const [amigos, setAmigos] = useState<Amigo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [amigoToDelete, setAmigoToDelete] = useState<Amigo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAmigos();
  }, []);

  const fetchAmigos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("amigos")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAmigos(data);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!amigoToDelete) return;
    setDeleting(true);

    const { error } = await supabase
      .from("amigos")
      .delete()
      .eq("id", amigoToDelete.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el amigo",
      });
    } else {
      toast({ title: "Amigo eliminado correctamente" });
      fetchAmigos();
    }

    setDeleteDialogOpen(false);
    setAmigoToDelete(null);
    setDeleting(false);
  };

  const filteredAmigos = amigos.filter(
    (a) =>
      a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>
            Amigos registrados ({amigos.length})
          </CardTitle>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredAmigos.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {searchTerm ? "No se encontraron resultados" : "No hay amigos registrados"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Fecha registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAmigos.map((amigo) => (
                  <TableRow key={amigo.id}>
                    <TableCell className="font-medium">
                      {amigo.nombre} {amigo.apellidos}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`mailto:${amigo.email}`}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {amigo.email}
                      </a>
                    </TableCell>
                    <TableCell>
                      {amigo.telefono ? (
                        <a
                          href={`tel:${amigo.telefono}`}
                          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {amigo.telefono}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatInMadrid(amigo.created_at, "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setAmigoToDelete(amigo);
                          setDeleteDialogOpen(true);
                        }}
                        title="Eliminar amigo"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar amigo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará a <strong>{amigoToDelete?.nombre} {amigoToDelete?.apellidos}</strong> de la lista de amigos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
