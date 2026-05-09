import amqp from 'amqplib';
import { CartService } from '../services/cart.service';

export class EventConsumer {
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

    await channel.assertQueue('cart_queue');

    channel.consume('cart_queue', async (msg) => {
      if (!msg) return;

      const event = JSON.parse(msg.content.toString());

      try {
        if (event.type === 'STOCK_RESERVED') {
          await this.service.markItemReserved(event.productId);
        }

        if (event.type === 'STOCK_FAILED') {
          await this.service.markItemFailed(event.productId);
        }

        channel.ack(msg);
      } catch (err) {
        console.error(err);
        channel.nack(msg);
      }
    });
  }
}
