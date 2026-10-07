/**
 * Who may use the Complete interface.
 *
 * CopyZap has two interfaces on one engine. Quick is open to every signed-in
 * user. Complete (Copy Maker, Dashboard and the rest) is for power users and
 * admins. The flag lives in `pmc_users.power_user`; only an admin can change
 * it (the database refuses anyone else).
 *
 * This is about which screens a user is shown, not about protecting data: both
 * interfaces use the same engine and the same per-user data rules. So when the
 * flag cannot be read (a network error), the user keeps the access they would
 * have had before the flag existed, rather than being locked out of their work.
 */
import { User } from '../types';
import { getIsAdmin } from './adminService';
import { supabase } from './supabaseClient';

let cached: { userId: string; allowed: boolean } | null = null;

/** Forget what is known, for example after signing out or after an admin changed a flag. */
export function resetCompleteAccess(): void {
  cached = null;
}

/** True when this user may use the Complete interface. */
export async function getCompleteAccess(user: Pick<User, 'id' | 'email'> | null | undefined): Promise<boolean> {
  if (!user?.id) return false;
  if (cached && cached.userId === user.id) return cached.allowed;

  let allowed: boolean;
  try {
    if (await getIsAdmin(user as User)) {
      allowed = true;
    } else {
      const { data, error } = await supabase.from('pmc_users').select('power_user').eq('id', user.id).maybeSingle();
      // Not readable: leave things as they were before the flag existed, and do not remember it.
      if (error) return true;
      allowed = data?.power_user === true;
    }
  } catch {
    return true;
  }

  cached = { userId: user.id, allowed };
  return allowed;
}

/** Admin only: the flag of every user, by user id. */
export async function listPowerUsers(): Promise<Record<string, boolean>> {
  const { data, error } = await supabase.from('pmc_users').select('id, power_user');
  if (error) throw new Error(error.message || 'The power-user settings could not be loaded.');
  const flags: Record<string, boolean> = {};
  for (const row of (data as { id: string; power_user: boolean | null }[] | null) ?? []) {
    flags[row.id] = row.power_user === true;
  }
  return flags;
}

/** Admin only: switch a user between the Complete interface and Quick only. */
export async function setPowerUser(userId: string, powerUser: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_set_power_user', { p_user_id: userId, p_power_user: powerUser });
  if (error) throw new Error(error.message || 'The setting could not be changed.');
  resetCompleteAccess();
}
