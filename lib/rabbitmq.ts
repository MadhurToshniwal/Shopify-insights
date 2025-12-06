import amqp from 'amqplib';

let connection: any = null;
let channel: any = null;

export const QUEUES = {
  CUSTOMER_SYNC: 'customer-sync',
  ORDER_SYNC: 'order-sync',
  PRODUCT_SYNC: 'product-sync',
  WEBHOOK_PROCESS: 'webhook-process',
} as const;

export async function connectRabbitMQ(): Promise<any> {
  if (channel) return channel;

  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL!);
    channel = await connection.createChannel();

    // Assert queues
    await Promise.all(
      Object.values(QUEUES).map((queue) =>
        channel!.assertQueue(queue, { durable: true })
      )
    );

    console.log('✅ RabbitMQ connected');
    return channel!;
  } catch (error) {
    console.error('❌ RabbitMQ connection failed:', error);
    throw error;
  }
}

export async function publishToQueue(queue: string, message: any): Promise<void> {
  const ch = await connectRabbitMQ();
  ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
}

export async function closeRabbitMQ(): Promise<void> {
  if (channel) await channel.close();
  if (connection) await connection.close();
}
