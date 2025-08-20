import { getServerSession } from "@/lib/supabase/server"
import { ProfileForm } from "@/components/profile-form"

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getServerSession()
  const user = session?.user

  const email = user?.email ?? ""
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.identities?.[0]?.identity_data?.name as string | undefined) ||
    (email ? email.split("@")[0] : "") ||
    ""
  const zip = (user?.user_metadata?.zip as string | undefined) || ""
  const timezone =
    (user?.user_metadata?.timezone as string | undefined) || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"

  return (
    <div className="p-0">
      <div className="w-full mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile settings. Your timezone setting will automatically determine your weather location on the dashboard. Your email cannot be changed here; other details can be updated.
        </p>

        <div className="mt-6 space-y-6">
          <ProfileForm initialEmail={email} initialFullName={fullName} initialZip={zip} initialTimezone={timezone} />
        </div>
      </div>
    </div>
  )
}
