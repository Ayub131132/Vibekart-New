const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 1. Initialize Firebase Admin (Reusing your existing config)
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function seedProducts() {
  console.log('--- Vibekart Bulk Product Importer ---');
  
  const seedFilePath = path.join(__dirname, '../bulk_products.json');
  
  if (!fs.existsSync(seedFilePath)) {
    console.error('Error: bulk_products.json not found at ' + seedFilePath);
    process.exit(1);
  }

  const products = JSON.parse(fs.readFileSync(seedFilePath, 'utf8'));
  
  let insertedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const product of products) {
    try {
      // 2. Prevent Duplicates by Name
      const existingQuery = await db.collection('products')
        .where('name', '==', product.name)
        .limit(1)
        .get();

      if (!existingQuery.empty) {
        console.log(`[SKIP] Duplicate found: ${product.name}`);
        skippedCount++;
        continue;
      }

      // 3. Prepare Product Data (schema compatibility)
      // Note: backend expects 'price' as number, existing schema uses:
      // name, price, description, category, stock, image
      const productData = {
        ...product,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        // Ensure ratings and reviews are included if provided
        rating: product.rating || 0,
        reviewsCount: product.reviewsCount || 0
      };

      // 4. Insert into Firestore
      await db.collection('products').add(productData);
      
      console.log(`[OK] Inserted: ${product.name}`);
      insertedCount++;
    } catch (error) {
      console.error(`[ERROR] Failed to insert ${product.name}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n--- Import Complete ---');
  console.log(`Inserted: ${insertedCount} products`);
  console.log(`Skipped:  ${skippedCount} duplicates`);
  if (errorCount > 0) {
    console.log(`Errors:   ${errorCount}`);
  }
  
  process.exit(0);
}

seedProducts();
