import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { RabbitmqModule } from 'src/rabbitmq/rabbitmq.module';
import { MailsService } from './mails.service';

@Module({
  imports: [
    RabbitmqModule,
    MailerModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        transport: {
          service: 'Gmail',
          host: configService.get('MAIL_HOST'),
          port: configService.get('MAIL_PORT'),
          secure: false,
          auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASS'),
          },
          maxConnections: 5,
          maxMessages: 50,
        },
        defaults: {
          headers: {
            'X-Mailer': 'Nest Mailer',
          },
          from: '"No Reply" <noreply@example.com>',
        },
        template: {
          dir: join(__dirname, './templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailsService],
  exports: [MailsService],
})
export class MailsModule {}
