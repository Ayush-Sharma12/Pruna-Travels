import { motion } from "framer-motion";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import EnquiryForm from "@/components/EnquiryForm";

export default function ContactPage() {
  return (
    <Layout>
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">Get in Touch</h1>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">Ready to plan your dream vacation? We'd love to hear from you.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 max-w-6xl mx-auto">
            {/* Contact Info */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-2xl p-6 shadow-elegant space-y-6">
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">Phone</h3>
                  <a href="tel:+917047538555" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                    <Phone className="h-4 w-4" /> +91 70475 38555
                  </a>
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">Email</h3>
                  <a href="mailto:info@purnatravels.com" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                    <Mail className="h-4 w-4" /> purnatourandtravels555@gmail.com
                  </a>
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">Location</h3>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Jamshedpur, Jharkhand India
                  </p>
                </div>
              </div>

              <Button asChild className="w-full rounded-xl bg-whatsapp hover:bg-whatsapp/90 text-primary-foreground" size="lg">
                <a href="https://wa.me/917047538555" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-5 w-5" /> Chat on WhatsApp
                </a>
              </Button>

              {/* Map Placeholder */}
              <div className="bg-muted rounded-2xl h-48 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Jamshedpur, Jharkhand India</p>
                </div>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3">
              <div className="bg-card rounded-2xl p-8 shadow-elegant">
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">Send Us a Message</h2>
                <p className="text-sm text-muted-foreground mb-6">Fill in the form below and we'll respond within 24 hours.</p>
                <EnquiryForm />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
