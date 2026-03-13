import { redirect } from "next/navigation";

export default function DashboardLayout() {
  // v1: Dashboard is intentionally hidden. Keep the route for later stages.
  redirect("/chat");
}

