import express from 'express';
import { OrderRepository } from './repository/order.repository';
import { OrderService } from './services/order.service';
import { OrderRoutes } from './routes/order.routes';
import { EventPublisher } from './events/publisher';
import { EventConsumer } from './events/consumer';
import { pool } from './db/pool';

const app = express();
app.use(express.json());

async function bootstrap() {
  const orderRepository = new OrderRepository();
  await orderRepository.init();
  const orderService = new OrderService(orderRepository);

  const eventPublisher = new EventPublisher();
  await eventPublisher.connect();

  const eventConsumer = new EventConsumer(orderService, eventPublisher);
  await eventConsumer.start();

  const orderRoutes = new OrderRoutes(orderService);
  app.get('/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({
        service: 'order-service',
        status: 'ok',
        database: 'connected',
        rabbitmq: eventPublisher.isConnected() ? 'ok' : 'error',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    } catch {
      res.status(500).json({
        service: 'order-service',
        status: 'degraded',
        database: 'error',
        rabbitmq: eventPublisher.isConnected() ? 'ok' : 'error',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    }
  });
  app.use('/orders', orderRoutes.router);

  const PORT = 3004;

  app.listen(PORT, () => {
    console.log(`Order Service running on port ${PORT}`);
  });
}

bootstrap();
