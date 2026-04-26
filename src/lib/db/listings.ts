import { Prisma, ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ListingWithSeller = Prisma.ListingGetPayload<{
  include: { seller: { select: { id: true; name: true } } };
}>;

export type ListingWithDetails = Prisma.ListingGetPayload<{
  include: {
    seller: { select: { id: true; name: true } };
    inquiries: { select: { id: true } };
  };
}>;

export interface ListingFilters {
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  maxMileage?: number;
  status?: ListingStatus;
  sellerId?: string;
  page?: number;
  limit?: number;
}

export async function getListings(filters: ListingFilters = {}) {
  const {
    brand,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    maxMileage,
    status = "ACTIVE",
    sellerId,
    page = 1,
    limit = 12,
  } = filters;

  const where: Prisma.ListingWhereInput = {
    status,
    ...(brand && { brand: { equals: brand, mode: "insensitive" } }),
    ...(minPrice !== undefined && { price: { gte: minPrice } }),
    ...(maxPrice !== undefined && {
      price: {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        lte: maxPrice,
      },
    }),
    ...(minYear !== undefined && { year: { gte: minYear } }),
    ...(maxYear !== undefined && {
      year: {
        ...(minYear !== undefined ? { gte: minYear } : {}),
        lte: maxYear,
      },
    }),
    ...(maxMileage !== undefined && { mileage: { lte: maxMileage } }),
    ...(sellerId && { sellerId }),
  };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        seller: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.listing.count({ where }),
  ]);

  return { listings, total, pages: Math.ceil(total / limit) };
}

export async function getListingById(id: string) {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true } },
      inquiries: { select: { id: true } },
    },
  });
}

export async function createListing(
  data: Omit<Prisma.ListingCreateInput, "seller"> & { sellerId: string }
) {
  const { sellerId, ...rest } = data;
  return prisma.listing.create({
    data: {
      ...rest,
      seller: { connect: { id: sellerId } },
    },
    include: { seller: { select: { id: true, name: true } } },
  });
}

export async function updateListing(
  id: string,
  sellerId: string,
  data: Partial<Prisma.ListingUpdateInput>
) {
  return prisma.listing.update({
    where: { id, sellerId },
    data,
    include: { seller: { select: { id: true, name: true } } },
  });
}

export async function deleteListing(id: string, sellerId: string) {
  return prisma.listing.delete({
    where: { id, sellerId },
  });
}

export async function getSellerListings(sellerId: string) {
  return prisma.listing.findMany({
    where: { sellerId },
    include: { seller: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFeaturedListings(limit = 6) {
  return prisma.listing.findMany({
    where: { status: "ACTIVE" },
    include: { seller: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getDistinctBrands() {
  const result = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    select: { brand: true },
    distinct: ["brand"],
    orderBy: { brand: "asc" },
  });
  return result.map((r) => r.brand);
}
