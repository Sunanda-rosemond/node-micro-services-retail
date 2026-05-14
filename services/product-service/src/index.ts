import express from 'express';
import { ProductRoutes } from './routes/product.routes';
import { ProductService } from './services/product.service';
import { ProductRepository } from './repository/product.repository';
var colors = require('colors/safe');

const app = express();
app.use(express.json());

async function bootstrap() {
  const repo = new ProductRepository();
  await repo.init();
  const service = new ProductService(repo);

  const routes = new ProductRoutes(service);

  const PORT = 3001;

  app.use('/products', routes.router);
  app.listen(PORT, () => {
    console.log(colors.green(`Server is running on port ${PORT}`));
  });
}
bootstrap().catch((err) => {
  console.error(colors.red('Failed to start server:'), err);
  process.exit(1);
});
