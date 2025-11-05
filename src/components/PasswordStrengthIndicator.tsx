import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const checks = [
    { label: 'Mínimo 8 caracteres', passed: hasMinLength },
    { label: 'Letra maiúscula', passed: hasUppercase },
    { label: 'Número', passed: hasNumber },
    { label: 'Caractere especial', passed: hasSpecialChar },
  ];

  const passedCount = checks.filter(c => c.passed).length;
  const strength = passedCount === 0 ? 0 : passedCount === 1 ? 25 : passedCount === 2 ? 50 : passedCount === 3 ? 75 : 100;
  const strengthLabel = strength === 0 ? '' : strength <= 25 ? 'Fraca' : strength <= 50 ? 'Média' : strength <= 75 ? 'Boa' : 'Forte';
  const strengthColor = strength === 0 ? 'bg-muted' : strength <= 25 ? 'bg-destructive' : strength <= 50 ? 'bg-orange-500' : strength <= 75 ? 'bg-yellow-500' : 'bg-secondary';

  return (
    <div className="space-y-3">
      {/* Strength bar */}
      {password && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Força da senha</span>
            <span className={cn("font-medium", strength > 50 ? "text-secondary" : "text-destructive")}>
              {strengthLabel}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all duration-300", strengthColor)}
              style={{ width: `${strength}%` }}
            />
          </div>
        </div>
      )}

      {/* Checklist */}
      <div className="space-y-1.5">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            {check.passed ? (
              <Check className="w-3.5 h-3.5 text-secondary" />
            ) : (
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span className={cn(
              check.passed ? "text-card-foreground" : "text-muted-foreground"
            )}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}