'use strict';

const inquiryRepository = require('../repositories/inquiryRepository');
const listingRepository = require('../repositories/listingRepository');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');
const { resolvePagination, buildMeta } = require('../utils/pagination');
const { ROLES, LISTING_STATUS, INQUIRY_STATUS } = require('../utils/constants');

/**
 * Inquiry business rules.
 *
 * An inquiry has two audiences with different rights: the buyer who sent it
 * (may read it) and the seller who received it (may read, mark read, reply).
 * Both checks happen here rather than in the controller.
 */

async function createInquiry(buyerId, listingId, message) {
  const [buyer, listing] = await Promise.all([
    userRepository.findById(buyerId, { lean: false }),
    listingRepository.findById(listingId),
  ]);

  if (!buyer) throw ApiError.unauthorized();
  if (!listing) throw ApiError.notFound('Listing not found');

  if (listing.status !== LISTING_STATUS.ACTIVE) {
    throw ApiError.badRequest('This listing is not accepting inquiries');
  }

  if (String(listing.seller.id) === String(buyerId)) {
    throw ApiError.badRequest('You cannot inquire about your own listing');
  }

  try {
    const inquiry = await inquiryRepository.create({
      listing: {
        id: listing._id,
        title: listing.title,
        price: listing.price,
        image: listing.images && listing.images.length ? listing.images[0] : null,
      },
      buyer: buyer.toContactSnapshot(),
      sellerId: listing.seller.id,
      message,
    });

    await listingRepository.incrementInquiryCount(listing._id, 1);
    return inquiry;
  } catch (error) {
    // Backed by the unique index on (listing.id, buyer.id).
    if (error.code === 11000) {
      throw ApiError.conflict('You have already sent an inquiry for this listing');
    }
    throw error;
  }
}

/** The seller's inbox: inquiries received on their listings. */
async function listReceived(sellerId, query = {}) {
  const { page, limit, skip } = resolvePagination(query);

  const filter = { sellerId };
  if (query.status) filter.status = query.status;
  if (query.listingId) filter['listing.id'] = query.listingId;

  const { items, total } = await inquiryRepository.paginate(filter, { skip, limit });
  return { items, meta: buildMeta({ page, limit, total }) };
}

/** The buyer's outbox: inquiries they have sent. */
async function listSent(buyerId, query = {}) {
  const { page, limit, skip } = resolvePagination(query);

  const filter = { 'buyer.id': buyerId };
  if (query.status) filter.status = query.status;

  const { items, total } = await inquiryRepository.paginate(filter, { skip, limit });
  return { items, meta: buildMeta({ page, limit, total }) };
}

async function getInquiry(inquiryId, actor) {
  const inquiry = await inquiryRepository.findById(inquiryId);
  if (!inquiry) throw ApiError.notFound('Inquiry not found');

  if (!canView(inquiry, actor)) {
    throw ApiError.forbidden('You are not a party to this inquiry');
  }

  return inquiry;
}

async function markAsRead(inquiryId, actor) {
  const inquiry = await requireRecipient(inquiryId, actor);

  if (inquiry.status !== INQUIRY_STATUS.UNREAD) return inquiry;

  return inquiryRepository.updateById(inquiryId, {
    $set: { status: INQUIRY_STATUS.READ },
  });
}

async function replyToInquiry(inquiryId, actor, message) {
  await requireRecipient(inquiryId, actor);

  return inquiryRepository.updateById(inquiryId, {
    $set: {
      status: INQUIRY_STATUS.REPLIED,
      reply: { message, repliedAt: new Date() },
    },
  });
}

/**
 * Deletes an inquiry.
 *
 * The buyer may withdraw theirs; the seller may clear one from their inbox.
 */
async function deleteInquiry(inquiryId, actor) {
  const inquiry = await inquiryRepository.findById(inquiryId);
  if (!inquiry) throw ApiError.notFound('Inquiry not found');

  if (!canView(inquiry, actor)) {
    throw ApiError.forbidden('You are not a party to this inquiry');
  }

  await inquiryRepository.deleteById(inquiryId);
  await listingRepository.incrementInquiryCount(inquiry.listing.id, -1);

  return { id: String(inquiryId) };
}

/** Only the seller who received an inquiry may act on it. */
async function requireRecipient(inquiryId, actor) {
  const inquiry = await inquiryRepository.findById(inquiryId);
  if (!inquiry) throw ApiError.notFound('Inquiry not found');

  const isRecipient = String(inquiry.sellerId) === String(actor.id);
  const isAdmin = actor.role === ROLES.ADMIN;

  if (!isRecipient && !isAdmin) {
    throw ApiError.forbidden('Only the seller who received this inquiry can act on it');
  }

  return inquiry;
}

function canView(inquiry, actor) {
  if (!actor) return false;
  if (actor.role === ROLES.ADMIN) return true;
  return (
    String(inquiry.sellerId) === String(actor.id) ||
    String(inquiry.buyer.id) === String(actor.id)
  );
}

module.exports = {
  createInquiry,
  listReceived,
  listSent,
  getInquiry,
  markAsRead,
  replyToInquiry,
  deleteInquiry,
};
