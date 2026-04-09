export interface Clinic {
  id: string;
  name: string;
  unidade: string;
}

export interface Dentist {
  id: string;
  name: string;
  nome_completo?: string;
  specialty?: string;
  is_active: boolean;
  unidade?: string;
  clinic_id?: string;
}

export interface Patient {
  id: string;
  name: string;
  nickname?: string;
  document_id?: string;
  mobile_phone?: string;
  email?: string;
  tenant_id?: string;
  is_active?: boolean;
  is_deleted?: boolean;
}

export interface Session {
  id: string;
  id_clinic: string;
  id_dentist: string;
  id_patient: string;
  created_at: number;
}

export interface Capture {
  id: string;
  blob: Blob;
  name: string;
  notes: string;
  timestamp: number;
  id_session?: string;
  id_patient?: string;
  id_dentist?: string;
  id_clinic?: string;
  sync_status: 'pending' | 'synced' | 'error';
  is_edited?: boolean;
  storage_path?: string;
  odontogram_data?: {
    denticao: string;
    dentes_selecionados: string[];
  };
}
