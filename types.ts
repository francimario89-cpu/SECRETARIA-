
export interface Appointment {
  id: string;
  description: string;
  dateTime: string;
  urgent: boolean;
  status: 'pending' | 'completed';
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
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
  expenses: Expense[];
  birthdays: Birthday[];
  messages: Message[];
}
