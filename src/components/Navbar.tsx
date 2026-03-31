import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useDestinations } from "@/hooks/useDatabase";
import logo from "@/assets/logo.webp";

const staticLinks = [
  { label: "Home", to: "/" },
  { label: "Packages", to: "/packages" },
  { label: "Blog", to: "/blog" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const { destinations } = useDestinations();

  const isActive = (path: string) => location.pathname === path;
  const adminLabel = isAdmin ? "Admin Dashboard" : "Admin Portal";
  const adminHref = isAdmin ? "/admin" : "/admin/login";

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Purna Travels" className="h-9 w-9" />
          <div className="leading-tight">
            <span className="font-display font-bold text-lg text-foreground">Purna</span>
            <span className="font-display font-bold text-lg text-primary"> Travels</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {destinations.length > 0 && (
            <div
              className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg">
                Destinations
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 bg-card rounded-xl shadow-elegant border border-border py-2 min-w-[180px]"
                  >
                    {destinations.map((destination) => (
                      <Link
                        key={destination.id}
                        to={`/destinations/${destination.slug}`}
                        className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        {destination.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {staticLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive(link.to) ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/account">My Account</Link>
              </Button>
              <Button asChild variant={isAdmin ? "default" : "outline"} size="sm" className={isAdmin ? "" : "border-primary/30 text-primary hover:bg-primary/5"}>
                <Link to={adminHref}>
                  <ShieldCheck className="mr-1.5 h-4 w-4" />
                  {adminLabel}
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Login</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/5">
                <Link to="/admin/login">
                  <ShieldCheck className="mr-1.5 h-4 w-4" />
                  Admin Portal
                </Link>
              </Button>
            </>
          )}
          <Button asChild size="sm">
            <a href="https://wa.me/917047538555?text=Hello%20Purna%20Travels%2C%20I%20want%20more%20details%20about%20your%20tour%20packages." target="_blank" rel="noopener noreferrer">
              Book Now
            </a>
          </Button>
        </div>

        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-card border-b border-border"
          >
            <div className="px-4 py-4 space-y-1">
              {destinations.length > 0 && (
                <div className="space-y-1">
                  <span className="block px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Destinations
                  </span>
                  {destinations.map((destination) => (
                    <Link
                      key={destination.id}
                      to={`/destinations/${destination.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="block px-6 py-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      {destination.name}
                    </Link>
                  ))}
                </div>
              )}

              {staticLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 text-sm font-medium rounded-lg ${
                    isActive(link.to) ? "text-primary bg-primary/5" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-3 space-y-2">
                {user ? (
                  <>
                    <Button asChild variant="outline" className="w-full" size="sm">
                      <Link to="/account" onClick={() => setMobileOpen(false)}>My Account</Link>
                    </Button>
                    <Button asChild variant={isAdmin ? "default" : "outline"} className="w-full" size="sm">
                      <Link to={adminHref} onClick={() => setMobileOpen(false)}>
                        <ShieldCheck className="mr-1.5 h-4 w-4" />
                        {adminLabel}
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full" size="sm">
                      <Link to="/auth" onClick={() => setMobileOpen(false)}>Login / Sign Up</Link>
                    </Button>
                    <Button asChild variant="default" className="w-full" size="sm">
                      <Link to="/admin/login" onClick={() => setMobileOpen(false)}>
                        <ShieldCheck className="mr-1.5 h-4 w-4" />
                        Admin Portal
                      </Link>
                    </Button>
                  </>
                )}
                <Button asChild className="w-full" size="sm">
                  <a href="https://wa.me/917047538555" target="_blank" rel="noopener noreferrer">
                    Book Now
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
