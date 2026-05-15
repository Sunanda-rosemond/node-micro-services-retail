# Node Microservices Retail Platform

## Overview

This project is a local microservices-based retail backend built with Node.js, TypeScript, Express, RabbitMQ, PostgreSQL, and Docker Compose.

It models a simplified retail shopping flow where customers can:

- View products
- Create a cart
- Add products to the cart
- Reserve inventory asynchronously
- Checkout the cart
- Create an order through an event-driven workflow

The project demonstrates core backend and distributed systems concepts including:

- Microservice separation
- Event-driven communication with RabbitMQ
- PostgreSQL persistence
- Docker Compose orchestration
- Service-to-service communication
- Inventory reservation flow
- Checkout workflow
- Health checks
- Database connectivity checks
- RabbitMQ connectivity checks
- Idempotent order creation
- Duplicate event handling
- Data persistence across service restarts

---

## Architecture

The platform is split into four main services:

```txt
Product Service
Cart Service
Inventory Service
Order Service
```

Supporting infrastructure:

```txt
RabbitMQ
PostgreSQL
Docker Compose
```

---

## Services

### Product Service

Responsible for managing product catalogue data.

Responsibilities:

- Create products
- List products
- Retrieve product by ID
- Update product stock field
- Delete products
- Persist products in PostgreSQL
- Expose service/database health status

Runs on:

```txt
http://localhost:3001
```

---

### Cart Service

Responsible for customer cart lifecycle.

Responsibilities:

- Create carts
- Retrieve carts
- Add items to carts
- Track item reservation status
- Checkout carts
- Publish inventory reservation events
- Consume inventory reservation result events
- Publish checkout completed events
- Persist carts and cart items in PostgreSQL
- Expose service/database/RabbitMQ health status

Runs on:

```txt
http://localhost:3002
```

---

### Inventory Service

Responsible for stock availability and reservation state.

Responsibilities:

- Create inventory records
- Retrieve inventory by product ID
- Reserve stock
- Release reserved stock
- Confirm reserved stock during checkout
- Persist inventory state in PostgreSQL
- Consume inventory events from RabbitMQ
- Publish stock reservation result events
- Expose service/database/RabbitMQ health status

Runs on:

```txt
http://localhost:3003
```

---

### Order Service

Responsible for creating orders after successful checkout.

Responsibilities:

- Consume checkout completed events from RabbitMQ
- Create orders
- Store order items
- Retrieve persisted orders
- Prevent duplicate orders for the same cart
- Persist orders and order items in PostgreSQL
- Expose service/database/RabbitMQ health status

Runs on:

```txt
http://localhost:3004
```

---

## Event-Driven Flow

### Add Item to Cart

```txt
Cart Service
   ↓ publishes RESERVE_STOCK
RabbitMQ inventory_queue
   ↓ consumed by
Inventory Service
   ↓ publishes STOCK_RESERVED or STOCK_FAILED
RabbitMQ cart_queue
   ↓ consumed by
Cart Service
   ↓ updates cart item status
```

### Checkout Flow

```txt
Cart Service
   ↓ confirms reserved stock
Inventory Service
   ↓ cart marked CHECKED_OUT
Cart Service
   ↓ publishes CHECKOUT_COMPLETED
RabbitMQ order_queue
   ↓ consumed by
Order Service
   ↓ order persisted in PostgreSQL
```

---

## Idempotent Order Creation

The Order Service is designed to handle duplicate checkout events safely.

RabbitMQ can deliver messages more than once in real-world distributed systems. To prevent duplicate orders, the Order Service enforces one order per cart.

This is handled by:

- Checking for an existing order by `cartId`
- Adding a unique database constraint/index on `cart_id`
- Returning the existing order when a duplicate checkout event is received
- Handling PostgreSQL unique constraint violations safely

This means if the same `CHECKOUT_COMPLETED` event is received multiple times:

```txt
First event      → creates order
Duplicate event  → returns existing order
Duplicate event  → returns existing order
```

Expected result:

```txt
Only one order exists for the same cartId
```

---

## Health Checks

Each service exposes a health endpoint:

```http
GET /health
```

Example response:

```json
{
  "service": "cart-service",
  "status": "ok",
  "database": "connected",
  "rabbitmq": "ok",
  "uptime": 42.12,
  "timestamp": "2026-05-15T20:00:00.000Z"
}
```

Health checks include:

- Service availability
- PostgreSQL connectivity
- RabbitMQ connectivity where applicable
- Process uptime
- Timestamp

### Health Check URLs

```http
GET http://localhost:3001/health
GET http://localhost:3002/health
GET http://localhost:3003/health
GET http://localhost:3004/health
```

---

## Tech Stack

