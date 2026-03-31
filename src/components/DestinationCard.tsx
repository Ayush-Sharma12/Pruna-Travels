import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface DestinationCardProps {
  name: string;
  slug: string;
  image: string;
  webpImage?: string;
  packageCount: number;
  tagline: string;
  index?: number;
}

export default function DestinationCard({ name, slug, image, webpImage, packageCount, tagline, index = 0 }: DestinationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.15, ease: [0.23, 1, 0.32, 1] }}
    >
      <Link
        to={`/destinations/${slug}`}
        className="group relative block aspect-[3/4] md:aspect-[4/5] rounded-2xl overflow-hidden"
      >
        <picture>
          {webpImage && <source srcSet={webpImage} type="image/webp" />}
          <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
        </picture>
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="text-sm font-medium text-primary-foreground/70 mb-1">{tagline}</p>
          <h3 className="text-2xl font-display font-bold text-primary-foreground">{name}</h3>
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm text-primary-foreground/70">{packageCount} packages</span>
            <span className="flex items-center gap-1 text-sm font-medium text-primary-foreground group-hover:gap-2 transition-all">
              Explore <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
