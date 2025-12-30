import { getRelationship } from "@/lib/next/relationship";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const relationship = await getRelationship();

  if (!relationship) {
    redirect("/pair");
  }

  return <>{children}</>;
}
