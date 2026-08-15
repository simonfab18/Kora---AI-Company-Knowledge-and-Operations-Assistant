import { updatePasswordAction } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth-shell";
import { PasswordResetForm } from "@/components/password-reset-form";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Choose new password" };

export default async function UpdatePasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AuthShell
      eyebrow="New password"
      title="Set a new password."
      description="Choose a new password for your Kora account. After updating it, you will be sent back to the protected app."
    >
      <PasswordResetForm mode="update" action={updatePasswordAction} />
    </AuthShell>
  );
}
