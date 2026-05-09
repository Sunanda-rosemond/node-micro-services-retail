# Event-Driven Retail Platform (Node.js Microservices)

## Overview

A distributed retail backend platform built using Node.js, TypeScript, RabbitMQ, and Docker Compose.

This project demonstrates:

- Microservices architecture
- Event-driven communication
- Saga pattern with compensation
- Inventory reservation lifecycle
- Eventual consistency
- RabbitMQ messaging
- Docker Compose orchestration
- Service-to-service communication
- Distributed workflow handling

The system models a simplified retail checkout platform where carts reserve stock asynchronously through RabbitMQ.

---

# Architecture

```txt
                    ┌──────────────────┐
                    │   RabbitMQ       │
                    │ Event Broker     │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ Cart Service   │ │ Inventory      │ │ Product        │
│                │ │ Service        │ │ Service        │
│ - Create cart  │ │ - Reserve      │ │ - Product data │
│ - Add items    │ │ - Release      │ │ - Metadata     │
│ - Checkout     │ │ - Confirm      │ │                │
│ - Saga logic   │ │ - Stock state  │ │                │
└────────────────┘ └────────────────┘ └────────────────┘
```

---

# Tech Stack

| Technology     | Purpose                 |
| -------------- | ----------------------- |
| Node.js        | Backend runtime         |
| TypeScript     | Type safety             |
| Express        | REST APIs               |
| RabbitMQ       | Event broker            |
| Docker Compose | Container orchestration |
| ts-node-dev    | Development runtime     |
| Axios          | Service communication   |

---

# Services

## Product Service

Responsible for:

- Product catalogue
- Product metadata
- Product retrieval

### Endpoints

```http
GET    /products
GET    /products/:id
POST   /products
PATCH  /products/:id
DELETE /products/:id
```

Runs on:

```txt
localhost:3001
```

---

## Inventory Service

Responsible for:

- Stock reservation
- Stock release
- Reservation confirmation
- Inventory lifecycle

### Endpoints

```http
POST  /inventory
GET   /inventory/:productId
PATCH /inventory/:productId/reserve
PATCH /inventory/:productId/release
PATCH /inventory/:productId/confirm
```

Runs on:

```txt
localhost:3003
```

---

## Cart Service

Responsible for:

- Cart creation
- Cart management
- Checkout orchestration
- Saga compensation handling
- Event publication

### Endpoints

```http
POST   /carts
GET    /carts
GET    /carts/:id
POST   /carts/:id/items
PATCH  /carts/:id/items/:productId
DELETE /carts/:id/items/:productId
POST   /carts/:id/checkout
DELETE /carts/:id
```

Runs on:

```txt
localhost:3002
```

---

# Event-Driven Workflow

## Add Item Flow

```txt
1. Cart Service receives add-item request
2. Cart Service publishes RESERVE_STOCK event
3. Inventory Service consumes event
4. Inventory reserves stock
5. Inventory publishes:
   - STOCK_RESERVED
   OR
   - STOCK_FAILED
6. Cart Service updates item status
```

---

# Saga Pattern

The checkout flow uses a Saga-style distributed transaction pattern.

## Goal

Prevent inconsistent stock state during distributed failures.

## Flow

```txt
Checkout Started
   ↓
Inventory Confirmed
   ↓
Failure Occurs
   ↓
Compensation Triggered
   ↓
Reserved Stock Released
```

This ensures:

- No permanent stock leakage
- Rollback capability
- Distributed consistency

---

# Event Types

## Inventory Events

```txt
RESERVE_STOCK
RELEASE_STOCK
```

## Cart Events

```txt
STOCK_RESERVED
STOCK_FAILED
```

---

# Cart Item State Transitions

```txt
PENDING
   ↓
RESERVED
   ↓
CHECKED_OUT
```

Failure path:

```txt
PENDING
   ↓
FAILED
```

---

# Running the Platform

## Prerequisites

- Docker Desktop
- Node.js 20+

---

## Start all services

From project root:

```powershell
cd C:\Users\rosem\projects\node-microservices-retail
```

Run:

```powershell
docker compose up --build
```

---

# RabbitMQ Management UI

```txt
http://localhost:15672
```

Credentials:

```txt
guest / guest
```

---

# Example Workflow

## 1. Create product

```http
POST /products
```

```json
{
  "name": "MacBook Pro",
  "price": 2000,
  "stock": 5
}
```

---

## 2. Create inventory

```http
POST /inventory
```

```json
{
  "productId": "<product-id>",
  "quantity": 5
}
```

---

## 3. Create cart

```http
POST /carts
```

---

## 4. Add item

```http
POST /carts/:id/items
```

```json
{
  "productId": "<product-id>",
  "quantity": 2
}
```

---

## 5. Checkout

```http
POST /carts/:id/checkout
```

---

# Key Engineering Concepts Demonstrated

- Distributed systems
- Event-driven architecture
- Service choreography
- Saga pattern
- Eventual consistency
- Asynchronous messaging
- Docker networking
- Microservices boundaries
- Compensation transactions
- RabbitMQ queues

---

# Future Improvements

Potential extensions:

- Order Service
- Notification Service
- PostgreSQL persistence
- Retry strategies
- Dead Letter Queues (DLQ)
- Idempotency handling
- API Gateway
- Authentication / Authorization
- Kubernetes deployment
- Observability (Prometheus/Grafana)
- CI/CD pipeline

---

# Project Structure

```txt
node-microservices-retail/
│
├── docker-compose.yml
│
├── services/
│   ├── product-service/
│   ├── inventory-service/
│   └── cart-service/
│
└── README.md
```

---

# Design Notes

## Why Inventory was separated from Product

Inventory management was intentionally extracted into its own service to:

- Decouple stock lifecycle from product metadata
- Enable independent scaling
- Support future warehouse strategies
- Demonstrate bounded contexts

---

## Why RabbitMQ was introduced

RabbitMQ enables:

- Loose coupling
- Async processing
- Independent service evolution
- Event choreography
- Failure isolation

---

# Author Notes

This project was intentionally designed as a learning-focused distributed system implementation to explore modern backend engineering concepts beyond CRUD APIs.
