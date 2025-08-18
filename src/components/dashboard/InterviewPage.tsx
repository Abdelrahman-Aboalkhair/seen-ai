import React, { useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

export function InterviewPage() {
  const { t, isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState("upcoming");

  // Mock data for demonstration
  const upcomingInterviews = [
    {
      id: 1,
      candidate: "Ahmed Hassan",
      position: "Senior Frontend Developer",
      date: "2024-01-15",
      time: "10:00 AM",
      type: "video",
      status: "scheduled",
    },
    {
      id: 2,
      candidate: "Sarah Johnson",
      position: "UX Designer",
      date: "2024-01-16",
      time: "2:00 PM",
      type: "in-person",
      status: "scheduled",
    },
  ];

  const completedInterviews = [
    {
      id: 3,
      candidate: "Mohammed Ali",
      position: "Backend Developer",
      date: "2024-01-10",
      time: "11:00 AM",
      type: "video",
      status: "completed",
      score: 85,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-500/20 text-blue-400 border-blue-500/30"
          >
            Scheduled
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="secondary"
            className="bg-green-500/20 text-green-400 border-green-500/30"
          >
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="secondary"
            className="bg-red-500/20 text-red-400 border-red-500/30"
          >
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "in-person":
        return <Users className="h-4 w-4" />;
      case "phone":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

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
        <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
          <Plus className="h-4 w-4 mr-2" />
          {t("dashboard.schedule_interview")}
        </Button>
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
                <p className="text-2xl font-bold text-white mt-1">
                  {upcomingInterviews.length}
                </p>
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
                <p className="text-2xl font-bold text-white mt-1">
                  {completedInterviews.length}
                </p>
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
                <p className="text-2xl font-bold text-white mt-1">
                  {completedInterviews.length > 0
                    ? Math.round(
                        completedInterviews.reduce(
                          (acc, interview) => acc + (interview.score || 0),
                          0
                        ) / completedInterviews.length
                      )
                    : 0}
                  %
                </p>
              </div>
              <div className="h-12 w-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Search className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
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
              {t("dashboard.upcoming")} ({upcomingInterviews.length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "completed"
                  ? "bg-cyan-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {t("dashboard.completed")} ({completedInterviews.length})
            </button>
          </div>

          {/* Interview List */}
          <div className="space-y-4">
            {activeTab === "upcoming" && (
              <>
                {upcomingInterviews.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-400 mb-2">
                      {t("dashboard.no_upcoming_interviews")}
                    </h3>
                    <p className="text-gray-500">
                      {t("dashboard.schedule_first_interview")}
                    </p>
                  </div>
                ) : (
                  upcomingInterviews.map((interview) => (
                    <motion.div
                      key={interview.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                            {getTypeIcon(interview.type)}
                          </div>
                          <div>
                            <h3 className="font-medium text-white">
                              {interview.candidate}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {interview.position}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-white">
                              {new Date(interview.date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-400">
                              {interview.time}
                            </p>
                          </div>
                          {getStatusBadge(interview.status)}
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </>
            )}

            {activeTab === "completed" && (
              <>
                {completedInterviews.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-400 mb-2">
                      {t("dashboard.no_completed_interviews")}
                    </h3>
                    <p className="text-gray-500">
                      {t("dashboard.completed_interviews_will_appear_here")}
                    </p>
                  </div>
                ) : (
                  completedInterviews.map((interview) => (
                    <motion.div
                      key={interview.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                            {getTypeIcon(interview.type)}
                          </div>
                          <div>
                            <h3 className="font-medium text-white">
                              {interview.candidate}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {interview.position}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-white">
                              {new Date(interview.date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-400">
                              Score: {interview.score}%
                            </p>
                          </div>
                          {getStatusBadge(interview.status)}
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
