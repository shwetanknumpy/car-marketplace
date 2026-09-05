'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../utils/constants');

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      // Uniqueness is enforced by the index below, not by a pre-save lookup:
      // a read-then-write check races under concurrent signups.
      unique: true,
      index: true,
    },
    // Never selected by default, so no query can leak the hash by accident.
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.BUYER,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.statics.hashPassword = function hashPassword(plainText) {
  return bcrypt.hash(plainText, SALT_ROUNDS);
};

userSchema.methods.verifyPassword = function verifyPassword(plainText) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(plainText, this.passwordHash);
};

userSchema.methods.isSeller = function isSeller() {
  return this.role === ROLES.SELLER || this.role === ROLES.ADMIN;
};

/** The shape denormalized onto listings and inquiries. */
userSchema.methods.toContactSnapshot = function toContactSnapshot() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone || '',
  };
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
