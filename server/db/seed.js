import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const sampleItems = [
  {
    title: 'Black Leather Bifold Wallet',
    description: 'Found near Central Park fountain. Contains driver license and cards.',
    category: 'Wallet',
    brand: 'Fossil',
    color: 'Black',
    location_found: 'Central Park, New York',
    date_found: '2026-08-01',
    reward_info: '$20 reward',
    phone: '+1 555 019 2831',
    email: 'finder1@example.com',
    status: 'found',
    image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'iPhone 15 Pro Max (Space Black)',
    description: 'Found on seat 14B on the Metro line. Phone has a clear magsafe case.',
    category: 'Phone',
    brand: 'Apple',
    color: 'Black',
    location_found: 'Metro Station, 5th Ave',
    date_found: '2026-08-02',
    reward_info: 'Generous reward upon verification',
    phone: '+1 555 014 9922',
    email: 'metro.finder@example.com',
    status: 'found',
    image_url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Toyota Car Keys with Blue Keychain',
    description: 'Key fob with 3 keys attached to a blue leather woven keychain.',
    category: 'Keys',
    brand: 'Toyota',
    color: 'Blue',
    location_found: 'Starbucks Parking Lot, Downtown',
    date_found: '2026-07-30',
    reward_info: '',
    phone: '+1 555 018 3341',
    email: 'starbucks.staff@example.com',
    status: 'found',
    image_url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Sony WH-1000XM5 Headphones (Silver)',
    description: 'Left in the library reading room on floor 3.',
    category: 'Headphones',
    brand: 'Sony',
    color: 'Silver',
    location_found: 'City Public Library',
    date_found: '2026-07-28',
    reward_info: '',
    phone: '+1 555 012 4455',
    email: 'lib.desk@example.com',
    status: 'returned',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
  },
];

async function seed() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🌱 Seeding sample data...');

    // 1. Create demo user & admin user
    const hashedPwd = await bcrypt.hash('Password123!', 10);

    const userRes = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id;`,
      ['Demo User', 'demo@findit.com', hashedPwd, 'user']
    );
    const userId = userRes.rows[0].id;

    await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;`,
      ['Admin User', 'admin@findit.com', hashedPwd, 'admin']
    );

    // 2. Insert sample items
    for (const item of sampleItems) {
      const itemRes = await pool.query(
        `INSERT INTO items
         (user_id, title, description, category, brand, color, location_found, date_found, reward_info, phone, email, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id;`,
        [
          userId, item.title, item.description, item.category, item.brand,
          item.color, item.location_found, item.date_found, item.reward_info,
          item.phone, item.email, item.status
        ]
      );
      const itemId = itemRes.rows[0].id;

      // Insert primary image
      await pool.query(
        `INSERT INTO item_images (item_id, image_url, is_primary)
         VALUES ($1, $2, true);`,
        [itemId, item.image_url]
      );
    }

    console.log('✅ Sample data seeded successfully!');
    console.log('  📧 Demo Login: demo@findit.com / Password123!');
    console.log('  👑 Admin Login: admin@findit.com / Password123!');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await pool.end();
  }
}

seed();
