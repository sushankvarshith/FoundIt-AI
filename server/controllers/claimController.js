import { query } from '../config/database.js';
import { notify } from '../services/notificationService.js';
import { uploadToCloudinary } from '../services/uploadService.js';

// POST /api/items/:id/claim
export const createClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;

    const item = await query('SELECT id, user_id, title FROM items WHERE id = $1', [id]);
    if (item.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    if (item.rows[0].user_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot claim your own item.' });
    }

    // Check for existing pending claim
    const existing = await query(
      "SELECT id FROM claim_requests WHERE item_id = $1 AND claimant_id = $2 AND status = 'pending'",
      [id, req.user.id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You already have a pending claim for this item.' });
    }

    let proofImageUrl = null;
    if (req.file) {
      const { url } = await uploadToCloudinary(req.file.buffer, 'findit/claims');
      proofImageUrl = url;
    }

    const result = await query(
      `INSERT INTO claim_requests (item_id, claimant_id, reason, description, proof_image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, req.user.id, reason, description, proofImageUrl]
    );

    // Notify item owner
    await notify.claim(item.rows[0].user_id, req.user.name, item.rows[0].title, id);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create claim error:', error);
    res.status(500).json({ error: 'Failed to submit claim.' });
  }
};

// GET /api/claims/received
export const getReceivedClaims = async (req, res) => {
  try {
    const result = await query(
      `SELECT cr.*, i.title as item_title,
        (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = true LIMIT 1) as item_image,
        u.name as claimant_name, u.email as claimant_email, u.avatar_url as claimant_avatar
       FROM claim_requests cr
       JOIN items i ON cr.item_id = i.id
       JOIN users u ON cr.claimant_id = u.id
       WHERE i.user_id = $1
       ORDER BY cr.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get received claims error:', error);
    res.status(500).json({ error: 'Failed to fetch claims.' });
  }
};

// GET /api/claims/sent
export const getSentClaims = async (req, res) => {
  try {
    const result = await query(
      `SELECT cr.*, i.title as item_title,
        (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = true LIMIT 1) as item_image,
        u.name as finder_name, u.avatar_url as finder_avatar
       FROM claim_requests cr
       JOIN items i ON cr.item_id = i.id
       JOIN users u ON i.user_id = u.id
       WHERE cr.claimant_id = $1
       ORDER BY cr.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get sent claims error:', error);
    res.status(500).json({ error: 'Failed to fetch claims.' });
  }
};

// PUT /api/claims/:id
export const updateClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const claim = await query(
      `SELECT cr.*, i.user_id as item_owner_id, i.title as item_title, i.id as item_id
       FROM claim_requests cr
       JOIN items i ON cr.item_id = i.id
       WHERE cr.id = $1`,
      [id]
    );

    if (claim.rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found.' });
    }

    if (claim.rows[0].item_owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    const result = await query(
      'UPDATE claim_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    // If accepted, mark item as claimed
    if (status === 'accepted') {
      await query("UPDATE items SET status = 'claimed', updated_at = NOW() WHERE id = $1", [claim.rows[0].item_id]);
    }

    // Notify claimant
    await notify.claimUpdate(claim.rows[0].claimant_id, status, claim.rows[0].item_title, claim.rows[0].item_id);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update claim error:', error);
    res.status(500).json({ error: 'Failed to update claim.' });
  }
};
