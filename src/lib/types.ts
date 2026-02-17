export type UserRole = 'admin' | 'partner';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  balance: number;
  business_name: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface Package {
  id: string;
  name: string;
  price_usd: number;
  data_amount: number;
  duration_days: number;
  is_active: boolean;
  created_at: string;
}

export interface Sale {
  id: string;
  user_id: string;
  package_id: string;
  price_sold: number;
  qr_code_data: string | null;
  created_at: string;
  package?: Package;
}

export interface DashboardStats {
  balance: number;
  totalSales: number;
  totalSpent: number;
}
