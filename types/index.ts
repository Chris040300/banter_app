export interface DbUser {
  id: number;
  name: string;
  username: string;
  password: string;
  is_admin: number;
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
