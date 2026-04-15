// Bare layout for /design-v2 — removes the global Navbar + max-w-7xl shell.
// The DesignEditorV2 component uses `fixed inset-0` to own the full viewport.
export default function DesignV2Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
