import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB = process.env.MONGODB_DB || "ggras_tracker";

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise__: Promise<MongoClient> | undefined;
}

function getClientPromise() {
  if (!MONGODB_URI) return null;

  if (!global.__mongoClientPromise__) {
    const client = new MongoClient(MONGODB_URI);
    global.__mongoClientPromise__ = client.connect();
  }

  return global.__mongoClientPromise__;
}

export async function getMongoDb() {
  const promise = getClientPromise();
  if (!promise) return null;
  const client = await promise;
  return client.db(MONGODB_DB);
}
