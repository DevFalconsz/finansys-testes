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
      comprovante: {
        Row: {
          arquivo: string | null
          arquivo_url: string | null
          created_at: string | null
          data_pagamento: string | null
          id_comprovante: number
          id_lancamento: number | null
          id_usuario: number | null
          tipo: string | null
        }
        Insert: {
          arquivo?: string | null
          arquivo_url?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          id_comprovante?: number
          id_lancamento?: number | null
          id_usuario?: number | null
          tipo?: string | null
        }
        Update: {
          arquivo?: string | null
          arquivo_url?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          id_comprovante?: number
          id_lancamento?: number | null
          id_usuario?: number | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comprovante_id_lancamento_fkey"
            columns: ["id_lancamento"]
            isOneToOne: false
            referencedRelation: "lancamento"
            referencedColumns: ["id_lancamento"]
          },
        ]
      }
      divida: {
        Row: {
          data_vencimento: string | null
          descricao: string | null
          id_divida: number
          id_usuario: number
          status: string | null
          valor_total: number | null
        }
        Insert: {
          data_vencimento?: string | null
          descricao?: string | null
          id_divida?: number
          id_usuario: number
          status?: string | null
          valor_total?: number | null
        }
        Update: {
          data_vencimento?: string | null
          descricao?: string | null
          id_divida?: number
          id_usuario?: number
          status?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "divida_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      imposto: {
        Row: {
          id_imposto: number
          id_lancamento: number
          periodo: string | null
          tipo: string | null
          valor: number | null
        }
        Insert: {
          id_imposto?: number
          id_lancamento: number
          periodo?: string | null
          tipo?: string | null
          valor?: number | null
        }
        Update: {
          id_imposto?: number
          id_lancamento?: number
          periodo?: string | null
          tipo?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "imposto_id_lancamento_fkey"
            columns: ["id_lancamento"]
            isOneToOne: false
            referencedRelation: "lancamento"
            referencedColumns: ["id_lancamento"]
          },
        ]
      }
      lancamento: {
        Row: {
          categoria: string | null
          data: string
          descricao: string | null
          id_lancamento: number
          id_usuario: number
          tipo: string | null
          valor: number
        }
        Insert: {
          categoria?: string | null
          data: string
          descricao?: string | null
          id_lancamento?: number
          id_usuario: number
          tipo?: string | null
          valor: number
        }
        Update: {
          categoria?: string | null
          data?: string
          descricao?: string | null
          id_lancamento?: number
          id_usuario?: number
          tipo?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamento_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      meta: {
        Row: {
          descricao: string | null
          id_meta: number
          id_usuario: number
          periodo: string | null
          valor_objetivo: number | null
        }
        Insert: {
          descricao?: string | null
          id_meta?: number
          id_usuario: number
          periodo?: string | null
          valor_objetivo?: number | null
        }
        Update: {
          descricao?: string | null
          id_meta?: number
          id_usuario?: number
          periodo?: string | null
          valor_objetivo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meta_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      movimentacao_caixa: {
        Row: {
          categoria: string | null
          created_at: string | null
          data: string
          descricao: string | null
          id_movimentacao: number
          id_usuario: number
          tipo: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          data: string
          descricao?: string | null
          id_movimentacao?: number
          id_usuario: number
          tipo: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          data?: string
          descricao?: string | null
          id_movimentacao?: number
          id_usuario?: number
          tipo?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: []
      }
      nfe: {
        Row: {
          data_emissao: string | null
          id_lancamento: number
          id_nfe: number
          numero: string | null
          serie: string | null
          valor: number | null
          xml: string | null
        }
        Insert: {
          data_emissao?: string | null
          id_lancamento: number
          id_nfe?: number
          numero?: string | null
          serie?: string | null
          valor?: number | null
          xml?: string | null
        }
        Update: {
          data_emissao?: string | null
          id_lancamento?: number
          id_nfe?: number
          numero?: string | null
          serie?: string | null
          valor?: number | null
          xml?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfe_id_lancamento_fkey"
            columns: ["id_lancamento"]
            isOneToOne: false
            referencedRelation: "lancamento"
            referencedColumns: ["id_lancamento"]
          },
          {
            foreignKeyName: "nfe_lancamento_fk"
            columns: ["id_lancamento"]
            isOneToOne: false
            referencedRelation: "lancamento"
            referencedColumns: ["id_lancamento"]
          },
        ]
      }
      relatorio: {
        Row: {
          formato: string | null
          id_relatorio: number
          id_usuario: number
          periodo: string | null
          tipo: string | null
        }
        Insert: {
          formato?: string | null
          id_relatorio?: number
          id_usuario: number
          periodo?: string | null
          tipo?: string | null
        }
        Update: {
          formato?: string | null
          id_relatorio?: number
          id_usuario?: number
          periodo?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relatorio_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuario: {
        Row: {
          auth_id: string | null
          created_at: string | null
          email: string
          id_usuario: number
          login: string
          nome: string
          perfil: string | null
          senha: string
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          created_at?: string | null
          email: string
          id_usuario?: number
          login: string
          nome: string
          perfil?: string | null
          senha: string
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          created_at?: string | null
          email?: string
          id_usuario?: number
          login?: string
          nome?: string
          perfil?: string | null
          senha?: string
          updated_at?: string | null
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
    }
    Enums: {
      app_role: "admin" | "user" | "analista" | "caixa" | "contador"
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
      app_role: ["admin", "user", "analista", "caixa", "contador"],
    },
  },
} as const
