import { redirect } from "next/navigation";

type Props = {
  params: { id: string };
};

export default async function CampaignAnalyticsPage({ params }: Props) {
  redirect(`/campaigns/${params.id}`);
}
