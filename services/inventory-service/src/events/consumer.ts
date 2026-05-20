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

    await channel.assertExchange('inventory_dlx', 'direct', {
      durable: true,
    });

    await channel.assertQueue('inventory_dlq', {
      durable: true,
    });

    await channel.bindQueue(
      'inventory_dlq',
      'inventory_dlx',
      'inventory_failed',
    );

    await channel.assertQueue('inventory_queue', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'inventory_dlx',
        'x-dead-letter-routing-key': 'inventory_failed',
      },
    });

    channel.consume('inventory_queue', async (msg) => {
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
        if (!event.type || !event.productId || !event.quantity) {
          console.error('Invalid inventory event:', event);
          channel.reject(msg, false);
          return;
        }
        if (event.type === 'RESERVE_STOCK') {
          await this.service.reserve(event.productId, event.quantity);

          await this.eventPublisher.publish({
            type: 'STOCK_RESERVED',
            productId: event.productId,
            quantity: event.quantity,
          });
        }

        if (event.type === 'RELEASE_STOCK') {
          await this.service.release(event.productId, event.quantity);
        }

        channel.ack(msg);
      } catch (err) {
        console.error('Error processing event', err);

        if (event.type === 'RESERVE_STOCK') {
          await this.eventPublisher.publish({
            type: 'STOCK_FAILED',
            productId: event.productId,
            quantity: event.quantity,
            reason: err instanceof Error ? err.message : 'Unknown error',
          });
        }
        channel.ack(msg);
        return;
      }
      channel.reject(msg, false);
    });
  }
}
