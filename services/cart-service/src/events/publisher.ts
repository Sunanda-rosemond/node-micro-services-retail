import amqp from 'amqplib';

export class EventPublisher {
  private channel: any;
  isConnected(): boolean {
    return !!this.channel;
  }

  async connect() {
    async function connectWithRetry() {
      let retries = 60;

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
    }
    const connection = await connectWithRetry();
    this.channel = await connection.createChannel();

    await this.channel.assertExchange('inventory_dlx', 'direct', {
      durable: true,
    });

    await this.channel.assertQueue('inventory_dlq', {
      durable: true,
    });

    await this.channel.bindQueue(
      'inventory_dlq',
      'inventory_dlx',
      'inventory_failed',
    );

    await this.channel.assertQueue('inventory_queue', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'inventory_dlx',
        'x-dead-letter-routing-key': 'inventory_failed',
      },
    });
    await this.channel.assertExchange('order_dlx', 'direct', {
      durable: true,
    });

    await this.channel.assertQueue('order_dlq', {
      durable: true,
    });

    await this.channel.bindQueue('order_dlq', 'order_dlx', 'order_failed');

    await this.channel.assertQueue('order_queue', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'order_dlx',
        'x-dead-letter-routing-key': 'order_failed',
      },
    });
  }

  async publish(event: any, queue: string) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not initialized');
    }
  }

  async publishToInventory(event: any) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not initialized');
    }

    this.channel.sendToQueue(
      'inventory_queue',
      Buffer.from(JSON.stringify(event)),
    );
  }

  async publishToOrder(event: any) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not initialized');
    }

    this.channel.sendToQueue('order_queue', Buffer.from(JSON.stringify(event)));
  }
}
