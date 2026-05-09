import amqp from 'amqplib';
import { InventoryService } from '../services/inventory.service';
import { EventPublisher } from './publisher';

export class EventConsumer {
  constructor(
    private service: InventoryService,
    private eventPublisher: EventPublisher,
  ) {}

  async start() {
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

    await channel.assertQueue('inventory_queue');

    channel.consume('inventory_queue', async (msg) => {
      if (!msg) return;

      const event = JSON.parse(msg.content.toString());

      try {
        if (event.type === 'RESERVE_STOCK') {
          this.service.reserve(event.productId, event.quantity);
        }
        // ✅ publish SUCCESS event
        await this.eventPublisher.publish({
          type: 'STOCK_RESERVED',
          productId: event.productId,
        });

        if (event.type === 'RELEASE_STOCK') {
          this.service.release(event.productId, event.quantity);
        }

        channel.ack(msg);
      } catch (err) {
        // ✅ publish FAILURE event
        await this.eventPublisher.publish({
          type: 'STOCK_FAILED',
          productId: event.productId,
        });
        console.error('Error processing event', err);
        channel.ack(msg);
      }
    });
  }
}
