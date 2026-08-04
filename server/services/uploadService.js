import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer - Image buffer
 * @param {string} folder - Cloudinary folder name
 * @returns {Object} { url, publicId }
 */
export function uploadToCloudinary(buffer, folder = 'findit') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

/**
 * Delete an image from Cloudinary.
 * @param {string} publicId - Cloudinary public ID
 */
export async function deleteFromCloudinary(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
}

/**
 * Upload multiple buffers to Cloudinary.
 * @param {Buffer[]} buffers - Array of image buffers
 * @param {string} folder - Cloudinary folder name
 * @returns {Array<{url: string, publicId: string}>}
 */
export async function uploadMultipleToCloudinary(buffers, folder = 'findit') {
  const uploads = buffers.map(buffer => uploadToCloudinary(buffer, folder));
  return Promise.all(uploads);
}
