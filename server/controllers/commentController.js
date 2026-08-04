import { query } from '../config/database.js';
import { notify } from '../services/notificationService.js';

// POST /api/items/:id/comments
export const createComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parent_id } = req.body;

    // Check item exists
    const item = await query('SELECT id, user_id, title FROM items WHERE id = $1', [id]);
    if (item.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const result = await query(
      `INSERT INTO comments (user_id, item_id, parent_id, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, id, parent_id || null, content]
    );

    const comment = {
      ...result.rows[0],
      user_name: req.user.name,
      user_avatar: req.user.avatar_url,
    };

    // Notify item owner (if not self-commenting)
    if (item.rows[0].user_id !== req.user.id) {
      await notify.comment(item.rows[0].user_id, req.user.name, item.rows[0].title, id);
    }

    // If replying, notify parent comment author
    if (parent_id) {
      const parentComment = await query('SELECT user_id FROM comments WHERE id = $1', [parent_id]);
      if (parentComment.rows.length > 0 && parentComment.rows[0].user_id !== req.user.id) {
        await notify.comment(parentComment.rows[0].user_id, req.user.name, 'your comment', id);
      }
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to post comment.' });
  }
};

// GET /api/items/:id/comments
export const getComments = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch all comments (threaded via parent_id)
    const result = await query(
      `SELECT c.*, u.name as user_name, u.avatar_url as user_avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.item_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );

    // Build threaded structure
    const comments = result.rows;
    const rootComments = comments.filter(c => !c.parent_id);
    const childMap = {};

    comments.forEach(c => {
      if (c.parent_id) {
        if (!childMap[c.parent_id]) childMap[c.parent_id] = [];
        childMap[c.parent_id].push(c);
      }
    });

    const threaded = rootComments.map(c => ({
      ...c,
      replies: childMap[c.id] || [],
    }));

    res.json(threaded);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments.' });
  }
};

// DELETE /api/comments/:id
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await query('SELECT user_id FROM comments WHERE id = $1', [id]);
    if (comment.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found.' });
    }
    if (comment.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    await query('DELETE FROM comments WHERE id = $1', [id]);
    res.json({ message: 'Comment deleted.' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment.' });
  }
};
