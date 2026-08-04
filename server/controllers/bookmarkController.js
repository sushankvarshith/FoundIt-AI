import { query } from '../config/database.js';

// POST /api/items/:id/bookmark (toggle)
export const toggleBookmark = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND item_id = $2',
      [req.user.id, id]
    );

    if (existing.rows.length > 0) {
      await query('DELETE FROM bookmarks WHERE user_id = $1 AND item_id = $2', [req.user.id, id]);
      return res.json({ bookmarked: false });
    }

    await query('INSERT INTO bookmarks (user_id, item_id) VALUES ($1, $2)', [req.user.id, id]);
    res.json({ bookmarked: true });
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({ error: 'Failed to toggle bookmark.' });
  }
};

// GET /api/bookmarks
export const getBookmarks = async (req, res) => {
  try {
    const result = await query(
      `SELECT i.*, u.name as user_name, u.avatar_url as user_avatar,
        (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = true LIMIT 1) as primary_image,
        (SELECT COUNT(*) FROM likes WHERE item_id = i.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE item_id = i.id) as comments_count,
        b.created_at as bookmarked_at
       FROM bookmarks b
       JOIN items i ON b.item_id = i.id
       JOIN users u ON i.user_id = u.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks.' });
  }
};
