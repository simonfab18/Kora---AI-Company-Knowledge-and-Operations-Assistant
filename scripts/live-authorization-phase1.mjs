import { randomBytes } from "node:crypto";
import { loadEnvFile } from "node:process";
import { createClient } from "@supabase/supabase-js";

loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !publishableKey || !serviceRoleKey) {
  throw new Error("Supabase URL, publishable key, and service-role key are required.");
}

const service = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
const password = `Kora-${randomBytes(18).toString("base64url")}!7`;
const identities = ["owner-a", "owner-b", "admin", "member"].map((role) => ({
  role,
  email: `kora-phase1-${role}-${suffix}@example.com`,
}));
const userIds = [];
const organizationIds = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectDenied(label, operation) {
  const result = await operation();
  assert(result.error, `${label}: operation unexpectedly succeeded`);
  assert(result.error.code !== "PGRST202", `${label}: RPC was missing instead of authorization being denied`);
  console.log(`PASS ${label}`);
}

async function createAuthenticatedClient(email) {
  const client = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw error ?? new Error(`No session for ${email}`);
  return client;
}

try {
  const users = {};
  for (const identity of identities) {
    const { data, error } = await service.auth.admin.createUser({
      email: identity.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `Phase 1 ${identity.role}` },
    });
    if (error || !data.user) throw error ?? new Error(`Could not create ${identity.role}`);
    users[identity.role] = data.user.id;
    userIds.push(data.user.id);
  }

  const ownerA = await createAuthenticatedClient(identities[0].email);
  const ownerB = await createAuthenticatedClient(identities[1].email);
  const admin = await createAuthenticatedClient(identities[2].email);
  const member = await createAuthenticatedClient(identities[3].email);
  const anonymous = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: orgA, error: orgAError } = await ownerA.rpc("create_organization", {
    p_name: `Phase One A ${suffix}`,
    p_slug: `phase-one-a-${suffix}`,
  });
  if (orgAError || !orgA) throw orgAError ?? new Error("Organization A was not created");
  organizationIds.push(orgA);

  const { data: orgB, error: orgBError } = await ownerB.rpc("create_organization", {
    p_name: `Phase One B ${suffix}`,
    p_slug: `phase-one-b-${suffix}`,
  });
  if (orgBError || !orgB) throw orgBError ?? new Error("Organization B was not created");
  organizationIds.push(orgB);

  const { error: seedError } = await service.from("organization_members").insert([
    { organization_id: orgA, user_id: users.admin, role: "admin", status: "active", invited_by: users["owner-a"], joined_at: new Date().toISOString() },
    { organization_id: orgA, user_id: users.member, role: "member", status: "active", invited_by: users["owner-a"], joined_at: new Date().toISOString() },
  ]);
  if (seedError) throw seedError;

  await expectDenied("anonymous direct organization write", () =>
    anonymous.from("organizations").update({ name: "Blocked" }).eq("id", orgA),
  );
  await expectDenied("anonymous hardened RPC", () =>
    anonymous.rpc("update_organization_profile", { p_organization_id: orgA, p_name: "Blocked", p_slug: "blocked" }),
  );
  await expectDenied("member organization update", () =>
    member.rpc("update_organization_profile", { p_organization_id: orgA, p_name: "Blocked", p_slug: "blocked" }),
  );
  await expectDenied("member membership update", () =>
    member.rpc("update_organization_member_role", { p_organization_id: orgA, p_user_id: users.admin, p_role: "member" }),
  );
  await expectDenied("admin direct self-promotion", () =>
    admin.from("organization_members").update({ role: "owner" }).eq("organization_id", orgA).eq("user_id", users.admin),
  );
  await expectDenied("admin RPC self-promotion", () =>
    admin.rpc("update_organization_member_role", { p_organization_id: orgA, p_user_id: users.admin, p_role: "owner" }),
  );
  await expectDenied("admin owner edit", () =>
    admin.rpc("disable_organization_member", { p_organization_id: orgA, p_user_id: users["owner-a"] }),
  );
  await expectDenied("admin cross-organization access", () =>
    admin.rpc("update_organization_profile", { p_organization_id: orgB, p_name: "Blocked", p_slug: "blocked" }),
  );

  const { error: ownerProfileError } = await ownerA.rpc("update_organization_profile", {
    p_organization_id: orgA,
    p_name: `Phase One A ${suffix}`,
    p_slug: `phase-one-a-${suffix}`,
  });
  if (ownerProfileError) throw ownerProfileError;
  console.log("PASS owner safe organization update");

  const { error: adminMemberError } = await admin.rpc("update_organization_member_role", {
    p_organization_id: orgA,
    p_user_id: users.member,
    p_role: "member",
  });
  if (adminMemberError) throw adminMemberError;
  console.log("PASS admin manages non-owner member");

  await expectDenied("service-role owner_user_id mutation", () =>
    service.from("organizations").update({ owner_user_id: users.admin }).eq("id", orgA),
  );
  await expectDenied("service-role owner disable", () =>
    service.from("organization_members").update({ status: "disabled" }).eq("organization_id", orgA).eq("user_id", users["owner-a"]),
  );
  await expectDenied("service-role owner removal", () =>
    service.from("organization_members").delete().eq("organization_id", orgA).eq("user_id", users["owner-a"]),
  );

  console.log("Phase 1 live JWT authorization suite passed.");
} finally {
  for (const organizationId of organizationIds.reverse()) {
    const { error } = await service.from("organizations").delete().eq("id", organizationId);
    if (error) console.error(`Cleanup warning: organization ${organizationId} was not removed: ${error.message}`);
  }
  for (const userId of userIds.reverse()) {
    const { error } = await service.auth.admin.deleteUser(userId);
    if (error) console.error(`Cleanup warning: test user was not removed: ${error.message}`);
  }
}