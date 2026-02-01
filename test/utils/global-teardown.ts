import { StartedMongoDBContainer } from '@testcontainers/mongodb';

export default async function globalTeardown() {
  const mongoContainer = global.__MONGO_CONTAINER__ as StartedMongoDBContainer;

  if (mongoContainer) {
    await mongoContainer.stop();
  }

  delete global.__MONGO_CONTAINER__;
}
