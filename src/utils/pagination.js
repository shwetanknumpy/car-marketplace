'use strict';

const env = require('../config/env');

/**
 * Turns validated `page`/`limit` inputs into skip/limit plus a meta block.
 *
 * `limit` is capped server-side: the response payload for a search stays the
 * same size whether the collection holds 50 listings or 500,000.
 */
function resolvePagination({ page, limit } = {}) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const requested = Number.parseInt(limit, 10) || env.pagination.defaultPageSize;
  const safeLimit = Math.min(Math.max(1, requested), env.pagination.maxPageSize);

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}

function buildMeta({ page, limit, total }) {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1 && total > 0,
  };
}

module.exports = { resolvePagination, buildMeta };
