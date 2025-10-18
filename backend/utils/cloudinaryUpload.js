import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { Readable } from 'stream';
import logger from '../config/logger.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Check if an error is transient and safe to retry */
const isTransientError = (err) => {
  const code = err?.code || err?.error?.code;
  const httpCode = err?.http_code || err?.error?.http_code;

  const transientNetworkCodes = ['ETIMEDOUT', 'ENETUNREACH', 'ECONNRESET'];
  const transientHttpCodes = [408, 429, 500, 502, 503, 504];

  return transientNetworkCodes.includes(code) || transientHttpCodes.includes(httpCode);
};

/** Uniform error wrapper */
const formatError = (error, fallback = 'File upload failed') => {
  const message =
    error?.message ||
    error?.error?.message ||
    (() => {
      try {
        return JSON.stringify(error);
      } catch {
        return fallback;
      }
    })();

  const e = new Error(message || fallback);
  e.code = error?.code || error?.error?.code;
  e.http_code = error?.http_code || error?.error?.http_code;
  return e;
};

/** Upload helper with retry logic */
const attemptUpload = async (uploadFn, label, maxRetries = 3) => {
  let lastErr;
  for (let i = 1; i <= maxRetries; i++) {
    try {
      return await uploadFn();
    } catch (err) {
      lastErr = err;
      if (isTransientError(err) && i < maxRetries) {
        const backoff = 700 * i + Math.random() * 300; // jittered backoff
        logger.warn(`Cloudinary upload (${label}) transient error — retrying`, {
          attempt: i,
          code: err?.code,
          http: err?.http_code,
          waitMs: Math.round(backoff),
        });
        await delay(backoff);
        continue;
      }
      throw formatError(err);
    }
  }
  throw lastErr;
};

/**
 * Uploads a file (path, buffer, or multer file) to Cloudinary.
 */
export const uploadToCloudinary = async (input, folder = 'chatapp', options = {}) => {
  const cloudOpts = { folder, resource_type: 'auto', ...options };

  // Upload from file path
  if (typeof input === 'string') {
    const filePath = input;
    try {
      const result = await attemptUpload(
        () => cloudinary.uploader.upload(filePath, cloudOpts),
        'path'
      );
      await fs.promises.unlink(filePath).catch(() => {}); // async delete
      return { public_id: result.public_id, url: result.secure_url, ...result };
    } catch (error) {
      await fs.promises.unlink(filePath).catch(() => {});
      logger.error('Cloudinary upload (path) failed', {
        reason: error.message,
        code: error.code,
        folder,
      });
      throw error;
    }
  }

  // Upload from buffer (Multer memory or raw buffer)
  // Ensure we use a Node Buffer, not the underlying ArrayBuffer
  if (Buffer.isBuffer(input) || (input && Buffer.isBuffer(input.buffer)) || input instanceof ArrayBuffer) {
    const buffer = Buffer.isBuffer(input)
      ? input
      : input instanceof ArrayBuffer
      ? Buffer.from(input)
      : input.buffer; // multer file.buffer (Buffer)

    // First try with provided options; if it fails (non-transient), fall back to resource_type 'auto'
    try {
      return await attemptUpload(
        () =>
          new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(cloudOpts, (error, result) => {
              if (error) return reject(formatError(error));
              if (!result) return reject(new Error('No result from Cloudinary'));
              resolve({ public_id: result.public_id, url: result.secure_url, ...result });
            });
            Readable.from(buffer).pipe(stream);
          }),
        'buffer'
      );
    } catch (err) {
      // If caller already requested 'auto', don't loop; rethrow
      if ((cloudOpts.resource_type || 'auto') === 'auto') throw err;
      logger.warn('Buffer upload failed — retrying with resource_type auto', {
        code: err?.code,
        http: err?.http_code,
        message: err?.message,
      });
      const autoOpts = { ...cloudOpts, resource_type: 'auto' };
      return attemptUpload(
        () =>
          new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(autoOpts, (error, result) => {
              if (error) return reject(formatError(error));
              if (!result) return reject(new Error('No result from Cloudinary'));
              resolve({ public_id: result.public_id, url: result.secure_url, ...result });
            });
            Readable.from(buffer).pipe(stream);
          }),
        'buffer'
      );
    }
  }

  throw new Error('Invalid input type for Cloudinary upload');
};

/**
 * Deletes a file from Cloudinary by its public ID.
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) throw new Error('Public ID is required for deletion');

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result?.result !== 'ok') {
      logger.warn('Cloudinary delete returned non-ok', { publicId, result });
    }
    return result;
  } catch (err) {
    logger.error('Cloudinary deletion failed', { publicId, error: err });
    throw formatError(err, 'File deletion failed');
  }
};
