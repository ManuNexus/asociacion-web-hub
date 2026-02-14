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
      ahora_tv: {
        Row: {
          activo: boolean
          created_at: string
          created_by: string | null
          descripcion: string | null
          destacado: boolean
          en_directo: boolean
          id: string
          tipo: string
          titulo: string
          updated_at: string
          youtube_url: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          destacado?: boolean
          en_directo?: boolean
          id?: string
          tipo?: string
          titulo: string
          updated_at?: string
          youtube_url: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          destacado?: boolean
          en_directo?: boolean
          id?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          youtube_url?: string
        }
        Relationships: []
      }
      analytics_snapshots: {
        Row: {
          created_at: string
          fecha: string
          id: string
          pageviews: number
          visitors: number
        }
        Insert: {
          created_at?: string
          fecha: string
          id?: string
          pageviews?: number
          visitors?: number
        }
        Update: {
          created_at?: string
          fecha?: string
          id?: string
          pageviews?: number
          visitors?: number
        }
        Relationships: []
      }
      analytics_summary: {
        Row: {
          avg_pageviews_per_visit: number
          avg_session_duration: number
          id: string
          last_updated: string
          total_pageviews: number
          total_visitors: number
        }
        Insert: {
          avg_pageviews_per_visit?: number
          avg_session_duration?: number
          id?: string
          last_updated?: string
          total_pageviews?: number
          total_visitors?: number
        }
        Update: {
          avg_pageviews_per_visit?: number
          avg_session_duration?: number
          id?: string
          last_updated?: string
          total_pageviews?: number
          total_visitors?: number
        }
        Relationships: []
      }
      calendario_junta: {
        Row: {
          created_at: string
          created_by: string | null
          descripcion: string | null
          fecha: string
          fecha_fin: string | null
          id: string
          roles: Database["public"]["Enums"]["cargo_junta"][] | null
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          fecha: string
          fecha_fin?: string | null
          id?: string
          roles?: Database["public"]["Enums"]["cargo_junta"][] | null
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          fecha?: string
          fecha_fin?: string | null
          id?: string
          roles?: Database["public"]["Enums"]["cargo_junta"][] | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      categorias_contabilidad: {
        Row: {
          color: string | null
          created_at: string
          id: string
          nombre: string
          tipo: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          nombre: string
          tipo: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          nombre?: string
          tipo?: string
        }
        Relationships: []
      }
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
      cobros_cuotas: {
        Row: {
          created_at: string
          estado: string
          fecha_cobro: string | null
          id: string
          importe: number
          notas: string | null
          periodo_fin: string
          periodo_inicio: string
          socio_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: string
          fecha_cobro?: string | null
          id?: string
          importe: number
          notas?: string | null
          periodo_fin: string
          periodo_inicio: string
          socio_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: string
          fecha_cobro?: string | null
          id?: string
          importe?: number
          notas?: string | null
          periodo_fin?: string
          periodo_inicio?: string
          socio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cobros_cuotas_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      contactos_directorio: {
        Row: {
          created_at: string
          created_by: string | null
          direccion: string | null
          email: string | null
          id: string
          nombre: string
          notas: string | null
          organizacion: string
          responsable_socio_id: string | null
          telefono: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          nombre: string
          notas?: string | null
          organizacion: string
          responsable_socio_id?: string | null
          telefono?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          organizacion?: string
          responsable_socio_id?: string | null
          telefono?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contactos_directorio_responsable_socio_id_fkey"
            columns: ["responsable_socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_internos: {
        Row: {
          archivo_url: string
          categoria: string | null
          created_at: string
          descripcion: string | null
          id: string
          solo_junta: boolean
          titulo: string
          updated_at: string
        }
        Insert: {
          archivo_url: string
          categoria?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          solo_junta?: boolean
          titulo: string
          updated_at?: string
        }
        Update: {
          archivo_url?: string
          categoria?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          solo_junta?: boolean
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
          imagen_url: string | null
          organizador: string | null
          publico: boolean
          solo_junta: boolean
          titulo: string
          ubicacion: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          fecha: string
          id?: string
          imagen_url?: string | null
          organizador?: string | null
          publico?: boolean
          solo_junta?: boolean
          titulo: string
          ubicacion?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          imagen_url?: string | null
          organizador?: string | null
          publico?: boolean
          solo_junta?: boolean
          titulo?: string
          ubicacion?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      facturas: {
        Row: {
          archivo_url: string | null
          concepto: string
          created_at: string
          created_by: string | null
          estado: string
          fecha_emision: string
          fecha_vencimiento: string | null
          id: string
          importe_base: number
          importe_iva: number | null
          importe_total: number | null
          iva_porcentaje: number | null
          notas: string | null
          numero: string
          proveedor_id: string | null
          tercero_direccion: string | null
          tercero_nif: string | null
          tercero_nombre: string
          tipo: string
          updated_at: string
        }
        Insert: {
          archivo_url?: string | null
          concepto: string
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          importe_base: number
          importe_iva?: number | null
          importe_total?: number | null
          iva_porcentaje?: number | null
          notas?: string | null
          numero: string
          proveedor_id?: string | null
          tercero_direccion?: string | null
          tercero_nif?: string | null
          tercero_nombre: string
          tipo: string
          updated_at?: string
        }
        Update: {
          archivo_url?: string | null
          concepto?: string
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          importe_base?: number
          importe_iva?: number | null
          importe_total?: number | null
          iva_porcentaje?: number | null
          notas?: string | null
          numero?: string
          proveedor_id?: string | null
          tercero_direccion?: string | null
          tercero_nif?: string | null
          tercero_nombre?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facturas_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajes_chat: {
        Row: {
          created_at: string
          es_junta: boolean
          id: string
          mensaje: string
          socio_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          es_junta?: boolean
          id?: string
          mensaje: string
          socio_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          es_junta?: boolean
          id?: string
          mensaje?: string
          socio_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_chat_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      noticias: {
        Row: {
          autor: string | null
          autor_socio_id: string | null
          categoria_id: string | null
          contenido: string | null
          created_at: string
          extracto: string | null
          fecha_publicacion: string | null
          fecha_publicacion_programada: string | null
          id: string
          imagen_url: string | null
          publicada: boolean
          solo_socios: boolean
          titulo: string
          updated_at: string
        }
        Insert: {
          autor?: string | null
          autor_socio_id?: string | null
          categoria_id?: string | null
          contenido?: string | null
          created_at?: string
          extracto?: string | null
          fecha_publicacion?: string | null
          fecha_publicacion_programada?: string | null
          id?: string
          imagen_url?: string | null
          publicada?: boolean
          solo_socios?: boolean
          titulo: string
          updated_at?: string
        }
        Update: {
          autor?: string | null
          autor_socio_id?: string | null
          categoria_id?: string | null
          contenido?: string | null
          created_at?: string
          extracto?: string | null
          fecha_publicacion?: string | null
          fecha_publicacion_programada?: string | null
          id?: string
          imagen_url?: string | null
          publicada?: boolean
          solo_socios?: boolean
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "noticias_autor_socio_id_fkey"
            columns: ["autor_socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "noticias_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_noticia"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          created_at: string
          id: string
          mensaje: string
          solo_junta: boolean
          titulo: string
        }
        Insert: {
          created_at?: string
          id?: string
          mensaje: string
          solo_junta?: boolean
          titulo: string
        }
        Update: {
          created_at?: string
          id?: string
          mensaje?: string
          solo_junta?: boolean
          titulo?: string
        }
        Relationships: []
      }
      notificaciones_leidas: {
        Row: {
          id: string
          leida_at: string
          notificacion_id: string
          user_id: string
        }
        Insert: {
          id?: string
          leida_at?: string
          notificacion_id: string
          user_id: string
        }
        Update: {
          id?: string
          leida_at?: string
          notificacion_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_leidas_notificacion_id_fkey"
            columns: ["notificacion_id"]
            isOneToOne: false
            referencedRelation: "notificaciones"
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
      proveedores: {
        Row: {
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          nif: string | null
          nombre: string
          notas: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nif?: string | null
          nombre: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nif?: string | null
          nombre?: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      redes_sociales: {
        Row: {
          contrasena: string
          created_at: string
          created_by: string | null
          id: string
          nombre: string
          notas: string | null
          updated_at: string
          url: string | null
          usuario: string
        }
        Insert: {
          contrasena: string
          created_at?: string
          created_by?: string | null
          id?: string
          nombre: string
          notas?: string | null
          updated_at?: string
          url?: string | null
          usuario: string
        }
        Update: {
          contrasena?: string
          created_at?: string
          created_by?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          updated_at?: string
          url?: string | null
          usuario?: string
        }
        Relationships: []
      }
      socios: {
        Row: {
          activo: boolean
          al_corriente_pago: boolean
          apellidos: string
          cargo_junta: Database["public"]["Enums"]["cargo_junta"] | null
          ciudad: string | null
          codigo_postal: string | null
          created_at: string
          dia_cobro: number | null
          direccion: string | null
          email: string
          fecha_alta: string
          fecha_nacimiento: string | null
          fecha_primera_cuota: string | null
          foto_url: string | null
          iban: string | null
          id: string
          nombre: string
          numero_socio: string | null
          provincia: string | null
          telefono: string | null
          tipo_cuota: string
          tipo_pago: string
          titular_cuenta: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          al_corriente_pago?: boolean
          apellidos: string
          cargo_junta?: Database["public"]["Enums"]["cargo_junta"] | null
          ciudad?: string | null
          codigo_postal?: string | null
          created_at?: string
          dia_cobro?: number | null
          direccion?: string | null
          email: string
          fecha_alta?: string
          fecha_nacimiento?: string | null
          fecha_primera_cuota?: string | null
          foto_url?: string | null
          iban?: string | null
          id?: string
          nombre: string
          numero_socio?: string | null
          provincia?: string | null
          telefono?: string | null
          tipo_cuota?: string
          tipo_pago?: string
          titular_cuenta?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean
          al_corriente_pago?: boolean
          apellidos?: string
          cargo_junta?: Database["public"]["Enums"]["cargo_junta"] | null
          ciudad?: string | null
          codigo_postal?: string | null
          created_at?: string
          dia_cobro?: number | null
          direccion?: string | null
          email?: string
          fecha_alta?: string
          fecha_nacimiento?: string | null
          fecha_primera_cuota?: string | null
          foto_url?: string | null
          iban?: string | null
          id?: string
          nombre?: string
          numero_socio?: string | null
          provincia?: string | null
          telefono?: string | null
          tipo_cuota?: string
          tipo_pago?: string
          titular_cuenta?: string | null
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
          dia_cobro: number | null
          direccion: string | null
          dni: string
          email: string
          estado: string
          fecha_nacimiento: string | null
          iban: string | null
          iban_reminder_sent: boolean | null
          iban_submitted_at: string | null
          id: string
          ip_address: string | null
          motivacion: string | null
          nombre: string
          provincia: string | null
          telefono: string | null
          tipo_pago: string
          titular_cuenta: string | null
          updated_at: string
          version_documento: string | null
        }
        Insert: {
          apellidos: string
          ciudad?: string | null
          codigo_postal?: string | null
          created_at?: string
          dia_cobro?: number | null
          direccion?: string | null
          dni: string
          email: string
          estado?: string
          fecha_nacimiento?: string | null
          iban?: string | null
          iban_reminder_sent?: boolean | null
          iban_submitted_at?: string | null
          id?: string
          ip_address?: string | null
          motivacion?: string | null
          nombre: string
          provincia?: string | null
          telefono?: string | null
          tipo_pago?: string
          titular_cuenta?: string | null
          updated_at?: string
          version_documento?: string | null
        }
        Update: {
          apellidos?: string
          ciudad?: string | null
          codigo_postal?: string | null
          created_at?: string
          dia_cobro?: number | null
          direccion?: string | null
          dni?: string
          email?: string
          estado?: string
          fecha_nacimiento?: string | null
          iban?: string | null
          iban_reminder_sent?: boolean | null
          iban_submitted_at?: string | null
          id?: string
          ip_address?: string | null
          motivacion?: string | null
          nombre?: string
          provincia?: string | null
          telefono?: string | null
          tipo_pago?: string
          titular_cuenta?: string | null
          updated_at?: string
          version_documento?: string | null
        }
        Relationships: []
      }
      transacciones: {
        Row: {
          categoria_id: string | null
          concepto: string
          created_at: string
          created_by: string | null
          descripcion: string | null
          factura_id: string | null
          fecha: string
          id: string
          importe: number
          tipo: string
          updated_at: string
        }
        Insert: {
          categoria_id?: string | null
          concepto: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          factura_id?: string | null
          fecha?: string
          id?: string
          importe: number
          tipo: string
          updated_at?: string
        }
        Update: {
          categoria_id?: string | null
          concepto?: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          factura_id?: string | null
          fecha?: string
          id?: string
          importe?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transacciones_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_contabilidad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
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
      votaciones: {
        Row: {
          activa: boolean
          created_at: string
          descripcion: string | null
          fecha_fin: string
          fecha_inicio: string
          id: string
          solo_junta: boolean
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
          solo_junta?: boolean
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
          solo_junta?: boolean
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
      check_scheduled_news: { Args: never; Returns: undefined }
      get_cargo_junta_label: {
        Args: { cargo: Database["public"]["Enums"]["cargo_junta"] }
        Returns: string
      }
      get_miembros_junta: {
        Args: never
        Returns: {
          apellidos: string
          cargo_junta: Database["public"]["Enums"]["cargo_junta"]
          id: string
          nombre: string
        }[]
      }
      get_news_author: {
        Args: { author_socio_id: string }
        Returns: {
          apellidos: string
          foto_url: string
          id: string
          nombre: string
        }[]
      }
      get_socios_for_junta: {
        Args: never
        Returns: {
          activo: boolean
          al_corriente_pago: boolean
          apellidos: string
          created_at: string
          dia_cobro: number
          email: string
          fecha_alta: string
          id: string
          nombre: string
          numero_socio: string
          telefono: string
          tipo_cuota: string
          tipo_pago: string
          updated_at: string
          user_id: string
        }[]
      }
      get_vote_counts_for_votaciones: {
        Args: { votacion_ids: string[] }
        Returns: {
          opcion_id: string
          vote_count: number
        }[]
      }
      has_cargo_contable: { Args: { _user_id: string }; Returns: boolean }
      has_cargo_directivo: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "socio" | "junta"
      cargo_junta:
        | "presidente"
        | "vicepresidente"
        | "secretario"
        | "tesorero"
        | "vocal"
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
      app_role: ["admin", "user", "socio", "junta"],
      cargo_junta: [
        "presidente",
        "vicepresidente",
        "secretario",
        "tesorero",
        "vocal",
      ],
    },
  },
} as const
