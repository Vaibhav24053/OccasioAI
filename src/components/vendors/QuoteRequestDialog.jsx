import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { quoteRequestBody, quoteRequestSubject } from "@/lib/vendorMail";

/** Email a vendor a quote request straight from the address saved on their record. */
export default function QuoteRequestDialog({ open, onOpenChange, vendor, event, onSent }) {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !vendor) return;
    setSubject(quoteRequestSubject(vendor, event));
    setMessage(vendor.outreach_draft?.trim() || quoteRequestBody(vendor, event));
    setError(null);
  }, [open, vendor, event]);

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      const response = await base44.functions.invoke("sendVendorQuoteRequest", {
        vendor_id: vendor.id,
        subject: subject.trim(),
        message: message.trim(),
      });
      toast({
        title: "Quote request sent",
        description: `${vendor.category_label || vendor.category} · ${response.data?.to || vendor.email}`,
      });
      await onSent?.();
      onOpenChange(false);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "That email didn't go out — try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            Ask {vendor?.category_label || vendor?.category} for a quote
          </DialogTitle>
          <DialogDescription>Sent from the app to the address saved on this vendor.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="quote-to">To</Label>
            <p
              id="quote-to"
              className="rounded-2xl bg-secondary px-3 py-2 text-sm text-secondary-foreground"
            >
              {vendor?.email}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quote-subject">Subject</Label>
            <Input
              id="quote-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={150}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quote-message">Message</Label>
            <Textarea
              id="quote-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={9}
              maxLength={4000}
            />
          </div>
        </div>

        {error ? (
          <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter className="gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button
            className="rounded-full"
            onClick={send}
            disabled={sending || !subject.trim() || !message.trim()}
          >
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {sending ? "Sending…" : "Send quote request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}