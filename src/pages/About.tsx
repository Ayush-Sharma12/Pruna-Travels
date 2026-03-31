import { motion } from "framer-motion";
import { Globe, Users, Award, Heart } from "lucide-react";
import Layout from "@/components/Layout";

const stats = [
  { label: "Happy Travellers", value: "2,500+", icon: Users },
  { label: "Tour Packages", value: "50+", icon: Globe },
  { label: "Years Experience", value: "5+", icon: Award },
  { label: "Destinations", value: "2", icon: Heart },
];

export default function AboutPage() {
  return (
    <Layout>
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">About Purna Travels</h1>
            <p className="mt-4 text-lg text-muted-foreground">Travel Beyond Limits — Your trusted partner for curated travel experiences.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="prose prose-slate max-w-none">
            <div className="bg-card rounded-2xl p-8 shadow-elegant mb-12">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">Our Story</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Purna Travels was born from a simple belief — that travel should be transformative, not transactional. We started with a passion for connecting people with the extraordinary beauty of India's most stunning destinations.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                From the snow-capped mountains of Kashmir to the turquoise waters of Andaman, we specialize in crafting journeys that go beyond the ordinary. Every itinerary is handcrafted, every stay is personally vetted, and every experience is designed to create lasting memories.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We believe in responsible tourism, fair pricing, and exceptional service. Our team of travel experts brings years of local knowledge and a genuine love for exploration to every trip we plan.
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center p-6 rounded-2xl bg-card shadow-elegant"
              >
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card rounded-2xl p-8 shadow-elegant">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">Our Philosophy</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: "Authentic Experiences", desc: "We connect you with local cultures, cuisines, and hidden gems that guidebooks miss." },
                { title: "Transparent Pricing", desc: "No hidden costs, no surprise charges. What we quote is what you pay." },
                { title: "Personal Touch", desc: "Every traveller is unique. We customize every itinerary to match your preferences." },
                { title: "Safety First", desc: "Your safety is our priority. We work with verified operators and trusted accommodations." },
              ].map((item) => (
                <div key={item.title} className="p-4 rounded-xl bg-background">
                  <h3 className="font-display font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