- Node.js
- TypeScript
- Express
- RabbitMQ
- PostgreSQL
- Docker
- Docker Compose
- pg
- amqplib
- ts-node-dev

---

## Project Structure

```txt
node-microservices-retail/
├── docker-compose.yml
├── services/
│   ├── product-service/
│   ├── cart-service/
│   ├── inventory-service/
│   └── order-service/
```

Each service follows a similar internal structure:

```txt
src/
├── db/
├── models/
├── repository/
├── routes/
├── services/
└── index.ts
```

Some services also include:

```txt
events/
clients/
```

---

## Running the Application

From the project root:

```bash
docker compose up --build
```

Or detached mode:

```bash
docker compose up -d --build
```

Check running containers:

```bash
docker ps
```

Expected containers:

```txt
product-service
cart-service
inventory-service
order-service
postgres
rabbitmq
```

---

## Service URLs

| Service | URL |
|---|---|
| Product Service | `http://localhost:3001` |
| Cart Service | `http://localhost:3002` |
| Inventory Service | `http://localhost:3003` |
| Order Service | `http://localhost:3004` |
| RabbitMQ Management UI | `http://localhost:15672` |
| PostgreSQL | `localhost:5432` |

RabbitMQ default login:

```txt
Username: guest
Password: guest
```

---

## Database

The project uses PostgreSQL through Docker Compose.

The database container is named:

```txt
postgres
```

Services connect to PostgreSQL using Docker networking:

```txt
postgres:5432
```

Example connection string:

```txt
postgresql://postgres:password@postgres:5432/db
```

---

## Database Tables

| Service | Tables |
|---|---|
| Product Service | `products` |
| Inventory Service | `inventory` |
| Cart Service | `carts`, `cart_items` |
| Order Service | `orders`, `order_items` |

---

## API Endpoints

## Product Service

Base URL:

```txt
http://localhost:3001
```

### Create Product

```http
POST /products
```

Example body:

```json
{
  "name": "Dried Lavender Bouquet",
  "price": 24.99,
  "stock": 10
}
```

### Get Products

```http
GET /products
```

### Get Product by ID

```http
GET /products/:id
```

### Update Product Stock

```http
PATCH /products/:id
```

Example body:

```json
{
  "stock": 20
}
```

### Delete Product

```http
DELETE /products/:id
```

### Health Check

```http
GET /health
```

---

## Cart Service

Base URL:

```txt
http://localhost:3002
```

### Create Cart

```http
POST /carts
```

### Get Cart

```http
GET /carts/:cartId
```

### Add Item to Cart

```http
POST /carts/:cartId/items
```

Example body:

```json
{
  "productId": "product-id-here",
  "quantity": 2
}
```

### Checkout Cart

```http
POST /carts/:cartId/checkout
```

### Health Check

```http
GET /health
```

---

## Inventory Service

Base URL:

```txt
http://localhost:3003
```

### Create Inventory

```http
POST /inventory
```

Example body:

```json
{
  "productId": "product-id-here",
  "quantity": 10
}
```

### Get Inventory by Product ID

```http
GET /inventory/:productId
```

### Reserve Stock

```http
PATCH /inventory/:productId/reserve
```

Example body:

```json
{
  "quantity": 2
}
```

### Release Stock

```http
PATCH /inventory/:productId/release
```

Example body:

```json
{
  "quantity": 2
}
```

### Confirm Stock

```http
PATCH /inventory/:productId/confirm
```

Example body:

```json
{
  "quantity": 2
}
```

### Health Check

```http
GET /health
```

---

## Order Service

Base URL:

```txt
http://localhost:3004
```

### Get Orders

```http
GET /orders
```

### Health Check

```http
GET /health
```

---

## Manual Test Flow

### 1. Create a Product

```http
POST http://localhost:3001/products
```

```json
{
  "name": "Dried Lavender Bouquet",
  "price": 24.99,
  "stock": 10
}
```

Copy the returned product ID.

### 2. Create Inventory

```http
POST http://localhost:3003/inventory
```

```json
{
  "productId": "paste-product-id-here",
  "quantity": 10
}
```

### 3. Create Cart

```http
POST http://localhost:3002/carts
```

Copy the returned cart ID.

### 4. Add Item to Cart

```http
POST http://localhost:3002/carts/paste-cart-id-here/items
```

```json
{
  "productId": "paste-product-id-here",
  "quantity": 2
}
```

The cart item is first added as:

```txt
PENDING
```

After Inventory Service processes the event, it should become:

```txt
RESERVED
```

### 5. Get Cart

```http
GET http://localhost:3002/carts/paste-cart-id-here
```

Expected item status:

```txt
RESERVED
```

### 6. Checkout

