import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

const PORT = 3000;

app.get('/health', (req, res) => {
  res.json({
    service: 'api-gateway',
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res, next) => {
  console.log(`[API Gateway] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(
  '/api/products',
  createProxyMiddleware({
    target: 'http://product-service:3001/products',
    changeOrigin: true,
  }),
);
app.use(
  '/api/carts',
  createProxyMiddleware({
    target: 'http://cart-service:3002/carts',
    changeOrigin: true,
  }),
);
app.use(
  '/api/inventory',
  createProxyMiddleware({
    target: 'http://inventory-service:3003/inventory',
    changeOrigin: true,
  }),
);
app.use(
  '/api/orders',
  createProxyMiddleware({
    target: 'http://order-service:3004/orders',
    changeOrigin: true,
  }),
);

app.listen(PORT, () => {
  console.log(`Api gateway running at port ${PORT}`);
});
