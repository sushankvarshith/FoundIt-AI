import { query } from '../config/database.js';

// POST /api/items/:id/report
export const createReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;

    const existing = await query(
      'SELECT id FROM reports WHERE reporter_id = $1 AND item_id = $2',
      [req.user.id, id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You have already reported this item.' });
    }

    const result = await query(
      `INSERT INTO reports (reporter_id, item_id, reason, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, id, reason, description]
    );

    res.status(201).json({ message: 'Report submitted.', report: result.rows[0] });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Failed to submit report.' });
  }
};
