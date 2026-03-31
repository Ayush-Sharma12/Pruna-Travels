import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, Calendar, Users, Trash2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { resolveDestinationName } from "@/lib/cms";

type Enquiry = Database["public"]["Tables"]["enquiries"]["Row"];
type Destination = Database["public"]["Tables"]["destinations"]["Row"];
type EnquiryListItem = Enquiry & {
  destination_record: Destination | null;
  packages: Pick<Database["public"]["Tables"]["packages"]["Row"], "title" | "slug"> | null;
};

export default function AdminEnquiries() {
  const { toast } = useToast();
  const [enquiries, setEnquiries] = useState<EnquiryListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnquiries = useCallback(async () => {
    const { data, error } = await supabase
      .from("enquiries")
      .select("*, destination_record:destinations!enquiries_destination_id_fkey(*), packages(title, slug)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Failed to load enquiries", description: error.message, variant: "destructive" });
      setEnquiries([]);
      setLoading(false);
      return;
    }

    setEnquiries((data as EnquiryListItem[]) || []);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void fetchEnquiries();
  }, [fetchEnquiries]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Status update failed", description: error.message, variant: "destructive" });
      return;
    }

    setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    toast({ title: `Status updated to ${status}` });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this enquiry?")) return;
    const { error } = await supabase.from("enquiries").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete enquiry", description: error.message, variant: "destructive" });
      return;
    }

    setEnquiries((prev) => prev.filter((e) => e.id !== id));
    toast({ title: "Enquiry deleted" });
  };

  const statusColor = (s: string) => {
    if (s === "NEW") return "bg-accent/20 text-accent";
    if (s === "CONTACTED") return "bg-primary/20 text-primary";
    return "bg-muted text-muted-foreground";
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-display font-bold text-foreground mb-6">Enquiries</h1>
      {loading ? (
        <p className="text-muted-foreground py-8 text-center">Loading...</p>
      ) : enquiries.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">No enquiries yet.</p>
      ) : (
        <div className="space-y-4">
          {enquiries.map((enq) => (
            <div key={enq.id} className="bg-card rounded-xl p-5 shadow-elegant">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display font-semibold text-foreground text-lg">{enq.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {enq.phone}</span>
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {enq.email}</span>
                    {enq.travel_dates && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {enq.travel_dates}</span>}
                    {enq.travellers && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {enq.travellers} travellers</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${statusColor(enq.status)}`}>{enq.status}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(enq.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                {(enq.destination || enq.destination_record) && <span className="bg-muted px-2 py-1 rounded">{resolveDestinationName(enq.destination_record, enq.destination)}</span>}
                {enq.packages?.title && <span className="bg-muted px-2 py-1 rounded">{enq.packages.title}</span>}
                {enq.budget && <span className="bg-muted px-2 py-1 rounded">{enq.budget}</span>}
              </div>
              {enq.message && <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3 mb-3">{enq.message}</p>}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {new Date(enq.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
                <Select value={enq.status} onValueChange={(v) => updateStatus(enq.id, v)}>
                  <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="CONTACTED">Contacted</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
