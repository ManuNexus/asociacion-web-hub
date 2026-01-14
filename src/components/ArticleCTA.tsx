import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight } from "lucide-react";

const ArticleCTA = () => {
  return (
    <div className="my-10 p-6 md:p-8 bg-gradient-to-r from-secondary via-secondary/90 to-accent rounded-2xl border-2 border-secondary relative overflow-hidden shadow-lg">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/2 right-8 w-20 h-20 bg-white/5 rounded-full" />
      
      <div className="relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
          <Users className="w-7 h-7 text-primary" />
        </div>
        
        <h3 className="text-xl md:text-2xl font-bold text-primary mb-3">
          ¡Únete al movimiento!
        </h3>
        
        <p className="text-primary/80 max-w-lg mx-auto mb-6 font-medium">
          Defiende los valores constitucionales, el pluralismo y los derechos fundamentales en España. 
          Juntos podemos construir un futuro mejor.
        </p>
        
        <Button 
          asChild 
          size="lg" 
          className="bg-primary hover:bg-primary/90 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 font-semibold"
        >
          <Link to="/hazte-socio" className="flex items-center gap-2">
            Hazte socio
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default ArticleCTA;
