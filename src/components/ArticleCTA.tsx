import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import ctaBanner from "@/assets/cta-banner.png";

const ArticleCTA = () => {
  return (
    <div className="py-6 px-6 bg-gradient-to-r from-muted via-card to-muted border-l-4 border-secondary rounded-r-xl flex flex-col sm:flex-row items-center gap-5 shadow-md">
      {/* Image */}
      <div className="shrink-0">
        <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-secondary shadow-md">
          <img src={ctaBanner} alt="Únete al movimiento" className="w-full h-full object-cover" />
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 text-center sm:text-left">
        <h4 className="text-lg font-bold text-foreground mb-1">
          ¡<span className="text-secondary">Únete</span> al movimiento!
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
          Formar parte
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
};

export default ArticleCTA;
