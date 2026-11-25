import 'dotenv/config';
import mongoose from 'mongoose';
import { products } from '../src/data/products';

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    largeImage: String,
    category: { type: String, required: true },
    details: [String],
  },
  { timestamps: true },
);

const Product = mongoose.model('Product', productSchema);

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Add it to your .env file.');
}

await mongoose.connect(process.env.DATABASE_URL);
await Promise.all(
  products.map((product) =>
    Product.updateOne({ id: product.id }, product, { upsert: true }),
  ),
);
console.log(`Seeded ${products.length} products into new-db.products`);
await mongoose.disconnect();