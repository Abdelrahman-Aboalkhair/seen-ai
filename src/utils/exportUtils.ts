// Utility functions for exporting CV analysis results

export interface CVAnalysisResult {
  name: string;
  email: string;
  phone: string;
  city: string;
  dateOfBirth: string;
  skills: string;
  summary: string;
  education: string;
  jobHistory: string;
  consideration: string;
  strengths: string;
  gaps: string;
  vote: string;
  analysisDate: string;
  ranking: number;
}

export interface ExportOptions {
  format: "csv" | "json" | "pdf";
  includeAllFields?: boolean;
  fileName?: string;
}

// Export to CSV
export function exportToCSV(
  results: CVAnalysisResult[],
  options: ExportOptions = { format: "csv" }
) {
  const { fileName = "cv-analysis-results" } = options;

  // Define CSV headers
  const headers = [
    "الاسم",
    "البريد الإلكتروني",
    "رقم الهاتف",
    "المدينة",
    "تاريخ الميلاد",
    "المهارات",
    "الملخص",
    "التعليم",
    "الخبرة العملية",
    "التقييم العام",
    "نقاط القوة",
    "نقاط التحسين",
    "التقييم (1-10)",
    "تاريخ التحليل",
    "الترتيب",
  ];

  // Convert results to CSV rows
  const csvRows = [
    headers.join(","),
    ...results.map((result) =>
      [
        `"${result.name}"`,
        `"${result.email}"`,
        `"${result.phone}"`,
        `"${result.city}"`,
        `"${result.dateOfBirth}"`,
        `"${result.skills}"`,
        `"${result.summary}"`,
        `"${result.education}"`,
        `"${result.jobHistory}"`,
        `"${result.consideration}"`,
        `"${result.strengths}"`,
        `"${result.gaps}"`,
        result.vote,
        `"${result.analysisDate}"`,
        result.ranking,
      ].join(",")
    ),
  ];

  const csvContent = csvRows.join("\n");

  // Add UTF-8 BOM to ensure proper encoding for Arabic text
  const BOM = "\uFEFF";
  const csvContentWithBOM = BOM + csvContent;

  const blob = new Blob([csvContentWithBOM], {
    type: "text/csv;charset=utf-8;",
  });

  // Create download link
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export to JSON
export function exportToJSON(
  results: CVAnalysisResult[],
  options: ExportOptions = { format: "json" }
) {
  const { fileName = "cv-analysis-results" } = options;

  const exportData = {
    exportDate: new Date().toISOString(),
    totalResults: results.length,
    results: results,
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], {
    type: "application/json;charset=utf-8;",
  });

  // Create download link
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.json`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export to PDF (using jsPDF)
export async function exportToPDF(
  results: CVAnalysisResult[],
  options: ExportOptions = { format: "pdf" }
) {
  const { fileName = "cv-analysis-results" } = options;

  // Dynamic import for jsPDF to avoid bundle size issues
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF();

  // Set document properties
  doc.setProperties({
    title: "نتائج تحليل السير الذاتية",
    subject: "CV Analysis Results",
    author: "SEEN AI HR Platform",
    creator: "SEEN AI HR Platform",
  });

  // Add title - Use English text for PDF to avoid encoding issues
  doc.setFontSize(20);
  doc.text("CV Analysis Results", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Export Date: ${new Date().toLocaleDateString("en-US")}`, 105, 30, {
    align: "center",
  });
  doc.text(`Total Results: ${results.length}`, 105, 40, { align: "center" });

  let yPosition = 60;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const lineHeight = 7;

  results.forEach((result, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }

    // Candidate header
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text(`${index + 1}. ${result.name}`, margin, yPosition);
    yPosition += lineHeight;

    // Vote score
    doc.setFontSize(12);
    doc.setFont(undefined, "normal");
    doc.text(`Rating: ${result.vote}/10`, margin, yPosition);
    yPosition += lineHeight;

    // Contact info
    if (result.email) {
      doc.text(`Email: ${result.email}`, margin, yPosition);
      yPosition += lineHeight;
    }
    if (result.phone) {
      doc.text(`Phone: ${result.phone}`, margin, yPosition);
      yPosition += lineHeight;
    }
    if (result.city) {
      doc.text(`City: ${result.city}`, margin, yPosition);
      yPosition += lineHeight;
    }

    // Skills
    if (result.skills) {
      doc.setFont(undefined, "bold");
      doc.text("Skills:", margin, yPosition);
      yPosition += lineHeight;
      doc.setFont(undefined, "normal");

      const skills = result.skills.split(",").map((s) => s.trim());
      skills.forEach((skill) => {
        doc.text(`• ${skill}`, margin + 5, yPosition);
        yPosition += lineHeight;
      });
    }

    // Summary
    if (result.summary) {
      doc.setFont(undefined, "bold");
      doc.text("Summary:", margin, yPosition);
      yPosition += lineHeight;
      doc.setFont(undefined, "normal");

      // Split long text into multiple lines
      const summaryLines = doc.splitTextToSize(result.summary, 170);
      summaryLines.forEach((line) => {
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
    }

    // Strengths
    if (result.strengths && result.strengths !== "غير محدد") {
      doc.setFont(undefined, "bold");
      doc.text("Strengths:", margin, yPosition);
      yPosition += lineHeight;
      doc.setFont(undefined, "normal");

      const strengths = result.strengths.split(",").map((s) => s.trim());
      strengths.forEach((strength) => {
        doc.text(`• ${strength}`, margin + 5, yPosition);
        yPosition += lineHeight;
      });
    }

    // Gaps
    if (result.gaps && result.gaps !== "غير محدد") {
      doc.setFont(undefined, "bold");
      doc.text("Areas for Improvement:", margin, yPosition);
      yPosition += lineHeight;
      doc.setFont(undefined, "normal");

      const gaps = result.gaps.split(",").map((s) => s.trim());
      gaps.forEach((gap) => {
        doc.text(`• ${gap}`, margin + 5, yPosition);
        yPosition += lineHeight;
      });
    }

    // Add spacing between candidates
    yPosition += 10;
  });

  // Save the PDF
  doc.save(`${fileName}.pdf`);
}

// Main export function
export async function exportResults(
  results: CVAnalysisResult[],
  options: ExportOptions
) {
  try {
    switch (options.format) {
      case "csv":
        exportToCSV(results, options);
        break;
      case "json":
        exportToJSON(results, options);
        break;
      case "pdf":
        await exportToPDF(results, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  } catch (error) {
    console.error("Export error:", error);
    throw error;
  }
}
