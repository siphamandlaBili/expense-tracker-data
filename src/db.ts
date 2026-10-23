import { MongoClient, type Db } from "mongodb";

// One client per process, shared by every request. On serverless hosts an
// instance handles many requests, so opening a connection per request would
// soon exhaust the database's connection limit.
let client: Promise<MongoClient> | undefined;

export function getDb(uri: string, dbName: string): Promise<Db> {
  client ??= new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5_000,
  })
    .connect()
    .catch((error: unknown) => {
      // Let the next request try again instead of failing forever.
      client = undefined;
      throw error;
    });
  return client.then((connected) => connected.db(dbName));
}
