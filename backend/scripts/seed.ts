import { Pool } from 'pg';

const sizes = ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45', 'EU 46'] as const;

const drops = [
  {
    sku: 'NIKE-AJ1-LOST-FOUND',
    slug: 'nike-air-jordan-1-lost-and-found',
    brand: 'Nike',
    model: 'Air Jordan 1 Retro High OG',
    name: 'Air Jordan 1 Retro High OG Lost and Found',
    colorway: 'Varsity Red/Black/Sail/Muslin',
    description: 'Limited Jordan drop inspired by vintage Chicago color blocking.',
    priceCents: 89900,
    imageUrl:
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1200&q=80',
    releaseAt: '2026-07-15T16:00:00.000Z',
    stockTotal: 12,
    sizeStocks: [1, 1, 2, 3, 2, 2, 1],
  },
  {
    sku: 'NIKE-DUNK-PANDA-LOW',
    slug: 'nike-dunk-low-panda',
    brand: 'Nike',
    model: 'Dunk Low',
    name: 'Nike Dunk Low Panda',
    colorway: 'White/Black',
    description: 'High-demand Dunk Low release in a clean monochrome colorway.',
    priceCents: 54900,
    imageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
    releaseAt: '2026-07-18T16:00:00.000Z',
    stockTotal: 20,
    sizeStocks: [2, 3, 4, 4, 3, 2, 2],
  },
  {
    sku: 'NIKE-AM1-LIMITED-BLUE',
    slug: 'nike-air-max-1-limited-blue',
    brand: 'Nike',
    model: 'Air Max 1',
    name: 'Nike Air Max 1 Limited Blue',
    colorway: 'White/Royal Blue/Neutral Grey',
    description: 'Limited Air Max 1 drop with a classic runner silhouette.',
    priceCents: 69900,
    imageUrl:
      'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=1200&q=80',
    releaseAt: '2026-07-20T16:00:00.000Z',
    stockTotal: 10,
    sizeStocks: [1, 1, 2, 2, 2, 1, 1],
  },
];

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to seed the database.');
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    for (const drop of drops) {
      const productResult = await pool.query<{ id: number }>(
        `
          INSERT INTO products (
            sku,
            slug,
            brand,
            model,
            name,
            colorway,
            description,
            price_cents,
            image_url,
            release_at,
            stock_total,
            stock_available,
            stock_reserved,
            stock_sold
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, 0, 0)
          ON CONFLICT (sku) DO UPDATE
          SET slug = EXCLUDED.slug,
              brand = EXCLUDED.brand,
              model = EXCLUDED.model,
              name = EXCLUDED.name,
              colorway = EXCLUDED.colorway,
              description = EXCLUDED.description,
              price_cents = EXCLUDED.price_cents,
              image_url = EXCLUDED.image_url,
              release_at = EXCLUDED.release_at,
              stock_total = EXCLUDED.stock_total,
              stock_available = EXCLUDED.stock_available,
              stock_reserved = 0,
              stock_sold = 0,
              updated_at = now()
              RETURNING id
        `,
        [
          drop.sku,
          drop.slug,
          drop.brand,
          drop.model,
          drop.name,
          drop.colorway,
          drop.description,
          drop.priceCents,
          drop.imageUrl,
          drop.releaseAt,
          drop.stockTotal,
        ],
      );

      const productId = productResult.rows[0].id;

      await pool.query('DELETE FROM product_sizes WHERE product_id = $1', [productId]);

      for (let index = 0; index < sizes.length; index += 1) {
        const stockTotal = drop.sizeStocks[index];

        await pool.query(
          `
            INSERT INTO product_sizes (
              product_id,
              size_code,
              stock_total,
              stock_available,
              stock_reserved,
              stock_sold
            )
            VALUES ($1, $2, $3, $3, 0, 0)
          `,
          [productId, sizes[index], stockTotal],
        );
      }
    }

    console.log(`Seeded ${drops.length} sneaker drops.`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
