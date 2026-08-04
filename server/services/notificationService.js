import { query } from '../config/database.js';

let io = null;

/**
 * Initialize the notification service with Socket.io instance.
 */
export function initNotificationService(socketIo) {
  io = socketIo;
}

/**
 * Create a notification and emit it in real-time via Socket.io.
 * @param {Object} params
 * @param {string} params.userId - Recipient user ID
 * @param {string} params.type - Notification type
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {string} [params.referenceId] - Related entity ID
 * @param {string} [params.referenceType] - Related entity type (item, comment, claim, etc.)
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  referenceId = null,
  referenceType = null,
}) {
  try {
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, type, title, message, referenceId, referenceType]
    );

    const notification = result.rows[0];

    // Emit real-time notification via Socket.io
    if (io) {
      io.to(`user:${userId}`).emit('notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    // Don't throw - notifications failing shouldn't break main operations
  }
}

/**
 * Create notifications for multiple types of events.
 */
export const notify = {
  async comment(itemOwnerId, commenterName, itemTitle, itemId) {
    if (!itemOwnerId) return;
    await createNotification({
      userId: itemOwnerId,
      type: 'comment',
      title: 'New Comment',
      message: `${commenterName} commented on "${itemTitle}"`,
      referenceId: itemId,
      referenceType: 'item',
    });
  },

  async like(itemOwnerId, likerName, itemTitle, itemId) {
    if (!itemOwnerId) return;
    await createNotification({
      userId: itemOwnerId,
      type: 'like',
      title: 'New Like',
      message: `${likerName} liked "${itemTitle}"`,
      referenceId: itemId,
      referenceType: 'item',
    });
  },

  async claim(itemOwnerId, claimantName, itemTitle, itemId) {
    if (!itemOwnerId) return;
    await createNotification({
      userId: itemOwnerId,
      type: 'claim',
      title: 'New Claim Request',
      message: `${claimantName} thinks "${itemTitle}" belongs to them`,
      referenceId: itemId,
      referenceType: 'item',
    });
  },

  async claimUpdate(claimantId, status, itemTitle, itemId) {
    if (!claimantId) return;
    await createNotification({
      userId: claimantId,
      type: 'claim_update',
      title: `Claim ${status === 'accepted' ? 'Accepted' : 'Rejected'}`,
      message: `Your claim for "${itemTitle}" has been ${status}`,
      referenceId: itemId,
      referenceType: 'item',
    });
  },

  async share(itemOwnerId, sharerName, itemTitle, itemId) {
    if (!itemOwnerId) return;
    await createNotification({
      userId: itemOwnerId,
      type: 'share',
      title: 'Item Shared',
      message: `${sharerName} shared "${itemTitle}"`,
      referenceId: itemId,
      referenceType: 'item',
    });
  },

  async aiMatch(userId, matchTitle, matchSimilarity, itemId) {
    if (!userId) return;
    await createNotification({
      userId,
      type: 'ai_match',
      title: '🤖 Possible Match Found!',
      message: `AI detected a ${matchSimilarity}% match with "${matchTitle}"`,
      referenceId: itemId,
      referenceType: 'item',
    });
  },

  async message(receiverId, senderName) {
    if (!receiverId) return;
    await createNotification({
      userId: receiverId,
      type: 'message',
      title: 'New Message',
      message: `${senderName} sent you a message`,
      referenceType: 'message',
    });
  },
};
