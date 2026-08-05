import { query, getClient } from '../config/database.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/uploadService.js';
import { generateEmbedding, storeEmbedding } from '../services/embeddingService.js';
import { runAutoMatch } from '../services/autoMatchService.js';
import QRCode from 'qrcode';

// POST /api/items
export const createItem = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const {
      title, description, category, brand, color,
      location_found, date_found, reward_info,
      phone, email, hide_contact,
    } = req.body;

    // Create item
    const itemResult = await client.query(
      `INSERT INTO items (user_id, title, description, category, brand, color,
        location_found, date_found, reward_info, phone, email, hide_contact)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [req.user.id, title, description, category, brand, color,
       location_found, date_found || null, reward_info, phone, email,
       hide_contact === 'true' || hide_contact === true]
    );

    const item = itemResult.rows[0];

    // Upload images to Cloudinary
    const images = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const { url, publicId } = await uploadToCloudinary(file.buffer, 'findit/items');

        const imgResult = await client.query(
          `INSERT INTO item_images (item_id, image_url, cloudinary_id, is_primary)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [item.id, url, publicId, i === 0]
        );

        images.push(imgResult.rows[0]);

        // Generate embedding for each image (async, don't block)
        generateEmbedding(file.buffer)
          .then(embedding => {
            storeEmbedding(item.id, imgResult.rows[0].id, embedding);
            // Run auto-match after primary image embedding is stored (reuse same embedding)
            if (i === 0) {
              runAutoMatch(embedding, item.id, item.title, req.user.id);
            }
          })
          .catch(err => console.error('Embedding generation error:', err));
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      ...item,
      images,
      user: { id: req.user.id, name: req.user.name, avatar_url: req.user.avatar_url },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Failed to create item.' });
  } finally {
    client.release();
  }
};

