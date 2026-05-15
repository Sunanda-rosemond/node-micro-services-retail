import express from 'express';
import { CartRepository } from './repository/cart.repository';
import { CartService } from './services/cart.service';
import { CartRoutes } from './routes/cart.routes';
import { InventoryClient } from './clients/inventory.client';
import { EventPublisher } from './events/publisher';
import { EventConsumer } from './events/consumer';
import { pool } from './db/pool';

const app = express();
app.use(express.json());

async function bootstrap() {
  const inventoryClient = new InventoryClient();
  const eventPublisher = new EventPublisher();
  await eventPublisher.connect();
  const repo = new CartRepository();
  await repo.init();
  const service = new CartService(repo, inventoryClient, eventPublisher);
  const eventConsumer = new EventConsumer(service);
  await eventConsumer.start();

  const routes = new CartRoutes(service);
  app.get('/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({
        service: 'cart-service',
        status: 'ok',
        database: 'connected',
        rabbitmq: eventPublisher.isConnected() ? 'ok' : 'error',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    } catch {
      res.status(500).json({
        service: 'cart-service',
        status: 'degraded',
        database: 'error',
        rabbitmq: eventPublisher.isConnected() ? 'ok' : 'error',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    }
  });
  app.use('/carts', routes.router);

  const PORT = 3002;

  app.listen(PORT, () => {
    console.log(`Cart Service running on port ${PORT}`);
  });
}
bootstrap();
