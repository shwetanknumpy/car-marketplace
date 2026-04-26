"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { inquirySchema, type InquiryInput } from "@/lib/validations";

interface InquiryFormProps {
  listingId: string;
}

export default function InquiryForm({ listingId }: InquiryFormProps) {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { listingId },
  });

  async function onSubmit(data: InquiryInput) {
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Failed to send inquiry");
      }

      toast.success("Inquiry sent! The seller will be in touch soon.");
      setSubmitted(true);
      reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    }
  }

  if (submitted) {
    return (
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
        <p className="text-sm font-semibold text-emerald-700">✓ Inquiry Sent!</p>
        <p className="text-xs text-emerald-600 mt-1">The seller will contact you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <input type="hidden" {...register("listingId")} value={listingId} />
      <div>
        <label className="block text-sm font-semibold mb-1.5">
          Send a Message
        </label>
        <textarea
          {...register("message")}
          placeholder="Hi, I'm interested in this car. Is it still available? Can we schedule a test drive?"
          rows={4}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none placeholder:text-muted-foreground transition-colors"
        />
        {errors.message && (
          <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send Inquiry
          </>
        )}
      </button>
      <p className="text-xs text-center text-muted-foreground">
        Min. 20 characters required
      </p>
    </form>
  );
}
