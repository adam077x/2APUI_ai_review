"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:3001/quizzes/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setQuiz(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return <div className="p-12 text-center text-zinc-500">Načítání kvízu...</div>;
  if (!quiz) return <div className="p-12 text-center text-red-500">Kvíz nenalezen.</div>;

  const handleSelect = (qIndex: number, optionIndex: number) => {
    if (showResults) return;
    setAnswers({ ...answers, [qIndex]: optionIndex });
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  let score = 0;
  if (showResults) {
    quiz.questions.forEach((q: any, i: number) => {
      if (answers[i] === q.correctAnswerIndex) score++;
    });
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="mb-8">
        <button onClick={() => router.push("/")} className="text-sm text-zinc-500 hover:text-black mb-4">
          &larr; Zpět
        </button>
        <h1 className="text-2xl font-bold">Kvíz z revize kódu</h1>
        {quiz.commitHash && <p className="text-sm text-zinc-500 mt-1">Commit: {quiz.commitHash}</p>}
      </div>

      <div className="space-y-8">
        {quiz.questions.map((q: any, i: number) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">{i + 1}. {q.question}</h3>
            <div className="space-y-2">
              {q.options.map((opt: string, optIndex: number) => {
                const isSelected = answers[i] === optIndex;
                const isCorrect = q.correctAnswerIndex === optIndex;
                const isWrong = isSelected && !isCorrect;
                
                let btnClass = "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800";
                if (isSelected) btnClass = "border-black bg-zinc-50 dark:bg-zinc-800 dark:border-white";
                
                if (showResults) {
                  if (isCorrect) btnClass = "border-green-500 bg-green-50 dark:bg-green-900/20";
                  else if (isWrong) btnClass = "border-red-500 bg-red-50 dark:bg-red-900/20";
                  else btnClass = "border-zinc-200 opacity-50";
                }

                return (
                  <button
                    key={optIndex}
                    onClick={() => handleSelect(i, optIndex)}
                    className={`w-full text-left p-3 border rounded-lg transition-colors ${btnClass}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {showResults && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                <strong>Vysvětlení: </strong>
                {q.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 pt-8 border-t flex items-center justify-between">
        {!showResults ? (
          <button 
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < quiz.questions.length}
            className="bg-black text-white dark:bg-white dark:text-black px-6 py-2 rounded-lg font-medium disabled:opacity-50"
          >
             Vyhodnotit kvíz
          </button>
        ) : (
          <div className="text-xl font-bold">
            Skóre: {score} / {quiz.questions.length}
          </div>
        )}
      </div>
    </div>
  );
}
