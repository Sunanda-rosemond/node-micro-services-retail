import amqp from 'amqplib';
import { CartService } from '../services/cart.service';

export class EventConsumer {
  private channel: any;
  constructor(private service: CartService) {}

  async start() {
    // const connection = await amqp.connect('amqp://rabbitmq');
    const connectWithRetry = async () => {
      let retries = 10;

      while (retries > 0) {
        try {
          return await amqp.connect('amqp://rabbitmq');
        } catch (err) {
          console.log('RabbitMQ not ready yet. Retrying...');
          retries--;
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }

      throw new Error('Could not connect to RabbitMQ');
    };
    const connection = await connectWithRetry();
    const channel = await connection.createChannel();
    this.channel = channel;

    await channel.assertExchange('cart_dlx', 'direct', {
      durable: true,
    });

    await channel.assertQueue('cart_dlq', {
      durable: true,
    });

    await channel.bindQueue('cart_dlq', 'cart_dlx', 'cart_failed');

    await channel.assertQueue('cart_queue', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'cart_dlx',
        'x-dead-letter-routing-key': 'cart_failed',
      },
    });

    channel.consume('cart_queue', async (msg) => {
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
        console.log('CArt event received:', event);
        if (
          !event.type ||
          !event.productId ||
          !['STOCK_RESERVED', 'STOCK_FAILED'].includes(event.type)
        ) {
          console.error('Invalid cart event:', event);
          channel.reject(msg, false);
          return;
        }

        if (event.type === 'STOCK_RESERVED') {
          await this.service.markItemReserved(event.productId);
        }

        if (event.type === 'STOCK_FAILED') {
          await this.service.markItemFailed(event.productId);
        }

        channel.ack(msg);
      } catch (err) {
        console.error('Error processing cart event:', err);
        channel.reject(msg, false);
      }
    });
  }
  isConnected(): boolean {
    return !!this.channel;
  }
}
