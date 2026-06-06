import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Calendar, Clock, Star, Lock, Link2, Check } from "lucide-react";
import { formatInMadrid } from "@/lib/timezone";
import logoIcon from "@/assets/logo-ahora-icon.png";
import { TweetEmbed, isTweetUrl } from "@/components/TweetEmbed";
import ArticleCTA from "@/components/ArticleCTA";
import { AudioPlayer } from "@/components/AudioPlayer";
import { useAuth } from "@/hooks/useAuth";
import { SEO, articleSchema, breadcrumbSchema } from "@/components/SEO";

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
  autor: string | null;
  autor_socio_id: string | null;
  fecha_publicacion: string | null;
  categoria_id: string | null;
  solo_socios: boolean;
  categorias_noticia: Categoria | null;
  socios?: { id: string; nombre: string; apellidos: string; foto_url: string | null } | null;
}

const NoticiaDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isSocio, isAdmin } = useAuth();
  const [noticia, setNoticia] = useState<Noticia | null>(null);
  const [relatedNoticias, setRelatedNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [notFound, setNotFound] = useState(false);
  
  // Check if user can view exclusive content
  const canViewExclusive = isSocio || isAdmin;

  useEffect(() => {
    const fetchNoticia = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Fetch the news article (RLS will handle published/admin access)
      let { data, error } = await supabase
        .from("noticias")
        .select("*, categorias_noticia(*)")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        // If there's an author socio, fetch their public info via the secure function
        let authorInfo = null;
        if (data.autor_socio_id) {
          const { data: authorData } = await supabase
            .rpc("get_news_author", { author_socio_id: data.autor_socio_id });
          if (authorData && authorData.length > 0) {
            authorInfo = authorData[0];
          }
        }
        
        setNoticia({
          ...data,
          socios: authorInfo
        });
        
        // Fetch related news (only published)
        const { data: related } = await supabase
          .from("noticias")
          .select("*, categorias_noticia(*)")
          .eq("publicada", true)
          .neq("id", id)
          .order("fecha_publicacion", { ascending: false })
          .limit(3);
        setRelatedNoticias(related || []);
      }
      setLoading(false);
    };

    fetchNoticia();
  }, [id]);

  const getReadingTime = (text: string | null) => {
    if (!text) return 1;
    const words = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  // Share URL uses the production domain - OG tags are handled by Cloudflare Worker proxy
  const shareUrl = noticia ? `https://ahoraorg.es/noticias/${noticia.id}` : "";
  const shareTitle = noticia?.titulo || "";

  const socialLinks = [
    {
      name: "X",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Facebook",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "LinkedIn",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`,
    },
    {
      name: "WhatsApp",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      url: `https://wa.me/?text=${encodeURIComponent(shareTitle + " " + shareUrl)}`,
    },
    {
      name: "Telegram",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
    },
  ];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return formatInMadrid(dateString, "dd MMM yyyy");
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (notFound || !noticia) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Noticia no encontrada</h1>
          <p className="text-muted-foreground mb-6">
            La noticia que buscas no existe o no está disponible.
          </p>
          <Button onClick={() => navigate("/noticias")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a noticias
          </Button>
        </div>
      </Layout>
    );
  }

  const readingTime = getReadingTime(noticia.contenido);

  return (
    <Layout>
      <SEO
        title={noticia.titulo}
        description={noticia.extracto || noticia.titulo}
        canonical={`/noticias/${noticia.id}`}
        ogImage={noticia.imagen_url || undefined}
        ogImageAlt={noticia.titulo}
        ogType="article"
        datePublished={noticia.fecha_publicacion || undefined}
        jsonLd={[
          articleSchema({
            title: noticia.titulo,
            description: noticia.extracto || noticia.titulo,
            url: `/noticias/${noticia.id}`,
            image: noticia.imagen_url || undefined,
            datePublished: noticia.fecha_publicacion || undefined,
            author: noticia.autor || "AHORA",
          }),
          breadcrumbSchema([
            { name: "Inicio", url: "/" },
            { name: "Noticias", url: "/noticias" },
            { name: noticia.titulo, url: `/noticias/${noticia.id}` },
          ]),
        ]}
      />
      {/* Hero Image */}
      {noticia.imagen_url && (
        <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden">
          <img
            src={noticia.imagen_url}
            alt={noticia.titulo}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
      )}

      <article className={`container max-w-4xl ${noticia.imagen_url ? '-mt-24 relative z-10' : 'pt-8'}`}>
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/noticias")}
          className="mb-6 bg-background/80 backdrop-blur-sm hover:bg-background"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a noticias
        </Button>

        {/* Article Card */}
        <div className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden">
          {/* Header */}
          <header className="p-6 md:p-10">
            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {noticia.solo_socios && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                  <Star className="h-3 w-3" />
                  Exclusivo para socios
                </div>
              )}
              {noticia.categorias_noticia ? (
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: noticia.categorias_noticia.color }}
                >
                  <span className="w-2 h-2 bg-white/50 rounded-full"></span>
                  {noticia.categorias_noticia.nombre}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  General
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6">
              {noticia.titulo}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-muted-foreground">
              {/* Author */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {noticia.socios?.foto_url ? (
                    <img src={noticia.socios.foto_url} alt={noticia.autor || "Autor"} className="w-full h-full object-cover" />
                  ) : (
                    <img src={logoIcon} alt="AHORA" className="w-5 h-5 object-contain" />
                  )}
                </div>
                <span className="font-medium text-foreground">{noticia.autor || "AHORA"}</span>
              </div>

              {/* Separator */}
              <span className="hidden md:block w-1 h-1 bg-muted-foreground/50 rounded-full"></span>

              {/* Date */}
              {noticia.fecha_publicacion && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <time>
                    {formatInMadrid(noticia.fecha_publicacion, "d 'de' MMMM, yyyy")}
                  </time>
                </div>
              )}

              {/* Separator */}
              <span className="hidden md:block w-1 h-1 bg-muted-foreground/50 rounded-full"></span>

              {/* Reading Time */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{readingTime} min de lectura</span>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">Compartir en:</p>
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/50 text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    title={`Compartir en ${social.name}`}
                  >
                    {social.icon}
                  </a>
                ))}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/50 text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  title="Copiar enlace"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </header>

          {/* Audio Player - oculto si la noticia es exclusiva y el usuario no es socio/admin */}
          {noticia.contenido && (!noticia.solo_socios || canViewExclusive) && (
            <div className="px-6 md:px-10 mt-4 mb-6">
              <AudioPlayer title={noticia.titulo} content={noticia.contenido} />
            </div>
          )}

          {/* Extracto with visual separator */}
          {noticia.extracto && (
            <div className="px-6 md:px-10">
              <div className="relative py-6 border-y border-border">
                {/* Decorative quote */}
                <div className="absolute -top-3 left-0 text-6xl text-primary/20 font-serif leading-none">"</div>
                <p className="text-lg md:text-xl text-muted-foreground font-medium italic leading-relaxed pl-8">
                  {noticia.extracto}
                </p>
              </div>
            </div>
          )}

          {/* Las noticias marcadas como "solo_socios" requieren iniciar sesión como socio/admin */}
          {noticia.solo_socios && !canViewExclusive ? (
            <div className="px-6 md:px-10 py-12">
              <div className="bg-secondary/30 border border-border rounded-xl p-8 text-center">
                <Lock className="h-12 w-12 mx-auto text-primary mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Contenido exclusivo para socios</h2>
                <p className="text-muted-foreground mb-6">
                  Esta noticia está reservada para socios de AHORA. Inicia sesión con tu cuenta de socio para leerla completa.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {!user ? (
                    <>
                      <Button onClick={() => navigate("/auth")}>Iniciar sesión</Button>
                      <Button variant="outline" onClick={() => navigate("/hazte-socio")}>Hazte socio</Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={() => navigate("/hazte-socio")}>Hazte socio</Button>
                  )}
                </div>
              </div>
            </div>
          ) : (

            <>
              {/* CTA Block */}
              <div className="px-6 md:px-10 py-6">
                <ArticleCTA />
              </div>

              {/* Content */}
              {noticia.contenido && (
                <div className="p-6 md:p-10 pt-0 -mt-4">
                  {(() => {
                    // Parse content - convert plain text to HTML if needed
                    const isHtml = noticia.contenido!.includes('<');
                    const htmlContent = isHtml 
                      ? noticia.contenido! 
                      : noticia.contenido!.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('');
                    
                    // Split content by tweet URLs to render embeds in place
                    const tweetRegex = /(https?:\/\/(?:twitter\.com|x\.com)\/\w+\/status\/\d+\S*)/g;
                    const parts = htmlContent.split(tweetRegex);
                    
                    const proseClasses = `prose prose-lg max-w-none text-justify
                      [&_p]:mb-5 [&_p]:text-foreground/90 [&_p]:leading-relaxed [&_p]:text-base md:[&_p]:text-lg [&_p]:text-justify
                      [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-4 [&_h1]:text-foreground [&_h1]:text-left
                      [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3 [&_h2]:text-foreground [&_h2]:text-left
                      [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-3 [&_h3]:text-foreground [&_h3]:text-left
                      [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4
                      [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4
                      [&_li]:mb-2 [&_li]:text-foreground/90
                      [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:text-muted-foreground
                      [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80
                      [&_strong]:font-bold [&_strong]:text-foreground
                      [&_em]:italic
                      [&_u]:underline
                      [&_s]:line-through
                    `;
                    
                    return (
                      <>
                        {parts.map((part, index) => {
                          // Check if this part is a tweet URL
                          const isTweet = /^https?:\/\/(?:twitter\.com|x\.com)\/\w+\/status\/\d+/.test(part);
                          
                          if (isTweet) {
                            const cleanUrl = part.replace(/<[^>]*>/g, '').trim();
                            return <TweetEmbed key={`tweet-${index}`} tweetUrl={cleanUrl} />;
                          }
                          
                          // Clean up empty paragraph tags that might be left
                          const cleanedPart = part.replace(/<p[^>]*>\s*<\/p>/g, '').trim();
                          if (!cleanedPart) return null;
                          
                          return (
                            <div 
                              key={`content-${index}`}
                              className={proseClasses}
                              dangerouslySetInnerHTML={{ __html: cleanedPart }}
                            />
                          );
                        })}
                      </>
                    );
                  })()}

                  {/* Footer decoration */}
                  <div className="mt-12 pt-8 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={logoIcon} alt="AHORA" className="w-10 h-10 object-contain opacity-50" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">Asociación AHORA</p>
                          <p>Actuar en el presente para construir el futuro</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/noticias")}
                      >
                        Más noticias
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Related News */}
        {relatedNoticias.length > 0 && (
          <section className="mt-12 mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Noticias relacionadas</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedNoticias.map((related) => (
                <Link
                  key={related.id}
                  to={`/noticias/${related.id}`}
                  className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-elevated transition-all duration-300"
                >
                  {related.imagen_url ? (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={related.imagen_url}
                        alt={related.titulo}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-40 bg-secondary/20 flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">Sin imagen</span>
                    </div>
                  )}
                  <div className="p-4">
                    {related.categorias_noticia && (
                      <span
                        className="inline-block px-2 py-0.5 text-xs font-medium rounded-full text-white mb-2"
                        style={{ backgroundColor: related.categorias_noticia.color }}
                      >
                        {related.categorias_noticia.nombre}
                      </span>
                    )}
                    <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {related.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {formatDate(related.fecha_publicacion)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Bottom spacing */}
        <div className="h-8"></div>
      </article>
    </Layout>
  );
};

export default NoticiaDetalle;