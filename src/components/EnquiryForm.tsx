import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function EnquiryForm({
  defaultDestination,
  defaultDestinationId,
  defaultPackage,
  packageId,
}: EnquiryFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { destinations } = useDestinations();

  const [loading, setLoading] = useState(false);

  const getSelectedDestination = () =>
    destinations.find(
      (destination) =>
        destination.id === defaultDestinationId ||
        destination.name === defaultDestination
    );

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    destinationId: defaultDestinationId || "",
    travelDates: "",
    travellers: "",
    budget: "",
    message: defaultPackage
      ? `I'm interested in: ${defaultPackage}`
      : "",
  });

  useEffect(() => {
    const selectedDestination = getSelectedDestination();

    setForm((prev) => ({
      ...prev,
      email: prev.email || user?.email || "",
      name: prev.name || user?.user_metadata?.full_name || "",
      destinationId:
        prev.destinationId ||
        selectedDestination?.id ||
        destinations[0]?.id ||
        "",
    }));
  }, [defaultDestination, defaultDestinationId, destinations, user]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    const selectedDestination = getSelectedDestination();

    setForm({
      name: user?.user_metadata?.full_name || "",
      phone: "",
      email: user?.email || "",
      destinationId:
        selectedDestination?.id ||
        destinations[0]?.id ||
        "",
      travelDates: "",
      travellers: "",
      budget: "",
      message: "",
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.email.trim()
    ) {
      toast({
        title: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const selectedDestination = destinations.find(
      (destination) => destination.id === form.destinationId
    );

    const { error } = await supabase
      .from("enquiries")
      .insert({
        user_id: user?.id || null,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        destination_id: form.destinationId || null,
        destination:
          selectedDestination?.name ||
          defaultDestination ||
          null,
        travel_dates: form.travelDates || null,
        travellers: form.travellers
          ? parseInt(form.travellers, 10)
          : null,
        budget: form.budget || null,
        message: form.message.trim() || null,
        package_id: packageId || null,
      });

    setLoading(false);

    if (error) {
      toast({
        title: "Failed to send enquiry",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Enquiry sent",
      description: user
        ? "Your enquiry has also been saved to your account."
        : "We will get back to you within 24 hours.",
    });

    resetForm();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          placeholder="Your Name *"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          required
          maxLength={100}
        />

        <Input
          placeholder="Phone Number *"
          type="tel"
          value={form.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          required
          maxLength={15}
        />
      </div>

      <Input
        placeholder="Email Address *"
        type="email"
        value={form.email}
        onChange={(e) => updateField("email", e.target.value)}
        required
        maxLength={200}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          value={form.destinationId}
          onValueChange={(value) =>
            updateField("destinationId", value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Destination" />
          </SelectTrigger>

          <SelectContent>
            {destinations.map((destination) => (
              <SelectItem
                key={destination.id}
                value={destination.id}
              >
                {destination.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Travel Dates"
          type="date"
          value={form.travelDates}
          onChange={(e) =>
            updateField("travelDates", e.target.value)
          }
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          placeholder="Number of Travellers"
          type="number"
          min="1"
          max="50"
          value={form.travellers}
          onChange={(e) =>
            updateField("travellers", e.target.value)
          }
        />

        <Select
          value={form.budget}
          onValueChange={(value) => updateField("budget", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Budget Range" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="under-20k">
              Under Rs. 20,000
            </SelectItem>
            <SelectItem value="20k-50k">
              Rs. 20,000 - Rs. 50,000
            </SelectItem>
            <SelectItem value="50k-1l">
              Rs. 50,000 - Rs. 1,00,000
            </SelectItem>
            <SelectItem value="above-1l">
              Above Rs. 1,00,000
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Textarea
        placeholder="Tell us about your travel plans..."
        value={form.message}
        onChange={(e) => updateField("message", e.target.value)}
        rows={4}
        maxLength={1000}
      />

      <Button
        type="submit"
        size="lg"
        className="w-full rounded-xl"
        disabled={loading}
      >
        {loading ? (
          "Sending..."
        ) : (
          <>
            Send My Enquiry
            <Send className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
