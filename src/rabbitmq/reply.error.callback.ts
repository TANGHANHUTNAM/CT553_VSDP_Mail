import { Channel, ConsumeMessage } from 'amqplib';
import { EXCHANGE, RETRY_LIMIT, ROUTING_KEY } from './rabbitmq-constant';

export function ReplyErrorCallback(
  channel: Channel,
  msg: ConsumeMessage,
  error: any,
) {
  const { headers } = msg.properties;
  const { content } = msg;

  let retries = headers['x-retries'] || 0;
  retries++;

  if (retries >= RETRY_LIMIT) {
    channel.publish(EXCHANGE.DLX, ROUTING_KEY.DEAD_LETTER, content, {
      headers: {
        ...headers,
        'x-retries': retries,
      },
    });
    channel.ack(msg);
    return;
  }

  channel.publish(EXCHANGE.RETRY, ROUTING_KEY.RETRY, content, {
    headers: {
      ...headers,
      'x-retries': retries,
    },
  });
  channel.ack(msg);
}
