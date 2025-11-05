import { useState } from 'react';
import { QuizQuestion } from '@/lib/types';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

interface QuizSliderProps {
  questions: QuizQuestion[];
  quizClosesAt?: Date;
  userAnswers: number[];
  hasUserAnswered: boolean;
  onAnswerSelect: (questionIndex: number, optionIndex: number) => void;
  onSubmit: () => void;
  calculateScore: () => number;
}

export function QuizSlider({
  questions,
  quizClosesAt,
  userAnswers,
  hasUserAnswered,
  onAnswerSelect,
  onSubmit,
  calculateScore,
}: QuizSliderProps) {
  const [showQuiz, setShowQuiz] = useState(false);

  const isQuizClosed = quizClosesAt && new Date() > quizClosesAt;
  const allAnswered = userAnswers.length === questions.length;

  if (!showQuiz) {
    return (
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowQuiz(true)}
          disabled={hasUserAnswered}
          className="rounded-full shadow-lg"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {hasUserAnswered ? 'Quiz Respondido' : 'Quiz'}
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-card/95 backdrop-blur-sm z-20 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-sm py-2 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowQuiz(false)}
            className="gap-1"
          >
            <ChevronRight className="w-4 h-4" />
            Voltar
          </Button>
          {!isQuizClosed && !hasUserAnswered && (
            <span className="text-xs text-muted-foreground">
              Fecha em {Math.floor((quizClosesAt!.getTime() - Date.now()) / (1000 * 60 * 60))}h
            </span>
          )}
        </div>

        {/* Quiz Title */}
        <div className="text-center">
          <h3 className="text-lg font-bold">📝 Questionário</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {questions.length} {questions.length === 1 ? 'questão' : 'questões'}
          </p>
        </div>

        {/* Questions */}
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="space-y-3 pb-4 border-b border-border last:border-0">
            <p className="font-semibold text-sm">
              {qIdx + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, optIdx) => {
                const isCorrect = optIdx === q.correctIndex;
                const isSelected = userAnswers[qIdx] === optIdx;
                const showCorrect = isQuizClosed && hasUserAnswered;

                return (
                  <button
                    key={optIdx}
                    onClick={() => !hasUserAnswered && onAnswerSelect(qIdx, optIdx)}
                    disabled={hasUserAnswered}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors',
                      isSelected && !showCorrect && 'border-primary bg-primary/10 font-medium',
                      showCorrect && isCorrect && 'border-green-500 bg-green-500/10 font-medium',
                      showCorrect && isSelected && !isCorrect && 'border-red-500 bg-red-500/10',
                      !hasUserAnswered && 'hover:border-primary/50 cursor-pointer active:scale-[0.98]',
                      hasUserAnswered && 'cursor-default'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex-1">{opt}</span>
                      {showCorrect && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Submit Button */}
        {!hasUserAnswered && !isQuizClosed && allAnswered && (
          <Button onClick={onSubmit} className="w-full sticky bottom-4">
            Enviar Respostas
          </Button>
        )}

        {/* Score Display */}
        {hasUserAnswered && isQuizClosed && (
          <div className="text-center p-4 bg-muted rounded-lg sticky bottom-4">
            <p className="text-sm font-semibold">
              Você acertou {calculateScore()} de {questions.length}!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
