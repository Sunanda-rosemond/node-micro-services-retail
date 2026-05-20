import amqp from 'amqplib';
import { OrderService } from '../services/order.service';
import { EventPublisher } from './publisher';

async function connectWithRetry() {
  let retries = 40;

  while (retries > 0) {
    try {
      return await amqp.connect('amqp://rabbitmq');
    } catch {
      console.log('RabbitMQ not ready yet. Retrying...');
      retries--;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  throw new Error('Could not connect to RabbitMQ');
}

export class EventConsumer {
  constructor(
    private orderService: OrderService,
    private eventPublisher: EventPublisher,
  ) {}

  async start() {
    const connection = await connectWithRetry();
    const channel = await connection.createChannel();

    await channel.assertExchange('order_dlx', 'direct', {
      durable: true,
    });

    await channel.assertQueue('order_dlq', {
      durable: true,
    });

    await channel.bindQueue('order_dlq', 'order_dlx', 'order_failed');

    await channel.assertQueue('order_queue', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'order_dlx',
        'x-dead-letter-routing-key': 'order_failed',
      },
    });

    channel.consume('order_queue', async (msg) => {
      if (!msg) return;
      let event: any;

      try {
        event = JSON.parse(msg.content.toString());
      } catch (err) {
        console.error('Invalid JSON msg:', msg.content.toString());
        channel.reject(msg, false);
        return;
      }
      try {
        console.log('Order event received:', event);

        if (
          event.type !== 'CHECKOUT_COMPLETED' ||
          !event.cartId ||
          !Array.isArray(event.items)
        ) {
          console.error('Invalid order event:', event);
          channel.reject(msg, false);
          return;
        }

        const order = await this.orderService.createOrder(
          event.cartId,
          event.items,
        );
        await this.eventPublisher.publish({
          type: 'ORDER_CREATED',
          orderId: order.id,
          cartId: order.cartId,
        });

        channel.ack(msg);
      } catch (err) {
        console.error('Error processing order event', err);
        channel.ack(msg);
      }
    });
  }
}
