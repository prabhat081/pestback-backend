export interface VerificationEmailData {
  firstName: string;
  verificationToken: string;
}

export interface TeamInvitationEmailData {
  companyName: string;
  roleName: string;
  invitationToken: string;
}