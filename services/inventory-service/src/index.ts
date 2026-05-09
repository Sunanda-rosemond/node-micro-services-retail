import express from 'express';
import { InventoryRepository } from './repository/inventory.repository';
import { InventoryService } from './services/inventory.service';
import { InventoryRoutes } from './routes/inventory.routes';
import { EventConsumer } from './events/consumer';

const app = express();
app.use(express.json());

const repo = new InventoryRepository();
const service = new InventoryService(repo);
const routes = new InventoryRoutes(service);
const consumer = new EventConsumer(service);
consumer.start();

app.use('/inventory', routes.router);

app.listen(3003, () => {
  console.log('Inventory Service running on port 3003');
});
