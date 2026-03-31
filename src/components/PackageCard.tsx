import { Link } from "react-router-dom";
import { Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { PackageWithMedia } from "@/hooks/useDatabase";
import { getPackagePricingDetails, resolveDestinationImage, resolveDestinationName } from "@/lib/cms";

interface PackageCardProps {
  pkg: PackageWithMedia;
  index?: number;
}

export default function PackageCard({ pkg, index = 0 }: PackageCardProps) {
  const firstImage = pkg.package_media?.find((media) => media.type === "image")?.url
    || resolveDestinationImage(pkg.destination_record);
  const destinationName = resolveDestinationName(pkg.destination_record, pkg.destination);
  const pricing = getPackagePricingDetails(pkg.price, pkg.actual_price);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -8 }}
      className="group rounded-2xl bg-card p-3 shadow-elegant hover:shadow-card-hover transition-all duration-300"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
        <img
          src={firstImage}
          alt={pkg.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-4 left-4 bg-card/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-foreground">
          {destinationName}
        </div>
        {pkg.featured && (
          <div className="absolute top-4 right-4 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Featured
          </div>
        )}
        {pricing.hasDiscount && (
          <div className="absolute bottom-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            {pricing.discountPercent}% Off
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-display font-semibold text-card-foreground leading-tight">{pkg.title}</h3>
        <div className="flex items-center gap-4 mt-2 text-muted-foreground text-sm">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {pkg.duration}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {destinationName}</span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{pkg.short_description}</p>
        <div className="mt-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Starting from</span>
            <p className="text-2xl font-display font-bold text-primary">Rs. {pricing.discountedPrice.toLocaleString("en-IN")}</p>
            {pricing.hasDiscount && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground line-through">Rs. {pricing.actualPrice.toLocaleString("en-IN")}</span>
                <span className="text-xs font-semibold text-emerald-600">Save Rs. {pricing.discountAmount.toLocaleString("en-IN")}</span>
              </div>
            )}
          </div>
          <Button asChild variant="secondary" size="sm" className="rounded-lg">
            <Link to={`/packages/${pkg.slug}`}>View Details</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
