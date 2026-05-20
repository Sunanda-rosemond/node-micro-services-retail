# Database Schema

## Overview

This document describes the current PostgreSQL schema used by the Node Microservices Retail Platform.

The project currently uses PostgreSQL for persistence across the following services:

- Product Service
- Inventory Service
- Cart Service
- Order Service

Most services currently share the same PostgreSQL container for local development, but each service owns its own tables logically.

## Databases

The project currently uses:

| Database        | Used by                                          |
| --------------- | ------------------------------------------------ |
| `db`            | Product Service, Inventory Service, Cart Service |
| `retail_orders` | Order Service                                    |

## Tables

```txt
products
inventory
carts
cart_items
orders
order_items
```

## products

Stores product catalogue data.

| Column | Type    | Nullable | Constraint  |
| ------ | ------- | -------- | ----------- |
| id     | text    | no       | Primary key |
| name   | text    | no       |             |
| price  | numeric | no       |             |
| stock  | integer | no       |             |

Indexes:

```txt
products_pkey PRIMARY KEY (id)
```

## inventory

Stores stock availability and reservation state for each product.

| Column     | Type    | Nullable | Constraint  |
| ---------- | ------- | -------- | ----------- |
| product_id | text    | no       | Primary key |
| available  | integer | no       |             |
| reserved   | integer | no       |             |

Indexes:

```txt
inventory_pkey PRIMARY KEY (product_id)
```

## carts

Stores cart-level information.

| Column     | Type                        | Nullable | Constraint  |
| ---------- | --------------------------- | -------- | ----------- |
| id         | text                        | no       | Primary key |
| status     | text                        | no       |             |
| created_at | timestamp without time zone | no       |             |

Indexes:

```txt
carts_pkey PRIMARY KEY (id)
```

## cart_items

Stores individual items inside a cart.

| Column      | Type                        | Nullable | Constraint                  |
| ----------- | --------------------------- | -------- | --------------------------- |
| id          | integer                     | no       | Primary key, auto-increment |
| cart_id     | text                        | no       | Foreign key to `carts.id`   |
| product_id  | text                        | no       |                             |
| quantity    | integer                     | no       |                             |
| reserved_at | timestamp without time zone | no       |                             |
| status      | text                        | no       |                             |

Indexes:

```txt
cart_items_pkey PRIMARY KEY (id)
```

## orders

Stores completed order records.

| Column     | Type                        | Nullable | Constraint  |
| ---------- | --------------------------- | -------- | ----------- |
| id         | text                        | no       | Primary key |
| cart_id    | text                        | no       | Unique      |
| status     | text                        | no       |             |
| created_at | timestamp without time zone | no       |             |

Indexes:

```txt
orders_pkey PRIMARY KEY (id)
idx_orders_cart_id UNIQUE (cart_id)
orders_cart_id_unique UNIQUE CONSTRAINT (cart_id)
```

## order_items

Stores individual items belonging to an order.

| Column     | Type    | Nullable | Constraint                  |
| ---------- | ------- | -------- | --------------------------- |
| id         | integer | no       | Primary key, auto-increment |
| order_id   | text    | no       | Foreign key to `orders.id`  |
| product_id | text    | no       |                             |
| quantity   | integer | no       |                             |

Indexes:

```txt
order_items_pkey PRIMARY KEY (id)
```

---

## Messaging Topology

In addition to the PostgreSQL schema, the project also defines RabbitMQ messaging topology.

RabbitMQ topology includes:

- Queues
- Dead letter exchanges
- Dead letter queues
- Routing keys

These are not database tables, but they are part of the system architecture.

---

## RabbitMQ Queues

| Queue             | Producer          | Consumer          | Purpose                       |
| ----------------- | ----------------- | ----------------- | ----------------------------- |
| `inventory_queue` | Cart Service      | Inventory Service | Reserve or release stock      |
| `cart_queue`      | Inventory Service | Cart Service      | Send stock reservation result |
| `order_queue`     | Cart Service      | Order Service     | Create order after checkout   |

---

## Dead Letter Queues

| Main Queue        | Dead Letter Exchange | Dead Letter Queue | Routing Key        |
| ----------------- | -------------------- | ----------------- | ------------------ |
| `inventory_queue` | `inventory_dlx`      | `inventory_dlq`   | `inventory_failed` |
| `cart_queue`      | `cart_dlx`           | `cart_dlq`        | `cart_failed`      |
| `order_queue`     | `order_dlx`          | `order_dlq`       | `order_failed`     |

---

## Dead Letter Handling Rules

Messages are sent to a dead letter queue when they cannot be safely processed.

Examples:

```txt
Invalid JSON
Missing required fields
Unknown event type
Unexpected payload shape
Unhandled technical exception
```

Business failures are not dead-lettered.

For example:

```txt
Insufficient stock
```

is handled by publishing:

```txt
STOCK_FAILED
```

rather than sending the original message to a DLQ.

## Queue Declaration Rule

RabbitMQ queue arguments are immutable.

Once a queue is created, it cannot be redeclared with different arguments.

For example, if inventory_queue was first created without a dead-letter exchange, then later declared with:

```txt
arguments: {
  'x-dead-letter-exchange': 'inventory_dlx',
  'x-dead-letter-routing-key': 'inventory_failed',
}
```

RabbitMQ will reject the declaration with:

```txt
PRECONDITION_FAILED - inequivalent arg 'x-dead-letter-exchange'
```

During local development, the queue can be deleted from RabbitMQ UI and recreated by restarting the service.

Important rule:

```txt
Every service that declares the same queue must declare it with the exact same queue arguments.
```

## Messaging Reliability Features

The current messaging setup supports:

```txt
Acknowledgements
Business failure events
Dead Letter Queues
Invalid JSON rejection
Invalid event shape rejection
Duplicate checkout event protection
Order idempotency
```
