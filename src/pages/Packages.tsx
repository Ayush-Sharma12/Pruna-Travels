import { useState } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import PackageCard from "@/components/PackageCard";
import { useDestinations, usePackages } from "@/hooks/useDatabase";
import { Button } from "@/components/ui/button";

export default function PackagesPage() {
  const [filter, setFilter] = useState<string>("All");
  const { packages, loading } = usePackages();
  const { destinations } = useDestinations();

  const filterOptions = ["All", ...destinations.map((destination) => destination.name)];
  const filteredPackages = filter === "All" ? packages : packages.filter((pkg) => pkg.destination === filter);

  return (
    <Layout>
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">Tour Packages</h1>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">Browse the packages currently available for the destinations your team is publishing.</p>
          </motion.div>

          <div className="flex justify-center gap-2 mb-10 flex-wrap">
            {filterOptions.map((option) => (
              <Button key={option} variant={filter === option ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setFilter(option)}>
                {option === "All" ? "All Destinations" : option}
              </Button>
            ))}
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-20">Loading packages...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPackages.map((pkg, index) => (
                <PackageCard key={pkg.id} pkg={pkg} index={index} />
              ))}
            </div>
          )}

          {!loading && filteredPackages.length === 0 && (
            <p className="text-center text-muted-foreground py-20">No packages found for this filter.</p>
          )}
        </div>
      </section>
    </Layout>
  );
}
