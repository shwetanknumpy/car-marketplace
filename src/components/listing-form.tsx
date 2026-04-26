"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import Image from "next/image";
import { UploadCloud, X, Loader2, Plus } from "lucide-react";
import { listingSchema, type ListingInput } from "@/lib/validations";

const BRANDS = [
  "BMW", "Mercedes-Benz", "Audi", "Tesla", "Porsche", "Ford", "Toyota", "Honda",
  "Chevrolet", "Dodge", "Jeep", "Lexus", "Infiniti", "Acura", "Cadillac",
  "Volkswagen", "Volvo", "Land Rover", "Jaguar", "Ferrari", "Lamborghini",
  "Bentley", "Rolls-Royce", "McLaren", "Maserati", "Alfa Romeo", "Bugatti",
  "Nissan", "Subaru", "Mazda", "Hyundai", "Kia", "Genesis",
];

const CURRENT_YEAR = new Date().getFullYear();

interface ListingFormProps {
  mode: "create" | "edit";
  listingId?: string;
  defaultValues?: Partial<ListingInput>;
}

export default function ListingForm({ mode, listingId, defaultValues }: ListingFormProps) {
  const router = useRouter();
  const [previewImages, setPreviewImages] = useState<{ file?: File; url: string; uploading?: boolean }[]>(
    defaultValues?.images?.map((url) => ({ url })) ?? []
  );
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ListingInput>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      status: "ACTIVE",
      images: defaultValues?.images ?? [],
      ...defaultValues,
    },
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const remaining = 6 - previewImages.length;
      const filesToAdd = acceptedFiles.slice(0, remaining);
      if (filesToAdd.length === 0) {
        toast.error("Maximum 6 images allowed");
        return;
      }

      setIsUploading(true);
      const newPreviews = filesToAdd.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        uploading: true,
      }));
      setPreviewImages((prev) => [...prev, ...newPreviews]);

      try {
        // Convert to base64 and upload
        const base64Images = await Promise.all(
          filesToAdd.map(
            (file) =>
              new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              })
          )
        );

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: base64Images }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed");

        const cloudUrls: string[] = json.urls;
        setPreviewImages((prev) => {
          const updated = [...prev];
          cloudUrls.forEach((url, i) => {
            const idx = updated.findIndex((p) => p.uploading && p.file === filesToAdd[i]);
            if (idx !== -1) {
              updated[idx] = { url, uploading: false };
            }
          });
          return updated;
        });

        const currentImages = (watch("images") ?? []).filter(
          (u) => !u.startsWith("blob:")
        );
        setValue("images", [...currentImages, ...cloudUrls]);
        toast.success(`${cloudUrls.length} photo${cloudUrls.length !== 1 ? "s" : ""} uploaded`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        toast.error(message);
        setPreviewImages((prev) => prev.filter((p) => !p.uploading));
      } finally {
        setIsUploading(false);
      }
    },
    [previewImages.length, setValue, watch]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 6,
    disabled: previewImages.length >= 6 || isUploading,
  });

  function removeImage(index: number) {
    const removed = previewImages[index];
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    const currentImages = watch("images") ?? [];
    setValue(
      "images",
      currentImages.filter((u) => u !== removed.url)
    );
  }

  async function onSubmit(data: ListingInput) {
    const uploadingCount = previewImages.filter((p) => p.uploading).length;
    if (uploadingCount > 0) {
      toast.error("Please wait for images to finish uploading");
      return;
    }

    try {
      const url = mode === "create" ? "/api/listings" : `/api/listings/${listingId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to save listing");
      }

      toast.success(mode === "create" ? "Listing posted successfully!" : "Listing updated!");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    }
  }

  const fieldClass =
    "w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors placeholder:text-muted-foreground";
  const labelClass = "block text-sm font-semibold mb-1.5";
  const errorClass = "mt-1.5 text-xs text-destructive";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Photo Upload */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-bold mb-4">Photos</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Upload up to 6 photos. The first photo will be the primary image.
        </p>

        {/* Dropzone */}
        {previewImages.length < 6 && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary hover:bg-muted/50"
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">
              {isDragActive ? "Drop photos here..." : "Drag & drop photos or click to select"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, WebP • Max 6 photos • 10MB each
            </p>
          </div>
        )}

        {/* Previews */}
        {previewImages.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {previewImages.map((img, idx) => (
              <div key={idx} className="relative group aspect-video rounded-xl overflow-hidden bg-muted">
                <Image
                  src={img.url}
                  alt={`Photo ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
                {img.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
                {!img.uploading && (
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                {idx === 0 && (
                  <div className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded-full">
                    Primary
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {errors.images && (
          <p className={`${errorClass} mt-2`}>{errors.images.message}</p>
        )}
      </div>

      {/* Basic Details */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <h2 className="text-lg font-bold">Basic Details</h2>

        {/* Title */}
        <div>
          <label htmlFor="listing-title" className={labelClass}>Listing Title</label>
          <input
            id="listing-title"
            {...register("title")}
            placeholder="e.g. 2022 BMW M3 Competition — Pristine Condition"
            className={fieldClass}
          />
          {errors.title && <p className={errorClass}>{errors.title.message}</p>}
        </div>

        {/* Brand & Model */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="listing-brand" className={labelClass}>Brand</label>
            <select
              id="listing-brand"
              {...register("brand")}
              className={`${fieldClass} appearance-none cursor-pointer`}
              defaultValue=""
            >
              <option value="" disabled>Select brand</option>
              {BRANDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            {errors.brand && <p className={errorClass}>{errors.brand.message}</p>}
          </div>
          <div>
            <label htmlFor="listing-model" className={labelClass}>Model</label>
            <input
              id="listing-model"
              {...register("model")}
              placeholder="e.g. M3 Competition"
              className={fieldClass}
            />
            {errors.model && <p className={errorClass}>{errors.model.message}</p>}
          </div>
        </div>

        {/* Year & Mileage */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="listing-year" className={labelClass}>Year</label>
            <input
              id="listing-year"
              type="number"
              {...register("year", { valueAsNumber: true })}
              placeholder={String(CURRENT_YEAR)}
              min={1900}
              max={CURRENT_YEAR + 1}
              className={fieldClass}
            />
            {errors.year && <p className={errorClass}>{errors.year.message}</p>}
          </div>
          <div>
            <label htmlFor="listing-mileage" className={labelClass}>Mileage (miles)</label>
            <input
              id="listing-mileage"
              type="number"
              {...register("mileage", { valueAsNumber: true })}
              placeholder="e.g. 25000"
              min={0}
              className={fieldClass}
            />
            {errors.mileage && <p className={errorClass}>{errors.mileage.message}</p>}
          </div>
        </div>

        {/* Price */}
        <div>
          <label htmlFor="listing-price" className={labelClass}>Asking Price (USD)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
            <input
              id="listing-price"
              type="number"
              {...register("price", { valueAsNumber: true })}
              placeholder="e.g. 35000"
              min={0}
              className={`${fieldClass} pl-7`}
            />
          </div>
          {errors.price && <p className={errorClass}>{errors.price.message}</p>}
        </div>

        {/* Status */}
        <div>
          <label htmlFor="listing-status" className={labelClass}>Listing Status</label>
          <select id="listing-status" {...register("status")} className={`${fieldClass} appearance-none cursor-pointer`}>
            <option value="ACTIVE">Active — visible to buyers</option>
            <option value="DRAFT">Draft — hidden from buyers</option>
            <option value="SOLD">Sold — mark as sold</option>
          </select>
          {errors.status && <p className={errorClass}>{errors.status.message}</p>}
        </div>
      </div>

      {/* Description */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-lg font-bold mb-4">Description</h2>
        <textarea
          {...register("description")}
          placeholder="Describe the car's condition, history, features, modifications, service records, and anything else a buyer should know. Be detailed and honest — this builds trust."
          rows={8}
          className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none placeholder:text-muted-foreground transition-colors"
        />
        {errors.description && (
          <p className={errorClass}>{errors.description.message}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">Minimum 50 characters</p>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === "create" ? "Posting..." : "Saving..."}
            </>
          ) : (
            mode === "create" ? "Post Listing" : "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}
