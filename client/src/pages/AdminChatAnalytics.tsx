import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, Users, TrendingUp, Heart, Brain, 
  Calendar, Download, BarChart3, PieChart, Activity
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
  positive: "#10b981",
  neutral: "#6b7280",
  negative: "#ef4444",
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: COLORS.positive,
  neutral: COLORS.neutral,
  negative: COLORS.negative,
  curious: "#3b82f6",
  excited: "#8b5cf6",
  confused: "#f59e0b",
};

export function AdminChatAnalytics() {
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});
  const [timeSeriesDays, setTimeSeriesDays] = useState(30);

  // Queries
  const { data: overview, isLoading: overviewLoading } = trpc.admin.getChatAnalyticsOverview.useQuery(dateRange);
  const { data: topTopics, isLoading: topicsLoading } = trpc.admin.getChatTopTopics.useQuery({ limit: 10, startDate: dateRange.startDate, endDate: dateRange.endDate });
  const { data: sentimentData, isLoading: sentimentLoading } = trpc.admin.getChatSentimentDistribution.useQuery({ startDate: dateRange.startDate, endDate: dateRange.endDate });
  const { data: timeSeriesData, isLoading: timeSeriesLoading } = trpc.admin.getChatTimeSeriesData.useQuery({ days: timeSeriesDays });
  const { data: recentConversations, isLoading: conversationsLoading } = trpc.admin.getChatRecentConversations.useQuery({ limit: 10 });
  const { data: memoryInsights, isLoading: memoryLoading } = trpc.admin.getChatMemoryInsights.useQuery();

  const isLoading = overviewLoading || topicsLoading || sentimentLoading || timeSeriesLoading || conversationsLoading || memoryLoading;

  // Format time series data for chart
  const formattedTimeSeriesData = timeSeriesData?.map(item => ({
    ...item,
    date: format(new Date(item.date), "MMM dd"),
  })) || [];

  // Format sentiment data for pie chart
  const formattedSentimentData = sentimentData?.map(item => ({
    name: item.sentiment,
    value: item.count,
    percentage: item.percentage,
  })) || [];

  // Format topics data for bar chart
  const formattedTopicsData = topTopics?.map(item => ({
    topic: item.topic.length > 20 ? item.topic.substring(0, 20) + "..." : item.topic,
    count: item.count,
  })) || [];

  const getMoodBadgeColor = (mood: string | null) => {
    if (!mood) return "secondary";
    const moodLower = mood.toLowerCase();
    if (moodLower.includes("positive") || moodLower.includes("excited")) return "default";
    if (moodLower.includes("negative") || moodLower.includes("confused")) return "destructive";
    return "secondary";
  };

  const getEngagementBadgeColor = (engagement: string | null) => {
    if (!engagement) return "secondary";
    if (engagement === "high") return "default";
    if (engagement === "low") return "destructive";
    return "secondary";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Chat Analytics</h1>
            <p className="text-muted-foreground">
              Monitor chatbot performance and user engagement
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              Date Range
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Conversations</p>
                  <p className="text-2xl font-bold">{overview?.totalConversations || 0}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{overview?.activeUsers || 0}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Messages/Conv</p>
                  <p className="text-2xl font-bold">{overview?.avgMessagesPerConversation || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Satisfaction Score</p>
                  <p className="text-2xl font-bold">{overview?.satisfactionScore || 0}/5</p>
                </div>
                <Heart className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversations Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Conversations Over Time
              </CardTitle>
              <CardDescription>
                Daily conversation and message trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedTimeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="conversations" stroke={COLORS.primary} strokeWidth={2} name="Conversations" />
                    <Line type="monotone" dataKey="messages" stroke={COLORS.accent} strokeWidth={2} name="Messages" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Top Discussion Topics
              </CardTitle>
              <CardDescription>
                Most frequently discussed topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedTopicsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="topic" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sentiment & Memory Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sentiment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Sentiment Distribution
              </CardTitle>
              <CardDescription>
                User mood and sentiment analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={formattedSentimentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name} (${entry.percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {formattedSentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name] || COLORS.muted} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Memory Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Memory Insights
              </CardTitle>
              <CardDescription>
                AI memory and learning statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Total Memories</span>
                  <span className="text-2xl font-bold">{memoryInsights?.totalMemories || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Avg per User</span>
                  <span className="text-2xl font-bold">{memoryInsights?.avgMemoriesPerUser || 0}</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Top Memory Categories</p>
                  {memoryInsights?.topCategories.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{cat.category.replace("_", " ")}</span>
                      <Badge variant="outline">{cat.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Conversations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
            <CardDescription>
              Latest chatbot interactions with users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Mood</TableHead>
                  <TableHead>Engagement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentConversations?.map((conv) => (
                  <TableRow key={conv.id}>
                    <TableCell className="font-medium">{conv.userName}</TableCell>
                    <TableCell>{conv.messageCount}</TableCell>
                    <TableCell>{format(new Date(conv.lastMessageAt), "MMM dd, HH:mm")}</TableCell>
                    <TableCell>
                      <Badge variant={getMoodBadgeColor(conv.mood)}>
                        {conv.mood || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getEngagementBadgeColor(conv.engagementLevel)}>
                        {conv.engagementLevel || "Unknown"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
