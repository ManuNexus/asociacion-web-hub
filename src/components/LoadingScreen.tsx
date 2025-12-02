import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import logoAhora from "@/assets/logo-ahora.png";

interface LoadingScreenProps {
  initialLoad?: boolean;
}

export function LoadingScreen({ initialLoad = false }: LoadingScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), initialLoad ? 2000 : 800);
    return () => clearTimeout(timer);
  }, [location.pathname, initialLoad]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-primary transition-opacity duration-300 pointer-events-none ${
        isLoading ? "opacity-100" : "opacity-0"
      }`}
    >
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
