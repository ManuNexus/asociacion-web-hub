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
      categorias_noticia: {
        Row: {
          color: string | null
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      documentos_internos: {
        Row: {
          archivo_url: string
          categoria: string | null
          created_at: string
          descripcion: string | null
          id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          archivo_url: string
          categoria?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          archivo_url?: string
          categoria?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      eventos: {
        Row: {
          created_at: string
          descripcion: string | null
          fecha: string
          id: string
          titulo: string
          ubicacion: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          fecha: string
          id?: string
          titulo: string
          ubicacion?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          titulo?: string
          ubicacion?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      noticias: {
        Row: {
          categoria_id: string | null
          contenido: string | null
          created_at: string
          extracto: string | null
          fecha_publicacion: string | null
          id: string
          imagen_url: string | null
          publicada: boolean
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria_id?: string | null
          contenido?: string | null
          created_at?: string
          extracto?: string | null
          fecha_publicacion?: string | null
          id?: string
          imagen_url?: string | null
          publicada?: boolean
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria_id?: string | null
          contenido?: string | null
          created_at?: string
          extracto?: string | null
          fecha_publicacion?: string | null
          id?: string
          imagen_url?: string | null
          publicada?: boolean
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "noticias_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_noticia"
            referencedColumns: ["id"]
          },
        ]
      }
      opciones_votacion: {
        Row: {
          created_at: string
          id: string
          texto: string
          votacion_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          texto: string
          votacion_id: string
        }
        Update: {
          created_at?: string
          id?: string
          texto?: string
          votacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opciones_votacion_votacion_id_fkey"
            columns: ["votacion_id"]
            isOneToOne: false
            referencedRelation: "votaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      socios: {
        Row: {
          activo: boolean
          apellidos: string
          created_at: string
          email: string
          fecha_alta: string
          id: string
          nombre: string
          numero_socio: string | null
          telefono: string | null
          tipo_cuota: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          apellidos: string
          created_at?: string
          email: string
          fecha_alta?: string
          id?: string
          nombre: string
          numero_socio?: string | null
          telefono?: string | null
          tipo_cuota?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean
          apellidos?: string
          created_at?: string
          email?: string
          fecha_alta?: string
          id?: string
          nombre?: string
          numero_socio?: string | null
          telefono?: string | null
          tipo_cuota?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      solicitudes_socio: {
        Row: {
          apellidos: string
          ciudad: string | null
          codigo_postal: string | null
          created_at: string
          direccion: string | null
          dni: string
          email: string
          estado: string
          id: string
          motivacion: string | null
          nombre: string
          provincia: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          apellidos: string
          ciudad?: string | null
          codigo_postal?: string | null
          created_at?: string
          direccion?: string | null
          dni: string
          email: string
          estado?: string
          id?: string
          motivacion?: string | null
          nombre: string
          provincia?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          apellidos?: string
          ciudad?: string | null
          codigo_postal?: string | null
          created_at?: string
          direccion?: string | null
          dni?: string
          email?: string
          estado?: string
          id?: string
          motivacion?: string | null
          nombre?: string
          provincia?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
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
      votaciones: {
        Row: {
          activa: boolean
          created_at: string
          descripcion: string | null
          fecha_fin: string
          fecha_inicio: string
          id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          activa?: boolean
          created_at?: string
          descripcion?: string | null
          fecha_fin: string
          fecha_inicio?: string
          id?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          descripcion?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      votos: {
        Row: {
          created_at: string
          id: string
          opcion_id: string
          user_id: string
          votacion_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          opcion_id: string
          user_id: string
          votacion_id: string
        }
        Update: {
          created_at?: string
          id?: string
          opcion_id?: string
          user_id?: string
          votacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votos_opcion_id_fkey"
            columns: ["opcion_id"]
            isOneToOne: false
            referencedRelation: "opciones_votacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votos_votacion_id_fkey"
            columns: ["votacion_id"]
            isOneToOne: false
            referencedRelation: "votaciones"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "user" | "socio"
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
      app_role: ["admin", "user", "socio"],
    },
  },
} as const
