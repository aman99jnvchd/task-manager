// src/types/task.ts
export interface Task {
    id: number;
    title: string;
    description?: string;
    is_completed: boolean;
    assigned_to: number | null;
    assigned_by: number | null;
    assigned_at: string;
    due_date?: string;
    priority?: string;
    is_approval_requested: boolean;
    approved_by: number | null;
    approved_at: string;
    created_at: string;
    updated_at: string;
}
