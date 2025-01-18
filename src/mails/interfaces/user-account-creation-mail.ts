export interface IUserSendMail {
  userName: string;
  userEmail: string;
  userPassword: string;
  userRole: string;
}

export interface IUserSendMailOTP {
  userEmail: string;
  userOTP: string;
}
