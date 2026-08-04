import { query } from '../config/database.js';
import { notify } from '../services/notificationService.js';

// POST /api/messages
export const sendMessage = async (req, res) => {
  try {
    const { receiver_id, content, item_id } = req.body;

    if (receiver_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot message yourself.' });
    }

    const result = await query(
      `INSERT INTO messages (sender_id, receiver_id, content, item_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, receiver_id, content, item_id || null]
    );

    await notify.message(receiver_id, req.user.name);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
};

// GET /api/messages/conversations
export const getConversations = async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT ON (other_user_id)
        m.*,
        CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END as other_user_id,
        u.name as other_user_name,
        u.avatar_url as other_user_avatar,
        (SELECT COUNT(*) FROM messages
         WHERE receiver_id = $1 AND sender_id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END AND is_read = false
        ) as unread_count
       FROM messages m
       JOIN users u ON u.id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
       WHERE m.sender_id = $1 OR m.receiver_id = $1
       ORDER BY other_user_id, m.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
};

// GET /api/messages/:userId
export const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    // Mark as read
    await query(
      'UPDATE messages SET is_read = true WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false',
      [userId, req.user.id]
    );

    const result = await query(
      `SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC
       LIMIT 100`,
      [req.user.id, userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
};
