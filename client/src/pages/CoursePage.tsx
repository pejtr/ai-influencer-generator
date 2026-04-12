import { useState } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import {
  CheckCircle2, Circle, Lock, Play, Clock, BookOpen,
  Trophy, ArrowRight, ChevronDown, ChevronUp, Loader2
} from "lucide-react";

export default function CoursePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [expandedModule, setExpandedModule] = useState<number | null>(null);

  const { data: enrollmentData, isLoading: enrollLoading } = trpc.course.checkEnrollment.useQuery(
    undefined, { enabled: !!user }
  );
  const { data: modules = [], isLoading: modulesLoading } = trpc.course.getModules.useQuery();
  const { data: progress = [] } = trpc.course.getProgress.useQuery(
    undefined, { enabled: !!user && !!enrollmentData?.enrolled }
  );

  const utils = trpc.useUtils();
  const completeMutation = trpc.course.completeLesson.useMutation({
    onSuccess: () => {
      utils.course.getProgress.invalidate();
      utils.course.checkEnrollment.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a08] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-6 p-8">
          <BookOpen className="w-16 h-16 text-amber-400/50" />
          <h1 className="text-2xl font-bold">Přihlaste se pro přístup ke kurzu</h1>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8"
          >
            Přihlásit se
          </Button>
        </div>
      </div>
    );
  }

  if (enrollLoading || modulesLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a08] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      </div>
    );
  }

  if (!enrollmentData?.enrolled) {
    return (
      <div className="min-h-screen bg-[#0a0a08] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-6 p-8 text-center">
          <Lock className="w-16 h-16 text-amber-400/50" />
          <h1 className="text-2xl font-bold">Kurz není přístupný</h1>
          <p className="text-white/50 max-w-md">
            Pro přístup ke kurzu AIFluencer Studio je nutné zakoupit přístup.
          </p>
          <Button
            onClick={() => navigate("/aifluencer-studio")}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8"
          >
            Koupit přístup — $97
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  const completedLessonIds = new Set(progress.map((p: any) => p.lessonId));
  const progressPct = enrollmentData.progressPct ?? 0;

  return (
    <div className="min-h-screen bg-[#0a0a08] text-white">
      <Navbar />

      <div className="container max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              <Trophy className="w-3 h-3 mr-1.5" />
              AIFluencer Studio
            </Badge>
            {progressPct === 100 && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1.5" />
                Dokončeno!
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">Váš kurz</h1>
          <p className="text-white/50 mb-6">Vítejte v AIFluencer Studio. Postupujte moduly v pořadí pro nejlepší výsledky.</p>

          {/* Progress bar */}
          <div className="bg-white/5 rounded-xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white/70">Celkový pokrok</span>
              <span className="text-sm font-bold text-amber-400">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2 bg-white/10" />
            <p className="text-xs text-white/40 mt-2">
              {completedLessonIds.size} lekcí dokončeno
            </p>
          </div>
        </div>

        {/* Modules */}
        {modules.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Obsah kurzu se připravuje. Brzy bude k dispozici.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {modules.map((mod: any, idx: number) => (
              <ModuleCard
                key={mod.id}
                module={mod}
                index={idx}
                isExpanded={expandedModule === mod.id}
                onToggle={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                completedLessonIds={completedLessonIds}
                onComplete={(lessonId) => completeMutation.mutate({ lessonId })}
                isCompleting={completeMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ModuleCard({
  module, index, isExpanded, onToggle, completedLessonIds, onComplete, isCompleting
}: {
  module: any;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  completedLessonIds: Set<number>;
  onComplete: (id: number) => void;
  isCompleting: boolean;
}) {
  const { data: lessons = [] } = trpc.course.getLessons.useQuery(
    { moduleId: module.id },
    { enabled: isExpanded }
  );

  const completedCount = lessons.filter((l: any) => completedLessonIds.has(l.id)).length;
  const allDone = lessons.length > 0 && completedCount === lessons.length;

  return (
    <Card className={`bg-white/3 border transition-all ${allDone ? "border-green-500/20" : "border-white/5"} hover:border-amber-500/10`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left"
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
          allDone ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
        }`}>
          {allDone ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white/90 text-sm">{module.title}</div>
          <div className="flex items-center gap-3 mt-1">
            {module.duration && (
              <span className="text-xs text-white/40 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {module.duration}
              </span>
            )}
            {isExpanded && lessons.length > 0 && (
              <span className="text-xs text-white/40">
                {completedCount}/{lessons.length} lekcí
              </span>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-white/5 px-5 pb-4">
          {module.description && (
            <p className="text-white/50 text-sm py-4 leading-relaxed">{module.description}</p>
          )}
          {lessons.length === 0 ? (
            <div className="py-4 text-center text-white/30 text-sm">
              <Lock className="w-6 h-6 mx-auto mb-2 opacity-50" />
              Lekce se připravují...
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              {lessons.map((lesson: any) => {
                const done = completedLessonIds.has(lesson.id);
                return (
                  <div
                    key={lesson.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      done ? "bg-green-500/5 border border-green-500/10" : "bg-white/3 border border-white/5"
                    }`}
                  >
                    <button
                      onClick={() => !done && onComplete(lesson.id)}
                      disabled={isCompleting || done}
                      className="flex-shrink-0"
                    >
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-white/30 hover:text-amber-400 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${done ? "text-white/50 line-through" : "text-white/80"}`}>
                        {lesson.title}
                      </div>
                      {lesson.duration && (
                        <div className="text-xs text-white/30 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {lesson.duration}
                        </div>
                      )}
                    </div>
                    {lesson.isPreview && !done && (
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                        Preview
                      </Badge>
                    )}
                    {lesson.videoUrl ? (
                      <Play className="w-4 h-4 text-white/30 flex-shrink-0" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-white/20 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
