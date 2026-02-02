import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { ChevronRight, Calendar, Loader2, Search, Filter, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatInMadrid } from "@/lib/timezone";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Categoria {
  id: string;
  nombre: string;
  color: string;
}

interface Noticia {
  id: string;
  titulo: string;
  extracto: string | null;
  contenido: string | null;
  imagen_url: string | null;
  fecha_publicacion: string | null;
  categoria_id: string | null;
  solo_socios: boolean;
  categorias_noticia: Categoria | null;
}

const ITEMS_PER_PAGE = 10;

const Noticias = () => {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("todas");
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      // Noticias will be filtered by RLS policies:
      // - Anon users: only published, non-exclusive articles
      // - Socios: all published articles (including exclusive)
      // - Admins: all articles
      const [noticiasRes, categoriasRes] = await Promise.all([
        supabase
          .from("noticias")
          .select("*, categorias_noticia(*)")
          .eq("publicada", true)
          .order("fecha_publicacion", { ascending: false }),
        supabase.from("categorias_noticia").select("*").order("nombre"),
      ]);

      if (noticiasRes.error) {
        console.error("Error fetching noticias:", noticiasRes.error);
      } else {
        setNoticias(noticiasRes.data || []);
      }

      if (categoriasRes.data) {
        setCategorias(categoriasRes.data);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]); // Refetch when user auth state changes

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return formatInMadrid(dateString, "dd MMM yyyy");
  };

  // Filter news
  const filteredNoticias = noticias.filter((noticia) => {
    const matchesSearch =
      noticia.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (noticia.extracto?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategoria =
      selectedCategoria === "todas" || noticia.categoria_id === selectedCategoria;
    return matchesSearch && matchesCategoria;
  });

  // Pagination
  const totalPages = Math.ceil(filteredNoticias.length / ITEMS_PER_PAGE);
  const paginatedNoticias = filteredNoticias.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategoria]);

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-hero py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary-foreground mb-6">
              Sala de Prensa
            </h1>
            <p className="text-xl text-primary-foreground/80">
              Comunicados, notas de prensa y actualidad de AHORA.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="h-1 bg-secondary" />
      <section className="py-8 border-b border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar noticias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las categorías</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Noticias Grid */}
      <section className="py-16 md:py-24">
        <div className="container">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredNoticias.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No hay noticias disponibles con los filtros seleccionados.
            </p>
          ) : (
            <>
              <div className="grid gap-8">
                {paginatedNoticias.map((noticia, index) => (
                  <article
                    key={noticia.id}
                    className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-elevated transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="grid md:grid-cols-[300px_1fr]">
                      {noticia.imagen_url ? (
                        <div className="h-48 md:h-full overflow-hidden">
                          <img
                            src={noticia.imagen_url}
                            alt={noticia.titulo}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-48 md:h-full bg-secondary/20 flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">Sin imagen</span>
                        </div>
                      )}
                      <div className="p-6 md:p-8">
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                          {noticia.solo_socios && (
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Exclusivo
                            </span>
                          )}
                          {noticia.categorias_noticia ? (
                            <span
                              className="px-3 py-1 text-xs font-medium rounded-full text-white"
                              style={{ backgroundColor: noticia.categorias_noticia.color }}
                            >
                              {noticia.categorias_noticia.nombre}
                            </span>
                          ) : (
                            <span className="px-3 py-1 text-xs font-medium bg-secondary/20 text-secondary-foreground rounded-full">
                              General
                            </span>
                          )}
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(noticia.fecha_publicacion)}
                          </div>
                        </div>
                        <Link to={`/noticias/${noticia.id}`}>
                          <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors cursor-pointer">
                            {noticia.titulo}
                          </h2>
                        </Link>
                        <p className="text-muted-foreground mb-4 text-justify">
                          {noticia.extracto}
                        </p>
                        <Link
                          to={`/noticias/${noticia.id}`}
                          className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          Leer noticia completa
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Noticias;