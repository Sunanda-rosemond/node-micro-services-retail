import amqp from 'amqplib';

export class EventPublisher {
  private channel: any;

  async connect() {
    const connectWithRetry = async () => {
      let retries = 30;

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
    this.channel = await connection.createChannel();

    await this.channel.assertQueue('cart_queue');
  }

  async publish(event: any) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not initialized');
    }

    this.channel.sendToQueue('cart_queue', Buffer.from(JSON.stringify(event)));
  }
}
