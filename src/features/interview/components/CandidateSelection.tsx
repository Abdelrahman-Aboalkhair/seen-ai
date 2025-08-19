import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Checkbox } from "../../../components/ui/Checkbox";
import { Badge } from "../../../components/ui/Badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/Avatar";
import { Search, Users, Mail, FileText, CheckCircle } from "lucide-react";
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
  onFetchCandidates
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    onFetchCandidates();
  }, [onFetchCandidates]);

  useEffect(() => {
    const filtered = candidates.filter(candidate =>
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCandidates(filtered);
  }, [candidates, searchTerm]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const allSelected = filteredCandidates.length > 0 && 
    filteredCandidates.every(candidate => selectedCandidates.includes(candidate.candidateId!));

  const someSelected = filteredCandidates.some(candidate => 
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
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            اختيار المرشحين
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            اختر المرشحين من قاعدة البيانات لإرسال روابط المقابلة إليهم
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث في المرشحين..."
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                ref={ref => {
                  if (ref) ref.indeterminate = someSelected && !allSelected;
                }}
                onCheckedChange={handleSelectAllToggle}
              />
              <span className="text-sm">تحديد الكل</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              {filteredCandidates.length} مرشح متاح
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedCandidates.length} مرشح محدد
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">جاري تحميل المرشحين...</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "لا توجد نتائج للبحث" : "لا يوجد مرشحين متاحين"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredCandidates.map((candidate) => {
                const isSelected = selectedCandidates.includes(candidate.candidateId!);
                
                return (
                  <div
                    key={candidate.candidateId}
                    className={`p-4 hover:bg-muted/50 transition-colors ${
                      isSelected ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onCandidateToggle(candidate.candidateId!)}
                      />
                      
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={candidate.resumeUrl} />
                        <AvatarFallback>
                          {getInitials(candidate.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{candidate.name}</h3>
                          {isSelected && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{candidate.email}</span>
                          </div>
                          
                          {candidate.resumeUrl && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>السيرة الذاتية متوفرة</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={isSelected ? "default" : "secondary"}>
                          {isSelected ? "محدد" : "متاح"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedCandidates.length} مرشح محدد للمقابلة
            </div>
            
            <Button
              onClick={onAddCandidates}
              disabled={selectedCandidates.length === 0 || loading}
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  جاري الإضافة...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  إضافة المرشحين المحددين
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
