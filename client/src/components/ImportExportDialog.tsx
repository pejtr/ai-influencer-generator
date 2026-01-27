import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, Upload, FileJson, FileText, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportExportDialog({ open, onOpenChange, onSuccess }: ImportExportDialogProps) {
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFormat, setImportFormat] = useState<"json" | "csv">("json");
  const [importMode, setImportMode] = useState<"skip" | "overwrite">("skip");
  const [previewData, setPreviewData] = useState<any>(null);

  const exportJSON = trpc.admin.exportKnowledgeJSON.useQuery(undefined, { enabled: false });
  const exportCSV = trpc.admin.exportKnowledgeCSV.useQuery(undefined, { enabled: false });
  const previewImport = trpc.admin.previewImportJSON.useMutation();
  const importJSON = trpc.admin.importKnowledgeJSON.useMutation();
  const importCSV = trpc.admin.importKnowledgeCSV.useMutation();

  const handleExportJSON = async () => {
    try {
      const data = await exportJSON.refetch();
      if (data.data) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `knowledge-base-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Knowledge base exported as JSON");
      }
    } catch (error) {
      toast.error("Failed to export JSON");
    }
  };

  const handleExportCSV = async () => {
    try {
      const data = await exportCSV.refetch();
      if (data.data) {
        const blob = new Blob([data.data], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `knowledge-base-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Knowledge base exported as CSV");
      }
    } catch (error) {
      toast.error("Failed to export CSV");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setPreviewData(null);

    // Auto-detect format
    if (file.name.endsWith(".json")) {
      setImportFormat("json");
    } else if (file.name.endsWith(".csv")) {
      setImportFormat("csv");
    }

    // Preview for JSON
    if (file.name.endsWith(".json")) {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const preview = await previewImport.mutateAsync({ data });
        setPreviewData(preview);
      } catch (error) {
        toast.error("Invalid JSON file");
      }
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error("Please select a file");
      return;
    }

    try {
      const text = await importFile.text();

      if (importFormat === "json") {
        const data = JSON.parse(text);
        const result = await importJSON.mutateAsync({
          data,
          skipDuplicates: importMode === "skip",
          overwriteDuplicates: importMode === "overwrite",
        });

        if (result.success) {
          toast.success(`Imported ${result.imported} items, skipped ${result.skipped}`);
          onSuccess();
          onOpenChange(false);
          setImportFile(null);
          setPreviewData(null);
        } else {
          toast.error(`Import failed: ${result.errors.join(", ")}`);
        }
      } else {
        const result = await importCSV.mutateAsync({
          csvContent: text,
          skipDuplicates: importMode === "skip",
          overwriteDuplicates: importMode === "overwrite",
        });

        if (result.success) {
          toast.success(`Imported ${result.imported} items, skipped ${result.skipped}`);
          onSuccess();
          onOpenChange(false);
          setImportFile(null);
        } else {
          toast.error(`Import failed: ${result.errors.join(", ")}`);
        }
      }
    } catch (error) {
      toast.error("Failed to import file");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import / Export Knowledge Base</DialogTitle>
          <DialogDescription>
            Export your knowledge base to JSON or CSV, or import from a file
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "export" | "import")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">
              <Download className="w-4 h-4 mr-2" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={handleExportJSON}
                disabled={exportJSON.isFetching}
              >
                <FileJson className="w-8 h-8" />
                <span>Export as JSON</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={handleExportCSV}
                disabled={exportCSV.isFetching}
              >
                <FileText className="w-8 h-8" />
                <span>Export as CSV</span>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              JSON format preserves all data and is recommended for backups. CSV format is useful for spreadsheet editing.
            </p>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div>
              <Label>Select File</Label>
              <Input
                type="file"
                accept=".json,.csv"
                onChange={handleFileSelect}
                className="mt-2"
              />
            </div>

            {importFile && (
              <>
                <div>
                  <Label>Format</Label>
                  <RadioGroup value={importFormat} onValueChange={(v) => setImportFormat(v as "json" | "csv")} className="mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="json" id="json" />
                      <Label htmlFor="json">JSON</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="csv" id="csv" />
                      <Label htmlFor="csv">CSV</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Duplicate Handling</Label>
                  <RadioGroup value={importMode} onValueChange={(v) => setImportMode(v as "skip" | "overwrite")} className="mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="skip" id="skip" />
                      <Label htmlFor="skip">Skip duplicates (keep existing)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="overwrite" id="overwrite" />
                      <Label htmlFor="overwrite">Overwrite duplicates</Label>
                    </div>
                  </RadioGroup>
                </div>

                {previewData && (
                  <div className="border rounded-lg p-4 space-y-2">
                    <h4 className="font-medium">Import Preview</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{previewData.newItems} new</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">{previewData.duplicates} duplicates</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm">{previewData.invalid} invalid</span>
                      </div>
                    </div>
                    {previewData.items.length > 0 && (
                      <ScrollArea className="h-32 mt-2">
                        <div className="space-y-1">
                          {previewData.items.slice(0, 10).map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              {item.status === "new" && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                              {item.status === "duplicate" && <AlertCircle className="w-3 h-3 text-yellow-500" />}
                              {item.status === "invalid" && <XCircle className="w-3 h-3 text-red-500" />}
                              <span className="truncate">{item.title}</span>
                              {item.reason && <span className="text-muted-foreground text-xs">({item.reason})</span>}
                            </div>
                          ))}
                          {previewData.items.length > 10 && (
                            <p className="text-xs text-muted-foreground">...and {previewData.items.length - 10} more</p>
                          )}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {activeTab === "import" && importFile && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={importJSON.isPending || importCSV.isPending}>
              {importJSON.isPending || importCSV.isPending ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
