export const MIXPANEL_SLOTS = {
  "events-trend": {
    name: "Event Trend Chart",
    description: "Time-series area chart showing event volume over the last 90 days",
    availableData: ["getEventTrend(eventName?, days?) - daily event counts, optionally filtered by event name"]
  },
  "events-breakdown": {
    name: "Event Breakdown",
    description: "Horizontal bar chart of events by category (pageview, click, signup, purchase, etc)",
    availableData: ["getEventsByCategory() - category counts"]
  },
  "events-metrics": {
    name: "Key Metrics Cards",
    description: "Summary KPIs: total events, unique users, avg events per user, top event",
    availableData: ["getMetrics() - totalEvents, uniqueUsers"]
  },
  "events-top": {
    name: "Top Events Table",
    description: "Ranked table of most frequent events with counts and unique user counts",
    availableData: ["getTopEvents(limit) - name, count, users"]
  },
  "funnel-chart": {
    name: "Funnel Visualization",
    description: "Step funnel with conversion rates between stages",
    availableData: ["getFunnels() - funnel definitions with steps"]
  },
  "funnel-list": {
    name: "Funnel List",
    description: "List of saved funnels",
    availableData: ["getFunnels()"]
  },
  "segments-overview": {
    name: "Segments Overview",
    description: "User segment cards with counts and filter descriptions",
    availableData: ["getUserSegments() - segment definitions and user counts"]
  },
  "segments-breakdown": {
    name: "Segment Breakdown Charts",
    description: "Pie/bar charts: users by plan, country, OS, browser",
    availableData: ["getUserBreakdown(field) - breakdown by any profile field"]
  },
  "retention-chart": {
    name: "Retention Cohort Heatmap",
    description: "Week-over-week cohort retention grid",
    availableData: ["Cohort data from retention API"]
  },
  "retention-curve": {
    name: "Retention Curve",
    description: "Line chart: average retention % over weeks",
    availableData: ["Retention curve data"]
  },
  "live-feed": {
    name: "Live Event Feed",
    description: "Real-time scrolling list of recent events with user info",
    availableData: ["getRecentEvents(limit) - event details with user profiles"]
  },
  "live-stats": {
    name: "Live Stats",
    description: "Real-time counters: events/min, active users now",
    availableData: ["Live event stream data"]
  },
};
