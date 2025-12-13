export interface AuthResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    role: string;
    status: string;
  };
}
