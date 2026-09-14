import { supabase } from '../config/supabase.js';

/**
 * supabase.auth.admin.listUsers() only returns 50 users per page by default.
 * Any code that needs to check "does a user with this email exist" or search
 * across the whole user base must paginate through every page, otherwise
 * users beyond the first page are silently invisible (broken duplicate-email
 * checks, broken password-reset existence checks, broken user search).
 *
 * This helper walks all pages and returns the full user list.
 * For very large user bases, prefer a dedicated `profiles` table with a
 * unique index on email instead of scanning auth.users like this.
 */
export async function listAllUsers({ perPage = 200 } = {}) {
  const allUsers = [];
  let page = 1;

  // Safety cap so a bug in the pagination logic can never loop forever.
  const MAX_PAGES = 1000;

  while (page <= MAX_PAGES) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data?.users || [];
    allUsers.push(...users);

    if (users.length < perPage) {
      break;
    }
    page += 1;
  }

  return allUsers;
}

export async function findUserByEmail(email) {
  const normalized = email.trim().toLowerCase();
  const users = await listAllUsers();
  return users.find((user) => user.email?.toLowerCase() === normalized) || null;
}
