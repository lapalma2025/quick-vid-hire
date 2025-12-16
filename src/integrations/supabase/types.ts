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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          job_id: string
          message: string | null
          read: boolean | null
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          job_id: string
          message?: string | null
          read?: boolean | null
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          job_id?: string
          message?: string | null
          read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          job_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          job_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_images_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_responses: {
        Row: {
          created_at: string | null
          group_members: string[] | null
          group_size: number | null
          id: string
          is_group_application: boolean | null
          job_id: string
          message: string | null
          offer_price: number | null
          proposed_time: string | null
          status: string | null
          worker_id: string
        }
        Insert: {
          created_at?: string | null
          group_members?: string[] | null
          group_size?: number | null
          id?: string
          is_group_application?: boolean | null
          job_id: string
          message?: string | null
          offer_price?: number | null
          proposed_time?: string | null
          status?: string | null
          worker_id: string
        }
        Update: {
          created_at?: string | null
          group_members?: string[] | null
          group_size?: number | null
          id?: string
          is_group_application?: boolean | null
          job_id?: string
          message?: string | null
          offer_price?: number | null
          proposed_time?: string | null
          status?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_responses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_responses_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_views: {
        Row: {
          id: string
          job_id: string
          viewed_at: string | null
          viewer_id: string | null
        }
        Insert: {
          id?: string
          job_id: string
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_views_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          allows_group: boolean | null
          applicant_limit: number | null
          budget: number | null
          budget_type: string | null
          category_id: string | null
          country: string | null
          created_at: string | null
          description: string | null
          duration_hours: number | null
          end_time: string | null
          id: string
          is_foreign: boolean | null
          is_highlighted: boolean | null
          is_promoted: boolean | null
          max_workers: number | null
          miasto: string
          min_workers: number | null
          paid: boolean | null
          promotion_expires_at: string | null
          selected_worker_id: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          stripe_session_id: string | null
          title: string
          updated_at: string | null
          urgent: boolean | null
          user_id: string
          wojewodztwo: string
        }
        Insert: {
          allows_group?: boolean | null
          applicant_limit?: number | null
          budget?: number | null
          budget_type?: string | null
          category_id?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          end_time?: string | null
          id?: string
          is_foreign?: boolean | null
          is_highlighted?: boolean | null
          is_promoted?: boolean | null
          max_workers?: number | null
          miasto: string
          min_workers?: number | null
          paid?: boolean | null
          promotion_expires_at?: string | null
          selected_worker_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          stripe_session_id?: string | null
          title: string
          updated_at?: string | null
          urgent?: boolean | null
          user_id: string
          wojewodztwo: string
        }
        Update: {
          allows_group?: boolean | null
          applicant_limit?: number | null
          budget?: number | null
          budget_type?: string | null
          category_id?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          end_time?: string | null
          id?: string
          is_foreign?: boolean | null
          is_highlighted?: boolean | null
          is_promoted?: boolean | null
          max_workers?: number | null
          miasto?: string
          min_workers?: number | null
          paid?: boolean | null
          promotion_expires_at?: string | null
          selected_worker_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          stripe_session_id?: string | null
          title?: string
          updated_at?: string | null
          urgent?: boolean | null
          user_id?: string
          wojewodztwo?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_selected_worker_id_fkey"
            columns: ["selected_worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          status: string | null
          stripe_payment_id: string | null
          stripe_session_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          available_from: string | null
          available_to: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          extended_description: string | null
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          is_trusted: boolean | null
          logo_url: string | null
          miasto: string | null
          name: string | null
          phone: string | null
          rating_avg: number | null
          rating_count: number | null
          remaining_highlights: number | null
          remaining_listings: number | null
          role: Database["public"]["Enums"]["user_role"]
          stripe_customer_id: string | null
          subscription_period_end: string | null
          subscription_plan: string | null
          updated_at: string | null
          user_id: string
          wojewodztwo: string | null
          worker_profile_completed: boolean | null
          worker_visibility_paid: boolean | null
        }
        Insert: {
          available_from?: string | null
          available_to?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          extended_description?: string | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          is_trusted?: boolean | null
          logo_url?: string | null
          miasto?: string | null
          name?: string | null
          phone?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          remaining_highlights?: number | null
          remaining_listings?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          stripe_customer_id?: string | null
          subscription_period_end?: string | null
          subscription_plan?: string | null
          updated_at?: string | null
          user_id: string
          wojewodztwo?: string | null
          worker_profile_completed?: boolean | null
          worker_visibility_paid?: boolean | null
        }
        Update: {
          available_from?: string | null
          available_to?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          extended_description?: string | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          is_trusted?: boolean | null
          logo_url?: string | null
          miasto?: string | null
          name?: string | null
          phone?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          remaining_highlights?: number | null
          remaining_listings?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          stripe_customer_id?: string | null
          subscription_period_end?: string | null
          subscription_plan?: string | null
          updated_at?: string | null
          user_id?: string
          wojewodztwo?: string | null
          worker_profile_completed?: boolean | null
          worker_visibility_paid?: boolean | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          job_id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          job_id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          job_id?: string
          rating?: number
          reviewed_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_id_fkey"
            columns: ["reviewed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_categories: {
        Row: {
          category_id: string
          id: string
          worker_id: string
        }
        Insert: {
          category_id: string
          id?: string
          worker_id: string
        }
        Update: {
          category_id?: string
          id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_categories_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_gallery: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          worker_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_gallery_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_applicant_limit: { Args: { job_uuid: string }; Returns: boolean }
    }
    Enums: {
      job_status:
        | "pending_payment"
        | "active"
        | "in_progress"
        | "done"
        | "archived"
        | "closed"
      user_role: "client" | "worker" | "admin"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      job_status: [
        "pending_payment",
        "active",
        "in_progress",
        "done",
        "archived",
        "closed",
      ],
      user_role: ["client", "worker", "admin"],
    },
  },
} as const
