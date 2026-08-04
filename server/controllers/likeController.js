import { query } from '../config/database.js';
import { notify } from '../services/notificationService.js';

// POST /api/items/:id/like (toggle)
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;

    // Check item exists
    const item = await query('SELECT id, user_id, title FROM items WHERE id = $1', [id]);
    if (item.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    // Check if already liked
    const existing = await query(
      'SELECT id FROM likes WHERE user_id = $1 AND item_id = $2',
      [req.user.id, id]
    );

    if (existing.rows.length > 0) {
      // Unlike
      await query('DELETE FROM likes WHERE user_id = $1 AND item_id = $2', [req.user.id, id]);
      const count = await query('SELECT COUNT(*) FROM likes WHERE item_id = $1', [id]);
      return res.json({ liked: false, likes_count: parseInt(count.rows[0].count) });
    }

    // Like
    await query(
      'INSERT INTO likes (user_id, item_id) VALUES ($1, $2)',
      [req.user.id, id]
    );

    const count = await query('SELECT COUNT(*) FROM likes WHERE item_id = $1', [id]);

    // Notify item owner
    if (item.rows[0].user_id !== req.user.id) {
      await notify.like(item.rows[0].user_id, req.user.name, item.rows[0].title, id);
    }

    res.json({ liked: true, likes_count: parseInt(count.rows[0].count) });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Failed to toggle like.' });
  }
};

// GET /api/items/:id/likes
export const getLikes = async (req, res) => {
  try {
    const { id } = req.params;
    const count = await query('SELECT COUNT(*) FROM likes WHERE item_id = $1', [id]);

    let isLiked = false;
    if (req.user) {
      const userLike = await query(
        'SELECT id FROM likes WHERE user_id = $1 AND item_id = $2',
        [req.user.id, id]
      );
      isLiked = userLike.rows.length > 0;
    }

    res.json({ likes_count: parseInt(count.rows[0].count), is_liked: isLiked });
  } catch (error) {
    console.error('Get likes error:', error);
    res.status(500).json({ error: 'Failed to fetch likes.' });
  }
};
