import amqp from 'amqplib';

async function connectWithRetry() {
  let retries = 10;

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

export class EventPublisher {
  private channel: any;

  async connect() {
    const connection = await connectWithRetry();
    this.channel = await connection.createChannel();

    await this.channel.assertQueue('notification_queue');
  }

  async publish(event: any) {
    this.channel.sendToQueue(
      'notification_queue',
      Buffer.from(JSON.stringify(event)),
    );
  }
}
