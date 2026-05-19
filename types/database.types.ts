export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      car_classes: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cars: {
        Row: {
          car_class_id: string;
          created_at: string;
          game_code: string | null;
          id: string;
          manufacturer_id: string;
          name: string;
          season: string | null;
          slug: string;
          updated_at: string;
        };
        Insert: {
          car_class_id: string;
          created_at?: string;
          game_code?: string | null;
          id?: string;
          manufacturer_id: string;
          name: string;
          season?: string | null;
          slug: string;
          updated_at?: string;
        };
        Update: {
          car_class_id?: string;
          created_at?: string;
          game_code?: string | null;
          id?: string;
          manufacturer_id?: string;
          name?: string;
          season?: string | null;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cars_car_class_id_fkey';
            columns: ['car_class_id'];
            isOneToOne: false;
            referencedRelation: 'car_classes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cars_manufacturer_id_fkey';
            columns: ['manufacturer_id'];
            isOneToOne: false;
            referencedRelation: 'manufacturers';
            referencedColumns: ['id'];
          },
        ];
      };
      manufacturers: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          active_team_id: string | null;
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          email: string | null;
          first_name: string | null;
          full_name: string | null;
          id: string;
          last_name: string | null;
          preferences: Json;
          updated_at: string;
        };
        Insert: {
          active_team_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          first_name?: string | null;
          full_name?: string | null;
          id: string;
          last_name?: string | null;
          preferences?: Json;
          updated_at?: string;
        };
        Update: {
          active_team_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          first_name?: string | null;
          full_name?: string | null;
          id?: string;
          last_name?: string | null;
          preferences?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_active_team_id_fkey';
            columns: ['active_team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      setup_favorites: {
        Row: {
          created_at: string;
          setup_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          setup_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          setup_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'setup_favorites_setup_id_fkey';
            columns: ['setup_id'];
            isOneToOne: false;
            referencedRelation: 'setups';
            referencedColumns: ['id'];
          },
        ];
      };
      setups: {
        Row: {
          abs: number | null;
          best_lap_ms: number | null;
          brake_bias: number | null;
          car_id: string;
          created_at: string;
          fuel_data: Json;
          id: string;
          name: string;
          notes: string | null;
          owner_user_id: string;
          race_duration_minutes: number | null;
          search_document: unknown;
          setup_type: Database['public']['Enums']['setup_type'];
          tc: number | null;
          tc_power_cut: number | null;
          tc_slip_angle: number | null;
          team_id: string | null;
          track_id: string;
          updated_at: string;
          visibility: Database['public']['Enums']['setup_visibility'];
          weather_summary: string | null;
        };
        Insert: {
          abs?: number | null;
          best_lap_ms?: number | null;
          brake_bias?: number | null;
          car_id: string;
          created_at?: string;
          fuel_data?: Json;
          id?: string;
          name: string;
          notes?: string | null;
          owner_user_id: string;
          race_duration_minutes?: number | null;
          search_document?: unknown;
          setup_type: Database['public']['Enums']['setup_type'];
          tc?: number | null;
          tc_power_cut?: number | null;
          tc_slip_angle?: number | null;
          team_id?: string | null;
          track_id: string;
          updated_at?: string;
          visibility?: Database['public']['Enums']['setup_visibility'];
          weather_summary?: string | null;
        };
        Update: {
          abs?: number | null;
          best_lap_ms?: number | null;
          brake_bias?: number | null;
          car_id?: string;
          created_at?: string;
          fuel_data?: Json;
          id?: string;
          name?: string;
          notes?: string | null;
          owner_user_id?: string;
          race_duration_minutes?: number | null;
          search_document?: unknown;
          setup_type?: Database['public']['Enums']['setup_type'];
          tc?: number | null;
          tc_power_cut?: number | null;
          tc_slip_angle?: number | null;
          team_id?: string | null;
          track_id?: string;
          updated_at?: string;
          visibility?: Database['public']['Enums']['setup_visibility'];
          weather_summary?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'setups_car_id_fkey';
            columns: ['car_id'];
            isOneToOne: false;
            referencedRelation: 'cars';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'setups_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'setups_track_id_fkey';
            columns: ['track_id'];
            isOneToOne: false;
            referencedRelation: 'tracks';
            referencedColumns: ['id'];
          },
        ];
      };
      team_members: {
        Row: {
          created_at: string;
          joined_at: string;
          role: Database['public']['Enums']['team_role'];
          team_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          joined_at?: string;
          role?: Database['public']['Enums']['team_role'];
          team_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          joined_at?: string;
          role?: Database['public']['Enums']['team_role'];
          team_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'team_members_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      teams: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tracks: {
        Row: {
          city: string | null;
          country_code: string | null;
          created_at: string;
          id: string;
          is_dlc: boolean;
          name: string;
          official_name: string | null;
          slug: string;
          updated_at: string;
        };
        Insert: {
          city?: string | null;
          country_code?: string | null;
          created_at?: string;
          id?: string;
          is_dlc?: boolean;
          name: string;
          official_name?: string | null;
          slug: string;
          updated_at?: string;
        };
        Update: {
          city?: string | null;
          country_code?: string | null;
          created_at?: string;
          id?: string;
          is_dlc?: boolean;
          name?: string;
          official_name?: string | null;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_team_member: { Args: { target_team_id: string }; Returns: boolean };
      is_team_owner: { Args: { target_team_id: string }; Returns: boolean };
    };
    Enums: {
      setup_type: 'fixed' | 'open';
      setup_visibility: 'private' | 'team' | 'public';
      team_role: 'owner' | 'member';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      setup_type: ['fixed', 'open'],
      setup_visibility: ['private', 'team', 'public'],
      team_role: ['owner', 'member'],
    },
  },
} as const;
