export interface CategoryRow {
  category: string;
  group_name: string | null;
  is_discretionary: boolean;
  total: number;
  count: number;
}

export interface AccountRow {
  account: string;
  total: number;
  count: number;
}

export interface GroupRow {
  group: string;
  total: number;
}

export interface TrendRow {
  month: string;
  total: number;
}

export interface RecentRow {
  id: string;
  amount: number;
  category: string;
  account: string | null;
  note: string | null;
  is_discretionary: boolean;
  type: string;
  occurred_at: string;
}

export interface DashboardData {
  month: string;
  total: number;
  count: number;
  essential: number;
  discretionary: number;
  byCategory: CategoryRow[];
  byGroup: GroupRow[];
  byAccount: AccountRow[];
  monthlyTrend: TrendRow[];
  recent: RecentRow[];
}
