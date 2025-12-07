export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice' | 'rating';
  options?: string[];
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  participants?: number;
  questionsCount?: number;
  isCompleted?: boolean;
  questions?: SurveyQuestion[];
}


