import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import {
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react";

interface AnalyticsData {
  users: {
    total: number;
    active: number;
    new_this_month: number;
    growth_rate: number;
  };
  revenue: {
    total: number;
    this_month: number;
    growth_rate: number;
    average_per_user: number;
  };
  usage: {
    total_searches: number;
    total_analyses: number;
    searches_this_month: number;
    analyses_this_month: number;
  };
  performance: {
    avg_response_time: number;
    success_rate: number;
    error_rate: number;
    uptime: number;
  };
}

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    users: { total: 0, active: 0, new_this_month: 0, growth_rate: 0 },
    revenue: { total: 0, this_month: 0, growth_rate: 0, average_per_user: 0 },
    usage: {
      total_searches: 0,
      total_analyses: 0,
      searches_this_month: 0,
      analyses_this_month: 0,
    },
    performance: {
      avg_response_time: 0,
      success_rate: 0,
      error_rate: 0,
      uptime: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const mockData: AnalyticsData = {
        users: {
          total: 1247,
          active: 892,
          new_this_month: 156,
          growth_rate: 12.5,
        },
        revenue: {
          total: 45678.9,
          this_month: 12345.67,
          growth_rate: 8.3,
          average_per_user: 36.67,
        },
        usage: {
          total_searches: 45678,
          total_analyses: 23456,
          searches_this_month: 3456,
          analyses_this_month: 1789,
        },
        performance: {
          avg_response_time: 245,
          success_rate: 98.7,
          error_rate: 1.3,
          uptime: 99.9,
        },
      };
      setAnalytics(mockData);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-400">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-2">
            Monitor platform performance and user engagement
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-red-600 hover:bg-red-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatNumber(analytics.users.total)}
            </div>
            <div className="flex items-center text-xs text-gray-400 mt-1">
              {analytics.users.growth_rate > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-400 mr-1" />
              )}
              {Math.abs(analytics.users.growth_rate)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Active Users
            </CardTitle>
            <Activity className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatNumber(analytics.users.active)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {Math.round(
                (analytics.users.active / analytics.users.total) * 100
              )}
              % of total users
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(analytics.revenue.total)}
            </div>
            <div className="flex items-center text-xs text-gray-400 mt-1">
              {analytics.revenue.growth_rate > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-400 mr-1" />
              )}
              {Math.abs(analytics.revenue.growth_rate)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Monthly Revenue
            </CardTitle>
            <Calendar className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(analytics.revenue.this_month)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Avg: {formatCurrency(analytics.revenue.average_per_user)} per user
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Usage Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {formatNumber(analytics.usage.total_searches)}
                </div>
                <p className="text-sm text-gray-400">Total Searches</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatNumber(analytics.usage.searches_this_month)} this month
                </p>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {formatNumber(analytics.usage.total_analyses)}
                </div>
                <p className="text-sm text-gray-400">Total Analyses</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatNumber(analytics.usage.analyses_this_month)} this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  Average Response Time
                </span>
                <span className="text-sm text-white">
                  {analytics.performance.avg_response_time}ms
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (analytics.performance.avg_response_time / 1000) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Success Rate</span>
                <span className="text-sm text-white">
                  {analytics.performance.success_rate}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${analytics.performance.success_rate}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Uptime</span>
                <span className="text-sm text-white">
                  {analytics.performance.uptime}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${analytics.performance.uptime}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
