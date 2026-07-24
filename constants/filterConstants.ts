export const DEAL_FILTER_CATEGORIES = [
  { key: "status", label: "Status" },
  { key: "dealValue", label: "Deal Value" },
  { key: "salesRep", label: "Sales Rep" },
  { key: "manager", label: "Sales Manager" },
  { key: "closure", label: "Closure Time" },
  { key: "lastCommented", label: "Last Commented" },
] as const;

export const DEAL_FILTER_OPTIONS: Record<string, string[]> = {
  status: [
    "New Lead",
    "Qualified",
    "Demo",
    "Proposal",
    "Negotiation",
    "Hot",
    "Warm",
    "Cold",
    "No Closure",
    "Lost",
  ],
  dealValue: ["0 - 5L", "5L - 10L", "10L - 20L", "20L - 50L", "50L+"],
  salesRep: ["Karan", "Rajit Kumar", "Punit Y S", "Harshita Anand", "Shareesh Kumar"],
  manager: ["Sunil Pal", "Sowndarya HS", "Rajesh Kumar", "Vinay R"],
  closure: ["Earliest First", "Latest First", "This Week", "This Month", "Overdue"],
  lastCommented: ["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "Oldest First"],
};
