import express from 'express';
import { OrderRepository } from './repository/order.repository';
import { OrderService } from './services/order.service';
import { OrderRoutes } from './routes/order.routes';
import { EventPublisher } from './events/publisher';
import { EventConsumer } from './events/consumer';

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
  app.use('/orders', orderRoutes.router);

  const PORT = 3004;

  app.listen(PORT, () => {
    console.log(`Order Service running on port ${PORT}`);
  });
}

bootstrap();
