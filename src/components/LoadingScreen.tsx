import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import logoAhoraWhite from "@/assets/logo-ahora-white.png";

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const location = useLocation();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const duration = isFirstLoad.current ? 2000 : 800;
    isFirstLoad.current = false;
    
    // Show immediately
    setIsVisible(true);
    setIsLoading(true);
    
    // Start fade out after duration
    const fadeTimer = setTimeout(() => {
      setIsLoading(false);
    }, duration);
    
    // Remove from DOM after fade animation
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, duration + 300);
    
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [location.pathname]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-primary transition-opacity duration-300 ${
        isLoading ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        <img 
          src={logoAhoraWhite} 
          alt="AHORA" 
          className="h-16 animate-pulse" 
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
