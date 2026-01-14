import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

const ArticleCTA = () => {
  return (
    <div className="my-10 p-6 md:p-8 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 rounded-2xl border border-primary/20 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/20 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full mb-4">
          <Users className="w-6 h-6 text-primary" />
        </div>
        
        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
          Únete al movimiento
        </h3>
        
        <p className="text-muted-foreground max-w-lg mx-auto mb-6">
          Defiende los valores constitucionales, el pluralismo y los derechos fundamentales en España. 
          Juntos podemos construir un futuro mejor.
        </p>
        
        <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
          <Link to="/hazte-socio">
            Hazte socio
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default ArticleCTA;
