import {
  MongoDBContainer,
  StartedMongoDBContainer,
} from '@testcontainers/mongodb';

export let mongoContainer: StartedMongoDBContainer;

export default async function globalSetup() {
  mongoContainer = await new MongoDBContainer('mongo:6.0').start();

  process.env.MONGODB_URI = mongoContainer.getConnectionString();

  process.env.ENV = 'test';
  process.env.NODE_ENV = 'test';

  global.__MONGO_CONTAINER__ = mongoContainer;
}
