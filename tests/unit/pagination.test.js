'use strict';

const { resolvePagination, buildMeta } = require('../../src/utils/pagination');
const env = require('../../src/config/env');

describe('pagination', () => {
  it('defaults to the first page and the configured page size', () => {
    expect(resolvePagination()).toEqual({
      page: 1,
      limit: env.pagination.defaultPageSize,
      skip: 0,
    });
  });

  it('computes skip from page and limit', () => {
    expect(resolvePagination({ page: 3, limit: 10 })).toEqual({
      page: 3,
      limit: 10,
      skip: 20,
    });
  });

  it('caps limit so a caller cannot request an unbounded payload', () => {
    const { limit } = resolvePagination({ limit: 100000 });
    expect(limit).toBe(env.pagination.maxPageSize);
  });

  it('clamps nonsensical input to safe values', () => {
    expect(resolvePagination({ page: -4, limit: 0 })).toEqual({
      page: 1,
      limit: env.pagination.defaultPageSize,
      skip: 0,
    });
    expect(resolvePagination({ page: 'abc' }).page).toBe(1);
  });

  it('builds meta describing the surrounding pages', () => {
    expect(buildMeta({ page: 2, limit: 10, total: 35 })).toEqual({
      page: 2,
      limit: 10,
      total: 35,
      totalPages: 4,
      hasNextPage: true,
      hasPrevPage: true,
    });
  });

  it('reports no neighbouring pages for an empty result set', () => {
    expect(buildMeta({ page: 1, limit: 10, total: 0 })).toMatchObject({
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    });
  });
});
