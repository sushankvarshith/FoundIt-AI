import { query } from '../config/database.js';

// GET /api/admin/dashboard
export const getDashboard = async (req, res) => {
  try {
    const [users, items, claims, reports, returned, recentUsers, recentItems] = await Promise.all([
      query('SELECT COUNT(*) FROM users'),
      query('SELECT COUNT(*) FROM items'),
      query('SELECT COUNT(*) FROM claim_requests'),
      query("SELECT COUNT(*) FROM reports WHERE status = 'pending'"),
      query("SELECT COUNT(*) FROM items WHERE status = 'returned'"),
      query("SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days'"),
      query("SELECT COUNT(*) FROM items WHERE created_at > NOW() - INTERVAL '7 days'"),
    ]);

    // Items by category
    const categories = await query(
      'SELECT category, COUNT(*) as count FROM items WHERE category IS NOT NULL GROUP BY category ORDER BY count DESC LIMIT 10'
    );

    // Items by status
    const statuses = await query(
      'SELECT status, COUNT(*) as count FROM items GROUP BY status'
    );

    // Daily uploads (last 30 days)
    const dailyUploads = await query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM items
       WHERE created_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date`
    );

    res.json({
      stats: {
        total_users: parseInt(users.rows[0].count),
        total_items: parseInt(items.rows[0].count),
        total_claims: parseInt(claims.rows[0].count),
        pending_reports: parseInt(reports.rows[0].count),
        returned_items: parseInt(returned.rows[0].count),
        new_users_week: parseInt(recentUsers.rows[0].count),
        new_items_week: parseInt(recentItems.rows[0].count),
      },
      categories: categories.rows,
      statuses: statuses.rows,
      daily_uploads: dailyUploads.rows,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard.' });
  }
};

// GET /api/admin/users
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '1=1';
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause = `(name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    paramCount++;
    params.push(parseInt(limit));
    paramCount++;
    params.push(offset);

    const result = await query(
      `SELECT id, name, email, avatar_url, role, is_banned, created_at,
        (SELECT COUNT(*) FROM items WHERE user_id = users.id) as uploads_count
       FROM users
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM users WHERE ${whereClause}`,
      search ? [`%${search}%`] : []
    );

    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

// PUT /api/admin/users/:id/ban
export const toggleBan = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await query('SELECT is_banned FROM users WHERE id = $1', [id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const newStatus = !user.rows[0].is_banned;
    await query('UPDATE users SET is_banned = $1 WHERE id = $2', [newStatus, id]);

    res.json({ is_banned: newStatus, message: newStatus ? 'User banned.' : 'User unbanned.' });
  } catch (error) {
    console.error('Toggle ban error:', error);
    res.status(500).json({ error: 'Failed to update user.' });
  }
};

// DELETE /api/admin/items/:id
export const adminDeleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM items WHERE id = $1', [id]);
    res.json({ message: 'Item deleted.' });
  } catch (error) {
    console.error('Admin delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item.' });
  }
};

// GET /api/admin/reports
export const getReports = async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, u.name as reporter_name, i.title as item_title,
        (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = true LIMIT 1) as item_image
       FROM reports r
       JOIN users u ON r.reporter_id = u.id
       JOIN items i ON r.item_id = i.id
       ORDER BY r.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
};

// PUT /api/admin/reports/:id
export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await query('UPDATE reports SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: 'Report updated.' });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ error: 'Failed to update report.' });
  }
};
