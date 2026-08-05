import { generateEmbedding, findSimilarItems } from '../services/embeddingService.js';
import { query } from '../config/database.js';

// POST /api/search/image - AI Image Similarity Search
export const imageSearch = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image to search.' });
    }

    console.log('🔍 Processing image search...');

    // Generate embedding for the uploaded search image
    let embedding;
    try {
      embedding = await generateEmbedding(req.file.buffer);
    } catch (modelError) {
      console.error('AI model error:', modelError);
      return res.status(503).json({ error: 'AI search model is still loading. Please try again in a few seconds.' });
    }

    // Find top 20 similar items
    const results = await findSimilarItems(embedding, 20);

    // Enrich results with additional data
    const enrichedResults = await Promise.all(
      results.map(async (item) => {
        const imagesResult = await query(
          `SELECT id, image_url, is_primary FROM item_images WHERE item_id = $1 ORDER BY is_primary DESC`,
          [item.id]
        );

        const likesResult = await query(
          'SELECT COUNT(*) FROM likes WHERE item_id = $1',
          [item.id]
        );

        const commentsResult = await query(
          'SELECT COUNT(*) FROM comments WHERE item_id = $1',
          [item.id]
        );

        return {
          ...item,
          images: imagesResult.rows,
          likes_count: parseInt(likesResult.rows[0].count),
          comments_count: parseInt(commentsResult.rows[0].count),
          similarity: parseFloat(item.similarity),
        };
      })
    );

    res.json({
      results: enrichedResults,
      count: enrichedResults.length,
      message: enrichedResults.length > 0
        ? `Found ${enrichedResults.length} similar items`
        : 'No similar items found. Try a different image.',
    });
  } catch (error) {
    console.error('Image search error:', error);
    res.status(500).json({ error: 'Image search failed. Please try again.' });
  }
};

// GET /api/search - Text/Filter Search
export const textSearch = async (req, res) => {
  try {
    const {
      q, category, location, color, brand, date_from, date_to,
      sort = 'newest', page = 1, limit = 12,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ["i.status = 'found'"];
    const params = [];
    let paramCount = 0;

    if (q) {
      paramCount++;
      conditions.push(`(i.title ILIKE $${paramCount} OR i.description ILIKE $${paramCount} OR i.brand ILIKE $${paramCount})`);
      params.push(`%${q}%`);
    }
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
    if (date_from) {
      paramCount++;
      conditions.push(`i.date_found >= $${paramCount}`);
      params.push(date_from);
    }
    if (date_to) {
      paramCount++;
      conditions.push(`i.date_found <= $${paramCount}`);
      params.push(date_to);
    }

    const whereClause = conditions.join(' AND ');

    let orderBy = 'i.created_at DESC';
    if (sort === 'oldest') orderBy = 'i.created_at ASC';
    if (sort === 'most_viewed') orderBy = 'i.views_count DESC';

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
        u.name as user_name, u.avatar_url as user_avatar,
        (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = true LIMIT 1) as primary_image,
        (SELECT json_agg(json_build_object('id', img.id, 'url', img.image_url))
         FROM item_images img WHERE img.item_id = i.id) as images,
        (SELECT COUNT(*) FROM likes WHERE item_id = i.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE item_id = i.id) as comments_count
       FROM items i
       JOIN users u ON i.user_id = u.id
       WHERE ${whereClause}
       ORDER BY ${orderBy}
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
    console.error('Text search error:', error);
    res.status(500).json({ error: 'Search failed.' });
  }
};
