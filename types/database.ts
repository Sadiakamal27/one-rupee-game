export interface GamePlan {
  id: number
  name: string
  price: number
  reward_title: string
  goal_amount: number
  current_amount: number
  end_date: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  order_id: string
  name: string
  easypaisa_account: string
  plan_id: number
  amount: number
  payment_status: 'pending' | 'completed' | 'failed'
  created_at: string
  user_id?: string
  profile?: {
    full_name?: string
    first_name?: string
    last_name?: string
  }
}

export interface Milestone {
  id: number
  plan_id: number
  amount: number
  reward_name: string
  created_at: string
}

