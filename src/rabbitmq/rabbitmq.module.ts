import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GlobalEventSettings, QUEUE } from './rabbitmq-constant';

@Module({
  imports: [
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        exchanges: [
          {
            type: 'topic',
            name: GlobalEventSettings.EXCHANGE,
          },
          { name: GlobalEventSettings.DLX, type: 'topic' },
        ],
        uri: configService.get('RABBITMQ_URI'),
        connectionInitOptions: { wait: true },
        channels: {
          'channel-1': {
            prefetchCount: 20,
            default: true,
            deadLetterExchange: GlobalEventSettings.DLX,
          },
        },
        queues: [
          {
            name: QUEUE.EMAIL_SEND,
            key: 'email.send',
            options: {
              durable: true,
            },
          },
        ],
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [RabbitMQModule],
})
export class RabbitmqModule {}
