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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          announcement_category: string
          announcement_content: string
          announcement_id: string
          announcement_title: string
          created_at: string
          feedback_id: string | null
          is_pinned: boolean
        }
        Insert: {
          announcement_category?: string
          announcement_content: string
          announcement_id?: string
          announcement_title: string
          created_at?: string
          feedback_id?: string | null
          is_pinned?: boolean
        }
        Update: {
          announcement_category?: string
          announcement_content?: string
          announcement_id?: string
          announcement_title?: string
          created_at?: string
          feedback_id?: string | null
          is_pinned?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "announcements_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "vetool_feedbacks"
            referencedColumns: ["feedback_id"]
          },
        ]
      }
      checkup_ai_results: {
        Row: {
          abnormal_findings: Json
          approved_at: string | null
          approved_by: string | null
          checkup_id: string
          created_at: string
          id: string
          monitoring_items: Json
          raw_ai_output: string | null
          summary: string | null
          updated_at: string
          weight_advice: string | null
        }
        Insert: {
          abnormal_findings?: Json
          approved_at?: string | null
          approved_by?: string | null
          checkup_id: string
          created_at?: string
          id?: string
          monitoring_items?: Json
          raw_ai_output?: string | null
          summary?: string | null
          updated_at?: string
          weight_advice?: string | null
        }
        Update: {
          abnormal_findings?: Json
          approved_at?: string | null
          approved_by?: string | null
          checkup_id?: string
          created_at?: string
          id?: string
          monitoring_items?: Json
          raw_ai_output?: string | null
          summary?: string | null
          updated_at?: string
          weight_advice?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkup_ai_results_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "checkup_ai_results_checkup_id_fkey"
            columns: ["checkup_id"]
            isOneToOne: true
            referencedRelation: "checkup_records"
            referencedColumns: ["id"]
          },
        ]
      }
      checkup_images: {
        Row: {
          ai_analyzed_at: string | null
          ai_confidence: number | null
          ai_description: string | null
          ai_section: string | null
          ai_tags: string[]
          caption: string | null
          checkup_id: string
          created_at: string
          created_by: string | null
          file_size: number | null
          id: string
          original_filename: string | null
          section: string | null
          sort_order: number
          tags: string[]
          url: string
        }
        Insert: {
          ai_analyzed_at?: string | null
          ai_confidence?: number | null
          ai_description?: string | null
          ai_section?: string | null
          ai_tags?: string[]
          caption?: string | null
          checkup_id: string
          created_at?: string
          created_by?: string | null
          file_size?: number | null
          id?: string
          original_filename?: string | null
          section?: string | null
          sort_order?: number
          tags?: string[]
          url: string
        }
        Update: {
          ai_analyzed_at?: string | null
          ai_confidence?: number | null
          ai_description?: string | null
          ai_section?: string | null
          ai_tags?: string[]
          caption?: string | null
          checkup_id?: string
          created_at?: string
          created_by?: string | null
          file_size?: number | null
          id?: string
          original_filename?: string | null
          section?: string | null
          sort_order?: number
          tags?: string[]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkup_images_checkup_id_fkey"
            columns: ["checkup_id"]
            isOneToOne: false
            referencedRelation: "checkup_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkup_images_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      checkup_records: {
        Row: {
          checkup_date: string
          created_at: string
          created_by: string | null
          hos_id: string
          id: string
          notes: string | null
          patient_id: string
          status: string
          sub_charts: Json
          updated_at: string
          vet_id: string | null
        }
        Insert: {
          checkup_date?: string
          created_at?: string
          created_by?: string | null
          hos_id: string
          id?: string
          notes?: string | null
          patient_id: string
          status?: string
          sub_charts?: Json
          updated_at?: string
          vet_id?: string | null
        }
        Update: {
          checkup_date?: string
          created_at?: string
          created_by?: string | null
          hos_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          status?: string
          sub_charts?: Json
          updated_at?: string
          vet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkup_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "checkup_records_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "checkup_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "checkup_records_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      checkup_sections: {
        Row: {
          checkup_id: string
          data: Json
          id: string
          section_type: string
          updated_at: string
        }
        Insert: {
          checkup_id: string
          data?: Json
          id?: string
          section_type: string
          updated_at?: string
        }
        Update: {
          checkup_id?: string
          data?: Json
          id?: string
          section_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkup_sections_checkup_id_fkey"
            columns: ["checkup_id"]
            isOneToOne: false
            referencedRelation: "checkup_records"
            referencedColumns: ["id"]
          },
        ]
      }
      cytology_charts: {
        Row: {
          ai_findings: Json | null
          ai_raw: Json | null
          chart_date: string
          created_at: string | null
          diagnosis: Json | null
          evaluator_id: string | null
          findings: Json | null
          hos_id: string
          id: string
          mode: string
          patient_id: string
          sample_info: Json | null
          sample_type: string
          summary: string | null
          tags: string | null
          updated_at: string | null
          user_tags: string | null
          vet_id: string | null
        }
        Insert: {
          ai_findings?: Json | null
          ai_raw?: Json | null
          chart_date: string
          created_at?: string | null
          diagnosis?: Json | null
          evaluator_id?: string | null
          findings?: Json | null
          hos_id: string
          id?: string
          mode?: string
          patient_id: string
          sample_info?: Json | null
          sample_type: string
          summary?: string | null
          tags?: string | null
          updated_at?: string | null
          user_tags?: string | null
          vet_id?: string | null
        }
        Update: {
          ai_findings?: Json | null
          ai_raw?: Json | null
          chart_date?: string
          created_at?: string | null
          diagnosis?: Json | null
          evaluator_id?: string | null
          findings?: Json | null
          hos_id?: string
          id?: string
          mode?: string
          patient_id?: string
          sample_info?: Json | null
          sample_type?: string
          summary?: string | null
          tags?: string | null
          updated_at?: string | null
          user_tags?: string | null
          vet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cytology_charts_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cytology_charts_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "cytology_charts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "cytology_charts_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cytology_images: {
        Row: {
          chart_id: string
          created_at: string | null
          hos_id: string | null
          id: string
          image_label: string | null
          image_url: string
          marks: Json | null
          tags: string | null
        }
        Insert: {
          chart_id: string
          created_at?: string | null
          hos_id?: string | null
          id?: string
          image_label?: string | null
          image_url: string
          marks?: Json | null
          tags?: string | null
        }
        Update: {
          chart_id?: string
          created_at?: string | null
          hos_id?: string | null
          id?: string
          image_label?: string | null
          image_url?: string
          marks?: Json | null
          tags?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cytology_images_chart_id_fkey"
            columns: ["chart_id"]
            isOneToOne: false
            referencedRelation: "cytology_charts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cytology_images_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
        ]
      }
      dental_chart_teeth: {
        Row: {
          abrasion: string | null
          attrition: string | null
          calculus: string | null
          caries: string | null
          chart_id: string
          created_at: string | null
          fracture: string | null
          furcation: string | null
          gingivitis: string | null
          hos_id: string
          id: string
          is_deciduous: boolean | null
          mobility: string | null
          periapical: string | null
          periodontal_stage: string | null
          plaque: string | null
          probing_b: number | null
          probing_db: number | null
          probing_dl: number | null
          probing_l: number | null
          probing_mb: number | null
          probing_ml: number | null
          pulp_exposure: string | null
          recession_b: string | null
          recession_db: string | null
          recession_dl: string | null
          recession_l: string | null
          recession_mb: string | null
          recession_ml: string | null
          resorption_stage: string | null
          resorption_type: string | null
          staining: string | null
          status: string | null
          supernumerary: boolean | null
          tooth_id: number
          tooth_name: string | null
          tooth_note: string | null
          treatment_done: string[] | null
          treatment_plan: string[] | null
          treatment_priority: string | null
          updated_at: string | null
          xray_finding: string | null
        }
        Insert: {
          abrasion?: string | null
          attrition?: string | null
          calculus?: string | null
          caries?: string | null
          chart_id: string
          created_at?: string | null
          fracture?: string | null
          furcation?: string | null
          gingivitis?: string | null
          hos_id: string
          id?: string
          is_deciduous?: boolean | null
          mobility?: string | null
          periapical?: string | null
          periodontal_stage?: string | null
          plaque?: string | null
          probing_b?: number | null
          probing_db?: number | null
          probing_dl?: number | null
          probing_l?: number | null
          probing_mb?: number | null
          probing_ml?: number | null
          pulp_exposure?: string | null
          recession_b?: string | null
          recession_db?: string | null
          recession_dl?: string | null
          recession_l?: string | null
          recession_mb?: string | null
          recession_ml?: string | null
          resorption_stage?: string | null
          resorption_type?: string | null
          staining?: string | null
          status?: string | null
          supernumerary?: boolean | null
          tooth_id: number
          tooth_name?: string | null
          tooth_note?: string | null
          treatment_done?: string[] | null
          treatment_plan?: string[] | null
          treatment_priority?: string | null
          updated_at?: string | null
          xray_finding?: string | null
        }
        Update: {
          abrasion?: string | null
          attrition?: string | null
          calculus?: string | null
          caries?: string | null
          chart_id?: string
          created_at?: string | null
          fracture?: string | null
          furcation?: string | null
          gingivitis?: string | null
          hos_id?: string
          id?: string
          is_deciduous?: boolean | null
          mobility?: string | null
          periapical?: string | null
          periodontal_stage?: string | null
          plaque?: string | null
          probing_b?: number | null
          probing_db?: number | null
          probing_dl?: number | null
          probing_l?: number | null
          probing_mb?: number | null
          probing_ml?: number | null
          pulp_exposure?: string | null
          recession_b?: string | null
          recession_db?: string | null
          recession_dl?: string | null
          recession_l?: string | null
          recession_mb?: string | null
          recession_ml?: string | null
          resorption_stage?: string | null
          resorption_type?: string | null
          staining?: string | null
          status?: string | null
          supernumerary?: boolean | null
          tooth_id?: number
          tooth_name?: string | null
          tooth_note?: string | null
          treatment_done?: string[] | null
          treatment_plan?: string[] | null
          treatment_priority?: string | null
          updated_at?: string | null
          xray_finding?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dental_chart_teeth_chart_id_fkey"
            columns: ["chart_id"]
            isOneToOne: false
            referencedRelation: "dental_charts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_chart_teeth_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
        ]
      }
      dental_charts: {
        Row: {
          anesthesia: boolean | null
          anesthesia_note: string | null
          calculus_overall: string | null
          chart_date: string
          created_at: string | null
          crowding: string | null
          general_note: string | null
          gingivitis_overall: string | null
          homecare_instruction: string | null
          hos_id: string
          id: string
          lymph_node_eval: string | null
          occlusion: string | null
          oral_mucosa: string | null
          palate_eval: string | null
          patient_id: string
          periodontitis_stage: string | null
          pharynx_eval: string | null
          procedure_fluoride: boolean | null
          procedure_irrigation: boolean | null
          procedure_other: string | null
          procedure_polishing: boolean | null
          procedure_scaling: boolean | null
          recheck_interval: string | null
          salivary_eval: string | null
          skull_type: string | null
          species: string | null
          tags: string | null
          tongue_eval: string | null
          tonsil_eval: string | null
          treatment_plan: string | null
          updated_at: string | null
          user_tags: string | null
          vet_id: Json | null
          xray_findings: string | null
          xray_taken: boolean | null
        }
        Insert: {
          anesthesia?: boolean | null
          anesthesia_note?: string | null
          calculus_overall?: string | null
          chart_date: string
          created_at?: string | null
          crowding?: string | null
          general_note?: string | null
          gingivitis_overall?: string | null
          homecare_instruction?: string | null
          hos_id: string
          id?: string
          lymph_node_eval?: string | null
          occlusion?: string | null
          oral_mucosa?: string | null
          palate_eval?: string | null
          patient_id: string
          periodontitis_stage?: string | null
          pharynx_eval?: string | null
          procedure_fluoride?: boolean | null
          procedure_irrigation?: boolean | null
          procedure_other?: string | null
          procedure_polishing?: boolean | null
          procedure_scaling?: boolean | null
          recheck_interval?: string | null
          salivary_eval?: string | null
          skull_type?: string | null
          species?: string | null
          tags?: string | null
          tongue_eval?: string | null
          tonsil_eval?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
          user_tags?: string | null
          vet_id?: Json | null
          xray_findings?: string | null
          xray_taken?: boolean | null
        }
        Update: {
          anesthesia?: boolean | null
          anesthesia_note?: string | null
          calculus_overall?: string | null
          chart_date?: string
          created_at?: string | null
          crowding?: string | null
          general_note?: string | null
          gingivitis_overall?: string | null
          homecare_instruction?: string | null
          hos_id?: string
          id?: string
          lymph_node_eval?: string | null
          occlusion?: string | null
          oral_mucosa?: string | null
          palate_eval?: string | null
          patient_id?: string
          periodontitis_stage?: string | null
          pharynx_eval?: string | null
          procedure_fluoride?: boolean | null
          procedure_irrigation?: boolean | null
          procedure_other?: string | null
          procedure_polishing?: boolean | null
          procedure_scaling?: boolean | null
          recheck_interval?: string | null
          salivary_eval?: string | null
          skull_type?: string | null
          species?: string | null
          tags?: string | null
          tongue_eval?: string | null
          tonsil_eval?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
          user_tags?: string | null
          vet_id?: Json | null
          xray_findings?: string | null
          xray_taken?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "dental_charts_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "dental_charts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["patient_id"]
          },
        ]
      }
      dental_images: {
        Row: {
          chart_id: string
          created_at: string
          dental_chart_teeth_ids: string[] | null
          dental_image_id: string
          img_url: string
          is_radio: boolean | null
          mark: string | null
          other_tags: string[] | null
          tooth_ids: string[] | null
        }
        Insert: {
          chart_id: string
          created_at?: string
          dental_chart_teeth_ids?: string[] | null
          dental_image_id?: string
          img_url: string
          is_radio?: boolean | null
          mark?: string | null
          other_tags?: string[] | null
          tooth_ids?: string[] | null
        }
        Update: {
          chart_id?: string
          created_at?: string
          dental_chart_teeth_ids?: string[] | null
          dental_image_id?: string
          img_url?: string
          is_radio?: boolean | null
          mark?: string | null
          other_tags?: string[] | null
          tooth_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "dental_images_chart_id_fkey"
            columns: ["chart_id"]
            isOneToOne: false
            referencedRelation: "dental_charts"
            referencedColumns: ["id"]
          },
        ]
      }
      diets: {
        Row: {
          active: boolean
          company: string
          created_at: string
          description: string | null
          diet_id: string
          hos_id: string
          mass_vol: number
          name: string
          product_tag: string | null
          species: string
          unit: string
        }
        Insert: {
          active?: boolean
          company: string
          created_at?: string
          description?: string | null
          diet_id?: string
          hos_id?: string
          mass_vol: number
          name: string
          product_tag?: string | null
          species: string
          unit: string
        }
        Update: {
          active?: boolean
          company?: string
          created_at?: string
          description?: string | null
          diet_id?: string
          hos_id?: string
          mass_vol?: number
          name?: string
          product_tag?: string | null
          species?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_vetool_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
        ]
      }
      echo_charts: {
        Row: {
          created_at: string
          exam_date: string
          examiner_id: string | null
          hos_id: string
          id: string
          memo: string | null
          patient_id: string
          tags: string | null
          template_id: string | null
          updated_at: string
          user_tags: string | null
          vet_id: string | null
        }
        Insert: {
          created_at?: string
          exam_date: string
          examiner_id?: string | null
          hos_id: string
          id?: string
          memo?: string | null
          patient_id: string
          tags?: string | null
          template_id?: string | null
          updated_at?: string
          user_tags?: string | null
          vet_id?: string | null
        }
        Update: {
          created_at?: string
          exam_date?: string
          examiner_id?: string | null
          hos_id?: string
          id?: string
          memo?: string | null
          patient_id?: string
          tags?: string | null
          template_id?: string | null
          updated_at?: string
          user_tags?: string | null
          vet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "echo_charts_examiner_id_fkey"
            columns: ["examiner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "echo_charts_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "echo_charts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "echo_charts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "echo_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echo_charts_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      echo_results: {
        Row: {
          comment: string | null
          created_at: string
          echo_chart_id: string
          id: string
          keyword_id: string
          result: string | null
          value: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          echo_chart_id: string
          id?: string
          keyword_id: string
          result?: string | null
          value?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          echo_chart_id?: string
          id?: string
          keyword_id?: string
          result?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "echo_results_echo_chart_id_fkey"
            columns: ["echo_chart_id"]
            isOneToOne: false
            referencedRelation: "echo_charts"
            referencedColumns: ["id"]
          },
        ]
      }
      echo_template_guide_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          mapped_keywords: string[]
          template_id: string
          view_name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          mapped_keywords?: string[]
          template_id: string
          view_name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          mapped_keywords?: string[]
          template_id?: string
          view_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "echo_template_guide_images_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "echo_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      echo_templates: {
        Row: {
          active_items: Json
          created_at: string
          description: string | null
          display_order: number
          hos_id: string
          id: string
          is_default: boolean
          item_order: Json
          name: string
          section_order: string[]
          template_species: string | null
          updated_at: string
        }
        Insert: {
          active_items?: Json
          created_at?: string
          description?: string | null
          display_order?: number
          hos_id: string
          id?: string
          is_default?: boolean
          item_order?: Json
          name?: string
          section_order?: string[]
          template_species?: string | null
          updated_at?: string
        }
        Update: {
          active_items?: Json
          created_at?: string
          description?: string | null
          display_order?: number
          hos_id?: string
          id?: string
          is_default?: boolean
          item_order?: Json
          name?: string
          section_order?: string[]
          template_species?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hos_drugs: {
        Row: {
          caution: string
          created_at: string
          hos_drug_id: string
          hos_drug_name: string
          hos_drug_route: string
          hos_id: string
          ml_per_kg: number
          raw_drug_id: string | null
          unit: string
          unit_per_kg: number
        }
        Insert: {
          caution?: string
          created_at?: string
          hos_drug_id?: string
          hos_drug_name?: string
          hos_drug_route: string
          hos_id?: string
          ml_per_kg: number
          raw_drug_id?: string | null
          unit?: string
          unit_per_kg: number
        }
        Update: {
          caution?: string
          created_at?: string
          hos_drug_id?: string
          hos_drug_name?: string
          hos_drug_route?: string
          hos_id?: string
          ml_per_kg?: number
          raw_drug_id?: string | null
          unit?: string
          unit_per_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "drugs_description_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "hos_drugs_raw_drug_id_fkey"
            columns: ["raw_drug_id"]
            isOneToOne: false
            referencedRelation: "raw_drugs"
            referencedColumns: ["raw_drug_id"]
          },
        ]
      }
      hospital_diet_pin: {
        Row: {
          created_at: string
          diet_id: string
          hos_id: string
        }
        Insert: {
          created_at?: string
          diet_id?: string
          hos_id?: string
        }
        Update: {
          created_at?: string
          diet_id?: string
          hos_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospital_diet_pin_diet_id_fkey"
            columns: ["diet_id"]
            isOneToOne: false
            referencedRelation: "diets"
            referencedColumns: ["diet_id"]
          },
          {
            foreignKeyName: "hospital_diet_pin_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
        ]
      }
      hospitals: {
        Row: {
          business_number: string
          city: string
          created_at: string
          district: string
          group_list: string[]
          hos_id: string
          icu_memo_names: string[]
          is_in_charge_system: boolean
          is_personal: boolean
          master_user_id: string
          name: string
          notes_category: Json | null
          order_color: Json | null
          order_font_size: number
          plan: string
          schedule_setting: Json | null
          show_orderer: boolean
          show_tx_user: boolean
          time_guidelines: number[]
          vital_ref_range: Json
        }
        Insert: {
          business_number?: string
          city: string
          created_at?: string
          district: string
          group_list?: string[]
          hos_id?: string
          icu_memo_names?: string[]
          is_in_charge_system?: boolean
          is_personal?: boolean
          master_user_id: string
          name: string
          notes_category?: Json | null
          order_color?: Json | null
          order_font_size?: number
          plan?: string
          schedule_setting?: Json | null
          show_orderer?: boolean
          show_tx_user?: boolean
          time_guidelines?: number[]
          vital_ref_range?: Json
        }
        Update: {
          business_number?: string
          city?: string
          created_at?: string
          district?: string
          group_list?: string[]
          hos_id?: string
          icu_memo_names?: string[]
          is_in_charge_system?: boolean
          is_personal?: boolean
          master_user_id?: string
          name?: string
          notes_category?: Json | null
          order_color?: Json | null
          order_font_size?: number
          plan?: string
          schedule_setting?: Json | null
          show_orderer?: boolean
          show_tx_user?: boolean
          time_guidelines?: number[]
          vital_ref_range?: Json
        }
        Relationships: [
          {
            foreignKeyName: "hospitals_master_user_id_fkey"
            columns: ["master_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      icu_charts: {
        Row: {
          created_at: string
          hos_id: string
          icu_chart_id: string
          icu_io_id: string | null
          in_charge: Json | null
          main_vet: string | null
          patient_id: string | null
          sub_vet: string | null
          target_date: string | null
          urgency: number | null
          weight: string
          weight_measured_date: string | null
        }
        Insert: {
          created_at?: string
          hos_id: string
          icu_chart_id?: string
          icu_io_id?: string | null
          in_charge?: Json | null
          main_vet?: string | null
          patient_id?: string | null
          sub_vet?: string | null
          target_date?: string | null
          urgency?: number | null
          weight?: string
          weight_measured_date?: string | null
        }
        Update: {
          created_at?: string
          hos_id?: string
          icu_chart_id?: string
          icu_io_id?: string | null
          in_charge?: Json | null
          main_vet?: string | null
          patient_id?: string | null
          sub_vet?: string | null
          target_date?: string | null
          urgency?: number | null
          weight?: string
          weight_measured_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "icu_charts_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "icu_charts_icu_io_id_fkey"
            columns: ["icu_io_id"]
            isOneToOne: false
            referencedRelation: "icu_io"
            referencedColumns: ["icu_io_id"]
          },
          {
            foreignKeyName: "icu_charts_main_vet_fkey"
            columns: ["main_vet"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "icu_charts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "icu_charts_sub_vet_fkey"
            columns: ["sub_vet"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      icu_default_chart: {
        Row: {
          created_at: string
          default_chart_id: string
          default_chart_order_comment: string
          default_chart_order_name: string
          default_chart_order_priority: number
          default_chart_order_type: string
          default_order_time: string[]
          hos_id: string
          is_bordered: boolean
        }
        Insert: {
          created_at?: string
          default_chart_id?: string
          default_chart_order_comment: string
          default_chart_order_name: string
          default_chart_order_priority?: number
          default_chart_order_type: string
          default_order_time?: string[]
          hos_id: string
          is_bordered?: boolean
        }
        Update: {
          created_at?: string
          default_chart_id?: string
          default_chart_order_comment?: string
          default_chart_order_name?: string
          default_chart_order_priority?: number
          default_chart_order_type?: string
          default_order_time?: string[]
          hos_id?: string
          is_bordered?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "icu_default_chart_temp_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
        ]
      }
      icu_io: {
        Row: {
          age_in_days: number
          cage: string | null
          cpcr: string
          created_at: string
          group_list: string[]
          hos_id: string | null
          icu_io_cc: string
          icu_io_dx: string
          icu_io_id: string
          icu_io_tags: string | null
          in_date: string
          memo_a: Json | null
          memo_b: Json | null
          memo_c: Json | null
          out_date: string | null
          out_due_date: string | null
          patient_id: string
        }
        Insert: {
          age_in_days: number
          cage?: string | null
          cpcr?: string
          created_at?: string
          group_list?: string[]
          hos_id?: string | null
          icu_io_cc?: string
          icu_io_dx?: string
          icu_io_id?: string
          icu_io_tags?: string | null
          in_date: string
          memo_a?: Json | null
          memo_b?: Json | null
          memo_c?: Json | null
          out_date?: string | null
          out_due_date?: string | null
          patient_id: string
        }
        Update: {
          age_in_days?: number
          cage?: string | null
          cpcr?: string
          created_at?: string
          group_list?: string[]
          hos_id?: string | null
          icu_io_cc?: string
          icu_io_dx?: string
          icu_io_id?: string
          icu_io_tags?: string | null
          in_date?: string
          memo_a?: Json | null
          memo_b?: Json | null
          memo_c?: Json | null
          out_date?: string | null
          out_due_date?: string | null
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "icu_io_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "icu_io_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["patient_id"]
          },
        ]
      }
      icu_orders: {
        Row: {
          created_at: string
          hos_id: string
          icu_chart_id: string
          icu_chart_order_comment: string | null
          icu_chart_order_id: string
          icu_chart_order_name: string
          icu_chart_order_priority: number
          icu_chart_order_time: string[]
          icu_chart_order_type: string
          is_bordered: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          hos_id: string
          icu_chart_id: string
          icu_chart_order_comment?: string | null
          icu_chart_order_id?: string
          icu_chart_order_name: string
          icu_chart_order_priority?: number
          icu_chart_order_time?: string[]
          icu_chart_order_type: string
          is_bordered?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          hos_id?: string
          icu_chart_id?: string
          icu_chart_order_comment?: string | null
          icu_chart_order_id?: string
          icu_chart_order_name?: string
          icu_chart_order_priority?: number
          icu_chart_order_time?: string[]
          icu_chart_order_type?: string
          is_bordered?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "icu_orders_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "icu_orders_icu_chart_id_fkey"
            columns: ["icu_chart_id"]
            isOneToOne: false
            referencedRelation: "icu_charts"
            referencedColumns: ["icu_chart_id"]
          },
        ]
      }
      icu_templates: {
        Row: {
          created_at: string
          hos_id: string
          icu_chart_id: string
          template_comment: string | null
          template_id: string
          template_name: string
        }
        Insert: {
          created_at?: string
          hos_id: string
          icu_chart_id: string
          template_comment?: string | null
          template_id?: string
          template_name: string
        }
        Update: {
          created_at?: string
          hos_id?: string
          icu_chart_id?: string
          template_comment?: string | null
          template_id?: string
          template_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "icu_templates_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "icu_templates_icu_chart_id_fkey"
            columns: ["icu_chart_id"]
            isOneToOne: true
            referencedRelation: "icu_charts"
            referencedColumns: ["icu_chart_id"]
          },
        ]
      }
      icu_txs: {
        Row: {
          created_at: string
          has_images: boolean | null
          hos_id: string
          icu_chart_order_id: string | null
          icu_chart_tx_comment: string | null
          icu_chart_tx_id: string
          icu_chart_tx_images: string[] | null
          icu_chart_tx_log: Json[] | null
          icu_chart_tx_result: string | null
          is_crucial: boolean
          time: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          has_images?: boolean | null
          hos_id: string
          icu_chart_order_id?: string | null
          icu_chart_tx_comment?: string | null
          icu_chart_tx_id?: string
          icu_chart_tx_images?: string[] | null
          icu_chart_tx_log?: Json[] | null
          icu_chart_tx_result?: string | null
          is_crucial?: boolean
          time: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          has_images?: boolean | null
          hos_id?: string
          icu_chart_order_id?: string | null
          icu_chart_tx_comment?: string | null
          icu_chart_tx_id?: string
          icu_chart_tx_images?: string[] | null
          icu_chart_tx_log?: Json[] | null
          icu_chart_tx_result?: string | null
          is_crucial?: boolean
          time?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "icu_txs_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "icu_txs_icu_chart_order_id_fkey"
            columns: ["icu_chart_order_id"]
            isOneToOne: false
            referencedRelation: "icu_orders"
            referencedColumns: ["icu_chart_order_id"]
          },
        ]
      }
      keywords: {
        Row: {
          keyword: string | null
          keyword_id: number
          main_keyword: string | null
          search_keyword: string | null
          tags: string | null
        }
        Insert: {
          keyword?: string | null
          keyword_id?: number
          main_keyword?: string | null
          search_keyword?: string | null
          tags?: string | null
        }
        Update: {
          keyword?: string | null
          keyword_id?: number
          main_keyword?: string | null
          search_keyword?: string | null
          tags?: string | null
        }
        Relationships: []
      }
      monitoring_sessions: {
        Row: {
          age_in_days: number | null
          created_at: string | null
          due_date: string | null
          end_time: string | null
          hos_id: string
          interval_setting: number | null
          is_template: boolean | null
          memo_etc: string | null
          memo_tx: Json | null
          patient_id: string | null
          planned_vitals: Json | null
          session_group: Json | null
          session_id: string
          session_info: Json | null
          session_title: string | null
          start_time: string | null
          tags: string | null
          updated_at: string | null
          user_tags: string | null
          vet_main: string | null
          vet_primary: string | null
          vet_sub: Json | null
          vital_results: Json | null
        }
        Insert: {
          age_in_days?: number | null
          created_at?: string | null
          due_date?: string | null
          end_time?: string | null
          hos_id: string
          interval_setting?: number | null
          is_template?: boolean | null
          memo_etc?: string | null
          memo_tx?: Json | null
          patient_id?: string | null
          planned_vitals?: Json | null
          session_group?: Json | null
          session_id?: string
          session_info?: Json | null
          session_title?: string | null
          start_time?: string | null
          tags?: string | null
          updated_at?: string | null
          user_tags?: string | null
          vet_main?: string | null
          vet_primary?: string | null
          vet_sub?: Json | null
          vital_results?: Json | null
        }
        Update: {
          age_in_days?: number | null
          created_at?: string | null
          due_date?: string | null
          end_time?: string | null
          hos_id?: string
          interval_setting?: number | null
          is_template?: boolean | null
          memo_etc?: string | null
          memo_tx?: Json | null
          patient_id?: string | null
          planned_vitals?: Json | null
          session_group?: Json | null
          session_id?: string
          session_info?: Json | null
          session_title?: string | null
          start_time?: string | null
          tags?: string | null
          updated_at?: string | null
          user_tags?: string | null
          vet_main?: string | null
          vet_primary?: string | null
          vet_sub?: Json | null
          vital_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_sessions_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "monitoring_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "monitoring_sessions_vet_main_fkey"
            columns: ["vet_main"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "monitoring_sessions_vet_primary_fkey"
            columns: ["vet_primary"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      monitoring_sessions_template: {
        Row: {
          created_at: string | null
          hos_id: string
          interval_setting: number | null
          is_template: boolean | null
          memo_etc: string | null
          memo_tx: Json | null
          planned_vitals: Json | null
          session_comment: string | null
          session_info: Json | null
          session_template_id: string
          session_template_title: string | null
          updated_at: string | null
          vital_results: Json | null
        }
        Insert: {
          created_at?: string | null
          hos_id: string
          interval_setting?: number | null
          is_template?: boolean | null
          memo_etc?: string | null
          memo_tx?: Json | null
          planned_vitals?: Json | null
          session_comment?: string | null
          session_info?: Json | null
          session_template_id?: string
          session_template_title?: string | null
          updated_at?: string | null
          vital_results?: Json | null
        }
        Update: {
          created_at?: string | null
          hos_id?: string
          interval_setting?: number | null
          is_template?: boolean | null
          memo_etc?: string | null
          memo_tx?: Json | null
          planned_vitals?: Json | null
          session_comment?: string | null
          session_info?: Json | null
          session_template_id?: string
          session_template_title?: string | null
          updated_at?: string | null
          vital_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_sessions_template_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
        ]
      }
      neuro_charts: {
        Row: {
          chart_date: string
          created_at: string
          evaluator_id: string | null
          hos_id: string
          id: string
          is_pinned: boolean
          localisations: Json | null
          patient_id: string
          results: Json | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          chart_date: string
          created_at?: string
          evaluator_id?: string | null
          hos_id: string
          id?: string
          is_pinned?: boolean
          localisations?: Json | null
          patient_id: string
          results?: Json | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          chart_date?: string
          created_at?: string
          evaluator_id?: string | null
          hos_id?: string
          id?: string
          is_pinned?: boolean
          localisations?: Json | null
          patient_id?: string
          results?: Json | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "neuro_charts_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "neuro_charts_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "neuro_charts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["patient_id"]
          },
        ]
      }
      notes: {
        Row: {
          content: Json | null
          created_at: string | null
          hos_id: string
          is_shared: boolean | null
          notes_id: string
          tags: string[] | null
          title: string
          user_id: string | null
          user_tags: string[] | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          hos_id: string
          is_shared?: boolean | null
          notes_id?: string
          tags?: string[] | null
          title: string
          user_id?: string | null
          user_tags?: string[] | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          hos_id?: string
          is_shared?: boolean | null
          notes_id?: string
          tags?: string[] | null
          title?: string
          user_id?: string | null
          user_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notices: {
        Row: {
          created_at: string
          hos_id: string | null
          id: string
          notice_color: string | null
          notice_order: number
          notice_text: string
          target_date: Json | null
          target_user: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          hos_id?: string | null
          id?: string
          notice_color?: string | null
          notice_order: number
          notice_text?: string
          target_date?: Json | null
          target_user?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          hos_id?: string | null
          id?: string
          notice_color?: string | null
          notice_order?: number
          notice_text?: string
          target_date?: Json | null
          target_user?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hos_notice_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "notices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      onco_adverse_events: {
        Row: {
          action_taken: string | null
          case_id: string
          case_protocol_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          drug_name: string | null
          event_date: string
          event_type: string
          id: string
          reported_by: string
          resolved: boolean
          resolved_date: string | null
          vcog_grade: number
        }
        Insert: {
          action_taken?: string | null
          case_id: string
          case_protocol_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          drug_name?: string | null
          event_date: string
          event_type: string
          id?: string
          reported_by?: string
          resolved?: boolean
          resolved_date?: string | null
          vcog_grade: number
        }
        Update: {
          action_taken?: string | null
          case_id?: string
          case_protocol_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          drug_name?: string | null
          event_date?: string
          event_type?: string
          id?: string
          reported_by?: string
          resolved?: boolean
          resolved_date?: string | null
          vcog_grade?: number
        }
        Relationships: [
          {
            foreignKeyName: "onco_adverse_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "onco_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onco_adverse_events_case_protocol_id_fkey"
            columns: ["case_protocol_id"]
            isOneToOne: false
            referencedRelation: "onco_case_protocols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onco_adverse_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      onco_ai_cache: {
        Row: {
          created_at: string
          diagnosis_key: string
          expires_at: string | null
          hos_id: string | null
          id: string
          is_active: boolean
          model_version: string | null
          protocol_name: string | null
          query_type: string
          response_json: Json
          version: number
        }
        Insert: {
          created_at?: string
          diagnosis_key: string
          expires_at?: string | null
          hos_id?: string | null
          id?: string
          is_active?: boolean
          model_version?: string | null
          protocol_name?: string | null
          query_type: string
          response_json: Json
          version?: number
        }
        Update: {
          created_at?: string
          diagnosis_key?: string
          expires_at?: string | null
          hos_id?: string | null
          id?: string
          is_active?: boolean
          model_version?: string | null
          protocol_name?: string | null
          query_type?: string
          response_json?: Json
          version?: number
        }
        Relationships: []
      }
      onco_case_protocols: {
        Row: {
          case_id: string
          completed_doses: number
          created_at: string
          created_by: string | null
          delayed_doses: number
          discontinue_reason: string | null
          end_date: string | null
          id: string
          initial_body_weight: number
          notes: string | null
          protocol_id: string
          reduced_doses: number
          start_date: string
          status: string
          total_doses: number
          updated_at: string
        }
        Insert: {
          case_id: string
          completed_doses?: number
          created_at?: string
          created_by?: string | null
          delayed_doses?: number
          discontinue_reason?: string | null
          end_date?: string | null
          id?: string
          initial_body_weight: number
          notes?: string | null
          protocol_id: string
          reduced_doses?: number
          start_date: string
          status?: string
          total_doses?: number
          updated_at?: string
        }
        Update: {
          case_id?: string
          completed_doses?: number
          created_at?: string
          created_by?: string | null
          delayed_doses?: number
          discontinue_reason?: string | null
          end_date?: string | null
          id?: string
          initial_body_weight?: number
          notes?: string | null
          protocol_id?: string
          reduced_doses?: number
          start_date?: string
          status?: string
          total_doses?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onco_case_protocols_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "onco_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onco_case_protocols_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "onco_case_protocols_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "onco_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      onco_cases: {
        Row: {
          age_at_diagnosis_days: number | null
          ai_cache_key: string | null
          body_weight: number | null
          case_date: string
          created_at: string
          created_by: string | null
          diagnosis_category: string[]
          diagnosis_key: string | null
          diagnosis_method: string[]
          diagnosis_name: string
          hos_id: string
          id: string
          notes: string | null
          patient_id: string
          sex: string | null
          stage: string | null
          status: string
          tags: string | null
          updated_at: string
          user_tags: string | null
          vet_id: string | null
        }
        Insert: {
          age_at_diagnosis_days?: number | null
          ai_cache_key?: string | null
          body_weight?: number | null
          case_date?: string
          created_at?: string
          created_by?: string | null
          diagnosis_category?: string[]
          diagnosis_key?: string | null
          diagnosis_method?: string[]
          diagnosis_name: string
          hos_id: string
          id?: string
          notes?: string | null
          patient_id: string
          sex?: string | null
          stage?: string | null
          status?: string
          tags?: string | null
          updated_at?: string
          user_tags?: string | null
          vet_id?: string | null
        }
        Update: {
          age_at_diagnosis_days?: number | null
          ai_cache_key?: string | null
          body_weight?: number | null
          case_date?: string
          created_at?: string
          created_by?: string | null
          diagnosis_category?: string[]
          diagnosis_key?: string | null
          diagnosis_method?: string[]
          diagnosis_name?: string
          hos_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          sex?: string | null
          stage?: string | null
          status?: string
          tags?: string | null
          updated_at?: string
          user_tags?: string | null
          vet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onco_cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "onco_cases_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "onco_cases_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "onco_cases_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      onco_diagnosis_inputs: {
        Row: {
          additional_notes: string | null
          ai_extracted_text: string | null
          case_id: string
          clinical_course: string | null
          clinical_signs: string | null
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          input_type: string
          raw_text: string | null
        }
        Insert: {
          additional_notes?: string | null
          ai_extracted_text?: string | null
          case_id: string
          clinical_course?: string | null
          clinical_signs?: string | null
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          input_type: string
          raw_text?: string | null
        }
        Update: {
          additional_notes?: string | null
          ai_extracted_text?: string | null
          case_id?: string
          clinical_course?: string | null
          clinical_signs?: string | null
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          input_type?: string
          raw_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onco_diagnosis_inputs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "onco_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      onco_protocols: {
        Row: {
          adverse_effects: Json
          ai_model_version: string | null
          contraindications: string | null
          created_at: string
          created_by: string | null
          description: string | null
          drug_interactions: Json
          drugs: Json
          hos_id: string | null
          id: string
          is_ai_generated: boolean
          is_verified: boolean
          mst_days: number | null
          origin_diagnosis: string | null
          owner_instructions: string | null
          owner_warning_signs: Json
          phase: string
          precautions: string | null
          protocol_name: string
          protocol_type: string
          radiation_details: Json | null
          ref_sources: Json
          response_rate: number | null
          surgery_details: Json | null
          tags: string | null
          total_cycles: number | null
          total_weeks: number | null
          updated_at: string
          user_tags: string | null
          version: number
        }
        Insert: {
          adverse_effects?: Json
          ai_model_version?: string | null
          contraindications?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          drug_interactions?: Json
          drugs?: Json
          hos_id?: string | null
          id?: string
          is_ai_generated?: boolean
          is_verified?: boolean
          mst_days?: number | null
          origin_diagnosis?: string | null
          owner_instructions?: string | null
          owner_warning_signs?: Json
          phase?: string
          precautions?: string | null
          protocol_name: string
          protocol_type: string
          radiation_details?: Json | null
          ref_sources?: Json
          response_rate?: number | null
          surgery_details?: Json | null
          tags?: string | null
          total_cycles?: number | null
          total_weeks?: number | null
          updated_at?: string
          user_tags?: string | null
          version?: number
        }
        Update: {
          adverse_effects?: Json
          ai_model_version?: string | null
          contraindications?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          drug_interactions?: Json
          drugs?: Json
          hos_id?: string | null
          id?: string
          is_ai_generated?: boolean
          is_verified?: boolean
          mst_days?: number | null
          origin_diagnosis?: string | null
          owner_instructions?: string | null
          owner_warning_signs?: Json
          phase?: string
          precautions?: string | null
          protocol_name?: string
          protocol_type?: string
          radiation_details?: Json | null
          ref_sources?: Json
          response_rate?: number | null
          surgery_details?: Json | null
          tags?: string | null
          total_cycles?: number | null
          total_weeks?: number | null
          updated_at?: string
          user_tags?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "onco_protocols_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "onco_protocols_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
        ]
      }
      onco_qol_records: {
        Row: {
          behavior_checklist: Json | null
          body_weight: number | null
          case_id: string
          created_at: string | null
          created_by: string | null
          good_days_score: number | null
          happiness_score: number | null
          hunger_score: number | null
          hydration_score: number | null
          hygiene_score: number | null
          id: string
          lethargy_days: number | null
          mobility_score: number | null
          nausea_vomiting_days: number | null
          notes: string | null
          pain_score: number | null
          reported_by: string | null
          visit_date: string
        }
        Insert: {
          behavior_checklist?: Json | null
          body_weight?: number | null
          case_id: string
          created_at?: string | null
          created_by?: string | null
          good_days_score?: number | null
          happiness_score?: number | null
          hunger_score?: number | null
          hydration_score?: number | null
          hygiene_score?: number | null
          id?: string
          lethargy_days?: number | null
          mobility_score?: number | null
          nausea_vomiting_days?: number | null
          notes?: string | null
          pain_score?: number | null
          reported_by?: string | null
          visit_date: string
        }
        Update: {
          behavior_checklist?: Json | null
          body_weight?: number | null
          case_id?: string
          created_at?: string | null
          created_by?: string | null
          good_days_score?: number | null
          happiness_score?: number | null
          hunger_score?: number | null
          hydration_score?: number | null
          hygiene_score?: number | null
          id?: string
          lethargy_days?: number | null
          mobility_score?: number | null
          nausea_vomiting_days?: number | null
          notes?: string | null
          pain_score?: number | null
          reported_by?: string | null
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "onco_qol_records_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "onco_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      onco_report_tokens: {
        Row: {
          case_id: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          show_adverse: boolean
          show_qol: boolean
          show_response: boolean
          show_schedule: boolean
          token: string
        }
        Insert: {
          case_id: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          show_adverse?: boolean
          show_qol?: boolean
          show_response?: boolean
          show_schedule?: boolean
          token?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          show_adverse?: boolean
          show_qol?: boolean
          show_response?: boolean
          show_schedule?: boolean
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "onco_report_tokens_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "onco_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onco_report_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      onco_response_evals: {
        Row: {
          case_id: string
          case_protocol_id: string | null
          clinical_impression: string | null
          created_at: string | null
          created_by: string | null
          criteria_system: string
          eval_date: string
          id: string
          marker_baseline: number | null
          marker_current: number | null
          marker_name: string | null
          marker_unit: string | null
          modalities: string[]
          new_lesions: boolean
          new_lesions_desc: string | null
          non_target_status: string | null
          notes: string | null
          overall_response: string
          percent_change: number | null
          sum_baseline_mm: number | null
          sum_current_mm: number | null
          target_lesions: Json
        }
        Insert: {
          case_id: string
          case_protocol_id?: string | null
          clinical_impression?: string | null
          created_at?: string | null
          created_by?: string | null
          criteria_system?: string
          eval_date: string
          id?: string
          marker_baseline?: number | null
          marker_current?: number | null
          marker_name?: string | null
          marker_unit?: string | null
          modalities?: string[]
          new_lesions?: boolean
          new_lesions_desc?: string | null
          non_target_status?: string | null
          notes?: string | null
          overall_response: string
          percent_change?: number | null
          sum_baseline_mm?: number | null
          sum_current_mm?: number | null
          target_lesions?: Json
        }
        Update: {
          case_id?: string
          case_protocol_id?: string | null
          clinical_impression?: string | null
          created_at?: string | null
          created_by?: string | null
          criteria_system?: string
          eval_date?: string
          id?: string
          marker_baseline?: number | null
          marker_current?: number | null
          marker_name?: string | null
          marker_unit?: string | null
          modalities?: string[]
          new_lesions?: boolean
          new_lesions_desc?: string | null
          non_target_status?: string | null
          notes?: string | null
          overall_response?: string
          percent_change?: number | null
          sum_baseline_mm?: number | null
          sum_current_mm?: number | null
          target_lesions?: Json
        }
        Relationships: [
          {
            foreignKeyName: "onco_response_evals_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "onco_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onco_response_evals_case_protocol_id_fkey"
            columns: ["case_protocol_id"]
            isOneToOne: false
            referencedRelation: "onco_case_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      onco_schedules: {
        Row: {
          administered_at: string | null
          administered_by: string | null
          body_weight_at_visit: number | null
          case_protocol_id: string
          created_at: string
          cycle_number: number
          day_number: number
          delay_reason: string | null
          dose_actual: number | null
          dose_calculated: number | null
          dose_per_kg: number | null
          dose_per_m2: number | null
          dose_unit: string
          drug_name: string
          drug_route: string
          id: string
          notes: string | null
          reduction_reason: string | null
          scheduled_date: string
          status: string
          updated_at: string
        }
        Insert: {
          administered_at?: string | null
          administered_by?: string | null
          body_weight_at_visit?: number | null
          case_protocol_id: string
          created_at?: string
          cycle_number: number
          day_number: number
          delay_reason?: string | null
          dose_actual?: number | null
          dose_calculated?: number | null
          dose_per_kg?: number | null
          dose_per_m2?: number | null
          dose_unit?: string
          drug_name: string
          drug_route: string
          id?: string
          notes?: string | null
          reduction_reason?: string | null
          scheduled_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          administered_at?: string | null
          administered_by?: string | null
          body_weight_at_visit?: number | null
          case_protocol_id?: string
          created_at?: string
          cycle_number?: number
          day_number?: number
          delay_reason?: string | null
          dose_actual?: number | null
          dose_calculated?: number | null
          dose_per_kg?: number | null
          dose_per_m2?: number | null
          dose_unit?: string
          drug_name?: string
          drug_route?: string
          id?: string
          notes?: string | null
          reduction_reason?: string | null
          scheduled_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onco_schedules_administered_by_fkey"
            columns: ["administered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "onco_schedules_case_protocol_id_fkey"
            columns: ["case_protocol_id"]
            isOneToOne: false
            referencedRelation: "onco_case_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      ophthalmic_charts: {
        Row: {
          chart_date: string
          created_at: string
          diagnosis: Json
          evaluator_id: string | null
          hos_id: string
          id: string
          patient_id: string
          results: Json
          summary: string | null
          tags: string | null
          treatment: Json | null
          updated_at: string
          user_tags: string | null
          vet_id: string | null
        }
        Insert: {
          chart_date: string
          created_at?: string
          diagnosis?: Json
          evaluator_id?: string | null
          hos_id: string
          id?: string
          patient_id: string
          results?: Json
          summary?: string | null
          tags?: string | null
          treatment?: Json | null
          updated_at?: string
          user_tags?: string | null
          vet_id?: string | null
        }
        Update: {
          chart_date?: string
          created_at?: string
          diagnosis?: Json
          evaluator_id?: string | null
          hos_id?: string
          id?: string
          patient_id?: string
          results?: Json
          summary?: string | null
          tags?: string | null
          treatment?: Json | null
          updated_at?: string
          user_tags?: string | null
          vet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ophthalmic_charts_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ophthalmic_charts_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "ophthalmic_charts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "ophthalmic_charts_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ophthalmic_images: {
        Row: {
          chart_id: string
          created_at: string
          hos_id: string
          id: string
          img_url: string
          mark: Json | null
          side: string | null
          tags: string[] | null
        }
        Insert: {
          chart_id: string
          created_at?: string
          hos_id: string
          id?: string
          img_url: string
          mark?: Json | null
          side?: string | null
          tags?: string[] | null
        }
        Update: {
          chart_id?: string
          created_at?: string
          hos_id?: string
          id?: string
          img_url?: string
          mark?: Json | null
          side?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ophthalmic_images_chart_id_fkey"
            columns: ["chart_id"]
            isOneToOne: false
            referencedRelation: "ophthalmic_charts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ophthalmic_images_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
        ]
      }
      owners: {
        Row: {
          created_at: string
          hos_id: string
          hos_owner_id: string
          owner_address: string | null
          owner_id: string
          owner_level: string
          owner_memo: string | null
          owner_name: string
          owner_phone_number: string | null
        }
        Insert: {
          created_at?: string
          hos_id: string
          hos_owner_id: string
          owner_address?: string | null
          owner_id?: string
          owner_level?: string
          owner_memo?: string | null
          owner_name?: string
          owner_phone_number?: string | null
        }
        Update: {
          created_at?: string
          hos_id?: string
          hos_owner_id?: string
          owner_address?: string | null
          owner_id?: string
          owner_level?: string
          owner_memo?: string | null
          owner_name?: string
          owner_phone_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owners_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
        ]
      }
      patients: {
        Row: {
          birth: string
          breed: string
          created_at: string
          gender: string
          hos_id: string
          hos_owner_id: string | null
          hos_patient_id: string
          is_alive: boolean
          memo: string | null
          microchip_no: string | null
          name: string
          owner_id: string | null
          owner_name: string | null
          patient_id: string
          species: string
        }
        Insert: {
          birth: string
          breed?: string
          created_at?: string
          gender: string
          hos_id: string
          hos_owner_id?: string | null
          hos_patient_id?: string
          is_alive?: boolean
          memo?: string | null
          microchip_no?: string | null
          name?: string
          owner_id?: string | null
          owner_name?: string | null
          patient_id?: string
          species: string
        }
        Update: {
          birth?: string
          breed?: string
          created_at?: string
          gender?: string
          hos_id?: string
          hos_owner_id?: string | null
          hos_patient_id?: string
          is_alive?: boolean
          memo?: string | null
          microchip_no?: string | null
          name?: string
          owner_id?: string | null
          owner_name?: string | null
          patient_id?: string
          species?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "patients_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["owner_id"]
          },
        ]
      }
      raw_drugs: {
        Row: {
          created_at: string
          raw_drug_description: string | null
          raw_drug_id: string
          raw_drug_indication: string | null
          raw_drug_name: string
          raw_drug_side_effect: string | null
          raw_drug_tags: string | null
        }
        Insert: {
          created_at?: string
          raw_drug_description?: string | null
          raw_drug_id?: string
          raw_drug_indication?: string | null
          raw_drug_name: string
          raw_drug_side_effect?: string | null
          raw_drug_tags?: string | null
        }
        Update: {
          created_at?: string
          raw_drug_description?: string | null
          raw_drug_id?: string
          raw_drug_indication?: string | null
          raw_drug_name?: string
          raw_drug_side_effect?: string | null
          raw_drug_tags?: string | null
        }
        Relationships: []
      }
      resource_collection_items: {
        Row: {
          added_at: string | null
          collection_id: string
          order_index: number
          resource_id: string
          resource_title: string | null
          resource_type: string
        }
        Insert: {
          added_at?: string | null
          collection_id: string
          order_index?: number
          resource_id: string
          resource_title?: string | null
          resource_type: string
        }
        Update: {
          added_at?: string | null
          collection_id?: string
          order_index?: number
          resource_id?: string
          resource_title?: string | null
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "resource_collections"
            referencedColumns: ["collection_id"]
          },
        ]
      }
      resource_collections: {
        Row: {
          collection_id: string
          created_at: string | null
          description: string | null
          hos_id: string
          title: string
          user_id: string | null
        }
        Insert: {
          collection_id?: string
          created_at?: string | null
          description?: string | null
          hos_id: string
          title: string
          user_id?: string | null
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          description?: string | null
          hos_id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_collections_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "resource_collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      resource_shares: {
        Row: {
          created_at: string | null
          id: string
          owner_hos_id: string
          owner_user_id: string | null
          permission_level: string | null
          resource_id: string
          resource_type: string
          restricted_data: Json | null
          share_target_type: string
          target_id: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          owner_hos_id?: string
          owner_user_id?: string | null
          permission_level?: string | null
          resource_id: string
          resource_type: string
          restricted_data?: Json | null
          share_target_type: string
          target_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          owner_hos_id?: string
          owner_user_id?: string | null
          permission_level?: string | null
          resource_id?: string
          resource_type?: string
          restricted_data?: Json | null
          share_target_type?: string
          target_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_shares_owner_hos_id_fkey"
            columns: ["owner_hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "resource_shares_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      schedules: {
        Row: {
          category: string | null
          color: string | null
          content: string | null
          created_at: string
          created_by: string | null
          end_time: string
          hos_id: string
          id: string
          is_all_day: boolean
          location: string | null
          start_time: string
          target_users: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          end_time: string
          hos_id: string
          id?: string
          is_all_day?: boolean
          location?: string | null
          start_time: string
          target_users?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          color?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          end_time?: string
          hos_id?: string
          id?: string
          is_all_day?: boolean
          location?: string | null
          start_time?: string
          target_users?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
        ]
      }
      todos: {
        Row: {
          created_at: string
          hos_id: string
          id: string
          is_done: boolean
          target_date: string
          target_user: string | null
          todo_title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          hos_id: string
          id?: string
          is_done?: boolean
          target_date: string
          target_user?: string | null
          todo_title?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          hos_id?: string
          id?: string
          is_done?: boolean
          target_date?: string
          target_user?: string | null
          todo_title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "todos_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "todos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ultrasound_chart_organs: {
        Row: {
          chart_id: string
          created_at: string
          findings_data: Json
          id: string
          organ_memo: string | null
          organ_name: string
          status: string
          updated_at: string
        }
        Insert: {
          chart_id: string
          created_at?: string
          findings_data?: Json
          id?: string
          organ_memo?: string | null
          organ_name: string
          status: string
          updated_at?: string
        }
        Update: {
          chart_id?: string
          created_at?: string
          findings_data?: Json
          id?: string
          organ_memo?: string | null
          organ_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ultrasound_chart_organs_chart_id_fkey"
            columns: ["chart_id"]
            isOneToOne: false
            referencedRelation: "ultrasound_charts"
            referencedColumns: ["id"]
          },
        ]
      }
      ultrasound_charts: {
        Row: {
          chart_date: string
          created_at: string
          evaluator_id: string | null
          hos_id: string
          id: string
          impression_summary: string | null
          patient_id: string
          tags: string | null
          updated_at: string
          vet_id: string | null
        }
        Insert: {
          chart_date: string
          created_at?: string
          evaluator_id?: string | null
          hos_id: string
          id?: string
          impression_summary?: string | null
          patient_id: string
          tags?: string | null
          updated_at?: string
          vet_id?: string | null
        }
        Update: {
          chart_date?: string
          created_at?: string
          evaluator_id?: string | null
          hos_id?: string
          id?: string
          impression_summary?: string | null
          patient_id?: string
          tags?: string | null
          updated_at?: string
          vet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ultrasound_charts_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ultrasound_charts_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "ultrasound_charts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "ultrasound_charts_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_approvals: {
        Row: {
          created_at: string
          hos_id: string | null
          is_approved: boolean
          updated_at: string | null
          user_approval_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          hos_id?: string | null
          is_approved?: boolean
          updated_at?: string | null
          user_approval_id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          hos_id?: string | null
          is_approved?: boolean
          updated_at?: string | null
          user_approval_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_approval_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
          {
            foreignKeyName: "user_approval_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          group: string[] | null
          hos_id: string | null
          is_active: boolean | null
          is_admin: boolean
          is_super: boolean
          is_vet: boolean
          name: string
          position: string
          rank: number
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          group?: string[] | null
          hos_id?: string | null
          is_active?: boolean | null
          is_admin?: boolean
          is_super?: boolean
          is_vet?: boolean
          name: string
          position?: string
          rank?: number
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          group?: string[] | null
          hos_id?: string | null
          is_active?: boolean | null
          is_admin?: boolean
          is_super?: boolean
          is_vet?: boolean
          name?: string
          position?: string
          rank?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_hos_id_fkey"
            columns: ["hos_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["hos_id"]
          },
        ]
      }
      vetool_feedbacks: {
        Row: {
          created_at: string
          feedback_category: string
          feedback_description: string
          feedback_id: string
          is_read: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feedback_category: string
          feedback_description: string
          feedback_id?: string
          is_read?: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feedback_category?: string
          feedback_description?: string
          feedback_id?: string
          is_read?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vetool_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vitals: {
        Row: {
          blood_pressure: string | null
          body_weight: string | null
          created_at: string
          heart_rate: string | null
          patient_id: string | null
          respiratory_rate: string | null
          temperature: string | null
          vital_id: number
        }
        Insert: {
          blood_pressure?: string | null
          body_weight?: string | null
          created_at?: string
          heart_rate?: string | null
          patient_id?: string | null
          respiratory_rate?: string | null
          temperature?: string | null
          vital_id?: number
        }
        Update: {
          blood_pressure?: string | null
          body_weight?: string | null
          created_at?: string
          heart_rate?: string | null
          patient_id?: string | null
          respiratory_rate?: string | null
          temperature?: string | null
          vital_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "vitals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["patient_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      copy_prev_chart: {
        Args: { patient_id_input: string; target_date_input: string }
        Returns: Json
      }
      copy_prev_orders: {
        Args: { new_chart_id_input: string; prev_chart_id_input: string }
        Returns: undefined
      }
      copy_selected_orders: {
        Args: {
          new_chart_id_input: string
          orderer_name_input: string
          selected_chart_id_input: string
        }
        Returns: undefined
      }
      copy_template_orders: {
        Args: { new_chart_id_input: string; prev_chart_id_input: string }
        Returns: undefined
      }
      create_template_orders: {
        Args: {
          hos_id_input: string
          is_time_included_input: boolean
          template_comment_input: string
          template_name_input: string
          template_orders_input: Json
        }
        Returns: undefined
      }
      discharge_patient: {
        Args: {
          icu_io_id_input: string
          is_alive_input: boolean
          keywords_input: string
          patient_id_input: string
        }
        Returns: undefined
      }
      fetch_icu_chart_data: {
        Args: {
          hos_id_input: string
          patient_id_input: string
          target_date_input: string
        }
        Returns: Json
      }
      fetch_icu_summary_data: {
        Args: { hos_id_input: string; target_date_input: string }
        Returns: Json
      }
      fetch_icu_tx_table_data: {
        Args: { hos_id_input: string; target_date_input: string }
        Returns: Json
      }
      fetch_monitoring_sidebar_data: {
        Args: { due_date_input: string; hos_id_input: string }
        Returns: {
          age_in_days: number
          end_time: string
          is_template: boolean
          patient: Json
          session_group: Json
          session_id: string
          session_title: string
          start_time: string
          tags: string
          updated_at: string
          user_tags: string
          vet_main: string
          vet_primary: string
          vet_sub: Json
        }[]
      }
      fetch_ms_with_patient_with_weight: {
        Args: { session_id_input: string }
        Returns: {
          age_in_days: number
          created_at: string
          due_date: string
          end_time: string
          hos_id: string
          interval_setting: number
          is_template: boolean
          memo_etc: string
          memo_tx: Json
          patient: Json
          planned_vitals: Json
          session_group: Json
          session_id: string
          session_info: Json
          session_title: string
          start_time: string
          tags: string
          updated_at: string
          user_tags: string
          vet_main: string
          vet_primary: string
          vet_sub: Json
          vital_results: Json
        }[]
      }
      get_chartable_vitals_data: {
        Args: { icu_io_id_input: string }
        Returns: Json
      }
      get_checklist_data: {
        Args: { checklist_id_input: string }
        Returns: Json
      }
      get_default_chart_data: { Args: { hos_id_input: string }; Returns: Json }
      get_hos_default_chart_orders: {
        Args: { hos_id_input: string }
        Returns: Json
      }
      get_hos_list_data: { Args: never; Returns: Json }
      get_icu_analysis_data: {
        Args: {
          end_date_input: string
          hos_id_input: string
          start_date_input: string
          target_date_input: string
        }
        Returns: Json
      }
      get_icu_bookmarked_data: { Args: { hos_id_input: string }; Returns: Json }
      get_icu_chart_by_patient_id_and_target_date: {
        Args: { patient_id_input: string; target_date_input: string }
        Returns: Json
      }
      get_icu_layout_data: {
        Args: { hos_id_input: string; target_date_input: string }
        Returns: Json
      }
      get_icu_out_due_patients: {
        Args: { hos_id_input: string; target_date_input: string }
        Returns: Json
      }
      get_icu_sidebar_data: {
        Args: { hos_id_input: string; target_date_input: string }
        Returns: Json
      }
      get_icu_summary_data: {
        Args: { hos_id_input: string; target_date_input: string }
        Returns: Json
      }
      get_icu_tx_table_data: {
        Args: { hos_id_input: string; target_date_input: string }
        Returns: Json
      }
      get_icu_visit_patients: {
        Args: { hos_id_input: string; target_date_input: string }
        Returns: Json
      }
      get_icu_visitable_patients: {
        Args: { hos_id_input: string; target_date_input: string }
        Returns: Json
      }
      get_my_hos_id: { Args: never; Returns: string }
      get_not_out_due_patients: {
        Args: { hos_id_input: string; target_date_input: string }
        Returns: Json
      }
      get_patient_data_with_vitals: {
        Args: { patient_id_input: string }
        Returns: Json
      }
      get_pinned_diet_data: {
        Args: { hos_id_input: string; species_input: string }
        Returns: Json
      }
      get_selected_icu_chart: {
        Args: { patient_id_input: string; target_date_input: string }
        Returns: Json
      }
      get_template_chart_data: {
        Args: { icu_chart_id_input: string }
        Returns: Json
      }
      get_vetool_user: { Args: never; Returns: Json }
      insert_calc_result_order: {
        Args: {
          hos_id_input: string
          order_comment_input: string
          order_name_input: string
          order_type_input: string
          patient_id_input: string
          target_date_input: string
        }
        Returns: undefined
      }
      insert_entire_hospital_diet_pin: {
        Args: { hos_id_input: string }
        Returns: undefined
      }
      paste_default_icu_chart: {
        Args: { hos_id_input: string; icu_chart_id_input: string }
        Returns: undefined
      }
      register_icu: {
        Args: {
          age_in_days_input: number
          group_list_input: Json
          hos_id_input: string
          icu_io_cc_input: string
          icu_io_dx_input: string
          in_date_input: string
          main_vet_input: string
          out_due_date_input: string
          patient_id_input: string
          sub_vet_input: string
        }
        Returns: undefined
      }
      register_new_patient_in_icu: {
        Args: {
          age_in_days_input: number
          hos_id_input: string
          in_date_input: string
          patient_id_input: string
        }
        Returns: undefined
      }
      register_patient: {
        Args: {
          birth_input: string
          body_weight_input: string
          breed_input: string
          gender_input: string
          hos_id_input: string
          hos_owner_id_input: string
          hos_patient_id_input: string
          memo_input: string
          microchip_no_input: string
          name_input: string
          owner_name_input: string
          species_input: string
        }
        Returns: string
      }
      search_notes_by_content: {
        Args: { hos_id_input: string; search_term: string }
        Returns: {
          content: Json
          created_at: string
          hos_id: string
          is_shared: boolean
          notes_id: string
          tags: string[]
          title: string
          user_tags: string[]
        }[]
      }
      search_patients: {
        Args: {
          hos_id_input: string
          is_icu_input: boolean
          items_per_page_input: number
          page_number_input: number
          search_term_input: string
        }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      toggle_io_patient_out: {
        Args: {
          age_in_days_input: number
          gender_input: string
          icu_io_id_input: string
          is_alive_input: boolean
          is_patient_out_input: boolean
          keywords_input: string
          owner_name_input: string
          patient_breed_input: string
          patient_id_input: string
          patient_name_input: string
          patient_species_input: string
        }
        Returns: undefined
      }
      update_icu_chart_table_weight_and_insert_vitals_table: {
        Args: {
          icu_chart_order_id_input: string
          weight_input: string
          weight_measured_date_input: string
        }
        Returns: undefined
      }
      update_patient_from_icu_route: {
        Args: {
          birth_input: string
          breed_input: string
          gender_input: string
          hos_owner_id_input: string
          hos_patient_id_input: string
          icu_chart_id_input: string
          is_weight_changed_input: boolean
          memo_input: string
          microchip_no_input: string
          name_input: string
          owner_name_input: string
          patient_id_input: string
          species_input: string
          weight_input: string
          weight_measured_date_input: string
        }
        Returns: undefined
      }
      update_patient_from_monitoring: {
        Args: {
          birth_input: string
          breed_input: string
          gender_input: string
          hos_owner_id_input: string
          hos_patient_id_input: string
          is_weight_changed_input: boolean
          memo_input: string
          microchip_no_input: string
          name_input: string
          owner_name_input: string
          patient_id_input: string
          species_input: string
          weight_input: string
        }
        Returns: undefined
      }
      update_patient_from_patient_route: {
        Args: {
          birth_input: string
          breed_input: string
          gender_input: string
          hos_owner_id_input: string
          hos_patient_id_input: string
          is_weight_changed_input: boolean
          memo_input: string
          microchip_no_input: string
          name_input: string
          owner_name_input: string
          patient_id_input: string
          species_input: string
          weight_input: string
        }
        Returns: undefined
      }
      update_template_chart: {
        Args: {
          hos_id_input: string
          icu_chart_id_input: string
          template_comment_input: string
          template_id_input: string
          template_name_input: string
          template_orders_input: Json
        }
        Returns: undefined
      }
      update_user_approval_and_user_hos_id_when_approved: {
        Args: { hos_id_input: string; user_id_input: string }
        Returns: undefined
      }
      update_user_info_when_create_new_hospital: {
        Args: {
          business_number_input: string
          city_input: string
          district_input: string
          hos_name_input: string
          is_vet_input: boolean
          user_name_input: string
        }
        Returns: string
      }
      update_user_info_when_sending_approval: {
        Args: {
          hos_id_input: string
          is_vet_input: boolean
          name_input: string
        }
        Returns: undefined
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
    Enums: {},
  },
} as const
