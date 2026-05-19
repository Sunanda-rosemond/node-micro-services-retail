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
