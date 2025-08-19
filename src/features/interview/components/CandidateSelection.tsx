import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Checkbox } from "../../../components/ui/Checkbox";
import { Badge } from "../../../components/ui/Badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../components/ui/Avatar";
import {
  Search,
  Users,
  Mail,
  FileText,
  CheckCircle,
  Filter,
  UserPlus,
  Sparkles,
  Star,
  MapPin,
  Calendar,
  Building2,
} from "lucide-react";
import { Candidate } from "../types";

interface CandidateSelectionProps {
  candidates: Candidate[];
  selectedCandidates: string[];
  onCandidateToggle: (candidateId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onAddCandidates: () => void;
  loading: boolean;
  onFetchCandidates: () => void;
}

export const CandidateSelection: React.FC<CandidateSelectionProps> = ({
  candidates,
  selectedCandidates,
  onCandidateToggle,
  onSelectAll,
  onDeselectAll,
  onAddCandidates,
  loading,
  onFetchCandidates,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    onFetchCandidates();
  }, [onFetchCandidates]);

  useEffect(() => {
    const filtered = candidates.filter(
      (candidate) =>
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCandidates(filtered);
  }, [candidates, searchTerm]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const allSelected =
    filteredCandidates.length > 0 &&
    filteredCandidates.every((candidate) =>
      selectedCandidates.includes(candidate.candidateId!)
    );

  const someSelected = filteredCandidates.some((candidate) =>
    selectedCandidates.includes(candidate.candidateId!)
  );

  const handleSelectAllToggle = () => {
    if (allSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  return (
    <div className="space-y-8">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl p-8 border border-blue-500/20">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            اختيار المرشحين
          </h1>
          <p className="text-gray-400 text-lg">
            اختر المرشحين الموهوبين لإرسال روابط المقابلة إليهم
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث في المرشحين بالاسم أو البريد الإلكتروني..."
              className="pl-12 pr-4 h-12 text-lg bg-white/5 border-gray-600 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">إجمالي المرشحين</p>
                <p className="text-2xl font-bold text-white">
                  {candidates.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">المرشحين المحددين</p>
                <p className="text-2xl font-bold text-green-400">
                  {selectedCandidates.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">النتائج المطابقة</p>
                <p className="text-2xl font-bold text-purple-400">
                  {filteredCandidates.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAllToggle}
                className="h-5 w-5"
              />
              <span className="text-white font-medium">
                {allSelected ? "إلغاء تحديد الكل" : "تحديد الكل"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-blue-500/10 text-blue-400 border-blue-500/20"
              >
                {filteredCandidates.length} مرشح متاح
              </Badge>
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-400 border-green-500/20"
              >
                {selectedCandidates.length} محدد
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modern Candidates Grid */}
      {loading ? (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              جاري تحميل المرشحين
            </h3>
            <p className="text-gray-400">
              يرجى الانتظار بينما نقوم بجلب أحدث البيانات...
            </p>
          </div>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-500/20 rounded-full mb-6">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm ? "لا توجد نتائج للبحث" : "لا يوجد مرشحين متاحين"}
            </h3>
            <p className="text-gray-400">
              {searchTerm
                ? "جرب تغيير كلمات البحث أو إضافة مرشحين جدد"
                : "قم بإضافة مرشحين جدد للبدء في إنشاء المقابلات"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map((candidate) => {
            const isSelected = selectedCandidates.includes(
              candidate.candidateId!
            );

            return (
              <Card
                key={candidate.candidateId}
                className={`relative overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 shadow-lg shadow-green-500/10"
                    : "bg-slate-800/50 border-slate-700 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10"
                }`}
                onClick={() => onCandidateToggle(candidate.candidateId!)}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}

                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-16 w-16 border-2 border-white/10">
                      <AvatarImage src={candidate.resumeUrl} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-semibold">
                        {getInitials(candidate.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white mb-1 truncate">
                        {candidate.name}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{candidate.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Candidate Details */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Building2 className="h-4 w-4" />
                      <span>مطور برمجيات</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span>الرياض، المملكة العربية السعودية</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>5+ سنوات خبرة</span>
                    </div>
                  </div>

                  {/* Skills Tags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge
                      variant="outline"
                      className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs"
                    >
                      React
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs"
                    >
                      TypeScript
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-green-500/10 text-green-400 border-green-500/20 text-xs"
                    >
                      Node.js
                    </Badge>
                  </div>

                  {/* Match Score */}
                  <div className="mt-4 pt-4 border-t border-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        مطابقة الوظيفة
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < 4
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-white">
                          85%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resume Indicator */}
                  {candidate.resumeUrl && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        السيرة الذاتية
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modern Action Section */}
      <Card className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border-green-500/20">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h3 className="text-xl font-semibold text-white mb-2">
                جاهز لإرسال روابط المقابلة
              </h3>
              <p className="text-gray-400">
                سيتم إرسال روابط المقابلة إلى {selectedCandidates.length} مرشح
                محدد
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                onClick={onDeselectAll}
                disabled={selectedCandidates.length === 0}
              >
                إلغاء التحديد
              </Button>

              <Button
                onClick={onAddCandidates}
                disabled={selectedCandidates.length === 0 || loading}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-8"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    إضافة المرشحين المحددين ({selectedCandidates.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
