import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getSellerListings } from "@/lib/db/listings";
import { getInquiriesForSeller, getUnreadInquiryCount } from "@/lib/db/inquiries";
import DashboardTabs from "@/components/dashboard-tabs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your car listings and inquiries on AutoMarket.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const [listings, inquiries, unreadCount] = await Promise.all([
    getSellerListings(session.user.id),
    getInquiriesForSeller(session.user.id),
    getUnreadInquiryCount(session.user.id),
  ]);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Dashboard</p>
          <h1 className="text-3xl font-bold">
            Welcome back, {session.user.name?.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your listings and respond to inquiries.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Listings", value: listings.length, emoji: "🚗" },
            { label: "Active Listings", value: listings.filter(l => l.status === "ACTIVE").length, emoji: "✅" },
            { label: "Cars Sold", value: listings.filter(l => l.status === "SOLD").length, emoji: "💰" },
            { label: "Unread Inquiries", value: unreadCount, emoji: "💬" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-2xl border border-border p-4">
              <p className="text-2xl mb-1">{stat.emoji}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <DashboardTabs listings={listings} inquiries={inquiries} unreadCount={unreadCount} />
      </div>
    </div>
  );
}
