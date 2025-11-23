import React from "react";

export default function ComproLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This route-level layout intentionally omits the global topbar/footer.
  // It overrides `app/layout.tsx` for the `/compro` route and renders only the page content.
  return <>{children}</>;
}
