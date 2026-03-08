/**
 * OnClaw Slot Definitions
 *
 * These slot definitions tell OnClaw what UI components can be generated
 * for each section of the CRM application. The LLM uses these descriptions
 * to understand the context and data available for each slot.
 */

export const CRM_SLOTS = {
  // Dashboard page slots
  "dashboard-metrics": {
    name: "Dashboard Metrics",
    description: "Key performance indicators displayed as summary cards: total pipeline value, won revenue, win rate percentage, and average deal size. Use formatCurrency for money values.",
    availableData: [
      "getDashboardMetrics() - returns metrics object with totalPipeline, wonRevenue, winRate, avgDealSize, totalDeals"
    ]
  },

  "dashboard-pipeline": {
    name: "Pipeline Overview",
    description: "Revenue pipeline breakdown by deal stage - can be bar chart, funnel chart, or stage cards showing deal counts and total values per stage",
    availableData: [
      "getPipelineByStage() - returns array with stage, count, total for each pipeline stage"
    ]
  },

  "dashboard-leaderboard": {
    name: "Sales Rep Leaderboard",
    description: "Top performing sales reps ranked by closed-won revenue with avatars, deal counts, and revenue totals",
    availableData: [
      "getLeaderboard() - returns array with name, avatar, wonCount, wonValue for top performers"
    ]
  },

  "dashboard-activity": {
    name: "Recent Activity Feed",
    description: "Timeline of recent sales activities (calls, emails, meetings, notes, tasks) with owner names and timestamps. Use timeAgo for dates.",
    availableData: [
      "getActivities({ limit: 15 }) - returns recent activities with type, subject, ownerName, createdAt"
    ]
  },

  "dashboard-monthly": {
    name: "Monthly Revenue Trend",
    description: "Monthly trend chart showing won vs lost deals over time - line chart, bar chart, or area chart comparing revenue by month",
    availableData: [
      "getMonthlyTrends() - returns monthly data with month, stage (closed-won/closed-lost), deal_count, total_value"
    ]
  },

  // Deals page slots
  "deals-header": {
    name: "Deals Pipeline Header",
    description: "Summary stats above the kanban board - stage cards showing deal counts and totals, or pipeline metrics",
    availableData: [
      "getDeals() - returns all deals with stage, value, name, owner info",
      "getPipelineByStage() - returns stage summaries"
    ]
  },

  "deals-stage-{stage}": {
    name: "Deal Stage Column",
    description: "Individual kanban column for a specific deal stage (prospecting, qualification, proposal, negotiation, closed-won, closed-lost)",
    availableData: [
      "getDeals({ stage }) - returns deals filtered by specific stage"
    ]
  },

  // Contacts page slots
  "contacts-summary": {
    name: "Contacts Overview",
    description: "Summary statistics about contacts - total counts, breakdown by status (lead/customer/churned), by source (website/referral/linkedin/etc), or by assigned owner",
    availableData: [
      "getContacts() - returns paginated contacts with status, source, ownerName",
      "getUsers() - returns all sales reps for owner filtering"
    ]
  },

  "contacts-filters": {
    name: "Contact Filters",
    description: "Filter controls for the contact list - status dropdown, source dropdown, owner selection, search input",
    availableActions: [
      "Filter contacts by status, source, ownerId, or search term"
    ]
  },

  // Analytics page slots
  "analytics-revenue": {
    name: "Revenue Analytics Chart",
    description: "Monthly revenue trend visualization - line chart, bar chart, or area chart showing closed-won revenue over time",
    availableData: [
      "getMonthlyTrends() - returns monthly won/lost data",
      "getAnalyticsByRep() - returns revenue by sales rep"
    ]
  },

  "analytics-funnel": {
    name: "Sales Funnel Analysis",
    description: "Pipeline conversion funnel showing deal counts at each stage - funnel chart, horizontal bar chart, or conversion rate analysis",
    availableData: [
      "getPipelineByStage() - returns deals by stage for funnel analysis"
    ]
  },

  "analytics-winrate": {
    name: "Win Rate by Rep",
    description: "Sales rep performance comparison - win rate percentages, deal counts, revenue totals by individual rep",
    availableData: [
      "getAnalyticsByRep() - returns performance stats by sales rep name and stage"
    ]
  },

  "analytics-source": {
    name: "Lead Source Attribution",
    description: "Revenue attribution by lead source - pie chart, bar chart, or table showing which sources (website, referral, linkedin, etc) drive the most revenue",
    availableData: [
      "getAnalyticsBySource() - returns source, deal count, total revenue for closed-won deals"
    ]
  },

  "analytics-velocity": {
    name: "Deal Velocity Metrics",
    description: "Sales cycle analysis showing average days to close deals by month - line chart or bar chart of time-to-close trends",
    availableData: [
      "getAnalyticsByRep() - can calculate velocity from deal data",
      "getMonthlyTrends() - provides monthly deal data for velocity calculations"
    ]
  },

  // Generic/reusable slots
  "crm-table": {
    name: "CRM Data Table",
    description: "Customizable data table for contacts, deals, companies, or activities with sorting, filtering, and pagination",
    availableData: [
      "getContacts() - paginated contacts with full details",
      "getDeals() - deals with owner/company/contact relationships",
      "getCompanies() - companies with industry/size filters",
      "getActivities() - activities with relationships"
    ]
  },

  "crm-chart": {
    name: "CRM Analytics Chart",
    description: "Flexible chart component for any CRM metrics - bar, line, pie, funnel, or area charts using provided data",
    availableData: [
      "Any query data can be visualized",
      "Use STAGE_COLORS and STATUS_COLORS for consistent theming"
    ]
  },

  "crm-kpi-cards": {
    name: "KPI Summary Cards",
    description: "Key performance indicator cards showing important metrics with icons and trend indicators",
    availableData: [
      "getDashboardMetrics() - core KPIs",
      "getPipelineByStage() - stage-specific metrics",
      "getLeaderboard() - performance metrics"
    ]
  }
};

// Utility to get slot configuration by ID
export function getSlotConfig(slotId: string) {
  return CRM_SLOTS[slotId as keyof typeof CRM_SLOTS] || null;
}

// Get all available slot IDs
export function getAllSlotIds() {
  return Object.keys(CRM_SLOTS);
}

// Get slots by category
export function getSlotsByCategory(category: 'dashboard' | 'deals' | 'contacts' | 'analytics' | 'generic') {
  const prefix = category === 'generic' ? 'crm-' : `${category}-`;
  return Object.keys(CRM_SLOTS).filter(id => id.startsWith(prefix));
}