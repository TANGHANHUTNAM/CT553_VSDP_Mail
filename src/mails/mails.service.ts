import {
  AmqpConnection,
  MessageHandlerErrorBehavior,
  Nack,
  RabbitHeader,
  RabbitPayload,
  RabbitRPC,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Injectable } from '@nestjs/common';
import { LogService } from 'src/log/log.service';
import {
  EXCHANGE,
  QUEUE,
  RETRY_LIMIT,
  ROUTING_KEY,
} from 'src/rabbitmq/rabbitmq-constant';
import { ReplyErrorCallback } from 'src/rabbitmq/reply.error.callback';
import {
  IUserSendMail,
  IUserSendMailOTP,
} from './interfaces/user-account-creation-mail';
import { delayProcess } from 'src/rabbitmq/delay.process';

@Injectable()
export class MailsService {
  constructor(
    private mailerService: MailerService,
    private logService: LogService,
  ) {
    this.logService.setContext(MailsService.name);
  }

  async sendMail(user: IUserSendMail) {
    try {
      const { userPassword, userEmail, userName, userRole } = user;
      await this.mailerService.sendMail({
        to: user.userEmail,
        subject: 'Tài Khoản Tình Nguyện Viên VSDP',
        template: './create-account-user',
        context: {
          userName,
          userEmail,
          userPassword,
          userRole,
        },
      });
      this.logService.log(`Email sent to ${userEmail || 'unknown'}`);
    } catch (error) {
      this.logService.error(`Error sending email to ${user?.userEmail}`);
      throw error;
    }
  }

  async sendMailOTPChangePassword(user: IUserSendMailOTP) {
    try {
      const { userEmail, userOTP } = user;
      await this.mailerService.sendMail({
        to: userEmail,
        subject: 'Mã OTP Đổi Mật Khẩu Tài Khoản VSDP',
        template: './send-mail-otp-change-password',
        context: {
          userEmail,
          userOTP,
        },
      });
      this.logService.log(`Email sent to ${userEmail || 'unknown'}`);
    } catch (error) {
      this.logService.error(`Error sending email to ${user?.userEmail}`);
      throw error;
    }
  }

  // Send email to change password OTP
  @RabbitRPC({
    exchange: EXCHANGE.EMAIL,
    routingKey: ROUTING_KEY.OTP_MAIL,
    queue: QUEUE.OTP_MAIL,
    queueOptions: {
      deadLetterExchange: EXCHANGE.DLX,
      deadLetterRoutingKey: ROUTING_KEY.DEAD_LETTER,
      messageTtl: 60000,
      maxLength: 100,
      durable: true,
    },
    usePersistentReplyTo: true,
  })
  async onEmailOTPChangePassword(@RabbitPayload() message: IUserSendMailOTP) {
    try {
      await this.sendMailOTPChangePassword(message);
    } catch (error) {
      throw new Nack(true);
    }
  }

  // Send email to login user
  @RabbitRPC({
    exchange: EXCHANGE.EMAIL,
    routingKey: ROUTING_KEY.EMAIL_SEND,
    queue: QUEUE.EMAIL_SEND,
    queueOptions: {
      deadLetterExchange: EXCHANGE.DLX,
      deadLetterRoutingKey: ROUTING_KEY.DEAD_LETTER,
      messageTtl: 60000,
      maxLength: 100,
      durable: true,
    },
    usePersistentReplyTo: true,
    errorHandler: ReplyErrorCallback,
  })
  async onEmailReceived(@RabbitPayload() message: IUserSendMail) {
    try {
      await this.sendMail(message);
    } catch (error) {
      throw new Nack(true);
    }
  }

  @RabbitSubscribe({
    exchange: EXCHANGE.RETRY,
    routingKey: ROUTING_KEY.RETRY,
    queue: QUEUE.RETRY,
    queueOptions: {
      messageTtl: 10000,
      deadLetterExchange: EXCHANGE.DLX,
      deadLetterRoutingKey: ROUTING_KEY.DEAD_LETTER,
      durable: true,
    },
    errorHandler: ReplyErrorCallback,
  })
  async handleRetryMessage(
    @RabbitPayload() message: IUserSendMail,
    @RabbitHeader() headers: { [key: string]: number },
  ) {
    try {
      let retries = headers['x-retries'] || 0;
      const delay = Math.pow(2, retries) * 1000;
      await delayProcess(delay);
      if (retries >= RETRY_LIMIT) {
        throw new Error('Max retry attempts exceeded');
      }
      await this.sendMail(message);
    } catch (error) {
      throw new Nack(false);
    }
  }

  @RabbitSubscribe({
    exchange: EXCHANGE.DLX,
    routingKey: ROUTING_KEY.DEAD_LETTER,
    queue: QUEUE.DEAD_LETTER,
    queueOptions: {
      durable: true,
    },
  })
  async handleDeadLetter(@RabbitPayload() message: IUserSendMail) {
    try {
      this.logService.error(`Dead letter for ${message?.userEmail}`);
    } catch (error) {
      throw error;
    }
  }
}
