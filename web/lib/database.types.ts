
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "class_events": {
                  Row: {
                    "context_t_start": number | null,"context_transcript": string | null,"created_at": string,"id": string,"lemma": string | null,"session_id": string,"student_id": string,"t_sec": number,"type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "context_t_start"?: number | null,"context_transcript"?: string | null,"created_at"?: string,"id"?: string,"lemma"?: string | null,"session_id": string,"student_id": string,"t_sec": number,"type": string
                  }
                  Update: {
                    "context_t_start"?: number | null,"context_transcript"?: string | null,"created_at"?: string,"id"?: string,"lemma"?: string | null,"session_id"?: string,"student_id"?: string,"t_sec"?: number,"type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "class_events_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "class_sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "class_events_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"class_sessions": {
                  Row: {
                    "id": string,"lesson_id": string,"started_at": string,"student_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"lesson_id": string,"started_at"?: string,"student_id": string
                  }
                  Update: {
                    "id"?: string,"lesson_id"?: string,"started_at"?: string,"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "class_sessions_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: false
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "class_sessions_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"clip_marks": {
                  Row: {
                    "clip_id": string,"created_at": string,"lemma": string | null,"student_id": string,"word": string
                  }
                  ComputedFields: never
                  Insert: {
                    "clip_id": string,"created_at"?: string,"lemma"?: string | null,"student_id": string,"word": string
                  }
                  Update: {
                    "clip_id"?: string,"created_at"?: string,"lemma"?: string | null,"student_id"?: string,"word"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "clip_marks_clip_id_fkey"
      columns: ["clip_id"]
isOneToOne: false
      referencedRelation: "clips"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "clip_marks_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"clips": {
                  Row: {
                    "audio_path": string | null,"created_at": string,"id": string,"kind": string,"lemma": string | null,"session_id": string,"student_id": string,"t_end": number,"t_start": number,"transcript": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "audio_path"?: string | null,"created_at"?: string,"id"?: string,"kind"?: string,"lemma"?: string | null,"session_id": string,"student_id": string,"t_end": number,"t_start": number,"transcript"?: string | null
                  }
                  Update: {
                    "audio_path"?: string | null,"created_at"?: string,"id"?: string,"kind"?: string,"lemma"?: string | null,"session_id"?: string,"student_id"?: string,"t_end"?: number,"t_start"?: number,"transcript"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "clips_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "class_sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "clips_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"lesson_lost_summaries": {
                  Row: {
                    "concepts": NonNullable<Json>,"created_at": string,"lesson_id": string,"lost_count": number
                  }
                  ComputedFields: never
                  Insert: {
                    "concepts"?: NonNullable<Json>,"created_at"?: string,"lesson_id": string,"lost_count": number
                  }
                  Update: {
                    "concepts"?: NonNullable<Json>,"created_at"?: string,"lesson_id"?: string,"lost_count"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "lesson_lost_summaries_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: true
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    }
                  ]
                },"lesson_terms": {
                  Row: {
                    "definition_fr": string | null,"forms": (string)[],"id": string,"key_phrase": string | null,"lemma": string,"lesson_id": string,"translation_es": string | null,"transparent": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "definition_fr"?: string | null,"forms": (string)[],"id"?: string,"key_phrase"?: string | null,"lemma": string,"lesson_id": string,"translation_es"?: string | null,"transparent": boolean
                  }
                  Update: {
                    "definition_fr"?: string | null,"forms"?: (string)[],"id"?: string,"key_phrase"?: string | null,"lemma"?: string,"lesson_id"?: string,"translation_es"?: string | null,"transparent"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "lesson_terms_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: false
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    }
                  ]
                },"lessons": {
                  Row: {
                    "created_at": string,"id": string,"lesson_date": string | null,"source_text": string | null,"subject": string | null,"teacher_id": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"lesson_date"?: string | null,"source_text"?: string | null,"subject"?: string | null,"teacher_id": string,"title": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"lesson_date"?: string | null,"source_text"?: string | null,"subject"?: string | null,"teacher_id"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lessons_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"mark_level_changes": {
                  Row: {
                    "created_at": string,"lemma": string,"level_delta": number,"session_id": string,"student_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"lemma": string,"level_delta": number,"session_id": string,"student_id": string
                  }
                  Update: {
                    "created_at"?: string,"lemma"?: string,"level_delta"?: number,"session_id"?: string,"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "mark_level_changes_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "class_sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mark_level_changes_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"practice_results": {
                  Row: {
                    "clip_id": string | null,"created_at": string,"id": string,"lemma": string,"passed": boolean,"student_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "clip_id"?: string | null,"created_at"?: string,"id"?: string,"lemma": string,"passed": boolean,"student_id": string
                  }
                  Update: {
                    "clip_id"?: string | null,"created_at"?: string,"id"?: string,"lemma"?: string,"passed"?: boolean,"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "practice_results_clip_id_fkey"
      columns: ["clip_id"]
isOneToOne: false
      referencedRelation: "clips"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "practice_results_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string | null,"id": string,"l1": string,"level": string,"role": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name"?: string | null,"id": string,"l1"?: string,"level"?: string,"role"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string | null,"id"?: string,"l1"?: string,"level"?: string,"role"?: string
                  }
                  Relationships: [
                    
                  ]
                },"word_mastery": {
                  Row: {
                    "last_seen_at": string | null,"lemma": string,"level": number,"student_id": string,"times_tapped": number
                  }
                  ComputedFields: never
                  Insert: {
                    "last_seen_at"?: string | null,"lemma": string,"level": number,"student_id": string,"times_tapped"?: number
                  }
                  Update: {
                    "last_seen_at"?: string | null,"lemma"?: string,"level"?: number,"student_id"?: string,"times_tapped"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "word_mastery_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"word_states_log": {
                  Row: {
                    "lemma": string,"session_id": string,"state": string,"student_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "lemma": string,"session_id": string,"state": string,"student_id": string
                  }
                  Update: {
                    "lemma"?: string,"session_id"?: string,"state"?: string,"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "word_states_log_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "class_sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "word_states_log_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "is_session_teacher":
{ Args: { "p_session_id": string }; Returns: boolean
                           },
"is_teacher":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
