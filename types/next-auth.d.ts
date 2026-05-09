import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: number;
      name: string;
      username: string;
      is_admin: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: number;
    is_admin: boolean;
  }
}
