import express from 'express';
import { CartRepository } from './repository/cart.repository';
import { CartService } from './services/cart.service';
import { CartRoutes } from './routes/cart.routes';
import { ProductClient } from './clients/product.client';
import { InventoryClient } from './clients/inventory.client';
import { EventPublisher } from './events/publisher';
import { EventConsumer } from './events/consumer';
const app = express();
app.use(express.json());
async function bootstrap() {
  const productClient = new ProductClient();
  const inventoryClient = new InventoryClient();
  const eventPublisher = new EventPublisher();
  await eventPublisher.connect();
  const repo = new CartRepository();
  const service = new CartService(
    repo,
    productClient,
    inventoryClient,
    eventPublisher,
  );
  const eventConsumer = new EventConsumer(service);
  await eventConsumer.start();

  const routes = new CartRoutes(service);

  app.use('/carts', routes.router);

  const PORT = 3002;

  app.listen(PORT, () => {
    console.log(`Cart Service running on port ${PORT}`);
  });
}
bootstrap();
