import { redirect } from "next/navigation";
import { getSession } from "@/lib/next/session";
import { LandingContent } from "./landing-content";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/home");
  }
  return <LandingContent />;
}
