import { supabase } from "@/integrations/supabase/client";

export const USERNAME_PATTERN = /^[A-Za-z0-9_-]{3,24}$/;

export function normalizeUsername(value: string) {
  return value.trim();
}

/** Returns an error message, or null when the username looks valid. */
export function validateUsername(value: string): string | null {
  const username = normalizeUsername(value);
  if (!username) return "Please choose a username.";
  if (username.length < 3) return "Usernames need at least 3 characters.";
  if (username.length > 24) return "Usernames can be at most 24 characters.";
  if (!USERNAME_PATTERN.test(username))
    return "Use letters, numbers, hyphens and underscores only.";
  return null;
}

export async function isUsernameAvailable(value: string): Promise<boolean | null> {
  const username = normalizeUsername(value);
  if (validateUsername(username)) return null;
  const { data, error } = await supabase.rpc("username_available", { _username: username });
  if (error) return null;
  return data === true;
}
