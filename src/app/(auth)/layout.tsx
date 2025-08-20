export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No sidebar, header, or footer on auth pages
  return <>{children}</>
}
