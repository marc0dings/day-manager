export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  order: number;
};

export type Checklist = {
  id: string;
  title: string;
  date: Date;
  items: ChecklistItem[];
  createdAt: Date;
};
