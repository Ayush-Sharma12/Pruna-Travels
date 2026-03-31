import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useDestinations } from "@/hooks/useDatabase";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EnquiryFormProps {
  defaultDestination?: string;
  defaultDestinationId?: string | null;
  defaultPackage?: string;
  packageId?: string;
}

export default function EnquiryForm({ defaultDestination, defaultDestinationId, defaultPackage, packageId }: EnquiryFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { destinations } = useDestinations();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    destinationId: defaultDestinationId || "",
    travelDates: "",
    travellers: "",
    budget: "",
    message: defaultPackage ? `I'm interested in: ${defaultPackage}` : "",
  });

  useEffect(() => {
    const matchedDestination = destinations.find((destination) => destination.id === defaultDestinationId || destination.name === defaultDestination);
    setForm((current) => ({
      ...current,
      email: current.email || user?.email || "",
      name: current.name || user?.user_metadata?.full_name || "",
      destinationId: current.destinationId || matchedDestination?.id || destinations[0]?.id || "",
    }));
  }, [defaultDestination, defaultDestinationId, destinations, user]);

  const handleChange = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("enquiries").insert({
      user_id: user?.id || null,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      destination_id: form.destinationId || null,
      destination: destinations.find((destination) => destination.id === form.destinationId)?.name || defaultDestination || null,
      travel_dates: form.travelDates || null,
      travellers: form.travellers ? parseInt(form.travellers, 10) : null,
      budget: form.budget || null,
      message: form.message.trim() || null,
      package_id: packageId || null,
    });

    setLoading(false);

    if (error) {
      toast({ title: "Failed to send enquiry", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Enquiry sent",
      description: user ? "Your enquiry has also been saved to your account." : "We will get back to you within 24 hours.",
    });

    const matchedDestination = destinations.find((destination) => destination.id === defaultDestinationId || destination.name === defaultDestination);

    setForm({
      name: user?.user_metadata?.full_name || "",
      phone: "",
      email: user?.email || "",
      destinationId: matchedDestination?.id || destinations[0]?.id || "",
      travelDates: "",
      travellers: "",
      budget: "",
      message: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input placeholder="Your Name *" value={form.name} onChange={(event) => handleChange("name", event.target.value)} required maxLength={100} />
        <Input placeholder="Phone Number *" type="tel" value={form.phone} onChange={(event) => handleChange("phone", event.target.value)} required maxLength={15} />
      </div>
      <Input placeholder="Email Address *" type="email" value={form.email} onChange={(event) => handleChange("email", event.target.value)} required maxLength={200} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select value={form.destinationId} onValueChange={(value) => handleChange("destinationId", value)}>
          <SelectTrigger><SelectValue placeholder="Select Destination" /></SelectTrigger>
          <SelectContent>
            {destinations.map((destination) => (
              <SelectItem key={destination.id} value={destination.id}>
                {destination.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="Travel Dates" type="date" value={form.travelDates} onChange={(event) => handleChange("travelDates", event.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input placeholder="Number of Travellers" type="number" min="1" max="50" value={form.travellers} onChange={(event) => handleChange("travellers", event.target.value)} />
        <Select value={form.budget} onValueChange={(value) => handleChange("budget", value)}>
          <SelectTrigger><SelectValue placeholder="Budget Range" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="under-20k">Under Rs. 20,000</SelectItem>
            <SelectItem value="20k-50k">Rs. 20,000 - Rs. 50,000</SelectItem>
            <SelectItem value="50k-1l">Rs. 50,000 - Rs. 1,00,000</SelectItem>
            <SelectItem value="above-1l">Above Rs. 1,00,000</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Textarea placeholder="Tell us about your travel plans..." value={form.message} onChange={(event) => handleChange("message", event.target.value)} rows={4} maxLength={1000} />
      <Button type="submit" size="lg" className="w-full rounded-xl" disabled={loading}>
        {loading ? "Sending..." : <>Send My Enquiry <Send className="ml-2 h-4 w-4" /></>}
      </Button>
    </form>
  );
}
