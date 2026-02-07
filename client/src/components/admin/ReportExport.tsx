import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function ReportExport() {
  const [csvLoading, setCsvLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const csvQuery = trpc.pwaAnalytics.exportReportCSV.useQuery(undefined, {
    enabled: false,
  });

  const htmlQuery = trpc.pwaAnalytics.exportReportHTML.useQuery(undefined, {
    enabled: false,
  });

  const handleCSVExport = useCallback(async () => {
    setCsvLoading(true);
    try {
      const result = await csvQuery.refetch();
      if (result.data) {
        const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("CSV report downloaded");
      }
    } catch (error) {
      toast.error("Failed to generate CSV report");
    } finally {
      setCsvLoading(false);
    }
  }, [csvQuery]);

  const handlePDFExport = useCallback(async () => {
    setPdfLoading(true);
    try {
      const result = await htmlQuery.refetch();
      if (result.data) {
        // Open HTML in new window for print-to-PDF
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(result.data.html);
          printWindow.document.close();
          // Add print button to the page
          const printBtn = printWindow.document.createElement("div");
          printBtn.style.cssText = "position:fixed;top:16px;right:16px;z-index:9999;";
          printBtn.innerHTML = `<button onclick="window.print();this.parentElement.remove()" style="background:#6366f1;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;box-shadow:0 4px 12px rgba(99,102,241,0.3)">📄 Save as PDF (Ctrl+P)</button>`;
          printWindow.document.body.appendChild(printBtn);
          toast.success("Report opened in new tab — use Print/Save as PDF");
        } else {
          // Fallback: download as HTML
          const blob = new Blob([result.data.html], { type: "text/html" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = result.data.filename.replace(".pdf", ".html");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success("HTML report downloaded — open and print to PDF");
        }
      }
    } catch (error) {
      toast.error("Failed to generate PDF report");
    } finally {
      setPdfLoading(false);
    }
  }, [htmlQuery]);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          Export Weekly Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Download the latest weekly report for sharing with your team or archiving.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleCSVExport}
            disabled={csvLoading}
          >
            {csvLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-green-500" />
            )}
            Export CSV
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handlePDFExport}
            disabled={pdfLoading}
          >
            {pdfLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 text-red-500" />
            )}
            Export PDF
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Reports include PWA metrics, A/B test results, mobile engagement, and AI recommendations
        </p>
      </CardContent>
    </Card>
  );
}
