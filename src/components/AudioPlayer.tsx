import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface AudioPlayerProps {
  title: string;
  content: string;
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

export function AudioPlayer(props: AudioPlayerProps) {
  // Algunos navegadores (Facebook/Instagram in-app en Android) no exponen speechSynthesis.
  // Hacemos un guard fuera del componente con hooks para evitar ReferenceError al renderizar.
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }
  return <AudioPlayerInner {...props} />;
}

function AudioPlayerInner({ title, content }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [voiceIndex, setVoiceIndex] = useState(-1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chunksRef = useRef<string[]>([]);
  const currentChunkRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load Spanish voices
  useEffect(() => {
    const loadVoices = () => {
      const allVoices = speechSynthesis.getVoices();
      const spanishVoices = allVoices.filter(
        (v) => v.lang.startsWith("es")
      );
      const available = spanishVoices.length > 0 ? spanishVoices : allVoices.slice(0, 5);
      setVoices(available);

      if (available.length > 0 && voiceIndex === -1) {
        // Priority: Google es-ES > Microsoft es-ES > any es-ES with "natural"/"neural" > first es-ES
        const priorities = [
          (v: SpeechSynthesisVoice) => v.lang === "es-ES" && v.name.toLowerCase().includes("google"),
          (v: SpeechSynthesisVoice) => v.lang === "es-ES" && v.name.toLowerCase().includes("microsoft"),
          (v: SpeechSynthesisVoice) => v.lang === "es-ES" && /natural|neural|premium/i.test(v.name),
          (v: SpeechSynthesisVoice) => v.lang === "es-ES" && !v.localService,
          (v: SpeechSynthesisVoice) => v.lang === "es-ES",
          (v: SpeechSynthesisVoice) => v.lang.startsWith("es"),
        ];

        let bestIndex = 0;
        for (const predicate of priorities) {
          const idx = available.findIndex(predicate);
          if (idx >= 0) { bestIndex = idx; break; }
        }
        setVoiceIndex(bestIndex);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  // Clean text for reading
  const fullText = `${title}. ${stripHtml(content)}`;

  // Split into chunks (SpeechSynthesis has limits on long texts)
  const splitIntoChunks = useCallback((text: string): string[] => {
    const maxLen = 180;
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];
    let current = "";

    for (const sentence of sentences) {
      if ((current + sentence).length > maxLen && current) {
        chunks.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }, []);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    currentChunkRef.current = 0;
    stopTracking();
  }, [stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      stopTracking();
    };
  }, [stopTracking]);

  const speakChunk = useCallback(
    (index: number) => {
      const chunks = chunksRef.current;
      if (index >= chunks.length) {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
        stopTracking();
        return;
      }

      currentChunkRef.current = index;
      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.rate = speed;
      utterance.pitch = 1.0;
      utterance.volume = isMuted ? 0 : 1;
      utterance.lang = "es-ES";

      if (voices.length > 0 && voiceIndex >= 0) {
        utterance.voice = voices[voiceIndex];
      }

      utterance.onend = () => {
        const next = currentChunkRef.current + 1;
        speakChunk(next);
      };

      utterance.onerror = (e) => {
        if (e.error !== "canceled") {
          console.error("Speech error:", e.error);
          stop();
        }
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);

      // Update progress
      stopTracking();
      intervalRef.current = setInterval(() => {
        const pct = ((currentChunkRef.current + 0.5) / chunks.length) * 100;
        setProgress(Math.min(pct, 99));
      }, 300);
    },
    [speed, isMuted, voices, voiceIndex, stop, stopTracking]
  );

  const play = useCallback(() => {
    if (isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    speechSynthesis.cancel();
    const chunks = splitIntoChunks(fullText);
    chunksRef.current = chunks;
    currentChunkRef.current = 0;
    setIsPlaying(true);
    setIsPaused(false);
    setProgress(0);
    speakChunk(0);
  }, [isPaused, fullText, splitIntoChunks, speakChunk]);

  const pause = useCallback(() => {
    speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  }, []);

  const skipForward = useCallback(() => {
    if (!chunksRef.current.length) return;
    speechSynthesis.cancel();
    const next = Math.min(currentChunkRef.current + 3, chunksRef.current.length - 1);
    speakChunk(next);
  }, [speakChunk]);

  const skipBack = useCallback(() => {
    if (!chunksRef.current.length) return;
    speechSynthesis.cancel();
    const prev = Math.max(currentChunkRef.current - 3, 0);
    speakChunk(prev);
  }, [speakChunk]);

  const cycleSpeed = useCallback(() => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const current = speeds.indexOf(speed);
    const next = speeds[(current + 1) % speeds.length];
    setSpeed(next);

    // Restart current chunk with new speed
    if (isPlaying || isPaused) {
      speechSynthesis.cancel();
      // Small delay to let cancel complete
      setTimeout(() => speakChunk(currentChunkRef.current), 50);
    }
  }, [speed, isPlaying, isPaused, speakChunk]);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => !m);
  }, []);

  // Estimate duration
  const wordCount = fullText.split(/\s+/).length;
  const estimatedMinutes = Math.max(1, Math.ceil(wordCount / (150 * speed)));

  if (!("speechSynthesis" in window)) return null;

  return (
    <div className="flex items-center gap-3 px-5 py-3 bg-muted/40 border border-border rounded-xl">
      {/* Play/Pause */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={skipBack}
          disabled={!isPlaying && !isPaused}
          title="Retroceder"
        >
          <SkipBack className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="default"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={isPlaying ? pause : play}
          title={isPlaying ? "Pausar" : "Escuchar noticia"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={skipForward}
          disabled={!isPlaying && !isPaused}
          title="Avanzar"
        >
          <SkipForward className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <Slider
          value={[progress]}
          max={100}
          step={1}
          className="h-1.5 cursor-default flex-1"
          disabled
        />
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
          ~{estimatedMinutes} min
        </span>
      </div>

      {/* Speed */}
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs font-mono min-w-[3rem]"
        onClick={cycleSpeed}
        title="Velocidad de lectura"
      >
        {speed}x
      </Button>

      {/* Stop */}
      {(isPlaying || isPaused) && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={stop}
          title="Detener"
        >
          <Square className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Mute */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground hidden sm:flex"
        onClick={toggleMute}
        title={isMuted ? "Activar sonido" : "Silenciar"}
      >
        {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}
