import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { History, RotateCcw, User, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  knowledgeId: number;
  knowledgeTitle: string;
  onRestore: () => void;
}

export function HistoryDialog({ open, onOpenChange, knowledgeId, knowledgeTitle, onRestore }: HistoryDialogProps) {
  const { data: history, isLoading } = trpc.admin.getKnowledgeHistory.useQuery(
    { knowledgeId },
    { enabled: open }
  );

  const restoreMutation = trpc.admin.restoreKnowledgeVersion.useMutation({
    onSuccess: () => {
      toast.success("Version restored successfully");
      onRestore();
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to restore version");
    },
  });

  const handleRestore = (historyId: number) => {
    if (confirm("Are you sure you want to restore this version? Current data will be replaced.")) {
      restoreMutation.mutate({ knowledgeId, historyId });
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-green-500/20 text-green-400";
      case "update":
        return "bg-blue-500/20 text-blue-400";
      case "delete":
        return "bg-red-500/20 text-red-400";
      case "restore":
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const renderDiff = (entry: any) => {
    const diffs: Array<{ field: string; oldValue: any; newValue: any }> = [];

    if (entry.oldTitle !== entry.newTitle && (entry.oldTitle || entry.newTitle)) {
      diffs.push({ field: "Title", oldValue: entry.oldTitle || "(none)", newValue: entry.newTitle || "(none)" });
    }

    if (entry.oldContentType !== entry.newContentType && (entry.oldContentType || entry.newContentType)) {
      diffs.push({ field: "Type", oldValue: entry.oldContentType || "(none)", newValue: entry.newContentType || "(none)" });
    }

    if (entry.oldCategory !== entry.newCategory && (entry.oldCategory || entry.newCategory)) {
      diffs.push({ field: "Category", oldValue: entry.oldCategory || "(none)", newValue: entry.newCategory || "(none)" });
    }

    if (entry.oldPriority !== entry.newPriority && (entry.oldPriority !== undefined || entry.newPriority !== undefined)) {
      diffs.push({ field: "Priority", oldValue: entry.oldPriority ?? "(none)", newValue: entry.newPriority ?? "(none)" });
    }

    if (entry.oldIsActive !== entry.newIsActive && (entry.oldIsActive !== undefined || entry.newIsActive !== undefined)) {
      diffs.push({
        field: "Status",
        oldValue: entry.oldIsActive !== undefined ? (entry.oldIsActive ? "Active" : "Inactive") : "(none)",
        newValue: entry.newIsActive !== undefined ? (entry.newIsActive ? "Active" : "Inactive") : "(none)",
      });
    }

    return diffs;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Version History
          </DialogTitle>
          <DialogDescription>
            {knowledgeTitle}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading history...
            </div>
          )}

          {!isLoading && history && history.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No history available
            </div>
          )}

          {!isLoading && history && history.length > 0 && (
            <div className="space-y-4">
              {history.map((entry, index) => {
                const diffs = renderDiff(entry);
                return (
                  <div key={entry.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getActionColor(entry.action)}>
                          {entry.action}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span>{entry.userName || "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                      {index > 0 && entry.action !== "delete" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(entry.id)}
                          disabled={restoreMutation.isPending}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Restore
                        </Button>
                      )}
                    </div>

                    {diffs.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {diffs.map((diff, i) => (
                          <div key={i} className="text-sm">
                            <span className="font-medium">{diff.field}:</span>{" "}
                            <span className="text-red-400 line-through">{String(diff.oldValue)}</span>
                            {" → "}
                            <span className="text-green-400">{String(diff.newValue)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {entry.action === "create" && (
                      <p className="text-sm text-muted-foreground">
                        Item created
                      </p>
                    )}

                    {entry.action === "delete" && (
                      <p className="text-sm text-muted-foreground">
                        Item deleted
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
