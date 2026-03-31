import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function HeroSection() {
  const { isAdmin } = useAuth();

  return (
    <section className="relative h-[90vh] min-h-[600px] overflow-hidden">
      <img
        src="/images/hero-kashmir.webp"
        alt="Kashmir landscape"
        className="absolute inset-0 w-full h-full object-cover"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/20 to-foreground/70" />
      
      <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-end pb-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-2xl"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/20 backdrop-blur-sm text-primary-foreground text-sm font-medium mb-6 border border-primary-foreground/10"
          >
            Purna Travels
          </motion.span>
          <h1 className="text-display font-display font-bold text-primary-foreground mb-4">
            Your Journey,{" "}
            <span className="text-primary">Unbounded.</span>
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-lg mb-8 font-body">
            From the serene valleys of Kashmir to the turquoise shores of Andaman. Experience travel curated for the restless soul.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="rounded-full px-8 text-base">
              <Link to="/packages">
                Explore Packages <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 text-base bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground">
              <a href="https://wa.me/917047538555" target="_blank" rel="noopener noreferrer">
                Talk to Us
              </a>
            </Button>
            <Button asChild variant="ghost" size="lg" className="rounded-full px-8 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to={isAdmin ? "/admin" : "/admin/login"}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                {isAdmin ? "Open Admin Dashboard" : "Admin Portal"}
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
