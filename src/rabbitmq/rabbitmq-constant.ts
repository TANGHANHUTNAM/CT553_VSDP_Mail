export const EXCHANGE = {
  EMAIL: 'email.exchange',
  DLX: 'email.dlx.exchange',
  RETRY: 'retry.exchange',
};

export const QUEUE = {
  EMAIL_SEND: 'email.queue',
  DEAD_LETTER: 'dead.letter.queue',
  RETRY: 'retry.queue',
};

export const ROUTING_KEY = {
  EMAIL_SEND: 'email.notification.account',
  DEAD_LETTER: 'email.dead.letter',
  RETRY: 'retry.queue',
};

export const RETRY_LIMIT = 3;
