'use strict';

const {
  buildSearchFilter,
} = require('../../src/repositories/listingRepository');

/**
 * The filter builder is pure, so it can be asserted without a database — which
 * is the point of keeping query construction in the repository rather than
 * inline in a controller.
 */
describe('listingRepository.buildSearchFilter', () => {
  it('defaults to active listings only', () => {
    expect(buildSearchFilter({}).status).toBe('active');
  });

  it('honours an explicit status', () => {
    expect(buildSearchFilter({ status: 'sold' }).status).toBe('sold');
  });

  it('matches make and model case-insensitively but exactly', () => {
    const filter = buildSearchFilter({ make: 'toyota', model: 'corolla' });

    expect(filter.make).toBeInstanceOf(RegExp);
    expect(filter.make.source).toBe('^toyota$');
    expect(filter.make.flags).toContain('i');
    expect(filter.model.source).toBe('^corolla$');
  });

  it('escapes regex metacharacters in user input', () => {
    const filter = buildSearchFilter({ make: 'a.*b' });
    expect(filter.make.source).toBe('^a\\.\\*b$');
  });

  it('turns min/max inputs into range predicates', () => {
    const filter = buildSearchFilter({
      minYear: 2015,
      maxYear: 2020,
      minPrice: 5000,
      maxPrice: 20000,
      maxMileage: 60000,
    });

    expect(filter.year).toEqual({ $gte: 2015, $lte: 2020 });
    expect(filter.price).toEqual({ $gte: 5000, $lte: 20000 });
    expect(filter.mileage).toEqual({ $lte: 60000 });
  });

  it('supports one-sided ranges', () => {
    expect(buildSearchFilter({ maxPrice: 9000 }).price).toEqual({ $lte: 9000 });
    expect(buildSearchFilter({ minYear: 2018 }).year).toEqual({ $gte: 2018 });
  });

  it('omits ranges entirely when no bound was supplied', () => {
    const filter = buildSearchFilter({ make: 'Ford' });
    expect(filter.price).toBeUndefined();
    expect(filter.year).toBeUndefined();
  });

  it('adds a text predicate for keyword search', () => {
    expect(buildSearchFilter({ q: 'estate diesel' }).$text).toEqual({
      $search: 'estate diesel',
    });
  });

  it('scopes to one seller when a seller id is given', () => {
    expect(buildSearchFilter({ sellerId: 'abc123' })['seller.id']).toBe('abc123');
  });
});
