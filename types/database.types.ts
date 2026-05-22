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
      session_import_job_items: {
        Row: {
          created_at: string;
          detected_session_type: string | null;
          driver_name: string;
          error_code: string | null;
          error_message: string | null;
          id: string;
          imported_session_id: string | null;
          job_id: string;
          owner_user_id: string;
          processed_at: string | null;
          session_name: string;
          source_file_size_bytes: number | null;
          source_file_hash: string;
          source_file_name: string | null;
          source_mime_type: string | null;
          storage_bucket: string;
          storage_path: string | null;
          status: string;
          xml_content: string | null;
        };
        Insert: {
          created_at?: string;
          detected_session_type?: string | null;
          driver_name: string;
          error_code?: string | null;
          error_message?: string | null;
          id?: string;
          imported_session_id?: string | null;
          job_id: string;
          owner_user_id: string;
          processed_at?: string | null;
          session_name: string;
          source_file_size_bytes?: number | null;
          source_file_hash: string;
          source_file_name?: string | null;
          source_mime_type?: string | null;
          storage_bucket?: string;
          storage_path?: string | null;
          status?: string;
          xml_content?: string | null;
        };
        Update: {
          created_at?: string;
          detected_session_type?: string | null;
          driver_name?: string;
          error_code?: string | null;
          error_message?: string | null;
          id?: string;
          imported_session_id?: string | null;
          job_id?: string;
          owner_user_id?: string;
          processed_at?: string | null;
          session_name?: string;
          source_file_size_bytes?: number | null;
          source_file_hash?: string;
          source_file_name?: string | null;
          source_mime_type?: string | null;
          storage_bucket?: string;
          storage_path?: string | null;
          status?: string;
          xml_content?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'session_import_job_items_imported_session_id_fkey';
            columns: ['imported_session_id'];
            isOneToOne: false;
            referencedRelation: 'setup_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'session_import_job_items_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'session_import_jobs';
            referencedColumns: ['id'];
          },
        ];
      };
      session_import_jobs: {
        Row: {
          completed_at: string | null;
          completed_count: number;
          created_at: string;
          duplicate_count: number;
          failed_count: number;
          filtered_count: number;
          id: string;
          invalid_count: number;
          notification_payload: Json;
          notification_status: string;
          notified_at: string | null;
          owner_user_id: string;
          processing_count: number;
          queued_count: number;
          session_type_filter: string;
          started_at: string | null;
          status: string;
          total_count: number;
        };
        Insert: {
          completed_at?: string | null;
          completed_count?: number;
          created_at?: string;
          duplicate_count?: number;
          failed_count?: number;
          filtered_count?: number;
          id?: string;
          invalid_count?: number;
          notification_payload?: Json;
          notification_status?: string;
          notified_at?: string | null;
          owner_user_id: string;
          processing_count?: number;
          queued_count?: number;
          session_type_filter?: string;
          started_at?: string | null;
          status?: string;
          total_count?: number;
        };
        Update: {
          completed_at?: string | null;
          completed_count?: number;
          created_at?: string;
          duplicate_count?: number;
          failed_count?: number;
          filtered_count?: number;
          id?: string;
          invalid_count?: number;
          notification_payload?: Json;
          notification_status?: string;
          notified_at?: string | null;
          owner_user_id?: string;
          processing_count?: number;
          queued_count?: number;
          session_type_filter?: string;
          started_at?: string | null;
          status?: string;
          total_count?: number;
        };
        Relationships: [];
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
      setup_session_laps: {
        Row: {
          created_at: string;
          elapsed_time_seconds: number | null;
          front_compound: string | null;
          fuel_remaining: number | null;
          fuel_used: number | null;
          id: string;
          is_valid_lap: boolean;
          lap_number: number;
          lap_time_seconds: number | null;
          pit_flag: boolean;
          rear_compound: string | null;
          running_position: number | null;
          sector_1_seconds: number | null;
          sector_2_seconds: number | null;
          sector_3_seconds: number | null;
          session_id: string;
          tire_fl_compound: string | null;
          tire_fr_compound: string | null;
          tire_rl_compound: string | null;
          tire_rr_compound: string | null;
          tire_wear_fl: number | null;
          tire_wear_fr: number | null;
          tire_wear_rl: number | null;
          tire_wear_rr: number | null;
          top_speed_kph: number | null;
          virtual_energy_remaining: number | null;
          virtual_energy_used: number | null;
        };
        Insert: {
          created_at?: string;
          elapsed_time_seconds?: number | null;
          front_compound?: string | null;
          fuel_remaining?: number | null;
          fuel_used?: number | null;
          id?: string;
          is_valid_lap?: boolean;
          lap_number: number;
          lap_time_seconds?: number | null;
          pit_flag?: boolean;
          rear_compound?: string | null;
          running_position?: number | null;
          sector_1_seconds?: number | null;
          sector_2_seconds?: number | null;
          sector_3_seconds?: number | null;
          session_id: string;
          tire_fl_compound?: string | null;
          tire_fr_compound?: string | null;
          tire_rl_compound?: string | null;
          tire_rr_compound?: string | null;
          tire_wear_fl?: number | null;
          tire_wear_fr?: number | null;
          tire_wear_rl?: number | null;
          tire_wear_rr?: number | null;
          top_speed_kph?: number | null;
          virtual_energy_remaining?: number | null;
          virtual_energy_used?: number | null;
        };
        Update: {
          created_at?: string;
          elapsed_time_seconds?: number | null;
          front_compound?: string | null;
          fuel_remaining?: number | null;
          fuel_used?: number | null;
          id?: string;
          is_valid_lap?: boolean;
          lap_number?: number;
          lap_time_seconds?: number | null;
          pit_flag?: boolean;
          rear_compound?: string | null;
          running_position?: number | null;
          sector_1_seconds?: number | null;
          sector_2_seconds?: number | null;
          sector_3_seconds?: number | null;
          session_id?: string;
          tire_fl_compound?: string | null;
          tire_fr_compound?: string | null;
          tire_rl_compound?: string | null;
          tire_rr_compound?: string | null;
          tire_wear_fl?: number | null;
          tire_wear_fr?: number | null;
          tire_wear_rl?: number | null;
          tire_wear_rr?: number | null;
          top_speed_kph?: number | null;
          virtual_energy_remaining?: number | null;
          virtual_energy_used?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'setup_session_laps_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'setup_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      setup_sessions: {
        Row: {
          average_fuel_used_per_lap: number | null;
          average_lap_ms: number | null;
          best_lap_seconds: number | null;
          best_three_lap_average_ms: number | null;
          car_class: string | null;
          car_number: string | null;
          car_type: string | null;
          category: string | null;
          class_finish_pos: number | null;
          class_grid_pos: number | null;
          connected: boolean | null;
          control_and_aids: string | null;
          control_and_aids_end_lap: number | null;
          control_and_aids_start_lap: number | null;
          created_at: string;
          damage_mult: number | null;
          dnf_reason: string | null;
          driver_name: string | null;
          finish_pos: number | null;
          finish_status: string | null;
          finish_time_seconds: number | null;
          fixed_setups: boolean | null;
          fixed_upgrades: boolean | null;
          free_settings: number | null;
          fuel_max_per_lap: number | null;
          fuel_min_per_lap: number | null;
          fuel_mult: number | null;
          front_compound: string | null;
          front_rear_wear_ratio: number | null;
          game_version: string | null;
          grid_pos: number | null;
          id: string;
          imported_at: string;
          incidents_count: number;
          insights: string[] | null;
          is_player: boolean | null;
          lap_consistency_ms: number | null;
          lap_rank_including_discos: number | null;
          laps_completed: number | null;
          last_three_lap_average_ms: number | null;
          left_right_wear_ratio: number | null;
          mech_fail_rate: number | null;
          optimal_lap_ms: number | null;
          owner_user_id: string;
          pace_fade_ms: number | null;
          parc_ferme: number | null;
          penalties_count: number;
          peak_top_speed_kph: number | null;
          pitstops: number | null;
          projected_fuel_20_minutes: number | null;
          projected_fuel_30_minutes: number | null;
          projected_fuel_45_minutes: number | null;
          race_laps: number | null;
          race_time_minutes: number | null;
          raw_payload: Json;
          rear_compound: string | null;
          server_name: string | null;
          server_scored: boolean | null;
          session_datetime: string | null;
          session_type: string | null;
          setup_id: string | null;
          source_file_hash: string | null;
          source_file_name: string | null;
          source_type: string;
          team_name: string | null;
          tire_drop_front: number | null;
          tire_drop_front_per_lap: number | null;
          tire_drop_rear: number | null;
          tire_drop_rear_per_lap: number | null;
          tire_mult: number | null;
          tire_warmers: boolean | null;
          track_course: string | null;
          track_event: string | null;
          track_layout_path: string | null;
          track_length_m: number | null;
          track_limits_count: number;
          track_venue: string | null;
          upgrade_code: string | null;
          valid_lap_count: number | null;
          valid_lap_rate: number | null;
          veh_file: string | null;
          veh_name: string | null;
          vehicles_allowed: string | null;
        };
        Insert: {
          average_fuel_used_per_lap?: number | null;
          average_lap_ms?: number | null;
          best_lap_seconds?: number | null;
          best_three_lap_average_ms?: number | null;
          car_class?: string | null;
          car_number?: string | null;
          car_type?: string | null;
          category?: string | null;
          class_finish_pos?: number | null;
          class_grid_pos?: number | null;
          connected?: boolean | null;
          control_and_aids?: string | null;
          control_and_aids_end_lap?: number | null;
          control_and_aids_start_lap?: number | null;
          created_at?: string;
          damage_mult?: number | null;
          dnf_reason?: string | null;
          driver_name?: string | null;
          finish_pos?: number | null;
          finish_status?: string | null;
          finish_time_seconds?: number | null;
          fixed_setups?: boolean | null;
          fixed_upgrades?: boolean | null;
          free_settings?: number | null;
          fuel_max_per_lap?: number | null;
          fuel_min_per_lap?: number | null;
          fuel_mult?: number | null;
          front_compound?: string | null;
          front_rear_wear_ratio?: number | null;
          game_version?: string | null;
          grid_pos?: number | null;
          id?: string;
          imported_at?: string;
          incidents_count?: number;
          insights?: string[] | null;
          is_player?: boolean | null;
          lap_consistency_ms?: number | null;
          lap_rank_including_discos?: number | null;
          laps_completed?: number | null;
          last_three_lap_average_ms?: number | null;
          left_right_wear_ratio?: number | null;
          mech_fail_rate?: number | null;
          optimal_lap_ms?: number | null;
          owner_user_id: string;
          pace_fade_ms?: number | null;
          parc_ferme?: number | null;
          penalties_count?: number;
          peak_top_speed_kph?: number | null;
          pitstops?: number | null;
          projected_fuel_20_minutes?: number | null;
          projected_fuel_30_minutes?: number | null;
          projected_fuel_45_minutes?: number | null;
          race_laps?: number | null;
          race_time_minutes?: number | null;
          raw_payload?: Json;
          rear_compound?: string | null;
          server_name?: string | null;
          server_scored?: boolean | null;
          session_datetime?: string | null;
          session_type?: string | null;
          setup_id?: string | null;
          source_file_hash?: string | null;
          source_file_name?: string | null;
          source_type?: string;
          team_name?: string | null;
          tire_drop_front?: number | null;
          tire_drop_front_per_lap?: number | null;
          tire_drop_rear?: number | null;
          tire_drop_rear_per_lap?: number | null;
          tire_mult?: number | null;
          tire_warmers?: boolean | null;
          track_course?: string | null;
          track_event?: string | null;
          track_layout_path?: string | null;
          track_length_m?: number | null;
          track_limits_count?: number;
          track_venue?: string | null;
          upgrade_code?: string | null;
          valid_lap_count?: number | null;
          valid_lap_rate?: number | null;
          veh_file?: string | null;
          veh_name?: string | null;
          vehicles_allowed?: string | null;
        };
        Update: {
          average_fuel_used_per_lap?: number | null;
          average_lap_ms?: number | null;
          best_lap_seconds?: number | null;
          best_three_lap_average_ms?: number | null;
          car_class?: string | null;
          car_number?: string | null;
          car_type?: string | null;
          category?: string | null;
          class_finish_pos?: number | null;
          class_grid_pos?: number | null;
          connected?: boolean | null;
          control_and_aids?: string | null;
          control_and_aids_end_lap?: number | null;
          control_and_aids_start_lap?: number | null;
          created_at?: string;
          damage_mult?: number | null;
          dnf_reason?: string | null;
          driver_name?: string | null;
          finish_pos?: number | null;
          finish_status?: string | null;
          finish_time_seconds?: number | null;
          fixed_setups?: boolean | null;
          fixed_upgrades?: boolean | null;
          free_settings?: number | null;
          fuel_max_per_lap?: number | null;
          fuel_min_per_lap?: number | null;
          fuel_mult?: number | null;
          front_compound?: string | null;
          front_rear_wear_ratio?: number | null;
          game_version?: string | null;
          grid_pos?: number | null;
          id?: string;
          imported_at?: string;
          incidents_count?: number;
          insights?: string[] | null;
          is_player?: boolean | null;
          lap_consistency_ms?: number | null;
          lap_rank_including_discos?: number | null;
          laps_completed?: number | null;
          last_three_lap_average_ms?: number | null;
          left_right_wear_ratio?: number | null;
          mech_fail_rate?: number | null;
          optimal_lap_ms?: number | null;
          owner_user_id?: string;
          pace_fade_ms?: number | null;
          parc_ferme?: number | null;
          penalties_count?: number;
          peak_top_speed_kph?: number | null;
          pitstops?: number | null;
          projected_fuel_20_minutes?: number | null;
          projected_fuel_30_minutes?: number | null;
          projected_fuel_45_minutes?: number | null;
          race_laps?: number | null;
          race_time_minutes?: number | null;
          raw_payload?: Json;
          rear_compound?: string | null;
          server_name?: string | null;
          server_scored?: boolean | null;
          session_datetime?: string | null;
          session_type?: string | null;
          setup_id?: string | null;
          source_file_hash?: string | null;
          source_file_name?: string | null;
          source_type?: string;
          team_name?: string | null;
          tire_drop_front?: number | null;
          tire_drop_front_per_lap?: number | null;
          tire_drop_rear?: number | null;
          tire_drop_rear_per_lap?: number | null;
          tire_mult?: number | null;
          tire_warmers?: boolean | null;
          track_course?: string | null;
          track_event?: string | null;
          track_layout_path?: string | null;
          track_length_m?: number | null;
          track_limits_count?: number;
          track_venue?: string | null;
          upgrade_code?: string | null;
          valid_lap_count?: number | null;
          valid_lap_rate?: number | null;
          veh_file?: string | null;
          veh_name?: string | null;
          vehicles_allowed?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'setup_sessions_setup_id_fkey';
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
          avg_fuel_used_per_lap: number | null;
          avg_position_gain: number | null;
          avg_tire_drop_front: number | null;
          avg_tire_drop_rear: number | null;
          best_lap_ms: number | null;
          best_validated_lap_ms: number | null;
          brake_bias: number | null;
          car_id: string;
          confidence_score: number | null;
          consistency_score: number | null;
          created_at: string;
          fuel_data: Json;
          id: string;
          last_validated_at: string | null;
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
          validation_sessions_count: number;
          visibility: Database['public']['Enums']['setup_visibility'];
          weather_summary: string | null;
        };
        Insert: {
          abs?: number | null;
          avg_fuel_used_per_lap?: number | null;
          avg_position_gain?: number | null;
          avg_tire_drop_front?: number | null;
          avg_tire_drop_rear?: number | null;
          best_lap_ms?: number | null;
          best_validated_lap_ms?: number | null;
          brake_bias?: number | null;
          car_id: string;
          confidence_score?: number | null;
          consistency_score?: number | null;
          created_at?: string;
          fuel_data?: Json;
          id?: string;
          last_validated_at?: string | null;
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
          validation_sessions_count?: number;
          visibility?: Database['public']['Enums']['setup_visibility'];
          weather_summary?: string | null;
        };
        Update: {
          abs?: number | null;
          avg_fuel_used_per_lap?: number | null;
          avg_position_gain?: number | null;
          avg_tire_drop_front?: number | null;
          avg_tire_drop_rear?: number | null;
          best_lap_ms?: number | null;
          best_validated_lap_ms?: number | null;
          brake_bias?: number | null;
          car_id?: string;
          confidence_score?: number | null;
          consistency_score?: number | null;
          created_at?: string;
          fuel_data?: Json;
          id?: string;
          last_validated_at?: string | null;
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
          validation_sessions_count?: number;
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
