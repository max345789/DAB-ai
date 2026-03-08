import { notFound } from "next/navigation";
import { LeadProfile } from "@/components/LeadProfile";
import { getLeads } from "@/lib/api";

type Props = {
  params: { id: string };
};

export default async function LeadProfilePage({ params }: Props) {
  const leads = await getLeads();
  const lead = leads.find((item) => item.id === params.id);

  if (!lead) {
    notFound();
  }

  return <LeadProfile lead={lead} />;
}
