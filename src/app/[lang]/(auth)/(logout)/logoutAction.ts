"use server";

import { redirect } from "next/navigation";
import { signOut } from "../../../../../auth";

export async function logoutAction(locale: string) {
  await signOut({ redirect: false });
  redirect(`/${locale}/login`);
}

