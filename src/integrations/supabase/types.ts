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
      addresses: {
        Row: {
          ad_soyad: string
          adres: string
          baslik: string
          created_at: string
          id: string
          ilce: string | null
          is_default: boolean
          mahalle: string | null
          posta_kodu: string | null
          sehir: string | null
          telefon: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_soyad: string
          adres: string
          baslik: string
          created_at?: string
          id?: string
          ilce?: string | null
          is_default?: boolean
          mahalle?: string | null
          posta_kodu?: string | null
          sehir?: string | null
          telefon: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_soyad?: string
          adres?: string
          baslik?: string
          created_at?: string
          id?: string
          ilce?: string | null
          is_default?: boolean
          mahalle?: string | null
          posta_kodu?: string | null
          sehir?: string | null
          telefon?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          aktif: boolean
          created_at: string
          id: string
          metin: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          id?: string
          metin: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          id?: string
          metin?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort?: number
        }
        Relationships: []
      }
      custom_scripts: {
        Row: {
          ad: string
          aktif: boolean
          created_at: string
          icerik: string
          id: string
          konum: string
          sira: number
          updated_at: string
        }
        Insert: {
          ad: string
          aktif?: boolean
          created_at?: string
          icerik?: string
          id?: string
          konum?: string
          sira?: number
          updated_at?: string
        }
        Update: {
          ad?: string
          aktif?: boolean
          created_at?: string
          icerik?: string
          id?: string
          konum?: string
          sira?: number
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          aktif: boolean
          id: string
          label: string
          sira: number
          url: string
        }
        Insert: {
          aktif?: boolean
          id?: string
          label: string
          sira?: number
          url: string
        }
        Update: {
          aktif?: boolean
          id?: string
          label?: string
          sira?: number
          url?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          adet: number
          birim_fiyat: number
          id: string
          order_id: string
          product_id: string | null
          urun_adi_snapshot: string
        }
        Insert: {
          adet: number
          birim_fiyat: number
          id?: string
          order_id: string
          product_id?: string | null
          urun_adi_snapshot: string
        }
        Update: {
          adet?: number
          birim_fiyat?: number
          id?: string
          order_id?: string
          product_id?: string | null
          urun_adi_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          ad_soyad: string
          adres: string
          created_at: string
          durum: string
          email: string
          id: string
          ilce: string | null
          mahalle: string | null
          notlar: string | null
          odeme_tipi: string
          posta_kodu: string | null
          sehir: string | null
          telefon: string
          toplam: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ad_soyad: string
          adres: string
          created_at?: string
          durum?: string
          email: string
          id?: string
          ilce?: string | null
          mahalle?: string | null
          notlar?: string | null
          odeme_tipi: string
          posta_kodu?: string | null
          sehir?: string | null
          telefon: string
          toplam?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ad_soyad?: string
          adres?: string
          created_at?: string
          durum?: string
          email?: string
          id?: string
          ilce?: string | null
          mahalle?: string | null
          notlar?: string | null
          odeme_tipi?: string
          posta_kodu?: string | null
          sehir?: string | null
          telefon?: string
          toplam?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pages: {
        Row: {
          aktif: boolean
          content: string | null
          id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          aktif?: boolean
          content?: string | null
          id?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          aktif?: boolean
          content?: string | null
          id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_attributes: {
        Row: {
          ad: string
          created_at: string
          degerler: string[]
          filterable: boolean
          id: string
          show_in_detail: boolean
          sira: number
          slug: string
          updated_at: string
        }
        Insert: {
          ad: string
          created_at?: string
          degerler?: string[]
          filterable?: boolean
          id?: string
          show_in_detail?: boolean
          sira?: number
          slug: string
          updated_at?: string
        }
        Update: {
          ad?: string
          created_at?: string
          degerler?: string[]
          filterable?: boolean
          id?: string
          show_in_detail?: boolean
          sira?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          aciklama: string | null
          aktif: boolean
          alis_fiyati: number
          barkod: string | null
          created_at: string
          etiketler: string[]
          id: string
          kategori_id: string | null
          liste_fiyati: number
          marka_id: string | null
          model_kodu: string | null
          ozellikler: Json
          resimler: string[]
          satis_fiyati: number
          slug: string
          stok_adedi: number
          stok_kodu: string
          updated_at: string
          urun_adi: string
          variant_group_id: string | null
        }
        Insert: {
          aciklama?: string | null
          aktif?: boolean
          alis_fiyati?: number
          barkod?: string | null
          created_at?: string
          etiketler?: string[]
          id?: string
          kategori_id?: string | null
          liste_fiyati?: number
          marka_id?: string | null
          model_kodu?: string | null
          ozellikler?: Json
          resimler?: string[]
          satis_fiyati?: number
          slug: string
          stok_adedi?: number
          stok_kodu: string
          updated_at?: string
          urun_adi: string
          variant_group_id?: string | null
        }
        Update: {
          aciklama?: string | null
          aktif?: boolean
          alis_fiyati?: number
          barkod?: string | null
          created_at?: string
          etiketler?: string[]
          id?: string
          kategori_id?: string | null
          liste_fiyati?: number
          marka_id?: string | null
          model_kodu?: string | null
          ozellikler?: Json
          resimler?: string[]
          satis_fiyati?: number
          slug?: string
          stok_adedi?: number
          stok_kodu?: string
          updated_at?: string
          urun_adi?: string
          variant_group_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_kategori_id_fkey"
            columns: ["kategori_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_marka_id_fkey"
            columns: ["marka_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      showcase_items: {
        Row: {
          id: string
          product_id: string
          sira: number
        }
        Insert: {
          id?: string
          product_id: string
          sira?: number
        }
        Update: {
          id?: string
          product_id?: string
          sira?: number
        }
        Relationships: [
          {
            foreignKeyName: "showcase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          favicon_url: string | null
          id: number
          logo_max_width: number
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          favicon_url?: string | null
          id?: number
          logo_max_width?: number
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          favicon_url?: string | null
          id?: number
          logo_max_width?: number
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sliders: {
        Row: {
          aktif: boolean
          alt_baslik: string | null
          baslik: string | null
          buton_link: string | null
          buton_yazi: string | null
          created_at: string
          gorsel: string
          id: string
          show_desktop: boolean
          show_mobile: boolean
          show_tablet: boolean
          sira: number
        }
        Insert: {
          aktif?: boolean
          alt_baslik?: string | null
          baslik?: string | null
          buton_link?: string | null
          buton_yazi?: string | null
          created_at?: string
          gorsel: string
          id?: string
          show_desktop?: boolean
          show_mobile?: boolean
          show_tablet?: boolean
          sira?: number
        }
        Update: {
          aktif?: boolean
          alt_baslik?: string | null
          baslik?: string | null
          buton_link?: string | null
          buton_yazi?: string | null
          created_at?: string
          gorsel?: string
          id?: string
          show_desktop?: boolean
          show_mobile?: boolean
          show_tablet?: boolean
          sira?: number
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_attribute_rename: {
        Args: { new_key: string; old_keys: string[]; value_map: Json }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
