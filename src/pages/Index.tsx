import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Heart, Award, Headphones, ArrowRight } from "lucide-react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import PackageCard from "@/components/PackageCard";
import DestinationCard from "@/components/DestinationCard";
import TestimonialSection from "@/components/TestimonialSection";
import { useFeaturedPackages, usePackages, useBlogPosts, useDestinations } from "@/hooks/useDatabase";
import { resolveDestinationName } from "@/lib/cms";

const whyUs = [
  { icon: Shield, title: "Trusted Service", desc: "Verified stays, licensed operators, and transparent pricing on every trip." },
  { icon: Heart, title: "Handcrafted Itineraries", desc: "Every trip is carefully designed for authentic, memorable experiences." },
  { icon: Award, title: "Best Price Guarantee", desc: "Competitive pricing without compromising on quality or comfort." },
  { icon: Headphones, title: "24/7 Support", desc: "Round-the-clock assistance before, during, and after your trip." },
];

export default function HomePage() {
  const { packages: featuredPkgs, loading: featuredLoading } = useFeaturedPackages();
  const { packages: allPkgs } = usePackages();
  const { posts: blogPosts } = useBlogPosts();
  const { destinations } = useDestinations();

  const destinationCards = destinations.map((destination) => ({
    ...destination,
    packageCount: allPkgs.filter((pkg) => pkg.destination_id === destination.id || pkg.destination === destination.name).length,
  }));

  return (
    <Layout>
      <HeroSection />

      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Featured Packages</h2>
              <p className="mt-3 text-muted-foreground">Handpicked experiences for your next adventure.</p>
            </div>
            <Button asChild variant="ghost" className="hidden md:flex text-secondary">
              <Link to="/packages">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </motion.div>
          {!featuredLoading && featuredPkgs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPkgs.map((pkg, index) => (
                <PackageCard key={pkg.id} pkg={pkg} index={index} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">No featured packages yet. Add packages from the admin dashboard.</p>
          )}
          <div className="mt-8 text-center md:hidden">
            <Button asChild variant="outline"><Link to="/packages">View All Packages</Link></Button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Explore Destinations</h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">Every destination card below is managed directly from the admin dashboard.</p>
          </motion.div>
          {destinationCards.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No destinations are published yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {destinationCards.map((destination, index) => (
                <DestinationCard
                  key={destination.id}
                  name={destination.name}
                  slug={destination.slug}
                  image={destination.card_image_url || destination.hero_image_url || "/placeholder.svg"}
                  packageCount={destination.packageCount}
                  tagline={destination.tagline || destination.short_description || "Explore this destination"}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Why Purna Travels?</h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">We plan journeys with clear communication, reliable support, and thoughtful local detail.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {whyUs.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="text-center p-6 rounded-2xl bg-card shadow-elegant"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialSection />

      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Travel Stories</h2>
              <p className="mt-3 text-muted-foreground">Fresh articles from the destinations and trips your team is publishing.</p>
            </div>
            <Button asChild variant="ghost" className="hidden md:flex text-secondary">
              <Link to="/blog">Read All <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </motion.div>

          {blogPosts.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No blog posts are published yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.slice(0, 3).map((post, index) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                  <Link to={`/blog/${post.slug}`} className="group block rounded-2xl bg-card shadow-elegant overflow-hidden hover:shadow-card-hover transition-all duration-300">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.image || post.blog_media.find((item) => item.type === "image")?.url || "/placeholder.svg"}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="font-semibold text-primary uppercase tracking-wider">{resolveDestinationName(post.destination_record, post.destination) || "Travel"}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">Ready to Start Planning?</h2>
            <p className="text-primary-foreground/80 max-w-lg mx-auto mb-8">Reach out on WhatsApp and we will help you shortlist destinations, dates, and the right package.</p>
            <Button asChild size="lg" variant="secondary" className="rounded-full px-10 text-base bg-card text-foreground hover:bg-card/90">
              <a href="https://wa.me/917047538555?text=Hello%20Purna%20Travels%2C%20I%20want%20to%20plan%20my%20next%20trip!" target="_blank" rel="noopener noreferrer">
                Chat on WhatsApp
              </a>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
