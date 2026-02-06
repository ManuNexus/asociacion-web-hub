import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Radio, Tv, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatInMadrid } from "@/lib/timezone";

interface Video {
  id: string;
  titulo: string;
  descripcion: string | null;
  youtube_url: string;
  tipo: string;
  en_directo: boolean;
  destacado: boolean;
  created_at: string;
}

// Extract YouTube video ID from various URL formats
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function AhoraTVViewer() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ahora_tv")
      .select("*")
      .eq("activo", true)
      .order("destacado", { ascending: false })
      .order("en_directo", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) {
      setVideos(data);
    }
    setLoading(false);
  };

  // Get live streams
  const directos = videos.filter(v => v.tipo === "directo" && v.en_directo);
  // Get regular videos
  const regularVideos = videos.filter(v => !(v.tipo === "directo" && v.en_directo));

  if (loading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5" />
            AHORA TV
          </CardTitle>
          <CardDescription>
            Vídeos y emisiones en directo exclusivas para socios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Live streams section */}
          {directos.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-destructive">
                <Radio className="h-4 w-4 animate-pulse" />
                EN DIRECTO AHORA
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {directos.map((video) => {
                  const videoId = getYouTubeVideoId(video.youtube_url);
                  return (
                    <Card 
                      key={video.id} 
                      className="overflow-hidden border-destructive/50 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors"
                      onClick={() => setSelectedVideo(video)}
                    >
                      <div className="relative aspect-video bg-muted">
                        {videoId && (
                          <img 
                            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                            alt={video.titulo}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="bg-white/90 rounded-full p-4">
                            <Play className="h-8 w-8 text-destructive fill-destructive" />
                          </div>
                        </div>
                        <Badge className="absolute top-2 left-2 bg-destructive animate-pulse">
                          <Radio className="h-3 w-3 mr-1" />
                          EN DIRECTO
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-semibold line-clamp-2">{video.titulo}</h4>
                        {video.descripcion && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {video.descripcion}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Regular videos section */}
          {regularVideos.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Play className="h-4 w-4" />
                Vídeos
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {regularVideos.map((video) => {
                  const videoId = getYouTubeVideoId(video.youtube_url);
                  return (
                    <Card 
                      key={video.id} 
                      className="overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedVideo(video)}
                    >
                      <div className="relative aspect-video bg-muted">
                        {videoId && (
                          <img 
                            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                            alt={video.titulo}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <div className="bg-white/90 rounded-full p-3">
                            <Play className="h-6 w-6 text-primary fill-primary" />
                          </div>
                        </div>
                        {video.destacado && (
                          <Badge className="absolute top-2 left-2 bg-secondary text-secondary-foreground">
                            Destacado
                          </Badge>
                        )}
                        {video.tipo === "directo" && !video.en_directo && (
                          <Badge variant="outline" className="absolute top-2 left-2 bg-background/80">
                            Directo grabado
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-medium line-clamp-2 text-sm">{video.titulo}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatInMadrid(video.created_at, "d MMM yyyy")}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {videos.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Tv className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay contenido disponible todavía</p>
              <p className="text-sm">Pronto añadiremos vídeos y emisiones en directo</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video player dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">{selectedVideo?.titulo}</DialogTitle>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setSelectedVideo(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            {selectedVideo && getYouTubeVideoId(selectedVideo.youtube_url) && (
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedVideo.youtube_url)}?autoplay=1`}
                  title={selectedVideo.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-start gap-2">
              {selectedVideo?.en_directo && (
                <Badge className="bg-destructive shrink-0">
                  <Radio className="h-3 w-3 mr-1" />
                  EN DIRECTO
                </Badge>
              )}
              <div>
                <h2 className="font-semibold text-lg">{selectedVideo?.titulo}</h2>
                {selectedVideo?.descripcion && (
                  <p className="text-muted-foreground mt-1">{selectedVideo.descripcion}</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
