export interface User {
  id: number;
  uid: string;
  username: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'admin' | 'usuario';
  level?: string;
  mode?: string;
  active?: boolean;
  registeredAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}