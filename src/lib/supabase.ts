import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  
  return supabaseInstance;
}

let authPromise: Promise<any> | null = null;

export async function ensureAuth() {
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;
  
  // If no session, we don't auto-login anymore. 
  // The UI should handle redirecting to login.
  return null;
}

export async function signIn(email: string, pass: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, pass: string, name: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      data: {
        display_name: name,
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function resetPassword(email: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getClinics() {
  await ensureAuth();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('clinics')
    .select('id, name, unidade, external_id')
    .eq('active', true);
  
  if (error) {
    console.error('Error fetching clinics:', error);
    return [];
  }
  return data || [];
}

export async function getDentists(clinicId: string) {
  await ensureAuth();
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('dentistas')
    .select('id, nome_completo, status, clinic_id')
    .eq('clinic_id', clinicId)
    .eq('status', true);
    
  if (error) {
    console.error('Error fetching dentists:', error);
    return [];
  }
  
  return (data || []).map((d: any) => ({
    id: String(d.id),
    name: d.nome_completo,
    nome_completo: d.nome_completo,
    specialty: 'Dentista',
    is_active: d.status,
    clinic_id: d.clinic_id
  }));
}

export async function searchPatients(query: string, clinic?: any) {
  await ensureAuth();
  const supabase = getSupabase();
  
  const searchStr = query.trim();
  if (!searchStr) return [];

  console.time(`searchPatients-${searchStr}`);
  console.log('Searching patients with query:', searchStr, 'for clinic:', clinic?.id);
  
  // Try searching in the specific clinic first
  // We'll try to select everything first to see what we get if there's an error
  let q = supabase
    .from('patients')
    .select('*')
    .ilike('name', `%${searchStr}%`);

  if (clinic && clinic.id) {
    q = q.eq('tenant_id', clinic.id);
  }

  let { data, error } = await q.limit(20); 
  
  if (error) {
    console.error('Error in primary patient search:', error);
    // If it's a column error, maybe 'name' doesn't exist? Try 'nome' or 'nome_completo'
    if (error.message.includes('column "name" does not exist')) {
       console.log('Column "name" not found, trying "nome_completo"...');
       let q2 = supabase.from('patients').select('*').ilike('nome_completo', `%${searchStr}%`);
       if (clinic && clinic.id) q2 = q2.eq('tenant_id', clinic.id);
       const { data: d2, error: e2 } = await q2.limit(20);
       data = d2;
       error = e2;
    }
  }

  // Fallback: If no results in the clinic, try a global search to help diagnose
  if (!error && (!data || data.length === 0) && clinic && clinic.id) {
    console.log('No results in clinic, trying global search (ignoring tenant_id)...');
    const { data: globalData, error: globalError } = await supabase
      .from('patients')
      .select('*')
      .ilike('name', `%${searchStr}%`)
      .limit(10);
      
    if (!globalError && globalData && globalData.length > 0) {
      console.log('Found results in global search:', globalData.length);
      data = globalData;
    } else if (globalError) {
      // Try nome_completo global
      const { data: gd2 } = await supabase.from('patients').select('*').ilike('nome_completo', `%${searchStr}%`).limit(10);
      if (gd2 && gd2.length > 0) data = gd2;
    }
  }

  console.timeEnd(`searchPatients-${searchStr}`);
  
  // Map data to ensure it has a 'name' property for the UI
  const mappedData = (data || []).map((p: any) => ({
    ...p,
    name: p.name || p.nome_completo || p.nome || 'Sem Nome'
  }));

  console.log('Search results count:', mappedData.length);
  return mappedData;
}

export async function createPatient(patientData: any) {
  await ensureAuth();
  const supabase = getSupabase();
  
  // Simplified payload for 'patients' table
  const payload = {
    name: patientData.name,
    tenant_id: patientData.tenant_id,
    document_id: patientData.document_id,
    email: patientData.email,
    mobile_phone: patientData.mobile_phone,
    is_active: true,
    is_deleted: false
  };

  const { data, error } = await supabase
    .from('patients')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error creating patient:', error);
    throw error;
  }

  return data;
}

export async function createSession(clinicId: string, dentistId: string | number, patientId: string) {
  await ensureAuth();
  const supabase = getSupabase();
  
  const payload = {
    id_clinic: clinicId,
    id_dentist: typeof dentistId === 'string' ? parseInt(dentistId, 10) : dentistId,
    id_patient: patientId
  };

  const { data, error } = await supabase
    .from('sessions')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
    throw error;
  }

  return data;
}

export async function uploadImage(blob: Blob, path: string) {
  await ensureAuth();
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from('captures')
    .upload(path, blob);
  if (error) throw error;
  return data;
}

export async function saveImageRecord(capture: any) {
  const session = await ensureAuth();
  if (!session) throw new Error('Usuário não autenticado');
  
  const supabase = getSupabase();
  
  const payload = {
    id_session: capture.id_session,
    storage_path: capture.storage_path,
    metadata: {
      user_id: session.user.id,
      id_clinic: capture.id_clinic,
      id_dentist: typeof capture.id_dentist === 'string' ? parseInt(capture.id_dentist, 10) : capture.id_dentist,
      id_patient: capture.id_patient,
      name: capture.name,
      notes: capture.notes,
      file_size: capture.blob.size,
      odontogram: capture.odontogram_data
    }
  };

  const { data, error } = await supabase
    .from('images')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error saving image record:', error);
    throw error;
  }
  return data;
}

export async function getPatientHistory(patientId: string) {
  await ensureAuth();
  const supabase = getSupabase();
  
  console.time(`getPatientHistory-${patientId}`);
  console.log('Fetching history for patient:', patientId);
  
  // Busca imagens onde o id_patient está dentro do JSONB metadata
  // Usando .contains para maior compatibilidade com JSONB
  let { data, error } = await supabase
    .from('images')
    .select('*')
    .contains('metadata', { id_patient: patientId })
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching patient history with .contains:', error);
    
    // Fallback: Try searching by id_patient if it's a top-level column
    console.log('Trying fallback search by id_patient column...');
    const { data: d2, error: e2 } = await supabase
      .from('images')
      .select('*')
      .eq('id_patient', patientId)
      .order('created_at', { ascending: false });
      
    if (!e2 && d2) {
      data = d2;
      error = null;
    } else {
       // Try metadata ->> id_patient (Postgres JSON operator) if supported via raw filter
       // but .contains is usually better. 
    }
  }
  
  console.log('History data found:', data?.length || 0, 'records');
  console.timeEnd(`getPatientHistory-${patientId}`);
  return data || [];
}
