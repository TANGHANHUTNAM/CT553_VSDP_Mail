import {
  MessageHandlerErrorBehavior,
  RabbitMQModule,
} from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EXCHANGE } from './rabbitmq-constant';

@Module({
  imports: [
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        exchanges: [
          {
            type: 'topic',
            name: EXCHANGE.EMAIL,
          },
          {
            type: 'direct',
            name: EXCHANGE.DLX,
          },
          {
            type: 'topic',
            name: EXCHANGE.RETRY,
          },
        ],
        prefetchCount: 50,
        defaultRpcErrorBehavior: MessageHandlerErrorBehavior.NACK,
        defaultSubscribeErrorBehavior: MessageHandlerErrorBehavior.NACK,
        uri: configService.get('RABBITMQ_URI'),
        connectionInitOptions: { wait: true, reject: true, timeout: 10000 },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [RabbitMQModule],
})
export class RabbitmqModule {}
