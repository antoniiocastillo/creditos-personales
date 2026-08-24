import { createClient } from '@/lib/supabase/server';

export type Profile = {
  id: string;
  full_name: string;
  role: 'admin' | 'operator';
  active: boolean;
};

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('id,full_name,role,active').eq('id', user.id).single();
  return data as Profile | null;
}
