import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, MapPin, Check, X, ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import EnquiryForm from "@/components/EnquiryForm";
import { usePackageBySlug } from "@/hooks/useDatabase";
import { getPackagePricingDetails, resolveDestinationImage, resolveDestinationName, slugify } from "@/lib/cms";

export default function PackageDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { pkg, loading } = usePackageBySlug(slug);

  if (loading) {
    return <Layout><div className="container mx-auto px-4 py-20 text-center"><p className="text-muted-foreground">Loading...</p></div></Layout>;
  }

  if (!pkg) {
    return <Layout><div className="container mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-display font-bold">Package not found</h1><Link to="/packages" className="text-primary mt-4 inline-block">Browse all packages</Link></div></Layout>;
  }

  const heroImage = pkg.package_media?.find((media) => media.type === "image")?.url
    || resolveDestinationImage(pkg.destination_record);
  const images = pkg.package_media?.filter((media) => media.type === "image") || [];
  const videos = pkg.package_media?.filter((media) => media.type === "video") || [];
  const itinerary = (pkg.itinerary as { day: number; title: string; description: string }[]) || [];
  const whatsappMsg = encodeURIComponent(`Hello Purna Travels, I want more details about: ${pkg.title}`);
  const destinationName = resolveDestinationName(pkg.destination_record, pkg.destination);
  const destinationSlug = pkg.destination_record?.slug || slugify(destinationName);
  const pricing = getPackagePricingDetails(pkg.price, pkg.actual_price);

  return (
    <Layout>
      <section className="relative h-[50vh] min-h-[350px] overflow-hidden">
        <img src={heroImage} alt={pkg.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-foreground/10" />
        <div className="relative z-10 container mx-auto px-4 h-full flex items-end pb-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-3">
              <Link to="/packages" className="hover:text-primary-foreground">Packages</Link>
              <ChevronRight className="h-3 w-3" />
              <Link to={`/destinations/${destinationSlug}`} className="hover:text-primary-foreground">{destinationName}</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-primary-foreground">{pkg.title}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-primary-foreground">{pkg.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-primary-foreground/80 text-sm">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {destinationName}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {pkg.duration}</span>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="sticky top-16 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Starting from</span>
            <div className="flex flex-wrap items-end gap-3">
              <p className="text-2xl font-display font-bold text-primary">Rs. {pricing.discountedPrice.toLocaleString("en-IN")}</p>
              {pricing.hasDiscount && (
                <>
                  <span className="text-sm text-muted-foreground line-through">Rs. {pricing.actualPrice.toLocaleString("en-IN")}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">{pricing.discountPercent}% OFF</span>
                </>
              )}
            </div>
            {pricing.hasDiscount && (
              <p className="text-xs text-emerald-600 mt-1">You save Rs. {pricing.discountAmount.toLocaleString("en-IN")}</p>
            )}
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" size="sm" className="rounded-lg">
              <a href="#enquiry">Send Enquiry</a>
            </Button>
            <Button asChild size="sm" className="rounded-lg bg-whatsapp hover:bg-whatsapp/90 text-primary-foreground">
              <a href={`https://wa.me/917047538555?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-1.5 h-4 w-4" /> Book on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">About This Package</h2>
              <p className="text-muted-foreground leading-relaxed">{pkg.description}</p>
            </motion.div>

            {images.length > 1 && (
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-4">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((media) => (
                    <div key={media.id} className="rounded-xl overflow-hidden aspect-[4/3]">
                      <img src={media.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {videos.length > 0 && (
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-4">Videos</h2>
                <div className="space-y-4">
                  {videos.map((video) => (
                    <video key={video.id} controls className="w-full rounded-xl" src={video.url} />
                  ))}
                </div>
              </div>
            )}

            {pkg.highlights && pkg.highlights.length > 0 && (
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-4">Highlights</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pkg.highlights.map((highlight) => (
                    <div key={highlight} className="flex items-center gap-3 p-3 rounded-xl bg-primary/5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm text-foreground">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {itinerary.length > 0 && (
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-6">Day-by-Day Itinerary</h2>
                <div className="space-y-4">
                  {itinerary.map((day) => (
                    <motion.div key={day.day} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex gap-4 p-5 rounded-xl bg-card shadow-elegant">
                      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary-foreground">{day.day}</span>
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-foreground">{day.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{day.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {pkg.inclusions && pkg.inclusions.length > 0 && (
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">Inclusions</h2>
                  <ul className="space-y-2">
                    {pkg.inclusions.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {pkg.exclusions && pkg.exclusions.length > 0 && (
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground mb-4">Exclusions</h2>
                  <ul className="space-y-2">
                    {pkg.exclusions.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <X className="h-4 w-4 text-destructive shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div id="enquiry" className="sticky top-36 bg-card rounded-2xl p-6 shadow-elegant">
              <h3 className="text-xl font-display font-bold text-foreground mb-2">Interested in this package?</h3>
              <p className="text-sm text-muted-foreground mb-6">Fill in the form and we will get back to you within 24 hours.</p>
              <EnquiryForm defaultDestination={destinationName} defaultDestinationId={pkg.destination_id} defaultPackage={pkg.title} packageId={pkg.id} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
