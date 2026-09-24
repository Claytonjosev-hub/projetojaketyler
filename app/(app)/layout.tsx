import { redirect } from "next/navigation";
import { BottomTabBar } from "@/components/BottomTabBar";
import { getSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { current } = await getSession();
  if (!current) {
    redirect("/entrar");
  }

  return (
    <div className="pb-24">
      {children}
      <BottomTabBar />
    </div>
  );
}
