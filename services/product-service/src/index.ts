import express from 'express';
import { ProductRoutes } from './routes/product.routes';
import { ProductService } from './services/product.service';
import { ProductRepository } from './repository/product.repository';
var colors = require('colors/safe');

const app = express();
app.use(express.json());

const repo = new ProductRepository();
const service = new ProductService(repo);

const routes = new ProductRoutes(service);

const PORT = 3001;

app.use('/products', routes.router);
app.listen(PORT, () => {
  console.log(colors.green(`Server is running on port ${PORT}`));
});