```http
POST http://localhost:3002/carts/paste-cart-id-here/checkout
```

The cart should become:

```txt
CHECKED_OUT
```

### 7. Get Orders

```http
GET http://localhost:3004/orders
```

Expected result:

```txt
Order created and persisted
```

---

## Idempotency Test

To test duplicate checkout event handling:

1. Complete a normal checkout flow.
2. Open RabbitMQ Management UI:

```txt
http://localhost:15672
```

3. Go to:

```txt
Queues and Streams → order_queue → Publish message
```

4. Publish the same checkout event more than once:

```json
{
  "type": "CHECKOUT_COMPLETED",
  "cartId": "existing-cart-id",
  "items": [
    {
      "productId": "existing-product-id",
      "quantity": 2
    }
  ]
}
```

5. Call:

```http
GET http://localhost:3004/orders
```

Expected result:

```txt
Only one order should exist for the same cartId.
```

---

## Persistence Test

To confirm persistence, create product, inventory, cart, and order data.

Then restart services:

```bash
docker compose restart product-service
docker compose restart inventory-service
docker compose restart cart-service
docker compose restart order-service
```

Then call:

```http
GET http://localhost:3001/products
GET http://localhost:3003/inventory/:productId
GET http://localhost:3002/carts/:cartId
GET http://localhost:3004/orders
```

Expected result:

```txt
Data should still be available after restart.
```

---

## Useful Docker Commands

### Start all services

```bash
docker compose up --build
```

### Start in detached mode

```bash
docker compose up -d --build
```

### Stop services

```bash
docker compose stop
```

### Restart one service

```bash
docker compose restart cart-service
```

### Rebuild one service

```bash
docker compose up -d --build --force-recreate cart-service
```

### View logs

```bash
docker compose logs -f cart-service
```

### Check environment variable inside container

```bash
docker compose exec product-service printenv DATABASE_URL
```

### Connect to PostgreSQL

```bash
docker exec -it postgres psql -U postgres -d db
```

### Connect to order database

```bash
docker exec -it postgres psql -U postgres -d retail_orders
```

### Inspect orders table

```sql
\d orders
```

---

## Key Design Decisions

### 1. Microservice Separation

Each service owns a specific business capability:

```txt
Products
Carts
Inventory
Orders
```

This keeps responsibilities clear and makes each service easier to reason about.

### 2. Event-Driven Inventory Reservation

Adding an item to the cart does not directly mutate cart state to reserved.

Instead:

```txt
Cart Service publishes RESERVE_STOCK
Inventory Service processes reservation
Cart Service receives reservation result
Cart item status changes to RESERVED or FAILED
```

This models asynchronous distributed system behaviour.

### 3. PostgreSQL Persistence

Each service persists its own state to PostgreSQL.

This ensures data survives service restarts and moves the project beyond in-memory demo storage.

### 4. Docker Compose Networking

Services communicate using Docker service names:

```txt
rabbitmq
postgres
inventory-service
product-service
cart-service
order-service
```

Inside Docker, services should not use:

```txt
localhost
```

because `localhost` means the container itself.

### 5. Repository Pattern

Database logic is isolated inside repository classes.

This keeps route and service layers cleaner:

```txt
Route → Service → Repository → PostgreSQL
```

### 6. Idempotency at the Order Boundary

The Order Service protects against duplicate order creation by enforcing uniqueness on `cart_id`.

This is important because event-driven systems may deliver the same message more than once.

### 7. Health Checks

Each service exposes a `/health` endpoint to make local debugging and operational visibility easier.

---

## Current Limitations

This project is intentionally focused on backend architecture and distributed systems concepts.

Current limitations:

- No authentication or authorization
- No frontend
- No payment integration
- No production deployment
- No formal database migration tool
- No centralized logging
- No distributed tracing
- No automated integration test suite yet
- No retry/dead-letter queue strategy yet

---

## Possible Future Improvements

- Add database migration tooling
- Add dead-letter queues for failed events
- Add integration tests
- Add OpenAPI/Swagger documentation
- Add structured logging
- Add observability with metrics/tracing
- Add authentication
- Split PostgreSQL databases per service
- Add CI pipeline
- Add automated end-to-end test flow
- Add message correlation IDs
- Add event versioning

---

## Summary

This project demonstrates a local microservices retail backend with:

- Multiple independently running services
- RabbitMQ-based asynchronous messaging
- PostgreSQL persistence
- Docker Compose orchestration
- Product, cart, inventory, and order workflows
- Health checks
- Database connectivity checks
- RabbitMQ connectivity checks
- Idempotent order creation
- Duplicate event handling
- Data persistence across restarts

It is designed as a practical learning and portfolio project for backend engineering, microservices, and distributed systems.
