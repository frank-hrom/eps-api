require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL3;
const ItemProvider = require('../models/itemProvider');
const Ranking = require('../models/ranking');
const { cleanTextRemoveSpaces } = require('../utils');

(async () => {
  try {
    await mongoose.connect(DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
    console.log(`connected to MongoDB ${DATABASE_URL}`);

    // const itemProviders = await ItemProvider.find().lean();
    const itemsWithProvidersClean = await ItemProvider.distinct(
      'item_clean'
    ).lean();

    console.log(
      'itemsWithProvidersClean amount: ' + itemsWithProvidersClean.length
    );

    const items = await Ranking.find({ rank: { $gte: 1, $lte: 100 } })
      .distinct('item')
      .sort()
      .lean();
    console.log('items amount: ' + items.length);

    const itemsWithoutProvider = [];
    const alreadyAddedClean = [];
    items.forEach((item) => {
      const itemClean = cleanTextRemoveSpaces(item);
      if (
        !itemsWithProvidersClean.includes(itemClean) &&
        !alreadyAddedClean.includes(itemClean)
      ) {
        itemsWithoutProvider.push(item);
        alreadyAddedClean.push(itemClean);
      }
    });
    console.log('itemsWithoutProvider amount: ' + itemsWithoutProvider.length);

    const file = path.join(
      process.cwd(),
      'export-csv',
      `_export_items_with_missing_provider_with_ranking1-100.csv`
    );

    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(file);

      // Write Headers to CSV
      writeStream.write(`Item,Item_clean\n`);

      itemsWithoutProvider.forEach((item) => {
        // write Row to CSV
        writeStream.write(`"${item}",${cleanTextRemoveSpaces(item)}\n`);
      });

      writeStream.end(resolve);
      writeStream.on('error', reject);

      console.log('DONE.');
    });
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('disconnected from MongoDB');
  }
})();
