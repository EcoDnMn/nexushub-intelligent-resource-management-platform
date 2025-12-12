export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// USER & AUTH
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Should not be sent to client
}
export interface AuthResponse {
  token: string; // For this demo, token is just the user ID
  user: Omit<User, 'password'>;
}
// RESOURCES
export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  url: string;
  category: 'Development' | 'Design' | 'Productivity' | 'Marketing';
  tags: string[];
  submittedBy: string; // userId
  createdAt: number; // epoch millis
  upvotes: number;
  downvotes: number;
}