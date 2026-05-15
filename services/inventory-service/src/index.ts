import express from 'express';
import { InventoryRepository } from './repository/inventory.repository';
import { InventoryService } from './services/inventory.service';
import { InventoryRoutes } from './routes/inventory.routes';
import { EventConsumer } from './events/consumer';
import { EventPublisher } from './events/publisher';
import { pool } from './db/pool';

const app = express();
app.use(express.json());

async function bootstrap() {
  const repository = new InventoryRepository();
  await repository.init();
  const service = new InventoryService(repository);

  const publisher = new EventPublisher();
  await publisher.connect();

  const consumer = new EventConsumer(service, publisher);
  await consumer.start();

  const routes = new InventoryRoutes(service);
  app.get('/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');

      res.json({
        service: 'inventory-service',
        status: 'ok',
        database: 'connected',
        rabbitmq: publisher.isConnected() ? 'ok' : 'error',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    } catch {
      res.status(500).json({
        service: 'inventory-service',
        status: 'degraded',
        database: 'error',
        rabbitmq: publisher.isConnected() ? 'ok' : 'error',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    }
  });
  app.use('/inventory', routes.router);

  app.listen(3003, () => {
    console.log('Inventory Service running on port 3003');
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start Inventory Service:', err);
  process.exit(1);
});
