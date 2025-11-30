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
      accounts_receivable: {
        Row: {
          amount: number
          bank_account_id: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string
          due_date: string
          id: string
          notes: string | null
          payment_method: string | null
          received_date: string | null
          status: string | null
          store_id: string
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description: string
          due_date: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          received_date?: string | null
          status?: string | null
          store_id: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string
          due_date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          received_date?: string | null
          status?: string | null
          store_id?: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          comparison_date: string
          comparison_period: string
          created_at: string | null
          error_message: string | null
          id: string
          request_date: string | null
          request_payload: Json
          response_text: string | null
          status: string
          store_id: string
          updated_at: string | null
        }
        Insert: {
          comparison_date: string
          comparison_period: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          request_date?: string | null
          request_payload: Json
          response_text?: string | null
          status?: string
          store_id: string
          updated_at?: string | null
        }
        Update: {
          comparison_date?: string
          comparison_period?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          request_date?: string | null
          request_payload?: Json
          response_text?: string | null
          status?: string
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_settings: {
        Row: {
          created_at: string | null
          daily_limit_per_store: number
          id: string
          updated_at: string | null
          webhook_endpoint: string
          webhook_endpoint_test: string | null
        }
        Insert: {
          created_at?: string | null
          daily_limit_per_store?: number
          id?: string
          updated_at?: string | null
          webhook_endpoint: string
          webhook_endpoint_test?: string | null
        }
        Update: {
          created_at?: string | null
          daily_limit_per_store?: number
          id?: string
          updated_at?: string | null
          webhook_endpoint?: string
          webhook_endpoint_test?: string | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_number: string | null
          account_type: string | null
          agency: string | null
          bank_name: string | null
          color: string | null
          created_at: string | null
          current_balance: number | null
          id: string
          initial_balance: number | null
          is_active: boolean | null
          name: string
          store_id: string
          updated_at: string | null
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          bank_name?: string | null
          color?: string | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean | null
          name: string
          store_id: string
          updated_at?: string | null
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          bank_name?: string | null
          color?: string | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean | null
          name?: string
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          banner_type: string | null
          created_at: string | null
          id: string
          order: number
          store_id: string
          updated_at: string | null
          url: string
        }
        Insert: {
          banner_type?: string | null
          created_at?: string | null
          id?: string
          order?: number
          store_id: string
          updated_at?: string | null
          url: string
        }
        Update: {
          banner_type?: string | null
          created_at?: string | null
          id?: string
          order?: number
          store_id?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "banners_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_customers: {
        Row: {
          campaign_id: string
          created_at: string | null
          customer_id: string
          id: string
          is_selected: boolean | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          customer_id: string
          id?: string
          is_selected?: boolean | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          customer_id?: string
          id?: string
          is_selected?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_customers_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_customers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_logs: {
        Row: {
          campaign_id: string
          created_at: string | null
          customer_id: string
          customer_name: string | null
          customer_phone: string
          error_message: string | null
          id: string
          message: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          customer_id: string
          customer_name?: string | null
          customer_phone: string
          error_message?: string | null
          id?: string
          message: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          customer_id?: string
          customer_name?: string | null
          customer_phone?: string
          error_message?: string | null
          id?: string
          message?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      card_machines: {
        Row: {
          created_at: string | null
          credit_fee: number | null
          debit_fee: number | null
          id: string
          installment_fees: Json | null
          is_active: boolean | null
          name: string
          store_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credit_fee?: number | null
          debit_fee?: number | null
          id?: string
          installment_fees?: Json | null
          is_active?: boolean | null
          name: string
          store_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credit_fee?: number | null
          debit_fee?: number | null
          id?: string
          installment_fees?: Json | null
          is_active?: boolean | null
          name?: string
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_machines_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_register: {
        Row: {
          closed_at: string | null
          final_amount: number | null
          id: string
          initial_amount: number
          opened_at: string | null
          opened_by: string
          store_id: string
        }
        Insert: {
          closed_at?: string | null
          final_amount?: number | null
          id?: string
          initial_amount: number
          opened_at?: string | null
          opened_by: string
          store_id: string
        }
        Update: {
          closed_at?: string | null
          final_amount?: number | null
          id?: string
          initial_amount?: number
          opened_at?: string | null
          opened_by?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_register_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          store_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          store_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      composite_item_transactions: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          order_item_id: string
          raw_material_consumed: number
          raw_material_product_id: string
          reversed_at: string | null
          variation_id: string
          variations_generated: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          order_item_id: string
          raw_material_consumed: number
          raw_material_product_id: string
          reversed_at?: string | null
          variation_id: string
          variations_generated: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          order_item_id?: string
          raw_material_consumed?: number
          raw_material_product_id?: string
          reversed_at?: string | null
          variation_id?: string
          variations_generated?: number
        }
        Relationships: [
          {
            foreignKeyName: "composite_item_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "composite_item_transactions_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "composite_item_transactions_raw_material_product_id_fkey"
            columns: ["raw_material_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "composite_item_transactions_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_uses: {
        Row: {
          coupon_id: string
          customer_id: string | null
          customer_phone: string | null
          discount_applied: number
          id: string
          order_id: string | null
          used_at: string | null
        }
        Insert: {
          coupon_id: string
          customer_id?: string | null
          customer_phone?: string | null
          discount_applied: number
          id?: string
          order_id?: string | null
          used_at?: string | null
        }
        Update: {
          coupon_id?: string
          customer_id?: string | null
          customer_phone?: string | null
          discount_applied?: number
          id?: string
          order_id?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_uses_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_uses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_uses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applicable_products: string[] | null
          code: string
          created_at: string | null
          current_uses: number | null
          discount_type: string | null
          discount_value: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          store_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          applicable_products?: string[] | null
          code: string
          created_at?: string | null
          current_uses?: number | null
          discount_type?: string | null
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          store_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          applicable_products?: string[] | null
          code?: string
          created_at?: string | null
          current_uses?: number | null
          discount_type?: string | null
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          store_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          bank_name: string | null
          card_limit: number | null
          closing_day: number | null
          color: string | null
          created_at: string | null
          due_day: number | null
          id: string
          is_active: boolean | null
          last_four_digits: string | null
          name: string
          store_id: string
          updated_at: string | null
        }
        Insert: {
          bank_name?: string | null
          card_limit?: number | null
          closing_day?: number | null
          color?: string | null
          created_at?: string | null
          due_day?: number | null
          id?: string
          is_active?: boolean | null
          last_four_digits?: string | null
          name: string
          store_id: string
          updated_at?: string | null
        }
        Update: {
          bank_name?: string | null
          card_limit?: number | null
          closing_day?: number | null
          color?: string | null
          created_at?: string | null
          due_day?: number | null
          id?: string
          is_active?: boolean | null
          last_four_digits?: string | null
          name?: string
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address: string
          cep: string | null
          created_at: string | null
          customer_id: string
          id: string
          name: string
          neighborhood: string
          number: string | null
          reference: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          cep?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          name: string
          neighborhood: string
          number?: string | null
          reference?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          cep?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          name?: string
          neighborhood?: string
          number?: string | null
          reference?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          loyalty_points: number | null
          name: string
          phone: string
          points: number | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          loyalty_points?: number | null
          name: string
          phone: string
          points?: number | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          loyalty_points?: number | null
          name?: string
          phone?: string
          points?: number | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      dream_board: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string | null
          current_amount: number | null
          description: string | null
          id: string
          image_url: string | null
          priority: number | null
          status: string | null
          store_id: string
          target_amount: number
          target_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_amount?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          priority?: number | null
          status?: string | null
          store_id: string
          target_amount: number
          target_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_amount?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          priority?: number | null
          status?: string | null
          store_id?: string
          target_amount?: number
          target_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dream_board_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          full_name: string
          hire_date: string | null
          id: string
          job_role_id: string | null
          notes: string | null
          phone: string | null
          rg: string | null
          salary: number | null
          store_id: string
          termination_date: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          job_role_id?: string | null
          notes?: string | null
          phone?: string | null
          rg?: string | null
          salary?: number | null
          store_id: string
          termination_date?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          job_role_id?: string | null
          notes?: string | null
          phone?: string | null
          rg?: string | null
          salary?: number | null
          store_id?: string
          termination_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_job_role_id_fkey"
            columns: ["job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          store_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          store_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          store_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_goals: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          period_end: string
          period_start: string
          store_id: string
          target_amount: number
          type: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          period_end: string
          period_start: string
          store_id: string
          target_amount: number
          type: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          period_end?: string
          period_start?: string
          store_id?: string
          target_amount?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_goals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_goals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_notifications: {
        Row: {
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          read_at: string | null
          related_id: string | null
          related_type: string | null
          sent_at: string | null
          store_id: string
          title: string
        }
        Insert: {
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          sent_at?: string | null
          store_id: string
          title: string
        }
        Update: {
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          sent_at?: string | null
          store_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          attachment_url: string | null
          bank_account_id: string | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          credit_card_id: string | null
          description: string
          due_date: string | null
          id: string
          is_recurring: boolean | null
          notes: string | null
          payment_method: string | null
          recurring_end_date: string | null
          recurring_type: string | null
          status: string | null
          store_id: string
          tags: string[] | null
          transaction_date: string
          transfer_to_account_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          bank_account_id?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_card_id?: string | null
          description: string
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment_method?: string | null
          recurring_end_date?: string | null
          recurring_type?: string | null
          status?: string | null
          store_id: string
          tags?: string[] | null
          transaction_date: string
          transfer_to_account_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          bank_account_id?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_card_id?: string | null
          description?: string
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment_method?: string | null
          recurring_end_date?: string | null
          recurring_type?: string | null
          status?: string | null
          store_id?: string
          tags?: string[] | null
          transaction_date?: string
          transfer_to_account_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_transfer_to_account_id_fkey"
            columns: ["transfer_to_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      job_roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system_role: boolean | null
          name: string
          store_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name: string
          store_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name?: string
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_roles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rules: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          min_purchase_amount: number | null
          name: string
          points_per_real: number | null
          points_required: number | null
          reward: string | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          min_purchase_amount?: number | null
          name: string
          points_per_real?: number | null
          points_required?: number | null
          reward?: string | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          min_purchase_amount?: number | null
          name?: string
          points_per_real?: number | null
          points_required?: number | null
          reward?: string | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          created_at: string | null
          customer_id: string
          description: string | null
          id: string
          order_id: string | null
          points: number
          store_id: string
          transaction_type: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          description?: string | null
          id?: string
          order_id?: string | null
          points: number
          store_id: string
          transaction_type: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points?: number
          store_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_flow_settings: {
        Row: {
          created_at: string | null
          is_pending_active: boolean
          is_preparing_active: boolean
          store_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          is_pending_active?: boolean
          is_preparing_active?: boolean
          store_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          is_pending_active?: boolean
          is_preparing_active?: boolean
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_flow_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name: string
          product_price: number
          product_variation_id: string | null
          quantity: number
          subtotal: number
          variation_name: string | null
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_name: string
          product_price: number
          product_variation_id?: string | null
          quantity: number
          subtotal: number
          variation_name?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          product_price?: number
          product_variation_id?: string | null
          quantity?: number
          subtotal?: number
          variation_name?: string | null
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
          {
            foreignKeyName: "order_items_product_variation_id_fkey"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          card_machine_id: string | null
          card_machine_ids: Json | null
          cash_register_id: string | null
          change_for: number | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          customer_name: string | null
          delivery: boolean | null
          delivery_address: string | null
          delivery_cep: string | null
          delivery_fee: number | null
          delivery_neighborhood: string | null
          delivery_number: string | null
          delivery_reference: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          order_number: string
          payment_amounts: Json | null
          payment_method: string | null
          payment_methods: Json | null
          pickup_time: string | null
          reservation_date: string | null
          source: Database["public"]["Enums"]["order_source"]
          status: Database["public"]["Enums"]["order_status"] | null
          store_id: string
          total: number
          updated_at: string | null
        }
        Insert: {
          card_machine_id?: string | null
          card_machine_ids?: Json | null
          cash_register_id?: string | null
          change_for?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          delivery?: boolean | null
          delivery_address?: string | null
          delivery_cep?: string | null
          delivery_fee?: number | null
          delivery_neighborhood?: string | null
          delivery_number?: string | null
          delivery_reference?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_number: string
          payment_amounts?: Json | null
          payment_method?: string | null
          payment_methods?: Json | null
          pickup_time?: string | null
          reservation_date?: string | null
          source: Database["public"]["Enums"]["order_source"]
          status?: Database["public"]["Enums"]["order_status"] | null
          store_id: string
          total: number
          updated_at?: string | null
        }
        Update: {
          card_machine_id?: string | null
          card_machine_ids?: Json | null
          cash_register_id?: string | null
          change_for?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          delivery?: boolean | null
          delivery_address?: string | null
          delivery_cep?: string | null
          delivery_fee?: number | null
          delivery_neighborhood?: string | null
          delivery_number?: string | null
          delivery_reference?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_amounts?: Json | null
          payment_method?: string | null
          payment_methods?: Json | null
          pickup_time?: string | null
          reservation_date?: string | null
          source?: Database["public"]["Enums"]["order_source"]
          status?: Database["public"]["Enums"]["order_status"] | null
          store_id?: string
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_card_machine_id_fkey"
            columns: ["card_machine_id"]
            isOneToOne: false
            referencedRelation: "card_machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_register"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          allowed_channels: string[] | null
          card_machine_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          store_id: string
          updated_at: string | null
        }
        Insert: {
          allowed_channels?: string[] | null
          card_machine_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          store_id: string
          updated_at?: string | null
        }
        Update: {
          allowed_channels?: string[] | null
          card_machine_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_card_machine_id_fkey"
            columns: ["card_machine_id"]
            isOneToOne: false
            referencedRelation: "card_machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      perishable_record_items: {
        Row: {
          created_at: string | null
          id: string
          item_type: string
          perishable_record_id: string
          product_id: string
          product_variation_id: string | null
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_type: string
          perishable_record_id: string
          product_id: string
          product_variation_id?: string | null
          quantity?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          item_type?: string
          perishable_record_id?: string
          product_id?: string
          product_variation_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "perishable_record_items_perishable_record_id_fkey"
            columns: ["perishable_record_id"]
            isOneToOne: false
            referencedRelation: "perishable_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perishable_record_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perishable_record_items_product_variation_id_fkey"
            columns: ["product_variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      perishable_records: {
        Row: {
          cash_register_id: string | null
          context_tags: string[] | null
          created_at: string | null
          id: string
          record_date: string
          store_id: string
          updated_at: string | null
        }
        Insert: {
          cash_register_id?: string | null
          context_tags?: string[] | null
          created_at?: string | null
          id?: string
          record_date?: string
          store_id: string
          updated_at?: string | null
        }
        Update: {
          cash_register_id?: string | null
          context_tags?: string[] | null
          created_at?: string | null
          id?: string
          record_date?: string
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perishable_records_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_register"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perishable_records_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_packaging_links: {
        Row: {
          created_at: string | null
          id: string
          packaging_id: string
          product_id: string
          quantity: number
          store_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          packaging_id: string
          product_id: string
          quantity?: number
          store_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          packaging_id?: string
          product_id?: string
          quantity?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_packaging_links_packaging_id_fkey"
            columns: ["packaging_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_packaging_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_packaging_links_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          created_at: string | null
          id: string
          is_composite: boolean | null
          name: string
          price_adjustment: number
          product_id: string
          raw_material_product_id: string | null
          raw_material_variation_id: string | null
          stock_quantity: number
          updated_at: string | null
          yield_quantity: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_composite?: boolean | null
          name: string
          price_adjustment?: number
          product_id: string
          raw_material_product_id?: string | null
          raw_material_variation_id?: string | null
          stock_quantity?: number
          updated_at?: string | null
          yield_quantity?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_composite?: boolean | null
          name?: string
          price_adjustment?: number
          product_id?: string
          raw_material_product_id?: string | null
          raw_material_variation_id?: string | null
          stock_quantity?: number
          updated_at?: string | null
          yield_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variations_raw_material_product_id_fkey"
            columns: ["raw_material_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variations_raw_material_variation_id_fkey"
            columns: ["raw_material_variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          can_be_redeemed_with_points: boolean | null
          category_id: string | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          earns_loyalty_points: boolean | null
          has_variations: boolean | null
          id: string
          ifood_price: number | null
          image_url: string | null
          is_packaging: boolean | null
          is_perishable: boolean | null
          loyalty_points_value: number | null
          name: string
          price: number
          redemption_points_cost: number | null
          stock_quantity: number | null
          store_id: string
          supplier_product_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          can_be_redeemed_with_points?: boolean | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          earns_loyalty_points?: boolean | null
          has_variations?: boolean | null
          id?: string
          ifood_price?: number | null
          image_url?: string | null
          is_packaging?: boolean | null
          is_perishable?: boolean | null
          loyalty_points_value?: number | null
          name: string
          price: number
          redemption_points_cost?: number | null
          stock_quantity?: number | null
          store_id: string
          supplier_product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          can_be_redeemed_with_points?: boolean | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          earns_loyalty_points?: boolean | null
          has_variations?: boolean | null
          id?: string
          ifood_price?: number | null
          image_url?: string | null
          is_packaging?: boolean | null
          is_perishable?: boolean | null
          loyalty_points_value?: number | null
          name?: string
          price?: number
          redemption_points_cost?: number | null
          stock_quantity?: number | null
          store_id?: string
          supplier_product_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_product_id_fkey"
            columns: ["supplier_product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved: boolean
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          store_id: string | null
        }
        Insert: {
          approved?: boolean
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          store_id?: string | null
        }
        Update: {
          approved?: boolean
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string | null
          id: string
          items: Json
          name: string
          notes: string | null
          store_id: string
          total_estimated_cost: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          items?: Json
          name: string
          notes?: string | null
          store_id: string
          total_estimated_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          items?: Json
          name?: string
          notes?: string | null
          store_id?: string
          total_estimated_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_operating_hours: {
        Row: {
          close_time: string | null
          created_at: string | null
          day_of_week: number
          id: string
          is_open: boolean
          open_time: string | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          close_time?: string | null
          created_at?: string | null
          day_of_week: number
          id?: string
          is_open?: boolean
          open_time?: string | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          close_time?: string | null
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_open?: boolean
          open_time?: string | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_operating_hours_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_special_days: {
        Row: {
          close_time: string | null
          created_at: string | null
          date: string
          id: string
          is_open: boolean
          open_time: string | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          close_time?: string | null
          created_at?: string | null
          date: string
          id?: string
          is_open?: boolean
          open_time?: string | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          close_time?: string | null
          created_at?: string | null
          date?: string
          id?: string
          is_open?: boolean
          open_time?: string | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_special_days_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          display_name: string | null
          id: string
          ifood_stock_alert_enabled: boolean | null
          ifood_stock_alert_threshold: number | null
          image_url: string | null
          is_active: boolean | null
          monitor_fullscreen_slideshow: boolean | null
          monitor_idle_timeout_seconds: number | null
          monitor_slide_disappear_minutes: number | null
          monitor_slide_mode: string | null
          monitor_slideshow_delay: number | null
          motoboy_whatsapp_number: string | null
          name: string
          perishable_control_enabled: boolean | null
          phone: string | null
          slug: string | null
          subscription_end_date: string | null
          subscription_plan:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          subscription_start_date: string | null
          updated_at: string | null
          whatsapp_ai_api_key: string | null
          whatsapp_ai_enabled: boolean | null
          whatsapp_ai_instructions: string | null
          whatsapp_enabled: boolean | null
          whatsapp_n8n_endpoint: string | null
          whatsapp_n8n_token: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          id?: string
          ifood_stock_alert_enabled?: boolean | null
          ifood_stock_alert_threshold?: number | null
          image_url?: string | null
          is_active?: boolean | null
          monitor_fullscreen_slideshow?: boolean | null
          monitor_idle_timeout_seconds?: number | null
          monitor_slide_disappear_minutes?: number | null
          monitor_slide_mode?: string | null
          monitor_slideshow_delay?: number | null
          motoboy_whatsapp_number?: string | null
          name: string
          perishable_control_enabled?: boolean | null
          phone?: string | null
          slug?: string | null
          subscription_end_date?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          subscription_start_date?: string | null
          updated_at?: string | null
          whatsapp_ai_api_key?: string | null
          whatsapp_ai_enabled?: boolean | null
          whatsapp_ai_instructions?: string | null
          whatsapp_enabled?: boolean | null
          whatsapp_n8n_endpoint?: string | null
          whatsapp_n8n_token?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          id?: string
          ifood_stock_alert_enabled?: boolean | null
          ifood_stock_alert_threshold?: number | null
          image_url?: string | null
          is_active?: boolean | null
          monitor_fullscreen_slideshow?: boolean | null
          monitor_idle_timeout_seconds?: number | null
          monitor_slide_disappear_minutes?: number | null
          monitor_slide_mode?: string | null
          monitor_slideshow_delay?: number | null
          motoboy_whatsapp_number?: string | null
          name?: string
          perishable_control_enabled?: boolean | null
          phone?: string | null
          slug?: string | null
          subscription_end_date?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          subscription_start_date?: string | null
          updated_at?: string | null
          whatsapp_ai_api_key?: string | null
          whatsapp_ai_enabled?: boolean | null
          whatsapp_ai_instructions?: string | null
          whatsapp_enabled?: boolean | null
          whatsapp_n8n_endpoint?: string | null
          whatsapp_n8n_token?: string | null
        }
        Relationships: []
      }
      subscription_history: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          start_date: string
          status: string
          store_id: string
          subscription_plan: Database["public"]["Enums"]["subscription_type"]
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          start_date: string
          status?: string
          store_id: string
          subscription_plan: Database["public"]["Enums"]["subscription_type"]
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          start_date?: string
          status?: string
          store_id?: string
          subscription_plan?: Database["public"]["Enums"]["subscription_type"]
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          cost_price: number | null
          created_at: string | null
          id: string
          product_id: string
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          cost_price?: number | null
          created_at?: string | null
          id?: string
          product_id: string
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          cost_price?: number | null
          created_at?: string | null
          id?: string
          product_id?: string
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          cnpj: string | null
          corporate_name: string
          created_at: string | null
          id: string
          phone: string | null
          store_id: string
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          corporate_name: string
          created_at?: string | null
          id?: string
          phone?: string | null
          store_id: string
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          corporate_name?: string
          created_at?: string | null
          id?: string
          phone?: string | null
          store_id?: string
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          annual_price: number
          created_at: string | null
          id: string
          is_subscription_active: boolean
          monthly_price: number
          updated_at: string | null
        }
        Insert: {
          annual_price?: number
          created_at?: string | null
          id?: string
          is_subscription_active?: boolean
          monthly_price?: number
          updated_at?: string | null
        }
        Update: {
          annual_price?: number
          created_at?: string | null
          id?: string
          is_subscription_active?: boolean
          monthly_price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      task_checklist_items: {
        Row: {
          created_at: string | null
          id: string
          is_completed: boolean
          order_index: number
          task_id: string
          text: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_completed?: boolean
          order_index: number
          task_id: string
          text: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_completed?: boolean
          order_index?: number
          task_id?: string
          text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_columns: {
        Row: {
          created_at: string | null
          id: string
          name: string
          order_index: number
          store_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          order_index: number
          store_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          order_index?: number
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_columns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      task_media: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_media_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          column_id: string
          created_at: string | null
          description: string | null
          id: string
          is_completed: boolean
          is_recurring: boolean
          last_recurrence_date: string | null
          order_index: number
          recurrence_interval: string | null
          store_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          column_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean
          is_recurring?: boolean
          last_recurrence_date?: string | null
          order_index: number
          recurrence_interval?: string | null
          store_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          column_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean
          is_recurring?: boolean
          last_recurrence_date?: string | null
          order_index?: number
          recurrence_interval?: string | null
          store_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "task_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      time_clock_records: {
        Row: {
          break_duration: number | null
          clock_in: string
          clock_out: string | null
          created_at: string | null
          employee_id: string
          id: string
          notes: string | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          break_duration?: number | null
          clock_in: string
          clock_out?: string | null
          created_at?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          break_duration?: number | null
          clock_in?: string
          clock_out?: string | null
          created_at?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_clock_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_records_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      upsell_rules: {
        Row: {
          created_at: string | null
          discount_price: number | null
          id: string
          is_active: boolean
          min_cart_total: number | null
          product_id: string
          store_id: string
          trigger_type: string
          updated_at: string | null
          use_discount: boolean
        }
        Insert: {
          created_at?: string | null
          discount_price?: number | null
          id?: string
          is_active?: boolean
          min_cart_total?: number | null
          product_id: string
          store_id: string
          trigger_type: string
          updated_at?: string | null
          use_discount?: boolean
        }
        Update: {
          created_at?: string | null
          discount_price?: number | null
          id?: string
          is_active?: boolean
          min_cart_total?: number | null
          product_id?: string
          store_id?: string
          trigger_type?: string
          updated_at?: string | null
          use_discount?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "upsell_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_rules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          store_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          store_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_campaigns: {
        Row: {
          created_at: string | null
          id: string
          last_run_at: string | null
          message: string
          name: string
          rule_params: Json | null
          rule_type: string
          status: string | null
          store_id: string
          total_failed: number | null
          total_sent: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_run_at?: string | null
          message: string
          name: string
          rule_params?: Json | null
          rule_type: string
          status?: string | null
          store_id: string
          total_failed?: number | null
          total_sent?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_run_at?: string | null
          message?: string
          name?: string
          rule_params?: Json | null
          rule_type?: string
          status?: string | null
          store_id?: string
          total_failed?: number | null
          total_sent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_campaigns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_carts: {
        Row: {
          client_number: string
          created_at: string | null
          id: string
          items: Json | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          client_number: string
          created_at?: string | null
          id?: string
          items?: Json | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          client_number?: string
          created_at?: string | null
          id?: string
          items?: Json | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_carts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          ai_enabled: boolean | null
          client_name: string | null
          client_number: string
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          sender: string
          store_id: string
        }
        Insert: {
          ai_enabled?: boolean | null
          client_name?: string | null
          client_number: string
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          sender: string
          store_id: string
        }
        Update: {
          ai_enabled?: boolean | null
          client_name?: string | null
          client_number?: string
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          sender?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_shortcuts: {
        Row: {
          command: string
          created_at: string | null
          id: string
          menu_items: Json | null
          message: string
          show_buttons: boolean | null
          store_id: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          command: string
          created_at?: string | null
          id?: string
          menu_items?: Json | null
          message: string
          show_buttons?: boolean | null
          store_id: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          command?: string
          created_at?: string | null
          id?: string
          menu_items?: Json | null
          message?: string
          show_buttons?: boolean | null
          store_id?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_shortcuts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      work_schedules: {
        Row: {
          created_at: string | null
          day_of_week: number
          employee_id: string
          end_time: string
          id: string
          start_time: string
          store_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          employee_id: string
          end_time: string
          id?: string
          start_time: string
          store_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          employee_id?: string
          end_time?: string
          id?: string
          start_time?: string
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_schedules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_monthly_financial_summary: {
        Row: {
          month: string | null
          store_id: string | null
          total: number | null
          transaction_count: number | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      v_overdue_accounts_receivable: {
        Row: {
          amount: number | null
          bank_account_id: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          days_overdue: number | null
          description: string | null
          due_date: string | null
          id: string | null
          notes: string | null
          payment_method: string | null
          received_date: string | null
          status: string | null
          store_id: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          bank_account_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          days_overdue?: never
          description?: string | null
          due_date?: string | null
          id?: string | null
          notes?: string | null
          payment_method?: string | null
          received_date?: string | null
          status?: string | null
          store_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          bank_account_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          days_overdue?: never
          description?: string | null
          due_date?: string | null
          id?: string | null
          notes?: string | null
          payment_method?: string | null
          received_date?: string | null
          status?: string | null
          store_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      v_store_financial_balance: {
        Row: {
          accounts_count: number | null
          store_id: string | null
          total_balance: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_default_financial_categories: {
        Args: { p_store_id: string }
        Returns: undefined
      }
      generate_order_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "store_manager" | "cashier"
      order_source:
        | "totem"
        | "whatsapp"
        | "loja_online"
        | "presencial"
        | "ifood"
      order_status:
        | "pending"
        | "preparing"
        | "ready"
        | "delivered"
        | "cancelled"
      subscription_type: "free" | "monthly" | "annual"
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
      app_role: ["admin", "store_manager", "cashier"],
      order_source: ["totem", "whatsapp", "loja_online", "presencial", "ifood"],
      order_status: ["pending", "preparing", "ready", "delivered", "cancelled"],
      subscription_type: ["free", "monthly", "annual"],
    },
  },
} as const
