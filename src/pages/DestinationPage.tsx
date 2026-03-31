import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import PackageCard from "@/components/PackageCard";
import { useDestinationBySlug, usePackages } from "@/hooks/useDatabase";

export default function DestinationPage() {
  const { destination: destinationSlug } = useParams<{ destination: string }>();
  const { destination, loading: destinationLoading } = useDestinationBySlug(destinationSlug);
  const { packages, loading: packagesLoading } = usePackages(destination?.id, destination?.name);

  if (destinationLoading) {
    return <Layout><div className="container mx-auto px-4 py-20 text-center"><p className="text-muted-foreground">Loading destination...</p></div></Layout>;
  }

  if (!destination) {
    return <Layout><div className="container mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-display font-bold">Destination not found</h1></div></Layout>;
  }

  const heroImage = destination.hero_image_url || destination.card_image_url || "/placeholder.svg";

  return (
    <Layout>
      <section className="relative h-[50vh] min-h-[350px] overflow-hidden">
        {destination.hero_video_url ? (
          <video src={destination.hero_video_url} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline />
        ) : (
          <img src={heroImage} alt={destination.name} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-foreground/20" />
        <div className="relative z-10 container mx-auto px-4 h-full flex items-end pb-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm uppercase tracking-[0.3em] text-primary-foreground/70 mb-3">{destination.tagline || "Destination"}</p>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground">{destination.name}</h1>
            <p className="mt-3 text-primary-foreground/80 max-w-2xl">{destination.description || destination.short_description}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-10">
            <h2 className="text-2xl font-display font-bold text-foreground mb-3">About {destination.name}</h2>
            <p className="text-muted-foreground leading-relaxed">{destination.short_description || destination.description}</p>
          </div>

          <h2 className="text-2xl font-display font-bold text-foreground mb-8">{destination.name} Packages ({packages.length})</h2>
          {packagesLoading ? (
            <p className="text-center text-muted-foreground py-12">Loading...</p>
          ) : packages.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No packages available yet. Add them from the admin dashboard.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg, index) => (
                <PackageCard key={pkg.id} pkg={pkg} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
