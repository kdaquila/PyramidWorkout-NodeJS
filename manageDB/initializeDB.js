
require('dotenv').config()
const {MongoClient, ObjectID} = require('mongodb');

async function createUniqueIndexes() {
    const client = new MongoClient(process.env.DB_CONNECTION_STRING, {useUnifiedTopology: true});
    try {
      await client.connect();
      const db = await client.db(process.env.DB_DATABASE_NAME);
      return await db.collection('AppUsers').createIndex({username: 1}, {unique: true})
  }
  finally {
      await client.close()
  }
  }

  createUniqueIndexes().catch(console.log)