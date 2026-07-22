import { createServerFn } from "@tanstack/react-start";

const ADMIN_EMAIL = "adminalpottica@alpottica.com";
const ADMIN_PASSWORD = "Ays10112006!";

export const ensureAdminUser = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Check if user exists
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL);

  let userId = existing?.id;

  if (!existing) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Alpottica Admin" },
    });
    if (error) throw new Error(error.message);
    userId = data.user?.id;
  } else {
    // Ensure password and confirmed
    await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
  }

  if (userId) {
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: userId, role: "admin" },
      { onConflict: "user_id,role" },
    );
    await supabaseAdmin.from("profiles").upsert(
      { id: userId, full_name: "Alpottica Admin" },
      { onConflict: "id" },
    );
  }

  return { ok: true, email: ADMIN_EMAIL };
});
