import { UserPicker } from "@/components/UserPicker";
import { listUsers } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EntrarPage() {
  const users = await listUsers();
  return <UserPicker users={users} />;
}
