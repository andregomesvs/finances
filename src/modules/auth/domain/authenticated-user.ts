export interface AuthenticatedUser {
  uid: string;
  email: string;
  name: string | null;
  picture: string | null;
}
