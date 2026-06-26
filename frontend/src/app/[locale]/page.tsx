import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth-actions";

export default async function RootLocalePage({ params }: { params: { locale: string } }) {
  const user = await getServerUser();
  if (user) redirect(`/${params.locale}/dashboard`);
  redirect(`/${params.locale}/login`);
}
