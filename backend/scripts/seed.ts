import { Pool } from 'pg';

const sizes = [
  'EU 40',
  'EU 41',
  'EU 42',
  'EU 43',
  'EU 44',
  'EU 45',
  'EU 46',
] as const;

const drops = [
  {
    sku: 'NIKE-AJ1-LOST-FOUND',
    slug: 'nike-air-jordan-1-lost-and-found',
    brand: 'Nike',
    model: 'Air Jordan 1 Retro High OG',
    name: 'Air Jordan 1 Retro High OG Lost and Found',
    colorway: 'Varsity Red/Black/Sail/Muslin',
    description:
      'A vintage Chicago-inspired Jordan 1 with cracked black leather, aged sail panels and varsity-red overlays.',
    priceCents: 89900,
    imageUrl:
      'https://images.stockx.com/images/Air-Jordan-1-Retro-High-OG-Chicago-Reimagined-Product.jpg?fit=fill&bg=FFFFFF&w=1200&h=857&q=90',
    releaseAt: '2026-07-08T16:00:00.000Z',
    sizeStocks: [1, 1, 2, 3, 2, 2, 1],
  },
  {
    sku: 'NIKE-DUNK-PANDA-LOW',
    slug: 'nike-dunk-low-panda',
    brand: 'Nike',
    model: 'Dunk Low Retro',
    name: 'Nike Dunk Low Retro Panda',
    colorway: 'White/White/Black',
    description:
      'The monochrome Dunk Low pairs a white leather base with crisp black overlays and a classic court outsole.',
    priceCents: 54900,
    imageUrl:
      'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto%2Cu_9ddf04c7-2a9a-4d76-add1-d15af8f0263d%2Cc_scale%2Cfl_relative%2Cw_1.0%2Ch_1.0%2Cfl_layer_apply/b1bcbca4-e853-4df7-b329-5be3c61ee057/NIKE%2BDUNK%2BLOW%2BRETRO.png',
    releaseAt: '2026-07-04T16:00:00.000Z',
    sizeStocks: [0, 0, 0, 0, 0, 0, 0],
    soldStocks: [2, 3, 4, 4, 3, 2, 2],
  },
  {
    sku: 'NIKE-AM1-UNIVERSITY-BLUE',
    slug: 'nike-air-max-1-university-blue',
    brand: 'Nike',
    model: 'Air Max 1',
    name: 'Nike Air Max 1 University Blue',
    colorway: 'White/University Blue/Neutral Grey',
    description:
      'A clean Air Max 1 with a white mesh base, neutral-grey overlays and a University Blue mudguard.',
    priceCents: 69900,
    imageUrl:
      'https://images.stockx.com/images/Nike-Air-Max-1-White-University-Blue-Product.jpg?fit=fill&bg=FFFFFF&w=1200&h=857&q=90',
    releaseAt: '2026-07-09T08:00:00.000Z',
    sizeStocks: [1, 1, 2, 2, 2, 1, 1],
  },
  {
    sku: 'ADIDAS-SAMBA-OG-B75806',
    slug: 'adidas-samba-og-cloud-white',
    brand: 'adidas',
    model: 'Samba OG',
    name: 'adidas Samba OG Cloud White',
    colorway: 'Cloud White/Core Black/Clear Granite',
    description:
      'The low-profile terrace icon combines a white leather upper, black three-stripes, suede detailing and a gum sole.',
    priceCents: 49900,
    imageUrl:
      'https://assets.adidas.com/images/w_940%2Cf_auto%2Cq_auto/3bbecbdf584e40398446a8bf0117cf62_9366/B75806_01_00_standard.jpg',
    releaseAt: '2026-07-09T16:00:00.000Z',
    sizeStocks: [2, 2, 3, 3, 2, 1, 1],
  },
  {
    sku: 'SALOMON-XT6-L47445300',
    slug: 'salomon-xt-6-vanilla-ice',
    brand: 'Salomon',
    model: 'XT-6',
    name: 'Salomon XT-6 Vanilla Ice',
    colorway: 'Vanilla Ice/Vanilla Ice/Almond Milk',
    description:
      'A trail-built city sneaker with quickLACE, an agileCHASSIS system and a soft Vanilla Ice technical upper.',
    priceCents: 74900,
    imageUrl:
      'https://cdn.dam.salomon.com/7077caf9-2bb6-48cc-b930-b2f401647181/L47445300/PNG-2000px-max-72dpi.png?auto=avif&bg-color=f5f5f5&canvas=116p%2C144p&fit=cover&format=pjpg&optimize=low&width=3840',
    releaseAt: '2026-07-18T16:00:00.000Z',
    sizeStocks: [1, 2, 2, 3, 2, 1, 1],
  },
  {
    sku: 'ASICS-GK14-1203A537-110',
    slug: 'asics-gel-kayano-14-white-pure-silver',
    brand: 'ASICS',
    model: 'GEL-KAYANO 14',
    name: 'ASICS GEL-KAYANO 14 White Pure Silver',
    colorway: 'White/Pure Silver',
    description:
      'A late-2000s technical runner with layered white mesh, metallic silver overlays and visible GEL cushioning.',
    priceCents: 67900,
    imageUrl:
      'https://www.buzzsneakers.hr/files/thumbs/files/images/slike-proizvoda/media/120/1203A537-110/images/thumbs_320/1203A537-110_320px.jpg',
    releaseAt: '2026-07-02T16:00:00.000Z',
    sizeStocks: [0, 0, 0, 0, 0, 0, 0],
    soldStocks: [1, 2, 3, 3, 2, 2, 1],
  },
  {
    sku: 'NB-9060-U9060ECA',
    slug: 'new-balance-9060-sea-salt',
    brand: 'New Balance',
    model: '9060',
    name: 'New Balance 9060 Sea Salt',
    colorway: 'Sea Salt/Concrete/Silver Metallic',
    description:
      'A sculpted Y2K runner with off-white mesh, suede overlays and an exaggerated ABZORB and SBS midsole.',
    priceCents: 71900,
    imageUrl:
      'https://images.stockx.com/images/New-Balance-9060-Sea-Salt-White-Product.jpg?fit=fill&bg=FFFFFF&w=1200&h=857&q=90',
    releaseAt: '2026-07-20T16:00:00.000Z',
    sizeStocks: [1, 1, 2, 3, 3, 2, 1],
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
      const soldStocks = drop.soldStocks ?? drop.sizeStocks.map(() => 0);
      const stockAvailable = drop.sizeStocks.reduce((sum, stock) => sum + stock, 0);
      const stockSold = soldStocks.reduce((sum, stock) => sum + stock, 0);
      const stockTotal = stockAvailable + stockSold;
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
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0, $13)
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
              stock_reserved = EXCLUDED.stock_reserved,
              stock_sold = EXCLUDED.stock_sold,
              archived_at = NULL,
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
          stockTotal,
          stockAvailable,
          stockSold,
        ],
      );

      const productId = productResult.rows[0].id;

      for (let index = 0; index < sizes.length; index += 1) {
        const sizeAvailable = drop.sizeStocks[index];
        const sizeSold = soldStocks[index];
        const sizeTotal = sizeAvailable + sizeSold;
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
            VALUES ($1, $2, $3, $4, 0, $5)
            ON CONFLICT (product_id, size_code) DO UPDATE
            SET stock_total = EXCLUDED.stock_total,
                stock_available = EXCLUDED.stock_available,
                stock_reserved = EXCLUDED.stock_reserved,
                stock_sold = EXCLUDED.stock_sold,
                updated_at = now()
            WHERE product_sizes.stock_reserved = 0
          `,
          [productId, sizes[index], sizeTotal, sizeAvailable, sizeSold],
        );
      }

      await pool.query(
        `
          UPDATE products
          SET stock_total = inventory.stock_total,
              stock_available = inventory.stock_available,
              stock_reserved = inventory.stock_reserved,
              stock_sold = inventory.stock_sold,
              updated_at = now()
          FROM (
            SELECT
              product_id,
              sum(stock_total)::integer AS stock_total,
              sum(stock_available)::integer AS stock_available,
              sum(stock_reserved)::integer AS stock_reserved,
              sum(stock_sold)::integer AS stock_sold
            FROM product_sizes
            WHERE product_id = $1
            GROUP BY product_id
          ) inventory
          WHERE products.id = inventory.product_id
        `,
        [productId],
      );
    }

    await pool.query(
      `
        UPDATE products
        SET archived_at = now(),
            updated_at = now()
        WHERE sku = 'NIKE-AM1-LIMITED-BLUE'
          AND archived_at IS NULL
      `,
    );

    console.log(`Seeded ${drops.length} sneaker drops.`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
