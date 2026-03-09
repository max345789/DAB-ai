export type DashboardMetrics = {
  totalLeads: number;
  activeCampaigns: number;
  adSpend: number;
  costPerLead: number;
  revenue: number;
  roas: number;
  recentActions: string[];
  spendOverTime: { date: string; spend: number }[];
  leadsOverTime: { date: string; leads: number }[];
  conversionTrend: { date: string; rate: number }[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  status?: "processing" | "streaming" | "complete";
};

export type LeadStatus = "hot" | "warm" | "cold";

export type ConversationEntry = {
  id: string;
  by: "lead" | "agent";
  content: string;
  date: string;
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  company: string;
  source: string;
  status: LeadStatus;
  leadScore: number;
  meetingStatus: "scheduled" | "pending" | "none";
  attribution: string;
  createdAt: string;
  budget?: string;
  message?: string;
  assignedCampaign?: string;
  history?: ConversationEntry[];
  lastContacted?: string;
};

export type CampaignStatus = "active" | "paused" | "draft";

export type Campaign = {
  id: string;
  name: string;
  platform: "Meta" | "Google" | "LinkedIn";
  dailyBudget: number;
  status: CampaignStatus;
  leadsGenerated: number;
  spend: number;
  costPerLead: number;
  conversionRate: number;
  createdAt: string;
  spendOverTime: number[];
  leadsPerDay: number[];
  audience?: string;
  productService?: string;
  location?: string;
  goal?: "Lead Generation" | "Traffic" | "Sales";
  generatedAd?: {
    headline: string;
    description: string;
    cta: string;
  };
};

export type FinanceSummary = {
  totalAdSpend: number;
  totalRevenue: number;
  costPerLead: number;
  roas: number;
  spendOverTime: { date: string; spend: number }[];
  spendVsRevenue: { date: string; spend: number; revenue: number }[];
  campaignProfitability: { name: string; profit: number }[];
};

export type CampaignFinance = {
  id: string;
  dailySpend: number;
  leadsGenerated: number;
  revenue: number;
  costPerLead: number;
  conversionRate: number;
  trend: "profitable" | "moderate" | "losing";
};

export type OptimizationSuggestion = {
  id: string;
  message: string;
  action: "increase_budget" | "pause" | "adjust_targeting";
};

/**
 * API_BASE resolves to:
 *   – Production: the value of NEXT_PUBLIC_API_BASE (e.g. https://api.yourdomain.com/api)
 *   – Local dev:  empty string → fetch("/api/...") is rewritten by next.config.ts → localhost:5000
 *
 * All fetch paths below are relative to this base.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

const mockDashboard: DashboardMetrics = {
  totalLeads: 1248,
  activeCampaigns: 6,
  adSpend: 28420,
  costPerLead: 18.6,
  revenue: 78200,
  roas: 2.75,
  recentActions: ["Ad campaign created", "New lead captured", "Meeting booked"],
  spendOverTime: [
    { date: "Mar 1", spend: 3800 },
    { date: "Mar 2", spend: 4100 },
    { date: "Mar 3", spend: 3950 },
    { date: "Mar 4", spend: 4500 },
    { date: "Mar 5", spend: 4300 },
    { date: "Mar 6", spend: 3900 },
    { date: "Mar 7", spend: 3870 },
  ],
  leadsOverTime: [
    { date: "Mar 1", leads: 180 },
    { date: "Mar 2", leads: 210 },
    { date: "Mar 3", leads: 195 },
    { date: "Mar 4", leads: 240 },
    { date: "Mar 5", leads: 220 },
    { date: "Mar 6", leads: 205 },
    { date: "Mar 7", leads: 198 },
  ],
  conversionTrend: [
    { date: "Mar 1", rate: 4.2 },
    { date: "Mar 2", rate: 4.6 },
    { date: "Mar 3", rate: 4.4 },
    { date: "Mar 4", rate: 5.1 },
    { date: "Mar 5", rate: 4.9 },
    { date: "Mar 6", rate: 4.7 },
    { date: "Mar 7", rate: 4.8 },
  ],
};

const mockLeads: Lead[] = [
  {
    id: "lead_1",
    name: "Amelia Rhodes",
    email: "amelia@rhodesgroup.com",
    company: "Rhodes Group",
    source: "Meta Ads",
    status: "hot",
    leadScore: 92,
    meetingStatus: "scheduled",
    attribution: "Luxury Buyers Q2",
    createdAt: "2026-03-06",
    budget: "$5,000",
    message: "Looking for premium buyer leads in Austin.",
    assignedCampaign: "Luxury Buyers Q2",
    history: [
      {
        id: "h1",
        by: "lead",
        content: "Interested in a campaign focused on luxury listings.",
        date: "2026-03-06",
      },
      {
        id: "h2",
        by: "agent",
        content: "Sent initial proposal and ad concepts.",
        date: "2026-03-07",
      },
    ],
  },
  {
    id: "lead_2",
    name: "Jordan Lee",
    email: "jordan@eastfield.io",
    company: "Eastfield Realty",
    source: "Google Ads",
    status: "warm",
    leadScore: 76,
    meetingStatus: "pending",
    attribution: "Rental Demand Surge",
    createdAt: "2026-03-05",
    budget: "$2,500",
    message: "Need steady inbound leads for rental properties.",
    assignedCampaign: "Rental Demand Surge",
    history: [
      {
        id: "h3",
        by: "lead",
        content: "Looking for a 30-day pilot to test ad performance.",
        date: "2026-03-05",
      },
      {
        id: "h4",
        by: "agent",
        content: "Scheduled follow-up call for campaign alignment.",
        date: "2026-03-06",
      },
    ],
  },
  {
    id: "lead_3",
    name: "Priya Nair",
    email: "priya@northpeak.ai",
    company: "Northpeak Homes",
    source: "Referral",
    status: "cold",
    leadScore: 54,
    meetingStatus: "none",
    attribution: "Starter Awareness",
    createdAt: "2026-03-02",
    budget: "$1,200",
    message: "Exploring options for local market ads.",
    assignedCampaign: "Starter Awareness",
    history: [
      {
        id: "h5",
        by: "agent",
        content: "Shared case study and lead magnet example.",
        date: "2026-03-03",
      },
    ],
  },
];

const mockCampaigns: Campaign[] = [
  {
    id: "camp_1",
    name: "Luxury Buyers Q2",
    platform: "Meta",
    dailyBudget: 400,
    status: "active",
    leadsGenerated: 128,
    spend: 8920,
    costPerLead: 14.2,
    conversionRate: 5.4,
    createdAt: "2026-03-01",
    spendOverTime: [220, 260, 280, 310, 340, 380, 400],
    leadsPerDay: [12, 16, 18, 20, 22, 19, 21],
    audience: "High-income buyers in Austin",
    productService: "Luxury home tours",
    location: "Austin, TX",
    goal: "Lead Generation",
    generatedAd: {
      headline: "Discover luxury homes tailored for you",
      description: "Exclusive listings and private tours for premium buyers.",
      cta: "Book a showing",
    },
  },
  {
    id: "camp_2",
    name: "Rental Demand Surge",
    platform: "Google",
    dailyBudget: 250,
    status: "active",
    leadsGenerated: 86,
    spend: 6120,
    costPerLead: 19.8,
    conversionRate: 4.1,
    createdAt: "2026-02-20",
    spendOverTime: [120, 140, 160, 170, 185, 200, 210],
    leadsPerDay: [8, 10, 12, 13, 12, 11, 10],
    audience: "Renters searching in NYC",
    productService: "Apartment rentals",
    location: "New York City",
    goal: "Lead Generation",
    generatedAd: {
      headline: "Find your next rental fast",
      description: "Instant access to high-demand listings.",
      cta: "Get listings",
    },
  },
  {
    id: "camp_3",
    name: "Starter Awareness",
    platform: "LinkedIn",
    dailyBudget: 180,
    status: "paused",
    leadsGenerated: 42,
    spend: 3380,
    costPerLead: 24.1,
    conversionRate: 3.2,
    createdAt: "2026-02-10",
    spendOverTime: [90, 100, 105, 110, 95, 80, 70],
    leadsPerDay: [4, 5, 6, 7, 5, 4, 3],
    audience: "First-time sellers",
    productService: "Seller onboarding",
    location: "Remote",
    goal: "Traffic",
    generatedAd: {
      headline: "Sell smarter with expert guidance",
      description: "Targeted campaigns for first-time sellers.",
      cta: "Learn more",
    },
  },
];

const mockFinanceSummary: FinanceSummary = {
  totalAdSpend: 28420,
  totalRevenue: 78200,
  costPerLead: 18.6,
  roas: 2.75,
  spendOverTime: [
    { date: "Mar 1", spend: 3800 },
    { date: "Mar 2", spend: 4100 },
    { date: "Mar 3", spend: 3950 },
    { date: "Mar 4", spend: 4500 },
    { date: "Mar 5", spend: 4300 },
    { date: "Mar 6", spend: 3900 },
    { date: "Mar 7", spend: 3870 },
  ],
  spendVsRevenue: [
    { date: "Mar 1", spend: 3800, revenue: 10400 },
    { date: "Mar 2", spend: 4100, revenue: 11250 },
    { date: "Mar 3", spend: 3950, revenue: 10820 },
    { date: "Mar 4", spend: 4500, revenue: 12600 },
    { date: "Mar 5", spend: 4300, revenue: 11980 },
    { date: "Mar 6", spend: 3900, revenue: 11040 },
    { date: "Mar 7", spend: 3870, revenue: 10930 },
  ],
  campaignProfitability: [
    { name: "Luxury Buyers Q2", profit: 18200 },
    { name: "Rental Demand Surge", profit: 9200 },
    { name: "Starter Awareness", profit: -1400 },
  ],
};

const mockCampaignFinance: CampaignFinance = {
  id: "camp_1",
  dailySpend: 420,
  leadsGenerated: 24,
  revenue: 1620,
  costPerLead: 17.5,
  conversionRate: 5.8,
  trend: "profitable",
};

const mockOptimizationSuggestions: OptimizationSuggestion[] = [
  {
    id: "opt_1",
    message: "Campaign A is performing well. Increase budget by 20%.",
    action: "increase_budget",
  },
  {
    id: "opt_2",
    message: "Campaign B cost per lead is too high. Consider pausing.",
    action: "pause",
  },
];

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

function normalizeLead(raw: Record<string, unknown>): Lead {
  const score = Number(raw.score ?? 0);
  const tier = String(raw.score_tier ?? "").toLowerCase();
  const status: LeadStatus =
    tier === "hot" || tier === "warm" || tier === "cold"
      ? (tier as LeadStatus)
      : score >= 80
        ? "hot"
        : score >= 50
          ? "warm"
          : "cold";

  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? "Unknown"),
    email: String(raw.email ?? ""),
    company: String(raw.company ?? ""),
    source: String(raw.source ?? raw.channel ?? "Unknown"),
    status,
    leadScore: score,
    meetingStatus: "pending",
    attribution: String(raw.campaign_id ?? "Unassigned"),
    createdAt: String(raw.createdat ?? ""),
    budget: raw.budget != null ? `$${raw.budget}` : undefined,
    message: raw.message != null ? String(raw.message) : undefined,
  };
}

function normalizeCampaign(raw: Record<string, unknown>): Campaign {
  const platformRaw = String(raw.platform ?? "").toLowerCase();
  const platform: Campaign["platform"] =
    platformRaw === "google"
      ? "Google"
      : platformRaw === "linkedin"
        ? "LinkedIn"
        : "Meta";

  const goalRaw = String(raw.goal ?? "");
  const goal: Campaign["goal"] =
    goalRaw === "Traffic" || goalRaw === "Sales" ? goalRaw : "Lead Generation";

  const dailyBudget = Number(raw.daily_budget ?? raw.dailyBudget ?? raw.budget ?? 0);
  const leadsGenerated = Number(raw.leads_generated ?? raw.leadsGenerated ?? 0);
  const spend = Number(raw.spend_so_far ?? raw.spend ?? 0);
  const costPerLead =
    Number(raw.cpl ?? raw.cost_per_lead ?? raw.costPerLead ?? 0) ||
    (leadsGenerated > 0 ? spend / leadsGenerated : 0);

  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? "Untitled Campaign"),
    platform,
    dailyBudget,
    status: (String(raw.status ?? "draft") as CampaignStatus) || "draft",
    leadsGenerated,
    spend,
    costPerLead,
    conversionRate: Number(raw.conversion_rate ?? raw.conversionRate ?? 0),
    createdAt: String(raw.createdat ?? raw.createdAt ?? ""),
    spendOverTime: [],
    leadsPerDay: [],
    audience: raw.target_audience != null ? JSON.stringify(raw.target_audience) : undefined,
    productService: raw.product_service != null ? String(raw.product_service) : undefined,
    location: raw.location != null ? String(raw.location) : undefined,
    goal,
    generatedAd: undefined,
  };
}

export async function getDashboard(): Promise<DashboardMetrics> {
  try {
    const response = await fetch(`${API_BASE}/dashboard/summary`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return mockDashboard;
    }
    const data = (await response.json()) as
      | DashboardMetrics
      | {
          success?: boolean;
          summary?: Record<string, unknown>;
        };

    if (data && typeof data === "object" && "summary" in data) {
      const summary = data.summary ?? {};
      return {
        totalLeads: Number(summary.total_leads ?? 0),
        activeCampaigns: Number(summary.active_campaigns ?? 0),
        adSpend: Number(summary.ad_spend ?? 0),
        revenue: Number(summary.monthly_revenue ?? 0),
        costPerLead: Number(summary.cost_per_lead ?? 0),
        roas: Number(summary.roas ?? 0),
        recentActions: mockDashboard.recentActions,
        spendOverTime: mockDashboard.spendOverTime,
        leadsOverTime: mockDashboard.leadsOverTime,
        conversionTrend: mockDashboard.conversionTrend,
      };
    }

    return (data as DashboardMetrics) ?? mockDashboard;
  } catch (error) {
    console.warn("Dashboard fetch failed:", toErrorMessage(error));
    return mockDashboard;
  }
}

export async function getLeads(): Promise<Lead[]> {
  try {
    const response = await fetch(`${API_BASE}/leads`, { cache: "no-store" });
    if (!response.ok) {
      return mockLeads;
    }
    const data = (await response.json()) as
      | Lead[]
      | {
          leads?: Record<string, unknown>[];
        };

    if (Array.isArray(data)) {
      return data;
    }

    const rawLeads = data?.leads;
    if (Array.isArray(rawLeads)) {
      return rawLeads.map(normalizeLead);
    }

    return mockLeads;
  } catch (error) {
    console.warn("Leads fetch failed:", toErrorMessage(error));
    return mockLeads;
  }
}

export async function postChat(message: string): Promise<{ reply: string }> {
  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) {
      return { reply: "I have queued that request. Want me to suggest copy?" };
    }
    const data = (await response.json()) as { reply?: string };
    return { reply: data.reply ?? "Request received." };
  } catch (error) {
    console.warn("Chat fetch failed:", toErrorMessage(error));
    return { reply: "Mock reply: I'll take care of that next." };
  }
}

export async function getCampaigns(): Promise<Campaign[]> {
  try {
    const response = await fetch(`${API_BASE}/campaigns`, { cache: "no-store" });
    if (!response.ok) {
      return mockCampaigns;
    }
    const data = (await response.json()) as
      | Campaign[]
      | {
          campaigns?: Record<string, unknown>[];
        };

    if (Array.isArray(data)) {
      return data;
    }

    const rawCampaigns = data?.campaigns;
    if (Array.isArray(rawCampaigns)) {
      return rawCampaigns.map(normalizeCampaign);
    }

    return mockCampaigns;
  } catch (error) {
    console.warn("Campaigns fetch failed:", toErrorMessage(error));
    return mockCampaigns;
  }
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  try {
    const response = await fetch(`${API_BASE}/campaign/${id}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return mockCampaigns.find((campaign) => campaign.id === id) ?? null;
    }
    const data = (await response.json()) as Campaign;
    return data ?? null;
  } catch (error) {
    console.warn("Campaign fetch failed:", toErrorMessage(error));
    return mockCampaigns.find((campaign) => campaign.id === id) ?? null;
  }
}

export async function postCampaign(payload: Partial<Campaign>): Promise<{
  success: boolean;
}> {
  try {
    const response = await fetch(`${API_BASE}/campaign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return { success: false };
    }
    return { success: true };
  } catch (error) {
    console.warn("Campaign submit failed:", toErrorMessage(error));
    return { success: false };
  }
}

export async function postCampaignGenerate(payload: {
  prompt: string;
}): Promise<{
  headline: string;
  description: string;
  cta: string;
  audience: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/campaign/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return {
        headline: "Grow your client pipeline fast",
        description: "High-intent ads optimized for lead capture.",
        cta: "Book a consult",
        audience: "Local business owners in target city",
      };
    }
    const data = (await response.json()) as {
      headline?: string;
      description?: string;
      cta?: string;
      audience?: string;
    };
    return {
      headline: data.headline ?? "Scale your marketing in 7 days",
      description:
        data.description ?? "AI-driven ads optimized for conversion.",
      cta: data.cta ?? "Get started",
      audience: data.audience ?? "High-intent prospects",
    };
  } catch (error) {
    console.warn("Campaign generate failed:", toErrorMessage(error));
    return {
      headline: "AI-optimized ads for your next campaign",
      description: "Launch fast with headlines and targeting crafted by DAB AI.",
      cta: "Launch now",
      audience: "Qualified buyers in your market",
    };
  }
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  try {
    const response = await fetch(`${API_BASE}/finance/summary`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return mockFinanceSummary;
    }
    const data = (await response.json()) as
      | FinanceSummary
      | {
          finance_summary?: Record<string, unknown>;
        };

    if (data && typeof data === "object" && "finance_summary" in data) {
      const summary = data.finance_summary ?? {};
      return {
        totalAdSpend: Number(summary.total_spend ?? 0),
        totalRevenue: Number(summary.total_revenue ?? 0),
        costPerLead: Number(summary.cost_per_lead ?? 0),
        roas: Number(summary.roas ?? 0),
        spendOverTime: mockFinanceSummary.spendOverTime,
        spendVsRevenue: mockFinanceSummary.spendVsRevenue,
        campaignProfitability: mockFinanceSummary.campaignProfitability,
      };
    }

    if (
      data &&
      typeof data === "object" &&
      "totalAdSpend" in data &&
      "totalRevenue" in data &&
      "costPerLead" in data &&
      "roas" in data
    ) {
      return data as FinanceSummary;
    }

    return mockFinanceSummary;
  } catch (error) {
    console.warn("Finance summary fetch failed:", toErrorMessage(error));
    return mockFinanceSummary;
  }
}

export async function getCampaignFinance(
  id: string
): Promise<CampaignFinance> {
  try {
    const response = await fetch(`${API_BASE}/campaign/${id}/finance`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return { ...mockCampaignFinance, id };
    }
    const data = (await response.json()) as CampaignFinance;
    return data ?? { ...mockCampaignFinance, id };
  } catch (error) {
    console.warn("Campaign finance fetch failed:", toErrorMessage(error));
    return { ...mockCampaignFinance, id };
  }
}

export async function postCampaignBudget(payload: {
  id: string;
  dailyBudget: number;
  paused: boolean;
  rules: string[];
}): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE}/campaign/budget`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return { success: false };
    }
    return { success: true };
  } catch (error) {
    console.warn("Campaign budget submit failed:", toErrorMessage(error));
    return { success: false };
  }
}

export async function getOptimizationSuggestions(): Promise<
  OptimizationSuggestion[]
> {
  try {
    const response = await fetch(`${API_BASE}/finance/optimizations`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return mockOptimizationSuggestions;
    }
    const data = (await response.json()) as OptimizationSuggestion[];
    return data ?? mockOptimizationSuggestions;
  } catch (error) {
    console.warn("Optimization fetch failed:", toErrorMessage(error));
    return mockOptimizationSuggestions;
  }
}

export async function postLead(lead: Partial<Lead>): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE}/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
    if (!response.ok) {
      return { success: false };
    }
    return { success: true };
  } catch (error) {
    console.warn("Lead submit failed:", toErrorMessage(error));
    return { success: false };
  }
}

export async function postFollowup(payload: {
  delay: string;
  attempts: number;
  template: string;
}): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE}/followup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return { success: false };
    }
    return { success: true };
  } catch (error) {
    console.warn("Follow-up submit failed:", toErrorMessage(error));
    return { success: false };
  }
}

export async function postMeeting(payload: {
  title: string;
  date: string;
  time: string;
  notes?: string;
}): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE}/meeting`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return { success: false };
    }
    return { success: true };
  } catch (error) {
    console.warn("Meeting submit failed:", toErrorMessage(error));
    return { success: false };
  }
}

// ── v6 API Functions ───────────────────────────────────────────────────────────

export async function getAgentStatus(): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(`${API_BASE}/agent/status`, { cache: "no-store" });
    if (!response.ok) return { status: "unknown" };
    return (await response.json()) as Record<string, unknown>;
  } catch (error) {
    console.warn("Agent status fetch failed:", toErrorMessage(error));
    return { status: "unknown" };
  }
}

export async function getAgentTasks(): Promise<unknown[]> {
  try {
    const response = await fetch(`${API_BASE}/agent/tasks`, { cache: "no-store" });
    if (!response.ok) return [];
    const data = (await response.json()) as { tasks?: unknown[] };
    return data.tasks ?? [];
  } catch (error) {
    console.warn("Agent tasks fetch failed:", toErrorMessage(error));
    return [];
  }
}

export async function getAgentDecisions(): Promise<unknown[]> {
  try {
    const response = await fetch(`${API_BASE}/agent/decisions`, { cache: "no-store" });
    if (!response.ok) return [];
    const data = (await response.json()) as { decisions?: unknown[] };
    return data.decisions ?? [];
  } catch (error) {
    console.warn("Agent decisions fetch failed:", toErrorMessage(error));
    return [];
  }
}

export async function getAutomationRules(): Promise<unknown[]> {
  try {
    const response = await fetch(`${API_BASE}/automation/rules`, { cache: "no-store" });
    if (!response.ok) return [];
    const data = (await response.json()) as { rules?: unknown[] };
    return data.rules ?? [];
  } catch (error) {
    console.warn("Automation rules fetch failed:", toErrorMessage(error));
    return [];
  }
}

export async function getAutomationHistory(): Promise<unknown[]> {
  try {
    const response = await fetch(`${API_BASE}/automation/history`, { cache: "no-store" });
    if (!response.ok) return [];
    const data = (await response.json()) as { history?: unknown[] };
    return data.history ?? [];
  } catch (error) {
    console.warn("Automation history fetch failed:", toErrorMessage(error));
    return [];
  }
}

export async function getIntegrations(): Promise<unknown[]> {
  try {
    const response = await fetch(`${API_BASE}/integrations`, { cache: "no-store" });
    if (!response.ok) return [];
    const data = (await response.json()) as { integrations?: unknown[] };
    return data.integrations ?? [];
  } catch (error) {
    console.warn("Integrations fetch failed:", toErrorMessage(error));
    return [];
  }
}

export async function connectIntegration(platform: string, credentials?: Record<string, unknown>): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE}/integration/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, credentials }),
    });
    return { success: response.ok };
  } catch (error) {
    console.warn("Integration connect failed:", toErrorMessage(error));
    return { success: false };
  }
}

export async function disconnectIntegration(platform: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE}/integration/disconnect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    return { success: response.ok };
  } catch (error) {
    console.warn("Integration disconnect failed:", toErrorMessage(error));
    return { success: false };
  }
}

export async function getReportsDaily(days = 30): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(`${API_BASE}/reports/daily?days=${days}`, { cache: "no-store" });
    if (!response.ok) return {};
    return (await response.json()) as Record<string, unknown>;
  } catch (error) {
    console.warn("Daily report fetch failed:", toErrorMessage(error));
    return {};
  }
}

export async function getReportsCampaign(): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(`${API_BASE}/reports/campaign`, { cache: "no-store" });
    if (!response.ok) return {};
    return (await response.json()) as Record<string, unknown>;
  } catch (error) {
    console.warn("Campaign report fetch failed:", toErrorMessage(error));
    return {};
  }
}

export async function getReportsLeads(days = 30): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(`${API_BASE}/reports/leads?days=${days}`, { cache: "no-store" });
    if (!response.ok) return {};
    return (await response.json()) as Record<string, unknown>;
  } catch (error) {
    console.warn("Leads report fetch failed:", toErrorMessage(error));
    return {};
  }
}

export async function getDashboardCharts(): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(`${API_BASE}/dashboard/charts`, { cache: "no-store" });
    if (!response.ok) return {};
    return (await response.json()) as Record<string, unknown>;
  } catch (error) {
    console.warn("Dashboard charts fetch failed:", toErrorMessage(error));
    return {};
  }
}

export async function getDashboardActivity(): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(`${API_BASE}/dashboard/activity`, { cache: "no-store" });
    if (!response.ok) return {};
    return (await response.json()) as Record<string, unknown>;
  } catch (error) {
    console.warn("Dashboard activity fetch failed:", toErrorMessage(error));
    return {};
  }
}
