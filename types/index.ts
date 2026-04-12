export interface DbUser {
  id: number;
  name: string;
  email: string;
  password: string;
  is_admin: number; // SQLite boolean: 0 or 1
  created_at: string;
}

export interface Quote {
  id: number;
  text: string;
  subtitle: string | null;
  author_id: number;
  author_name: string;
  created_at: string;
  updated_at: string;
}
