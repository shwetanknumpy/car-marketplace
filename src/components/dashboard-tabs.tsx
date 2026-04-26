"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatPrice, formatDate, formatMileage } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Pencil, Trash2, CheckCircle, MessageSquare, ChevronDown, ChevronUp, Car } from "lucide-react";
import type { Listing } from "@prisma/client";

interface ListingWithSeller extends Listing {
  seller: { id: string; name: string };
}

interface InquiryWithDetails {
  id: string;
  message: string;
  status: string;
  createdAt: Date;
  listing: { id: string; title: string; images: string[] };
  buyer: { id: string; name: string; email: string };
}

interface DashboardTabsProps {
  listings: ListingWithSeller[];
  inquiries: InquiryWithDetails[];
  unreadCount: number;
}

export default function DashboardTabs({ listings, inquiries, unreadCount }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<"listings" | "inquiries">("listings");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedInquiry, setExpandedInquiry] = useState<string | null>(null);
  const [inquiryData, setInquiryData] = useState(inquiries);
  const router = useRouter();

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Listing deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete listing");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  async function handleMarkSold(id: string) {
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SOLD" }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Listing marked as sold!");
      router.refresh();
    } catch {
      toast.error("Failed to update listing");
    }
  }

  async function handleMarkRead(inquiryId: string) {
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to update");
      setInquiryData((prev) =>
        prev.map((inq) =>
          inq.id === inquiryId ? { ...inq, status: "READ" } : inq
        )
      );
    } catch {
      toast.error("Failed to mark as read");
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, "active" | "sold" | "draft"> = {
      ACTIVE: "active",
      SOLD: "sold",
      DRAFT: "draft",
    };
    return map[status] ?? "default";
  };

  const inquiryBadge = (status: string) => {
    const map: Record<string, "unread" | "read" | "replied"> = {
      UNREAD: "unread",
      READ: "read",
      REPLIED: "replied",
    };
    return map[status] ?? "default";
  };

  // Group inquiries by listing
  const inquiriesByListing = inquiryData.reduce<Record<string, { listing: InquiryWithDetails["listing"]; items: InquiryWithDetails[] }>>((acc, inq) => {
    const lid = inq.listing.id;
    if (!acc[lid]) acc[lid] = { listing: inq.listing, items: [] };
    acc[lid].items.push(inq);
    return acc;
  }, {});

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("listings")}
          className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors relative ${
            activeTab === "listings"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Car className="h-4 w-4" />
            My Listings ({listings.length})
          </span>
          {activeTab === "listings" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-brand" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("inquiries")}
          className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors relative ${
            activeTab === "inquiries"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Inquiries
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </span>
          {activeTab === "inquiries" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-brand" />
          )}
        </button>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === "listings" && (
          <div>
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-semibold">Your car listings</h2>
              <Link
                href="/dashboard/listings/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <PlusCircle className="h-4 w-4" />
                Post New Car
              </Link>
            </div>

            {listings.length === 0 ? (
              <div className="text-center py-16">
                <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="font-semibold mb-1">No listings yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Post your first car to start selling!
                </p>
                <Link
                  href="/dashboard/listings/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90"
                >
                  <PlusCircle className="h-4 w-4" />
                  Post a Car
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-16 w-24 rounded-lg overflow-hidden shrink-0 bg-muted">
                      {listing.images[0] ? (
                        <Image
                          src={listing.images[0]}
                          alt={listing.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Car className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={statusBadge(listing.status)}>
                          {listing.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(listing.createdAt)}
                        </span>
                      </div>
                      <p className="font-semibold text-sm truncate">{listing.title}</p>
                      <p className="text-primary font-bold text-sm">{formatPrice(listing.price.toString())}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/dashboard/listings/${listing.id}/edit`}
                        className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      {listing.status === "ACTIVE" && (
                        <button
                          onClick={() => handleMarkSold(listing.id)}
                          className="p-2 rounded-lg border border-border hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors"
                          title="Mark as Sold"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {confirmDeleteId === listing.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(listing.id)}
                            disabled={deletingId === listing.id}
                            className="px-2 py-1 text-xs rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                          >
                            {deletingId === listing.id ? "..." : "Confirm"}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 text-xs rounded-lg border border-border hover:bg-muted transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(listing.id)}
                          className="p-2 rounded-lg border border-border hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "inquiries" && (
          <div>
            <h2 className="font-semibold mb-5">Inquiries received</h2>
            {Object.keys(inquiriesByListing).length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="font-semibold mb-1">No inquiries yet</h3>
                <p className="text-sm text-muted-foreground">
                  When buyers contact you about your listings, they&apos;ll appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(inquiriesByListing).map(([lid, { listing: listingInfo, items }]) => (
                  <div key={lid} className="rounded-xl border border-border overflow-hidden">
                    {/* Listing header */}
                    <div className="flex items-center gap-3 p-4 bg-muted/40">
                      <div className="relative h-10 w-14 rounded-lg overflow-hidden bg-muted shrink-0">
                        {listingInfo.images[0] && (
                          <Image
                            src={listingInfo.images[0]}
                            alt={listingInfo.title}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{listingInfo.title}</p>
                        <p className="text-xs text-muted-foreground">{items.length} inquiry{items.length !== 1 ? "s" : ""}</p>
                      </div>
                      <Link
                        href={`/cars/${listingInfo.id}`}
                        className="text-xs text-primary hover:underline shrink-0"
                      >
                        View listing →
                      </Link>
                    </div>

                    {/* Inquiry items */}
                    <div className="divide-y divide-border">
                      {items.map((inquiry) => (
                        <div key={inquiry.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-brand text-white text-xs font-bold shrink-0">
                                {inquiry.buyer.name[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-sm">{inquiry.buyer.name}</span>
                                  <Badge variant={inquiryBadge(inquiry.status) as "unread" | "read" | "replied"}>
                                    {inquiry.status}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">{formatDate(inquiry.createdAt)}</span>
                                </div>
                                <p
                                  className={`text-sm text-muted-foreground transition-all ${
                                    expandedInquiry === inquiry.id ? "" : "line-clamp-2"
                                  }`}
                                >
                                  {inquiry.message}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {inquiry.status === "UNREAD" && (
                                <button
                                  onClick={() => handleMarkRead(inquiry.id)}
                                  className="text-xs text-primary hover:underline font-medium"
                                >
                                  Mark read
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setExpandedInquiry(expandedInquiry === inquiry.id ? null : inquiry.id);
                                  if (inquiry.status === "UNREAD") handleMarkRead(inquiry.id);
                                }}
                                className="p-1 rounded hover:bg-muted transition-colors"
                              >
                                {expandedInquiry === inquiry.id ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
