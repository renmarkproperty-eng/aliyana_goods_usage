export type Database = {
  public: {
    Tables: {
      master_departemen: {
        Row: {
          id: number;
          nama: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          nama: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          nama?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      master_satuan: {
        Row: {
          id: number;
          nama: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          nama: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          nama?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      master_purpose: {
        Row: {
          id: number;
          name: string;
        };
        Insert: {
          id?: number;
          name: string;
        };
        Update: {
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: number;
          username: string;
          password: string;
          role: "pic" | "admin";
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          username: string;
          password: string;
          role?: "pic" | "admin";
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          username?: string;
          password?: string;
          role?: "pic" | "admin";
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      users_detail: {
        Row: {
          id: number;
          user_id: number;
          nama: string;
          departemen_id: number;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: number;
          nama: string;
          departemen_id: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: number;
          nama?: string;
          departemen_id?: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_detail_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_detail_departemen_id_fkey";
            columns: ["departemen_id"];
            isOneToOne: false;
            referencedRelation: "master_departemen";
            referencedColumns: ["id"];
          },
        ];
      };
      pengambilan_barang: {
        Row: {
          id: number;
          tanggal: string;
          user_id: number;
          shift: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          tanggal: string;
          user_id: number;
          shift: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          tanggal?: string;
          user_id?: number;
          shift?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pengambilan_barang_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      detail_pengambilan_barang: {
        Row: {
          id: number;
          pengambilan_barang_id: number;
          nama_barang: string;
          satuan_id: number;
          jumlah_diambil: number;          jumlah_terpakai: number;
          sisa: number;
          keterangan: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          pengambilan_barang_id: number;
          nama_barang: string;
          satuan_id: number;
          jumlah_diambil: number;          jumlah_terpakai: number;
          keterangan: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          pengambilan_barang_id?: number;
          nama_barang?: string;
          satuan_id?: number;
          jumlah_diambil?: number;          jumlah_terpakai?: number;
          keterangan?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "detail_pengambilan_barang_pengambilan_barang_id_fkey";
            columns: ["pengambilan_barang_id"];
            isOneToOne: false;
            referencedRelation: "pengambilan_barang";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "detail_pengambilan_barang_satuan_id_fkey";
            columns: ["satuan_id"];
            isOneToOne: false;
            referencedRelation: "master_satuan";
            referencedColumns: ["id"];
          },
        ];
      };
      detail_pemakaian_menu: {
        Row: {
          id: number;
          detail_pengambilan_barang_id: number;
          menu: string;
          jumlah: number;
          purpose_id: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          detail_pengambilan_barang_id: number;
          menu: string;
          jumlah: number;
          purpose_id: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          detail_pengambilan_barang_id?: number;
          menu?: string;
          jumlah?: number;
          purpose_id?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "detail_pemakaian_menu_detail_pengambilan_barang_id_fkey";
            columns: ["detail_pengambilan_barang_id"];
            isOneToOne: false;
            referencedRelation: "detail_pengambilan_barang";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "detail_pemakaian_menu_purpose_id_fkey";
            columns: ["purpose_id"];
            isOneToOne: false;
            referencedRelation: "master_purpose";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
