import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "../../lib/i18n";
import { Button } from "../ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { Badge } from "../ui/Badge";
import {
  Calendar,
  Clock,
  Users,
  Video,
  MessageSquare,
  FileText,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Brain,
} from "lucide-react";

export function InterviewPage() {
  const { t, isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState("upcoming");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {t("dashboard.interview")}
          </h1>
          <p className="text-gray-400 mt-1">
            {t("dashboard.interview_description")}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/dashboard/interview-wizard"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-colors duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("dashboard.schedule_interview")}
          </Link>
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            <Brain className="h-4 w-4 mr-2" />
            Smart Interview Wizard
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t("dashboard.upcoming_interviews")}
                </p>
                <p className="text-2xl font-bold text-white mt-1">0</p>
              </div>
              <div className="h-12 w-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t("dashboard.completed_interviews")}
                </p>
                <p className="text-2xl font-bold text-white mt-1">0</p>
              </div>
              <div className="h-12 w-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t("dashboard.avg_score")}
                </p>
                <p className="text-2xl font-bold text-white mt-1">0%</p>
              </div>
              <div className="h-12 w-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Search className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">
              {t("dashboard.interview_management")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {t("dashboard.filter")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "upcoming"
                  ? "bg-cyan-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {t("dashboard.upcoming")} (0)
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "completed"
                  ? "bg-cyan-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {t("dashboard.completed")} (0)
            </button>
          </div>

          {/* Empty State */}
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              {activeTab === "upcoming"
                ? t("dashboard.no_upcoming_interviews")
                : t("dashboard.no_completed_interviews")}
            </h3>
            <p className="text-gray-500">
              {activeTab === "upcoming"
                ? t("dashboard.schedule_first_interview")
                : t("dashboard.completed_interviews_will_appear_here")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