// GET /api/items
export const getItems = async (req, res) => {
  try {
    const {
      page = 1, limit = 12, category, location, color, brand,
      status = 'found', sort = 'newest', search,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ['i.status = $1'];
    const params = [status];
    let paramCount = 1;

    if (category) {
      paramCount++;
      conditions.push(`i.category = $${paramCount}`);
      params.push(category);
    }
    if (location) {
      paramCount++;
      conditions.push(`i.location_found ILIKE $${paramCount}`);
      params.push(`%${location}%`);
    }
    if (color) {
      paramCount++;
      conditions.push(`i.color ILIKE $${paramCount}`);
      params.push(`%${color}%`);
    }
    if (brand) {
      paramCount++;
      conditions.push(`i.brand ILIKE $${paramCount}`);
      params.push(`%${brand}%`);
    }
    if (search) {
      paramCount++;
      conditions.push(`(i.title ILIKE $${paramCount} OR i.description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    const whereClause = conditions.join(' AND ');

    let orderBy = 'i.created_at DESC';
    if (sort === 'oldest') orderBy = 'i.created_at ASC';
    if (sort === 'most_viewed') orderBy = 'i.views_count DESC';
    if (sort === 'most_liked') orderBy = 'likes_count DESC';

    // Count total
    const countResult = await query(
      `SELECT COUNT(*) FROM items i WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Fetch items with aggregates
    paramCount++;
    const limitParam = paramCount;
    params.push(parseInt(limit));

    paramCount++;
    const offsetParam = paramCount;
    params.push(offset);

    const userId = req.user?.id || null;

    // Build user-specific subqueries with parameterized values
    let userLikedClause = 'false as is_liked,';
    let userBookmarkedClause = 'false as is_bookmarked';
    if (userId) {
      paramCount++;
      const userIdParam1 = paramCount;
      params.push(userId);
      paramCount++;
      const userIdParam2 = paramCount;
      params.push(userId);
      userLikedClause = `(SELECT EXISTS(SELECT 1 FROM likes WHERE item_id = i.id AND user_id = $${userIdParam1})) as is_liked,`;
      userBookmarkedClause = `(SELECT EXISTS(SELECT 1 FROM bookmarks WHERE item_id = i.id AND user_id = $${userIdParam2})) as is_bookmarked`;
    }

    const result = await query(
      `SELECT
        i.*,
        u.name as user_name,
        u.avatar_url as user_avatar,
        (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = true LIMIT 1) as primary_image,
        (SELECT json_agg(json_build_object('id', img.id, 'url', img.image_url, 'is_primary', img.is_primary))
         FROM item_images img WHERE img.item_id = i.id) as images,
        (SELECT COUNT(*) FROM likes WHERE item_id = i.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE item_id = i.id) as comments_count,
        (SELECT COUNT(*) FROM shares WHERE item_id = i.id) as shares_count,
        ${userLikedClause}
        ${userBookmarkedClause}
       FROM items i
       JOIN users u ON i.user_id = u.id
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      params
    );

    res.json({
      items: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Failed to fetch items.' });
  }
};

// GET /api/items/trending
export const getTrending = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const params = [];
    let userLikedClause = 'false as is_liked';
    if (userId) {
      params.push(userId);
      userLikedClause = `(SELECT EXISTS(SELECT 1 FROM likes WHERE item_id = i.id AND user_id = $1)) as is_liked`;
    }
    const result = await query(
      `SELECT
        i.*,
        u.name as user_name,
        u.avatar_url as user_avatar,
        (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = true LIMIT 1) as primary_image,
        (SELECT COUNT(*) FROM likes WHERE item_id = i.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE item_id = i.id) as comments_count,
        ${userLikedClause}
       FROM items i
       JOIN users u ON i.user_id = u.id
       WHERE i.status = 'found' AND i.created_at > NOW() - INTERVAL '7 days'
       ORDER BY i.views_count DESC, (SELECT COUNT(*) FROM likes WHERE item_id = i.id) DESC
       LIMIT 10`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({ error: 'Failed to fetch trending items.' });
  }
};

// GET /api/items/recent-returned
export const getRecentReturned = async (req, res) => {
  try {
    const result = await query(
      `SELECT i.*, u.name as user_name, u.avatar_url as user_avatar,
        (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = true LIMIT 1) as primary_image
       FROM items i
       JOIN users u ON i.user_id = u.id
       WHERE i.status = 'returned'
       ORDER BY i.updated_at DESC
       LIMIT 10`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get recent returned error:', error);
    res.status(500).json({ error: 'Failed to fetch returned items.' });
  }
};

// GET /api/items/:id
export const getItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;

    // Increment views
    await query('UPDATE items SET views_count = views_count + 1 WHERE id = $1', [id]);

    const params = [id];
    let userLikedClause = 'false as is_liked,';
    let userBookmarkedClause = 'false as is_bookmarked';
    if (userId) {
      params.push(userId);
      const uidParam1 = params.length;
      params.push(userId);
      const uidParam2 = params.length;
      userLikedClause = `(SELECT EXISTS(SELECT 1 FROM likes WHERE item_id = i.id AND user_id = $${uidParam1})) as is_liked,`;
      userBookmarkedClause = `(SELECT EXISTS(SELECT 1 FROM bookmarks WHERE item_id = i.id AND user_id = $${uidParam2})) as is_bookmarked`;
    }

    const result = await query(
      `SELECT
        i.*,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar,
        (SELECT json_agg(json_build_object('id', img.id, 'url', img.image_url, 'is_primary', img.is_primary) ORDER BY img.is_primary DESC)
         FROM item_images img WHERE img.item_id = i.id) as images,
        (SELECT COUNT(*) FROM likes WHERE item_id = i.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE item_id = i.id) as comments_count,
        (SELECT COUNT(*) FROM shares WHERE item_id = i.id) as shares_count,
        (SELECT COUNT(*) FROM claim_requests WHERE item_id = i.id) as claims_count,
        ${userLikedClause}
        ${userBookmarkedClause}
       FROM items i
       JOIN users u ON i.user_id = u.id
       WHERE i.id = $1`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const item = result.rows[0];

    // Hide contact info if requested
    if (item.hide_contact && (!userId || userId !== item.user_id)) {
      item.phone = null;
      item.email = null;
    }

    res.json(item);
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Failed to fetch item.' });
  }
};

// PUT /api/items/:id
export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const existing = await query('SELECT user_id FROM items WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found.' });
    }
    if (existing.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    const {
      title, description, category, brand, color,
      location_found, date_found, reward_info,
      phone, email, hide_contact,
    } = req.body;

    const result = await query(
      `UPDATE items SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        brand = COALESCE($4, brand),
        color = COALESCE($5, color),
        location_found = COALESCE($6, location_found),
        date_found = COALESCE($7, date_found),
        reward_info = COALESCE($8, reward_info),
        phone = COALESCE($9, phone),
        email = COALESCE($10, email),
        hide_contact = COALESCE($11, hide_contact),
        updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [title, description, category, brand, color,
       location_found, date_found || null, reward_info,
       phone, email,
       hide_contact !== undefined ? (hide_contact === 'true' || hide_contact === true) : null,
       id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Failed to update item.' });
  }
};

// DELETE /api/items/:id
export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query(
      'SELECT user_id FROM items WHERE id = $1',
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found.' });
    }
    if (existing.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    // Delete cloudinary images
    const images = await query('SELECT cloudinary_id FROM item_images WHERE item_id = $1', [id]);
    for (const img of images.rows) {
      if (img.cloudinary_id) {
        await deleteFromCloudinary(img.cloudinary_id);
      }
    }

    await query('DELETE FROM items WHERE id = $1', [id]);

    res.json({ message: 'Item deleted successfully.' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item.' });
  }
};

// PUT /api/items/:id/status
export const updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['found', 'claimed', 'returned'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const existing = await query('SELECT user_id FROM items WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found.' });
    }
    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    const result = await query(
      'UPDATE items SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status.' });
  }
};

// GET /api/items/user/:userId
export const getUserItems = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 12, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = 'i.user_id = $1';
    const params = [userId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereClause += ` AND i.status = $${paramCount}`;
      params.push(status);
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM items i WHERE ${whereClause}`,
      params
    );

    paramCount++;
    params.push(parseInt(limit));
    paramCount++;
    params.push(offset);

    const result = await query(
      `SELECT i.*,
        (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = true LIMIT 1) as primary_image,
        (SELECT json_agg(json_build_object('id', img.id, 'url', img.image_url, 'is_primary', img.is_primary))
         FROM item_images img WHERE img.item_id = i.id) as images,
        (SELECT COUNT(*) FROM likes WHERE item_id = i.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE item_id = i.id) as comments_count,
        (SELECT COUNT(*) FROM shares WHERE item_id = i.id) as shares_count,
        (SELECT COUNT(*) FROM claim_requests WHERE item_id = i.id) as claims_count
       FROM items i
       WHERE ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
      params
    );

    res.json({
      items: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get user items error:', error);
    res.status(500).json({ error: 'Failed to fetch user items.' });
  }
};

// GET /api/items/:id/qr
export const getItemQR = async (req, res) => {
  try {
    const { id } = req.params;
    const url = `${process.env.CLIENT_URL}/items/${id}`;
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: '#6366f1', light: '#ffffff' },
    });
    res.json({ qr: qrDataUrl, url });
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code.' });
  }
};
