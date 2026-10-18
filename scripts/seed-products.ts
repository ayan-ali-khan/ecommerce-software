/**
 * Seeds ~10 sample products (idempotent: upserts by slug, validated by the shared Zod schema).
 * Usage: bun run seed:products   (requires MONGODB_URI)
 */
import { z } from 'zod';
import { connectDB, disconnectDB } from '@/lib/db';
import { Product } from '@/models';
import { productInputSchema } from '@/lib/validators/product';
import { slugify } from '@/lib/utils';

type SeedProduct = z.input<typeof productInputSchema> & { slug?: string };

/** Seeded products use locally hosted placeholder images (public/products/*.png). */
const img = (file: string): string => `/products/${file}.png`;

const seedProducts: SeedProduct[] = [
  {
    name: 'Whey Protein Isolate 100% (Chocolate)',
    brand: 'IronFuel',
    category: 'Protein',
    description:
      'Fast-absorbing whey isolate with 25g protein per scoop and almost zero sugar. Ideal for lean muscle gain and post-workout recovery. Mixes instantly in water or milk.',
    images: [img('whey-isolate-1lb'), img('whey-isolate-5lb')],
    variants: [
      { label: '1 lb (45 Servings)', price: 1299, mrp: 1799, sku: 'IF-WPI-1LB', stockQty: 25 },
      { label: '5 lb (60 Servings)', price: 4999, mrp: 6499, sku: 'IF-WPI-5LB', stockQty: 8 },
    ],
    ingredients:
      'Whey protein isolate (milk), cocoa powder, natural & artificial flavour, lecithin, sucralose.',
    nutritionFacts: [
      { label: 'Protein per scoop', value: '25 g' },
      { label: 'BCAAs per scoop', value: '5.5 g' },
      { label: 'Calories per scoop', value: '116 kcal' },
      { label: 'Sugars per scoop', value: '< 1 g' },
    ],
    featured: true,
    inStock: true,
  },
  {
    name: 'Whey Protein Concentrate 80% (Vanilla)',
    brand: 'PrimeLabs',
    category: 'Protein',
    description:
      'Classic 80% whey concentrate with digestive enzymes. Great taste, great value for everyday training.',
    images: [img('whey-concentrate')],
    variants: [
      { label: '2 lb (30 Servings)', price: 2199, mrp: 2799, sku: 'PL-WPC-2LB', stockQty: 15 },
      { label: '5 lb (75 Servings)', price: 4499, mrp: 5999, sku: 'PL-WPC-5LB', stockQty: 6 },
    ],
    ingredients:
      'Whey protein concentrate (milk), vanilla flavour, xanthan gum, digestive enzyme blend, stevia.',
    nutritionFacts: [
      { label: 'Protein per scoop', value: '24 g' },
      { label: 'Calories per scoop', value: '124 kcal' },
    ],
    featured: false,
    inStock: true,
  },
  {
    name: 'Creatine Monohydrate 100% (300 g Unflavoured)',
    brand: 'IronFuel',
    category: 'Creatine',
    description:
      'Micronised creatine monohydrate — the most researched performance supplement. Supports strength, power and recovery. Unflavoured, stacks with anything.',
    images: [img('creatine-300g'), img('creatine-label')],
    variants: [
      { label: '300 g (60 Servings)', price: 899, mrp: 1199, sku: 'IF-CRE-300', stockQty: 40 },
      { label: '100 g (20 Servings)', price: 449, mrp: 599, sku: 'IF-CRE-100', stockQty: 30 },
    ],
    ingredients: 'Micronised creatine monohydrate.',
    nutritionFacts: [
      { label: 'Creatine per serving', value: '5 g' },
      { label: 'Servings', value: '60' },
    ],
    featured: true,
    inStock: true,
  },
  {
    name: 'Volt Pre-Workout Extreme (Blue Razz)',
    brand: 'VoltNutrition',
    category: 'Pre-Workout',
    description:
      'Explosive energy and focus blend with caffeine, citrulline and beta-alanine. Timed-release caffeine without the crash. Sugar free.',
    images: [img('volt-preworkout'), img('volt-blue-razz')],
    variants: [
      { label: '30 Servings', price: 1499, mrp: 1899, sku: 'VN-PRE-30', stockQty: 20 },
      { label: '60 Servings', price: 2599, mrp: 3299, sku: 'VN-PRE-60', stockQty: 10 },
    ],
    ingredients:
      'Citrulline malate, beta-alanine, caffeine anhydrous (200 mg), taurine, L-tyrosine, blue razz flavour, sucralose.',
    nutritionFacts: [
      { label: 'Caffeine per serving', value: '200 mg' },
      { label: 'Citrulline per serving', value: '6 g' },
      { label: 'Calories per serving', value: '10 kcal' },
    ],
    featured: true,
    inStock: true,
  },
  {
    name: 'Daily Multivitamin for Men (60 Tablets)',
    brand: 'WellCore',
    category: 'Vitamins',
    description:
      'Complete once-daily multivitamin with 23 vitamins and minerals plus ginseng for energy and immunity support.',
    images: [img('men-multi')],
    variants: [
      { label: '60 Tablets (2 Months)', price: 649, mrp: 799, sku: 'WC-MVM-60', stockQty: 50 },
    ],
    ingredients:
      'Vitamin A, C, D3, E, K2, B-complex, zinc, magnesium, selenium, ginseng extract, mineral premix.',
    nutritionFacts: [
      { label: 'Serving size', value: '1 tablet' },
      { label: 'Servings', value: '60' },
    ],
    featured: false,
    inStock: true,
  },
  {
    name: 'Omega-3 Fish Oil 1000 mg (60 Softgels)',
    brand: 'WellCore',
    category: 'Wellness',
    description:
      'Triple-strength fish oil with 300 mg EPA+DHA per softgel for heart, joint and brain health. Burp-less, molecularly distilled.',
    images: [img('omega3')],
    variants: [{ label: '60 Softgels', price: 749, mrp: 999, sku: 'WC-OMG-60', stockQty: 35 }],
    ingredients: 'Fish oil concentrate (anchovy/sardine), EPA, DHA, gelatin, glycerin, vitamin E.',
    nutritionFacts: [
      { label: 'EPA per softgel', value: '180 mg' },
      { label: 'DHA per softgel', value: '120 mg' },
    ],
    featured: false,
    inStock: true,
  },
  {
    name: 'BCAA 2:1:1 (300 g Fruit Punch)',
    brand: 'PrimeLabs',
    category: 'Amino Acids',
    description:
      'Instantised branched-chain amino acids in the clinically studied 2:1:1 ratio to reduce muscle breakdown during training.',
    images: [img('bcaa')],
    variants: [
      { label: '300 g (30 Servings)', price: 1199, mrp: 1499, sku: 'PL-BCAA-300', stockQty: 0 },
    ],
    ingredients:
      'L-Leucine, L-Isoleucine, L-Valine (2:1:1), citric acid, fruit punch flavour, sucralose.',
    nutritionFacts: [{ label: 'BCAAs per serving', value: '5 g' }],
    featured: false,
    inStock: false,
  },
  {
    name: 'Mass Gainer 3000 (5 lb Chocolate)',
    brand: 'IronFuel',
    category: 'Mass Gainers',
    description:
      'High-calorie mass gainer with 50g protein and 250g carbs per serving plus a digestive enzyme blend for hard gainers.',
    images: [img('mass-gainer')],
    variants: [
      { label: '5 lb (16 Servings)', price: 3499, mrp: 4499, sku: 'IF-MG-5LB', stockQty: 12 },
    ],
    ingredients:
      'Whey protein concentrate, maltodextrin, oat flour, cocoa, creatine monohydrate, lipase & protease.',
    nutritionFacts: [
      { label: 'Protein per serving', value: '50 g' },
      { label: 'Calories per serving', value: '1250 kcal' },
    ],
    featured: true,
    inStock: true,
  },
  {
    name: 'L-Carnitine 1000 (30 Servings)',
    brand: 'VoltNutrition',
    category: 'Fat Burners',
    description:
      'Liquid L-carnitine 1000 mg to support fat metabolism and endurance. Take 30 minutes before cardio.',
    images: [img('l-carnitine')],
    variants: [
      { label: '30 Servings (300 ml)', price: 999, mrp: 1299, sku: 'VN-LCAR-30', stockQty: 0 },
    ],
    ingredients: 'L-carnitine L-tartrate, water, citric acid, natural flavour, potassium sorbate.',
    nutritionFacts: [{ label: 'L-Carnitine per serving', value: '1000 mg' }],
    featured: false,
    inStock: false,
  },
  {
    name: 'Vitamin D3 5000 IU (60 Softgels)',
    brand: 'WellCore',
    category: 'Vitamins',
    description:
      'High-potency vitamin D3 for immunity, bone health and testosterone support. One softgel every other day lasts 4 months.',
    images: [img('vitamin-d3')],
    variants: [{ label: '60 Softgels', price: 499, mrp: 649, sku: 'WC-D3-60', stockQty: 60 }],
    ingredients: 'Cholecalciferol (vitamin D3), medium-chain triglyceride oil, gelatin, glycerin.',
    nutritionFacts: [{ label: 'Vitamin D3 per softgel', value: '5000 IU (125 mcg)' }],
    featured: false,
    inStock: true,
  },
];

async function main(): Promise<void> {
  await connectDB();
  await Product.syncIndexes();

  let created = 0;
  let updated = 0;

  for (const seed of seedProducts) {
    const { slug: slugOverride, ...rest } = seed;
    const data = productInputSchema.parse(rest);
    const slug = slugOverride ?? slugify(data.name);

    const result = await Product.updateOne({ slug }, { $set: { ...data, slug } }, { upsert: true });
    if (result.upsertedCount > 0) created += 1;
    else updated += 1;
    console.log(`[seed-products] ${result.upsertedCount > 0 ? 'created' : 'updated '} ${slug}`);
  }

  console.log(`[seed-products] Done: ${created} created, ${updated} updated.`);
}

main()
  .then(() => disconnectDB())
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error('[seed-products] Failed:', err);
    process.exit(1);
  });
