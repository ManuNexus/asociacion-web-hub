import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const ArticleCTA = () => {
  return (
    <div className="my-8 py-4 px-5 bg-card border-l-4 border-secondary rounded-r-lg flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-secondary rounded-full hidden sm:block" />
        <p className="text-foreground font-medium text-center sm:text-left">
          <span className="text-secondary font-bold">¡Únete!</span> Defiende los valores constitucionales, el pluralismo y los derechos fundamentales.
        </p>
      </div>
      
      <Button 
        asChild 
        size="sm"
        className="bg-secondary hover:bg-secondary/90 text-primary font-semibold shrink-0"
      >
        <Link to="/hazte-socio" className="flex items-center gap-1.5">
          Hazte socio
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
};

export default ArticleCTA;
