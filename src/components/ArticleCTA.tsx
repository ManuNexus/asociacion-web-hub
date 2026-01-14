import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import logoIcon from "@/assets/logo-ahora-icon.png";

const ArticleCTA = () => {
  return (
    <div className="my-10 py-6 px-6 bg-gradient-to-r from-muted via-card to-muted border-l-4 border-secondary rounded-r-xl flex flex-col sm:flex-row items-center gap-5 shadow-md">
      {/* Logo/Image */}
      <div className="shrink-0">
        <div className="w-16 h-16 rounded-full bg-secondary/20 border-2 border-secondary flex items-center justify-center">
          <img src={logoIcon} alt="AHORA" className="w-10 h-10 object-contain" />
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 text-center sm:text-left">
        <h4 className="text-lg font-bold text-foreground mb-1">
          <span className="text-secondary">¡Únete</span> al movimiento!
        </h4>
        <p className="text-muted-foreground text-sm">
          Defiende los valores constitucionales, el pluralismo y los derechos fundamentales en España.
        </p>
      </div>
      
      {/* Button */}
      <Button 
        asChild 
        className="bg-secondary hover:bg-secondary/90 text-primary font-semibold shrink-0 shadow-lg"
      >
        <Link to="/hazte-socio" className="flex items-center gap-2">
          Hazte socio
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
};

export default ArticleCTA;
