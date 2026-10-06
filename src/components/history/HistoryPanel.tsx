"use client";

/* ============================================================
   HistoryPanel — list past grading submissions from SQLite.
   Clicking one opens a detail dialog with full report.
   ============================================================ */

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { History as HistoryIcon, RefreshCw, Eye, Zap } from "lucide-react";
import { toast } from "sonner";

interface SubmissionRow {
  id: string;
  slug: string;
  fileName: string;
  rubricId: string;
  totalScore: number;
  totalMax: number;
  ocrProvider: string;
  ocrLatency: number;
  createdAt: string;
}

interface SubmissionDetail extends SubmissionRow {
  ocrText: string;
  evaluations: Array<{
    questionId: string;
    question: string;
    studentAnswer: string;
    modelAnswer: string;
    keywords: string[];
    maxMarks: number;
    suggestedScore: number;
    semanticSimilarity: number;
    missingKeywords: string[];
    feedback: string;
  }>;
}

export function HistoryPanel() {
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (data.submissions) setRows(data.submissions);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function openDetail(id: string) {
    setLoadingDetail(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/history?id=${id}`);
      const data = await res.json();
      if (data.submission) setDetail(data.submission);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingDetail(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="card-soft p-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 brand-gradient-bg-soft rounded-full opacity-50 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="pill bg-brand/10 text-brand w-fit mb-1.5">
              <HistoryIcon size={11} /> SQLite · Prisma
            </div>
            <h2 className="font-display text-2xl">Grading history</h2>
            <p className="text-sm text-muted-foreground max-w-2xl mt-1">
              Every submission is persisted to a local SQLite database. Click any
              row to view the full grading report (OCR transcript, per-question
              scores, missing keywords, and AI feedback).
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </Card>

      <Card className="card-soft p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No submissions yet. Grade an answer sheet on the{" "}
            <span className="text-brand font-medium">Grade</span> tab to see it
            here.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Submission</TableHead>
                <TableHead>Rubric</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="text-right">OCR ms</TableHead>
                <TableHead className="text-right">Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const pct = r.totalMax ? (r.totalScore / r.totalMax) * 100 : 0;
                return (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-medium text-sm">{r.slug}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.fileName}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{r.rubricId}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-display brand-gradient-text">
                        {r.totalScore.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        /{r.totalMax}
                      </span>
                      <div className="text-[10px] text-muted-foreground">
                        {pct.toFixed(1)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="pill bg-brand/10 text-brand">
                        <Zap size={10} /> {r.ocrProvider?.toUpperCase() ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {r.ocrLatency ?? 0}ms
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetail(r.id)}
                      >
                        <Eye size={14} /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={!!detail || loadingDetail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto scroll-soft">
          {loadingDetail ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading report…
            </div>
          ) : detail ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  {detail.slug}
                </DialogTitle>
                <DialogDescription>
                  {detail.rubricId} ·{" "}
                  <span className="brand-gradient-text font-display">
                    {detail.totalScore.toFixed(1)} / {detail.totalMax}
                  </span>{" "}
                  · {detail.ocrProvider?.toUpperCase()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">
                    Raw OCR
                  </h4>
                  <pre className="text-xs whitespace-pre-wrap font-mono bg-muted/40 rounded-lg p-3 max-h-40 overflow-auto scroll-soft border border-border/60">
                    {detail.ocrText}
                  </pre>
                </div>
                {detail.evaluations.map((e) => (
                  <div
                    key={e.questionId}
                    className="rounded-lg border border-border/60 p-4 bg-card/50"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="pill bg-brand/10 text-brand">
                        Q{e.questionId}
                      </span>
                      <span className="font-display brand-gradient-text text-lg">
                        {e.suggestedScore.toFixed(1)}/{e.maxMarks}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">{e.question}</p>
                    <p className="text-xs text-muted-foreground mb-1.5">
                      <span className="font-medium">Student:</span> {e.studentAnswer}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      <span className="font-medium">AI feedback:</span> {e.feedback}
                    </p>
                    {e.missingKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] text-muted-foreground mr-1">
                          Missing:
                        </span>
                        {e.missingKeywords.map((k) => (
                          <span
                            key={k}
                            className="pill bg-destructive/10 text-destructive line-through"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
