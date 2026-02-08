import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { 
  Users, Image, DollarSign, TrendingUp, 
  Loader2, AlertTriangle, BookOpen, BarChart3
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();

  const { data: metrics, isLoading: metricsLoading } = trpc.admin.getMetrics.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: usersData, isLoading: usersLoading } = trpc.admin.getUsers.useQuery(
    { limit: 10, offset: 0 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-8">
          <div className="container">
            <div className="max-w-md mx-auto text-center py-20">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
              <p className="text-muted-foreground mb-6">
                You don't have permission to access the admin dashboard.
              </p>
              <Button asChild>
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-8">
        <div className="container">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Monitor your platform's performance and manage users
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button asChild variant="outline">
                <Link href="/admin/funnel" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Conversion Funnel
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/cohort-analysis" className="gap-2">
                  <Users className="w-4 h-4" />
                  Cohort Analysis
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/pwa-analytics" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  PWA Analytics
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/chat-analytics" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Chat Analytics
                </Link>
              </Button>
              <Button asChild>
                <Link href="/admin/knowledge" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  Knowledge Base
                </Link>
              </Button>
            </div>
          </div>

          {metricsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="text-3xl font-bold">{metrics?.totalUsers ?? 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Paid Users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      <span className="text-3xl font-bold">{metrics?.paidUsers ?? 0}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {metrics?.totalUsers ? ((metrics.paidUsers / metrics.totalUsers) * 100).toFixed(1) : 0}% conversion
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Generations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Image className="w-5 h-5 text-purple-500" />
                      <span className="text-3xl font-bold">{metrics?.totalGenerations ?? 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Monthly Generations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span className="text-3xl font-bold">{metrics?.monthlyGenerations ?? 0}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Metrics */}
              <div className="grid lg:grid-cols-3 gap-4 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Monthly Recurring Revenue</CardTitle>
                    <CardDescription>Estimated based on active subscriptions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-primary">
                      ${((metrics?.paidUsers ?? 0) * 29).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Based on average $29/user
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Average Revenue Per User</CardTitle>
                    <CardDescription>ARPU calculation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-green-500">
                      ${metrics?.totalUsers ? (((metrics.paidUsers ?? 0) * 29) / metrics.totalUsers).toFixed(2) : "0.00"}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Across all users
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lifetime Value</CardTitle>
                    <CardDescription>Estimated LTV per customer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-blue-500">
                      $348
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Based on 12-month avg retention
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Users */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Users</CardTitle>
                  <CardDescription>Latest registered users</CardDescription>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : usersData?.users && usersData.users.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>Credits</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usersData.users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.name || "—"}</TableCell>
                            <TableCell>{u.email || "—"}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                u.tier === "creator" 
                                  ? "bg-purple-500/10 text-purple-500"
                                  : u.tier === "pro"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-secondary text-muted-foreground"
                              }`}>
                                {u.tier}
                              </span>
                            </TableCell>
                            <TableCell>{u.credits}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No users yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
