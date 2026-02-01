
export interface Appointment {
  id: string;
  description: string;
  dateTime: string;
  urgent: boolean;
  status: 'pending' | 'completed';
  items?: { name: string; quantity: string; marketQuantity?: string }[];
}

export interface Habit {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  lastUpdated: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
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
  habits: Habit[];
  tasks: Task[];
  messages: Message[];
}
