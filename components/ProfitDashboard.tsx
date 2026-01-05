/**
 * Profit Intelligence Dashboard
 * 
 * Enterprise-grade financial analytics for AI SaaS platform
 * Super Admin only - Real-time profit, cost, and revenue tracking
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  Activity,
  Users,
  Zap,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RechartsPie, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase'; // Adjust import path

// ============================================
// TYPES
// ============================================

interface MetricCard {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  color: string;
}

interface LossUser {
  user_id: string;
  email: string;
  subscription_plan: string;
  total_cost_usd: number;
  total_profit_usd: number;
  profit_margin_percent: number;
  days_in_loss: number;
}

interface ProfitAggregate {
  period_id: string;
  period_type: string;
  total_cost_usd: number;
  total_revenue_usd: number;
  total_profit_usd: number;
  profit_margin_percent: number;
  cost_by_engine: Record<string, any>;
  profit_by_plan: Record<string, any>;
  loss_users_count: number;
  total_generations: number;
  total_users: number;
  updated_at: any;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProfitDashboard() {
  // State
  const [loading, setLoading] = useState(true);
  const [currentAggregate, setCurrentAggregate] = useState<ProfitAggregate | null>(null);
  const [previousAggregate, setPreviousAggregate] = useState<ProfitAggregate | null>(null);
  const [lossUsers, setLossUsers] = useState<LossUser[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'monthly'>('daily');
  const [chartData, setChartData] = useState<any[]>([]);

  // Fetch data
  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch aggregates
      const getProfitAggregates = httpsCallable(functions, 'getProfitAggregates');
      const result = await getProfitAggregates({ 
        period_type: selectedPeriod, 
        limit: 30 
      }) as any;

      if (result.data.success && result.data.data.length > 0) {
        setCurrentAggregate(result.data.data[0]);
        if (result.data.data.length > 1) {
          setPreviousAggregate(result.data.data[1]);
        }
        setChartData(result.data.data.slice(0, 14).reverse()); // Last 14 periods
      }

      // Fetch loss users
      const getLossUsers = httpsCallable(functions, 'getLossUsers');
      const lossResult = await getLossUsers({ limit: 10 }) as any;
      
      if (lossResult.data.success) {
        setLossUsers(lossResult.data.data);
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate change percentage
  const calculateChange = (current: number, previous: number): number => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Profit Intelligence...</p>
        </div>
      </div>
    );
  }

  if (!currentAggregate) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <p className="text-gray-600">No financial data available</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare metrics
  const metrics: MetricCard[] = [
    {
      title: 'Total Revenue',
      value: formatCurrency(currentAggregate.total_revenue_usd),
      change: previousAggregate 
        ? calculateChange(currentAggregate.total_revenue_usd, previousAggregate.total_revenue_usd)
        : 0,
      trend: previousAggregate && currentAggregate.total_revenue_usd >= previousAggregate.total_revenue_usd ? 'up' : 'down',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-green-500'
    },
    {
      title: 'Total Cost',
      value: formatCurrency(currentAggregate.total_cost_usd),
      change: previousAggregate 
        ? calculateChange(currentAggregate.total_cost_usd, previousAggregate.total_cost_usd)
        : 0,
      trend: previousAggregate && currentAggregate.total_cost_usd <= previousAggregate.total_cost_usd ? 'up' : 'down',
      icon: <Activity className="w-6 h-6" />,
      color: 'bg-red-500'
    },
    {
      title: 'Net Profit',
      value: formatCurrency(currentAggregate.total_profit_usd),
      change: previousAggregate 
        ? calculateChange(currentAggregate.total_profit_usd, previousAggregate.total_profit_usd)
        : 0,
      trend: previousAggregate && currentAggregate.total_profit_usd >= previousAggregate.total_profit_usd ? 'up' : 'down',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Profit Margin',
      value: `${currentAggregate.profit_margin_percent.toFixed(1)}%`,
      change: previousAggregate 
        ? currentAggregate.profit_margin_percent - previousAggregate.profit_margin_percent
        : 0,
      trend: previousAggregate && currentAggregate.profit_margin_percent >= previousAggregate.profit_margin_percent ? 'up' : 'down',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'bg-purple-500'
    }
  ];

  // Prepare chart data
  const costVsRevenueData = chartData.map(agg => ({
    date: agg.period_id.split('_').slice(1).join('-'),
    revenue: agg.total_revenue_usd,
    cost: agg.total_cost_usd,
    profit: agg.total_profit_usd
  }));

  // Engine cost data
  const engineCostData = Object.entries(currentAggregate.cost_by_engine || {}).map(([engine, data]: [string, any]) => ({
    name: engine,
    cost: data.cost_usd,
    count: data.usage_count
  })).sort((a, b) => b.cost - a.cost).slice(0, 5);

  // Plan profit data
  const planProfitData = Object.entries(currentAggregate.profit_by_plan || {}).map(([plan, data]: [string, any]) => ({
    name: plan,
    profit: data.profit_usd,
    margin: data.profit_margin_percent
  })).sort((a, b) => b.profit - a.profit);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              💰 Profit & Cost Intelligence
            </h1>
            <p className="text-gray-600">
              Enterprise financial analytics • Last updated: {new Date(currentAggregate.updated_at?.toDate?.() || new Date()).toLocaleString()}
            </p>
          </div>
          
          <div className="flex gap-4">
            {/* Period selector */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily View</option>
              <option value="monthly">Monthly View</option>
            </select>

            {/* Refresh button */}
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            {/* Export button */}
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`${metric.color} text-white p-3 rounded-lg`}>
                {metric.icon}
              </div>
              <div className={`flex items-center gap-1 text-sm font-semibold ${
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(metric.change).toFixed(1)}%
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">{metric.title}</h3>
            <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Cost vs Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Cost vs Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={costVsRevenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value: any) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
            <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} name="Cost" />
            <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="Profit" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Cost Engines */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Cost Engines</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={engineCostData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Bar dataKey="cost" fill="#3b82f6" name="Cost" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit by Plan */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Profit by Plan</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={planProfitData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Bar dataKey="profit" fill="#10b981" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Loss Users Alert */}
      {lossUsers.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-red-900">
              ⚠️ Loss-Making Users ({lossUsers.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-red-200">
                  <th className="text-left py-3 px-4 text-red-900 font-semibold">User</th>
                  <th className="text-left py-3 px-4 text-red-900 font-semibold">Plan</th>
                  <th className="text-right py-3 px-4 text-red-900 font-semibold">Cost</th>
                  <th className="text-right py-3 px-4 text-red-900 font-semibold">Profit</th>
                  <th className="text-right py-3 px-4 text-red-900 font-semibold">Margin</th>
                  <th className="text-right py-3 px-4 text-red-900 font-semibold">Days</th>
                </tr>
              </thead>
              <tbody>
                {lossUsers.map((user, index) => (
                  <tr key={index} className="border-b border-red-100 hover:bg-red-100">
                    <td className="py-3 px-4 text-gray-900 font-medium">{user.email}</td>
                    <td className="py-3 px-4 text-gray-700 capitalize">{user.subscription_plan}</td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {formatCurrency(user.total_cost_usd)}
                    </td>
                    <td className="py-3 px-4 text-right text-red-700 font-semibold">
                      {formatCurrency(user.total_profit_usd)}
                    </td>
                    <td className="py-3 px-4 text-right text-red-700 font-semibold">
                      {user.profit_margin_percent.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {user.days_in_loss}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h3 className="text-gray-600 text-sm font-semibold">Total Users</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{currentAggregate.total_users.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">
            Avg revenue: {formatCurrency(currentAggregate.avg_revenue_per_user || 0)}/user
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-gray-600" />
            <h3 className="text-gray-600 text-sm font-semibold">Total Generations</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{currentAggregate.total_generations.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">
            Avg cost: {formatCurrency(currentAggregate.avg_cost_per_user || 0)}/user
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-gray-600 text-sm font-semibold">Loss Users</h3>
          </div>
          <p className="text-3xl font-bold text-red-600">{currentAggregate.loss_users_count}</p>
          <p className="text-sm text-gray-500 mt-1">
            {((currentAggregate.loss_users_count / currentAggregate.total_users) * 100).toFixed(1)}% of total
          </p>
        </div>
      </div>
    </div>
  );
}
