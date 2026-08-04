import { pipeline, env } from '@xenova/transformers';
import sharp from 'sharp';
import { query } from '../config/database.js';

// Configure transformers.js for server-side use
env.cacheDir = './.cache/huggingface';
env.allowLocalModels = true;

let featureExtractor = null;
let isLoading = false;

/**
 * Lazy-load the CLIP model (quantized for low memory footprint).
 * Uses Xenova/clip-vit-base-patch32 which is smaller than patch16.
 * Quantized model: ~85MB vs ~350MB full precision.
 */
async function getExtractor() {
  if (featureExtractor) return featureExtractor;
  if (isLoading) {
    // Wait for existing load to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return featureExtractor;
  }

  isLoading = true;
  try {
    console.log('🤖 Loading CLIP model (quantized)...');
    featureExtractor = await pipeline(
      'feature-extraction',
      'Xenova/clip-vit-base-patch32',
      {
        quantized: true, // Use int8 quantized model (~85MB instead of ~350MB)
      }
    );
    console.log('✅ CLIP model loaded successfully');
    return featureExtractor;
  } catch (error) {
    console.error('❌ Failed to load CLIP model:', error);
    isLoading = false;
    throw error;
  } finally {
    isLoading = false;
  }
}

/**
 * Preprocess image buffer for CLIP model input.
 * Resizes to 224x224 and converts to RGB.
 */
async function preprocessImage(imageBuffer) {
  const processed = await sharp(imageBuffer)
    .resize(224, 224, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return processed;
}

/**
 * Generate a 512-dimensional embedding from an image buffer.
 * @param {Buffer} imageBuffer - Raw image buffer
 * @returns {Float32Array} 512-dim embedding vector
 */
export async function generateEmbedding(imageBuffer) {
  try {
    const extractor = await getExtractor();

    // Preprocess with sharp
    const { data, info } = await preprocessImage(imageBuffer);

    // Convert raw pixel data to the format expected by transformers.js
    // Create a simple data URL from the buffer for the pipeline
    const base64 = imageBuffer.toString('base64');
    const mimeType = 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Extract features using the pipeline
    const output = await extractor(dataUrl, { pooling: 'mean', normalize: true });

    // Get the embedding as a flat array
    const embedding = Array.from(output.data);

    // Normalize to unit vector for cosine similarity
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalized = embedding.map(val => val / magnitude);

    return normalized;
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw new Error('Failed to generate image embedding');
  }
}

/**
 * Store an embedding in the database.
 * @param {string} itemId - Item UUID
 * @param {string} imageId - Image UUID
 * @param {number[]} embedding - 512-dim vector
 */
export async function storeEmbedding(itemId, imageId, embedding) {
  const vectorStr = `[${embedding.join(',')}]`;
  await query(
    'INSERT INTO embeddings (item_id, image_id, embedding) VALUES ($1, $2, $3)',
    [itemId, imageId, vectorStr]
  );
}

/**
 * Find similar items using cosine similarity via pgvector.
 * Returns top N most similar items with similarity scores.
 * @param {number[]} embedding - Query embedding vector
 * @param {number} limit - Number of results (default 20)
 * @param {string|null} excludeItemId - Item ID to exclude from results
 * @returns {Array} Items with similarity scores
 */
export async function findSimilarItems(embedding, limit = 20, excludeItemId = null) {
  const vectorStr = `[${embedding.join(',')}]`;

  let sql = `
    SELECT DISTINCT ON (i.id)
      i.id,
      i.title,
      i.description,
      i.category,
      i.brand,
      i.color,
      i.location_found,
      i.date_found,
      i.status,
      i.views_count,
      i.created_at,
      u.id as user_id,
      u.name as user_name,
      u.avatar_url as user_avatar,
      img.image_url as primary_image,
      ROUND((1 - (e.embedding <=> $1::vector))::numeric * 100, 1) as similarity
    FROM embeddings e
    JOIN items i ON e.item_id = i.id
    JOIN users u ON i.user_id = u.id
    LEFT JOIN item_images img ON img.item_id = i.id AND img.is_primary = true
    WHERE i.status != 'returned'
  `;

  const params = [vectorStr];

  if (excludeItemId) {
    sql += ` AND i.id != $2`;
    params.push(excludeItemId);
  }

  sql += `
    ORDER BY i.id, e.embedding <=> $1::vector ASC
  `;

  // Wrap to apply limit on distinct results sorted by similarity
  const wrappedSql = `
    SELECT * FROM (${sql}) AS unique_items
    ORDER BY similarity DESC
    LIMIT $${params.length + 1}
  `;
  params.push(limit);

  const result = await query(wrappedSql, params);
  return result.rows;
}

/**
 * Find potential matches for auto-matching (similarity > threshold).
 * @param {number[]} embedding - New item's embedding
 * @param {string} itemId - New item's ID to exclude
 * @param {number} threshold - Minimum similarity percentage (default 85)
 * @returns {Array} Matching items above threshold
 */
export async function findAutoMatches(embedding, itemId, threshold = 85) {
  const vectorStr = `[${embedding.join(',')}]`;

  const result = await query(
    `SELECT DISTINCT ON (i.id)
      i.id,
      i.title,
      i.user_id,
      ROUND((1 - (e.embedding <=> $1::vector))::numeric * 100, 1) as similarity
    FROM embeddings e
    JOIN items i ON e.item_id = i.id
    WHERE i.id != $2
      AND i.status = 'found'
      AND (1 - (e.embedding <=> $1::vector)) * 100 >= $3
    ORDER BY i.id, e.embedding <=> $1::vector ASC
    LIMIT 10`,
    [vectorStr, itemId, threshold]
  );

  return result.rows;
}

/**
 * Preload the model in the background (call on server start).
 */
export async function preloadModel() {
  try {
    await getExtractor();
  } catch (error) {
    console.warn('⚠️ Model preload failed, will load on first request:', error.message);
  }
}
