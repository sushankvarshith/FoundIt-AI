import { findAutoMatches } from './embeddingService.js';
import { notify } from './notificationService.js';
import { query } from '../config/database.js';

/**
 * Automatically compare a newly uploaded item's embedding against all existing items.
 * If similarity > threshold, notify both users.
 * Runs asynchronously - does not block the upload response.
 *
 * @param {number[]} embedding - The new item's embedding vector
 * @param {string} newItemId - The new item's ID
 * @param {string} newItemTitle - The new item's title
 * @param {string} uploaderId - The uploader's user ID
 */
export async function runAutoMatch(embedding, newItemId, newItemTitle, uploaderId) {
  try {
    const matches = await findAutoMatches(embedding, newItemId, 80);

    if (matches.length === 0) return;

    for (const match of matches) {
      // Notify the owner of the existing item
      await notify.aiMatch(
        match.user_id,
        newItemTitle,
        match.similarity,
        newItemId
      );

      // Notify the uploader about the existing match
      await notify.aiMatch(
        uploaderId,
        match.title,
        match.similarity,
        match.id
      );
    }

    console.log(`🤖 Auto-match: Found ${matches.length} matches for item ${newItemId}`);
  } catch (error) {
    console.error('Auto-match error:', error);
    // Non-critical - don't throw
  }
}
