export type Todo = {
  description: string;
  due_date?: string;
  status?: "OPEN" | "CLOSED";
};
