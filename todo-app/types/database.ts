// Tipado mínimo de la base de datos para tareas

export type Tables = {
  tasks: {
    Row: {
      id: string;
      user_id: string | null;
      title: string;
      completed: boolean | null;
      priority?: string | null;
      category?: string | null;
      due_date?: string | null;
      created_at: string | null;
      updated_at?: string | null;
      folder_id?: string | null;
    };
    Insert: {
      id?: string;
      user_id?: string | null;
      title: string;
      completed?: boolean | null;
      priority?: string | null;
      category?: string | null;
      due_date?: string | null;
      created_at?: string | null;
      updated_at?: string | null;
      folder_id?: string | null;
    };
    Update: Partial<{
      title: string;
      completed: boolean | null;
      priority: string | null;
      category: string | null;
      due_date: string | null;
      updated_at: string | null;
      folder_id: string | null;
    }>;
  };
  folders: {
    Row: {
      id: string;
      user_id: string | null;
      name: string;
      created_at: string | null;
      updated_at?: string | null;
    };
    Insert: {
      id?: string;
      user_id?: string | null;
      name: string;
      created_at?: string | null;
      updated_at?: string | null;
    };
    Update: Partial<{
      name: string;
      updated_at: string | null;
    }>;
  };
};

export type Database = {
  public: {
    Tables: Tables;
  };
};


