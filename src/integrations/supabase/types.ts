export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          content_type: Database["public"]["Enums"]["content_type"] | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_published: boolean
          parent_id: string | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          parent_id?: string | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean
          parent_id?: string | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      content: {
        Row: {
          body: Json
          category_id: string | null
          code_notice: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          diagram_key: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          featured_image: string | null
          id: string
          safety_note: string | null
          search_text: string | null
          slug: string
          sort_order: number
          source_name: string | null
          source_reference: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["content_status"]
          subcategory: string | null
          summary: string | null
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          body?: Json
          category_id?: string | null
          code_notice?: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          diagram_key?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          featured_image?: string | null
          id?: string
          safety_note?: string | null
          search_text?: string | null
          slug: string
          sort_order?: number
          source_name?: string | null
          source_reference?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          subcategory?: string | null
          summary?: string | null
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          body?: Json
          category_id?: string | null
          code_notice?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          diagram_key?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          featured_image?: string | null
          id?: string
          safety_note?: string | null
          search_text?: string | null
          slug?: string
          sort_order?: number
          source_name?: string | null
          source_reference?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          subcategory?: string | null
          summary?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      content_relationships: {
        Row: {
          content_id: string
          created_at: string
          id: string
          related_content_id: string
          relationship_type: string
          sort_order: number
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          related_content_id: string
          relationship_type?: string
          sort_order?: number
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          related_content_id?: string
          relationship_type?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_relationships_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_relationships_related_content_id_fkey"
            columns: ["related_content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt_text: string | null
          caption: string | null
          content_id: string | null
          created_at: string
          id: string
          sort_order: number
          type: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          content_id?: string | null
          created_at?: string
          id?: string
          sort_order?: number
          type?: string
          url: string
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          content_id?: string | null
          created_at?: string
          id?: string
          sort_order?: number
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_questions: {
        Row: {
          content_id: string | null
          correct_answer: Json | null
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          explanation: string
          id: string
          options: Json
          prompt: string
          question_type: Database["public"]["Enums"]["question_type"]
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          content_id?: string | null
          correct_answer?: Json | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          explanation?: string
          id?: string
          options?: Json
          prompt: string
          question_type?: Database["public"]["Enums"]["question_type"]
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          content_id?: string | null
          correct_answer?: Json | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          explanation?: string
          id?: string
          options?: Json
          prompt?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_questions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          content_id: string | null
          created_at: string
          description: string | null
          id: string
          question_ids: string[]
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          content_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          question_ids?: string[]
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          content_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          question_ids?: string[]
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          content_id: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          id: string
          kind: string
          safety_note: string | null
          setup: string
          status: Database["public"]["Enums"]["content_status"]
          steps: Json
          symptoms: Json
          title: string
          updated_at: string
        }
        Insert: {
          content_id?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          kind?: string
          safety_note?: string | null
          setup?: string
          status?: Database["public"]["Enums"]["content_status"]
          steps?: Json
          symptoms?: Json
          title: string
          updated_at?: string
        }
        Update: {
          content_id?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          kind?: string
          safety_note?: string | null
          setup?: string
          status?: Database["public"]["Enums"]["content_status"]
          steps?: Json
          symptoms?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          plan_interval: Database["public"]["Enums"]["plan_interval"]
          price_id: string | null
          provider: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          plan_interval?: Database["public"]["Enums"]["plan_interval"]
          price_id?: string | null
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          plan_interval?: Database["public"]["Enums"]["plan_interval"]
          price_id?: string | null
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          content_id: string | null
          created_at: string
          event: string
          id: string
          is_correct: boolean | null
          question_id: string | null
          user_id: string
        }
        Insert: {
          content_id?: string | null
          created_at?: string
          event?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string | null
          user_id: string
        }
        Update: {
          content_id?: string | null
          created_at?: string
          event?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "practice_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_pro: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      practice_catalog: {
        Args: never
        Returns: {
          content_id: string
          equipment: number
          questions: number
          quizzes: number
          troubleshooting: number
        }[]
      }
      practice_counts: {
        Args: { _content_id: string }
        Returns: {
          equipment: number
          questions: number
          quizzes: number
          troubleshooting: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
      content_status: "draft" | "published" | "archived"
      content_type:
        | "equipment"
        | "component"
        | "concept"
        | "procedure"
        | "troubleshooting"
        | "tool"
      difficulty_level: "beginner" | "apprentice" | "technician" | "advanced"
      plan_interval: "monthly" | "annual"
      question_type:
        | "multiple_choice"
        | "true_false"
        | "multiple_select"
        | "short_answer"
        | "calculation"
        | "diagnostic_decision"
        | "identify_component"
        | "identify_problem"
        | "sequence_of_operation"
      subscription_status: "active" | "canceled" | "past_due" | "trialing"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "user"],
      content_status: ["draft", "published", "archived"],
      content_type: [
        "equipment",
        "component",
        "concept",
        "procedure",
        "troubleshooting",
        "tool",
      ],
      difficulty_level: ["beginner", "apprentice", "technician", "advanced"],
      plan_interval: ["monthly", "annual"],
      question_type: [
        "multiple_choice",
        "true_false",
        "multiple_select",
        "short_answer",
        "calculation",
        "diagnostic_decision",
        "identify_component",
        "identify_problem",
        "sequence_of_operation",
      ],
      subscription_status: ["active", "canceled", "past_due", "trialing"],
    },
  },
} as const
