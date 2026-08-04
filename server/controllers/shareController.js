import { query } from '../config/database.js';
import { notify } from '../services/notificationService.js';

// POST /api/items/:id/share
export const trackShare = async (req, res) => {
  try {
    const { id } = req.params;
    const { platform } = req.body;

    await query(
      'INSERT INTO shares (user_id, item_id, platform) VALUES ($1, $2, $3)',
      [req.user?.id || null, id, platform]
    );

    // Notify item owner
    if (req.user) {
      const item = await query('SELECT user_id, title FROM items WHERE id = $1', [id]);
      if (item.rows.length > 0 && item.rows[0].user_id !== req.user.id) {
        await notify.share(item.rows[0].user_id, req.user.name, item.rows[0].title, id);
      }
    }

    const count = await query('SELECT COUNT(*) FROM shares WHERE item_id = $1', [id]);
    res.json({ shares_count: parseInt(count.rows[0].count) });
  } catch (error) {
    console.error('Track share error:', error);
    res.status(500).json({ error: 'Failed to track share.' });
  }
};
