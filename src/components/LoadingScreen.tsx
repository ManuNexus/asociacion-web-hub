import { useEffect, useState } from "react";
import logoAhora from "@/assets/logo-ahora.png";

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary transition-opacity duration-500">
      <div className="flex flex-col items-center gap-6">
        <img 
          src={logoAhora} 
          alt="AHORA" 
          className="h-16 brightness-0 invert animate-pulse" 
        />
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
