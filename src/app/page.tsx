// app/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";

  const locale = acceptLanguage.startsWith("en") ? "en" : "pt";

  redirect(`/${locale}`);
}
