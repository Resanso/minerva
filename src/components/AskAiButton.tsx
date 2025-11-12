"use client";

import {
  useCallback,
  useMemo,
  useState,
  type FormEvent,
  type SVGProps,
} from "react";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const SparklesIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path
      d="m12 3 1.3 3.5L17 8l-3.7 1.5L12 13l-1.3-3.5L7 8l3.7-1.5L12 3Zm7 8 0.9 2.4 2.1 0.8-2.1 0.9L19 17l-0.9-2.3L16 14l2.1-0.8L19 11Zm-14 0 0.9 2.4 2.1 0.8-2.1 0.9L5 17l-0.9-2.3L2 14l2.1-0.8L5 11Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export function AskAiButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [fluxQuery, setFluxQuery] = useState<string | null>(null);
  const [rawData, setRawData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedQuestion = useMemo(() => question.trim(), [question]);

  const resetState = useCallback(() => {
    setQuestion("");
    setAnswer(null);
    setFluxQuery(null);
    setRawData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!trimmedQuestion) {
        setError("Pertanyaan tidak boleh kosong.");
        return;
      }

      setIsLoading(true);
      setError(null);
      setAnswer(null);
      setFluxQuery(null);
      setRawData(null);

      try {
        // Call backend workflow that translates natural language to Flux and analysis answer.
        const response = await fetch(apiUrl("/api/chatbot/query"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: trimmedQuestion }),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            typeof payload?.error === "string"
              ? payload.error
              : "Gagal memproses permintaan.";
          throw new Error(message);
        }

        const answerText =
          typeof payload?.answer === "string" ? payload.answer.trim() : "";
        setAnswer(answerText ? answerText : "(Tidak ada jawaban)");

        const flux =
          typeof payload?.fluxQuery === "string"
            ? payload.fluxQuery.trim()
            : "";
        setFluxQuery(flux ? flux : null);

        const dataText =
          typeof payload?.data === "string" ? payload.data.trim() : "";
        setRawData(dataText ? dataText : null);
      } catch (err) {
        const fallbackMessage =
          err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.";
        setError(fallbackMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [trimmedQuestion]
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          resetState();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className={cn(
            "min-w-[120px] items-center gap-2 text-sm font-semibold tracking-wide",
            className
          )}
        >
          <SparklesIcon className="h-4 w-4" />
          Ask AI
        </Button>
      </DialogTrigger>
      <DialogContent className="p-6">
        <div className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Tanyakan ke Minerva AI</DialogTitle>
            <DialogDescription>
              Ajukan pertanyaan tentang performa mesin. Sistem akan menyusun
              query Flux dan menjawab berdasarkan data InfluxDB.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Contoh: Tampilkan performa mesin cutting dalam 24 jam terakhir"
              disabled={isLoading}
            />
            {error && (
              <div className="rounded-3xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <DialogFooter className="gap-3">
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Tutup
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? "Memproses..." : "Kirim Pertanyaan"}
              </Button>
            </DialogFooter>
          </form>
          {answer && (
            <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Jawaban
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">
                  {answer}
                </p>
              </div>
              {fluxQuery && (
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Flux Query
                  </p>
                  <pre className="mt-2 overflow-x-auto rounded-2xl bg-slate-950/60 p-3 text-xs text-blue-200">
                    <code>{fluxQuery}</code>
                  </pre>
                </div>
              )}
              {rawData && (
                <div>
                  <details className="group">
                    <summary className="cursor-pointer text-xs font-medium text-slate-400 transition group-open:text-slate-200">
                      Lihat Data Mentah
                    </summary>
                    <pre className="mt-2 max-h-48 overflow-auto rounded-2xl bg-slate-950/40 p-3 text-xs text-slate-300">
                      <code>{rawData}</code>
                    </pre>
                  </details>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
