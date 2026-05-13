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

    await channel.assertQueue('order_queue');

    channel.consume('order_queue', async (msg) => {
      if (!msg) return;

      const event = JSON.parse(msg.content.toString());
      console.log('Order event received:', event);

      try {
        if (event.type === 'CHECKOUT_COMPLETED') {
          const order = await this.orderService.createOrder(
            event.cartId,
            event.items,
          );

          await this.eventPublisher.publish({
            type: 'ORDER_CREATED',
            orderId: order.id,
            cartId: order.cartId,
          });
        }

        channel.ack(msg);
      } catch (err) {
        console.error('Error processing order event', err);
        channel.ack(msg);
      }
    });
  }
}
