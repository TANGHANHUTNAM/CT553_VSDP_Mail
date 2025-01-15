import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { LogService } from 'src/log/log.service';
import { IUserSendMail } from './interfaces/user-account-creation-mail';
import { GlobalEventSettings, QUEUE } from 'src/rabbitmq/rabbitmq-constant';

@Injectable()
export class MailsService {
  constructor(
    private mailerService: MailerService,
    private logService: LogService,
  ) {
    this.logService.setContext(MailsService.name);
  }

  @RabbitSubscribe({
    exchange: GlobalEventSettings.EXCHANGE,
    routingKey: 'email.send',
    queue: QUEUE.EMAIL_SEND,
  })
  async onEmailReceived(message: IUserSendMail): Promise<void> {
    const { userName, userEmail, userPassword, userRole } = message;

    await this.mailerService.sendMail({
      to: userEmail,
      subject: 'Account Confirmation',
      template: './create-account-user',
      context: {
        userName,
        userEmail,
        userPassword,
        userRole,
      },
    }),
      this.logService.log(`Email sent to ${userEmail}`);
  }

  @RabbitSubscribe({
    exchange: GlobalEventSettings.DLX,
    routingKey: 'deadletter',
    queue: QUEUE.DEAD_LETTER,
  })
  async handleDeadLetter(message: IUserSendMail): Promise<void> {
    this.logService.error(`Message moved to DLQ: ${JSON.stringify(message)}`);
  }
}
