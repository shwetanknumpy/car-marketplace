import { prisma } from "@/lib/prisma";

export async function createInquiry(data: {
  message: string;
  listingId: string;
  buyerId: string;
}) {
  return prisma.inquiry.create({
    data,
    include: {
      listing: { select: { id: true, title: true } },
      buyer: { select: { id: true, name: true } },
    },
  });
}

export async function getInquiriesForSeller(sellerId: string) {
  return prisma.inquiry.findMany({
    where: {
      listing: { sellerId },
    },
    include: {
      listing: { select: { id: true, title: true, images: true } },
      buyer: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function markInquiryRead(id: string, sellerId: string) {
  // Ensure the inquiry belongs to a listing owned by the seller
  const inquiry = await prisma.inquiry.findFirst({
    where: { id, listing: { sellerId } },
  });
  if (!inquiry) throw new Error("Inquiry not found or unauthorized");

  return prisma.inquiry.update({
    where: { id },
    data: { status: "READ" },
  });
}

export async function checkDuplicateInquiry(listingId: string, buyerId: string) {
  const existing = await prisma.inquiry.findUnique({
    where: { listingId_buyerId: { listingId, buyerId } },
  });
  return !!existing;
}

export async function getUnreadInquiryCount(sellerId: string) {
  return prisma.inquiry.count({
    where: {
      listing: { sellerId },
      status: "UNREAD",
    },
  });
}
