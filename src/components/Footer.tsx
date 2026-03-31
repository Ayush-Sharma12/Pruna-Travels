import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDestinations } from "@/hooks/useDatabase";
import logo from "@/assets/logo.webp";

export default function Footer() {
  const { isAdmin } = useAuth();
  const { destinations } = useDestinations();
  const footerDestinations = destinations.slice(0, 4);
  const adminHref = isAdmin ? "/admin" : "/admin/login";
  const adminLabel = isAdmin ? "Open Admin Dashboard" : "Admin Portal Login";

  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Purna Travels" className="h-8 w-8 brightness-200" />
              <span className="font-display font-bold text-lg">Purna Travels</span>
            </div>
            <p className="text-sm text-primary-foreground/60 leading-relaxed">
              Travel Beyond Limits. Curated travel experiences to the destinations your team manages live from the admin portal.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Quick Links</h4>
            <div className="space-y-2">
              {[
                { label: "Home", to: "/" },
                { label: "Packages", to: "/packages" },
                { label: "Blog", to: "/blog" },
                { label: "About Us", to: "/about" },
                { label: "Contact", to: "/contact" },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="block text-sm text-primary-foreground/60 hover:text-primary transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Destinations</h4>
            <div className="space-y-2">
              {footerDestinations.length > 0 ? (
                footerDestinations.map((destination) => (
                  <Link key={destination.id} to={`/destinations/${destination.slug}`} className="block text-sm text-primary-foreground/60 hover:text-primary transition-colors">
                    {destination.name}
                  </Link>
                ))
              ) : (
                <span className="block text-sm text-primary-foreground/50">Published destinations will appear here.</span>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Contact Us</h4>
            <div className="space-y-3">
              <a href="tel:+917047538555" className="flex items-center gap-2 text-sm text-primary-foreground/60 hover:text-primary transition-colors">
                <Phone className="h-4 w-4 shrink-0" /> +91 70475 38555
              </a>
              <a href="mailto:purnatourandtravels555@gmail.com" className="flex items-center gap-2 text-sm text-primary-foreground/60 hover:text-primary transition-colors">
                <Mail className="h-4 w-4 shrink-0" /> purnatourandtravels555@gmail.com
              </a>
              <div className="flex items-start gap-2 text-sm text-primary-foreground/60">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" /> Jamshedpur, Jharkhand India
              </div>
              <Link to={adminHref} className="inline-flex items-center gap-2 text-sm text-primary-foreground/60 hover:text-primary transition-colors">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                {adminLabel}
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 flex items-center justify-between text-sm text-primary-foreground/40">
          <span>&copy; {new Date().getFullYear()} Purna Travels. All rights reserved.</span>
          <Link to={adminHref} className="hover:text-primary-foreground/60 transition-colors">
            {isAdmin ? "Dashboard" : "Admin Portal"}
          </Link>
        </div>
      </div>
    </footer>
  );
}
