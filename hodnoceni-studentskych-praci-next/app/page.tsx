"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, GitCommit, Loader2, User } from "lucide-react";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [step, setStep] = useState<"input" | "commits">("input");
  const [commits, setCommits] = useState<any[]>([]);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState<string | null>(null);
  const router = useRouter();

  const handleLoadCommits = async () => {
    if (!repoUrl) return;
    setLoadingCommits(true);
    try {
      const res = await fetch(`http://localhost:3001/quizzes/repo-commits?url=${encodeURIComponent(repoUrl)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Chyba při načítání commitů");
      }
      const data = await res.json();
      setCommits(data);
      setStep("commits");
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Došlo k chybě. Zkontrolujte URL repozitáře a zkuste to znovu.");
    } finally {
      setLoadingCommits(false);
    }
  };

  const handleGenerate = async (commitSha?: string) => {
    if (!repoUrl) return;
    
    setLoadingQuiz(commitSha || "latest");
    try {
      const res = await fetch("http://localhost:3001/quizzes/generate-from-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryUrl: repoUrl, commitSha }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Chyba při generování kvízu");
      }
      
      const data = await res.json();
      if (data.id) {
        router.push(`/quiz/${data.id}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Došlo k chybě při generování kvízu.");
      setLoadingQuiz(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <Card className={`w-full ${step === 'commits' ? 'max-w-2xl' : 'max-w-md'} shadow-lg border-zinc-200 dark:border-zinc-800 transition-all duration-300`}>
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-full">
              <GitBranch className="w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">AI Code Review Kvíz</CardTitle>
          <CardDescription className="text-center text-zinc-500">
            {step === "input" 
              ? "Zadejte GitHub repozitář pro načtení historie změn a vygenerování kvízu."
              : `Commity pro ${repoUrl}`}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {step === "input" ? (
            <div className="space-y-2">
              <Label htmlFor="repoUrl">URL Repozitáře</Label>
              <Input 
                id="repoUrl"
                placeholder="např. facebook/react"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="dark:bg-zinc-900"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLoadCommits();
                }}
              />
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {commits.map((commit) => (
                <div key={commit.sha} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{commit.message.split('\n')[0]}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {commit.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <GitCommit className="w-3 h-3" />
                        <span className="font-mono">{commit.sha.substring(0, 7)}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant={loadingQuiz ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleGenerate(commit.sha)}
                    disabled={loadingQuiz !== null}
                    className="whitespace-nowrap"
                  >
                    {loadingQuiz === commit.sha ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generuji...</>
                    ) : "Z tohoto commitu"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex gap-3 flex-col sm:flex-row">
          {step === "input" ? (
            <>
              <Button 
                className="w-full" 
                onClick={handleLoadCommits} 
                disabled={loadingCommits || !repoUrl.trim()}
              >
                {loadingCommits && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loadingCommits ? "Načítám..." : "Zobrazit commity"}
              </Button>
              <Button 
                variant="outline"
                className="w-full" 
                onClick={() => handleGenerate()} 
                disabled={loadingQuiz !== null || !repoUrl.trim()}
              >
                {loadingQuiz === "latest" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loadingQuiz === "latest" ? "Generuji..." : "Rovnou z nejnovějšího"}
              </Button>
            </>
          ) : (
            <Button 
              variant="outline"
              className="w-full" 
              onClick={() => setStep("input")} 
              disabled={loadingQuiz !== null}
            >
              Zpět na zadání repozitáře
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
