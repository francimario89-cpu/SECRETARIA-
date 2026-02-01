
export interface Appointment {
  id: string;
  description: string;
  dateTime: string;
  urgent: boolean;
  status: 'pending' | 'completed';
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  description: string;
  isRecurring?: boolean;
  frequency?: 'monthly' | 'weekly';
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
}

export interface Birthday {
  id: string;
  name: string;
  date: string;
  relation: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface AppState {
  appointments: Appointment[];
  transactions: Transaction[];
  goals: SavingsGoal[];
  monthlyBudget: number;
  birthdays: Birthday[];
  messages: Message[];
}
