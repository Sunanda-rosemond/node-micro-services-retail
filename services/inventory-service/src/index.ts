import express from 'express';
import { InventoryRepository } from './repository/inventory.repository';
import { InventoryService } from './services/inventory.service';
import { InventoryRoutes } from './routes/inventory.routes';
import { EventConsumer } from './events/consumer';
import { EventPublisher } from './events/publisher';

const app = express();
app.use(express.json());

async function bootstrap() {
  const repository = new InventoryRepository();
  const service = new InventoryService(repository);

  const publisher = new EventPublisher();
  await publisher.connect();

  const consumer = new EventConsumer(service, publisher);
  await consumer.start();

  const routes = new InventoryRoutes(service);
  app.use('/inventory', routes.router);

  app.listen(3003, () => {
    console.log('Inventory Service running on port 3003');
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start Inventory Service:', err);
  process.exit(1);
});
