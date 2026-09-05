'use strict';

const inquiryService = require('../../src/services/inquiryService');
const { Listing } = require('../../src/models');
const { LISTING_STATUS, ROLES, INQUIRY_STATUS } = require('../../src/utils/constants');
const { createSeller, createBuyer, createListing } = require('../helpers/factories');

describe('inquiryService', () => {
  let seller;
  let buyer;
  let listing;

  beforeEach(async () => {
    seller = await createSeller();
    buyer = await createBuyer();
    listing = await createListing(seller);
  });

  const message = 'Hi, is this still available? I could view it this weekend.';

  describe('createInquiry', () => {
    it('records the buyer, the seller and a listing snapshot', async () => {
      const inquiry = await inquiryService.createInquiry(buyer._id, listing._id, message);

      expect(String(inquiry.buyer.id)).toBe(String(buyer._id));
      expect(String(inquiry.sellerId)).toBe(String(seller._id));
      expect(inquiry.listing.title).toBe(listing.title);
      expect(inquiry.listing.price).toBe(listing.price);
      expect(inquiry.status).toBe(INQUIRY_STATUS.UNREAD);
    });

    it('increments the listing inquiry counter', async () => {
      await inquiryService.createInquiry(buyer._id, listing._id, message);
      const reloaded = await Listing.findById(listing._id);
      expect(reloaded.inquiryCount).toBe(1);
    });

    it('refuses a second inquiry on the same listing from the same buyer', async () => {
      await inquiryService.createInquiry(buyer._id, listing._id, message);

      await expect(
        inquiryService.createInquiry(buyer._id, listing._id, message)
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('refuses an inquiry on the seller’s own listing', async () => {
      await expect(
        inquiryService.createInquiry(seller._id, listing._id, message)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('refuses an inquiry on a listing that is not active', async () => {
      const draft = await createListing(seller, { status: LISTING_STATUS.DRAFT });

      await expect(
        inquiryService.createInquiry(buyer._id, draft._id, message)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('inboxes', () => {
    it('separates what a seller receives from what a buyer sent', async () => {
      const otherBuyer = await createBuyer();
      await inquiryService.createInquiry(buyer._id, listing._id, message);
      await inquiryService.createInquiry(otherBuyer._id, listing._id, message);

      const received = await inquiryService.listReceived(seller._id, {});
      const sent = await inquiryService.listSent(buyer._id, {});

      expect(received.meta.total).toBe(2);
      expect(sent.meta.total).toBe(1);
    });

    it('paginates the seller inbox', async () => {
      const buyers = await Promise.all([createBuyer(), createBuyer(), createBuyer()]);
      await Promise.all(
        buyers.map((b) => inquiryService.createInquiry(b._id, listing._id, message))
      );

      const page = await inquiryService.listReceived(seller._id, { page: 1, limit: 2 });
      expect(page.items).toHaveLength(2);
      expect(page.meta).toMatchObject({ total: 3, totalPages: 2, hasNextPage: true });
    });
  });

  describe('authorization', () => {
    it('lets neither party read an inquiry that is not theirs', async () => {
      const inquiry = await inquiryService.createInquiry(buyer._id, listing._id, message);
      const stranger = await createBuyer();

      await expect(
        inquiryService.getInquiry(inquiry._id, { id: stranger._id, role: ROLES.BUYER })
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('lets both parties read their own inquiry', async () => {
      const inquiry = await inquiryService.createInquiry(buyer._id, listing._id, message);

      await expect(
        inquiryService.getInquiry(inquiry._id, { id: buyer._id, role: ROLES.BUYER })
      ).resolves.toBeTruthy();
      await expect(
        inquiryService.getInquiry(inquiry._id, { id: seller._id, role: ROLES.SELLER })
      ).resolves.toBeTruthy();
    });

    it('lets only the recipient reply', async () => {
      const inquiry = await inquiryService.createInquiry(buyer._id, listing._id, message);

      await expect(
        inquiryService.replyToInquiry(
          inquiry._id,
          { id: buyer._id, role: ROLES.BUYER },
          'Trying to reply to myself'
        )
      ).rejects.toMatchObject({ statusCode: 403 });

      const replied = await inquiryService.replyToInquiry(
        inquiry._id,
        { id: seller._id, role: ROLES.SELLER },
        'Yes, still available.'
      );
      expect(replied.status).toBe(INQUIRY_STATUS.REPLIED);
      expect(replied.reply.message).toBe('Yes, still available.');
    });

    it('marks an inquiry read for the recipient only', async () => {
      const inquiry = await inquiryService.createInquiry(buyer._id, listing._id, message);

      await expect(
        inquiryService.markAsRead(inquiry._id, { id: buyer._id, role: ROLES.BUYER })
      ).rejects.toMatchObject({ statusCode: 403 });

      const read = await inquiryService.markAsRead(inquiry._id, {
        id: seller._id,
        role: ROLES.SELLER,
      });
      expect(read.status).toBe(INQUIRY_STATUS.READ);
    });
  });

  describe('deleteInquiry', () => {
    it('decrements the listing counter when an inquiry is withdrawn', async () => {
      const inquiry = await inquiryService.createInquiry(buyer._id, listing._id, message);

      await inquiryService.deleteInquiry(inquiry._id, {
        id: buyer._id,
        role: ROLES.BUYER,
      });

      const reloaded = await Listing.findById(listing._id);
      expect(reloaded.inquiryCount).toBe(0);
    });
  });
});
