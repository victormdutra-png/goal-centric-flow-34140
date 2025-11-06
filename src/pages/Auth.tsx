import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import prumoLogo from "@/assets/prumo-logo.png";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { Eye, EyeOff, Globe } from "lucide-react";
import { countries, type Country } from "@/lib/countries";
import { useLanguage } from "@/contexts/LanguageContext";

const signupSchema = z.object({
  username: z.string().min(3, "Usuário deve ter no mínimo 3 caracteres"),
  fullName: z.string().min(3, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(8, "Telefone inválido"),
  birthDate: z.string().refine((date) => {
    const birth = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();
    
    // Adjust age if birthday hasn't occurred yet this year
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
    return actualAge >= 14;
  }, "Você deve ter pelo menos 14 anos"),
  password: z.string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    .regex(/[0-9]/, "Senha deve conter pelo menos um número")
    .regex(/[^A-Za-z0-9]/, "Senha deve conter pelo menos um caractere especial"),
});

const Auth = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<'language' | 'initial' | 'login' | 'signup' | 'forgot'>('language');

  // Signup fields
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthDateDisplay, setBirthDateDisplay] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    setLoading(true);
    try {
      // Validate form
      const validation = signupSchema.safeParse({
        username,
        fullName,
        email,
        phone: phone.replace(/\D/g, ''),
        birthDate,
        password,
      });

      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setLoading(false);
        return;
      }

      // Check if username exists (case-insensitive)
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("username")
        .ilike("username", username)
        .maybeSingle();

      if (existingUser) {
        toast.error(t('user_exists'));
        setLoading(false);
        return;
      }

      // Check if email exists (case-insensitive)
      const { data: existingEmail } = await supabase
        .from("profiles")
        .select("email")
        .ilike("email", email)
        .maybeSingle();

      if (existingEmail) {
        toast.error(t('email_exists'));
        setLoading(false);
        return;
      }

      // Check if phone exists
      const fullPhone = `${selectedCountry.phoneCode}${phone.replace(/\D/g, '')}`;
      const { data: existingPhone } = await supabase
        .from("profiles")
        .select("phone")
        .eq("phone", fullPhone)
        .maybeSingle();

      if (existingPhone) {
        toast.error(t('phone_exists'));
        setLoading(false);
        return;
      }

      // Sign up with email
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username,
            full_name: fullName,
            phone: fullPhone,
            birth_date: birthDate,
          },
        },
      });

      if (error) throw error;

      toast.success(t('check_email_confirmation'));
      setView('login');
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string, country: Country) => {
    const numbers = value.replace(/\D/g, '');
    
    if (country.code === "BR") {
      let formatted = numbers;
      if (numbers.length >= 2) {
        formatted = '(' + numbers.slice(0, 2) + ') ' + numbers.slice(2);
      }
      if (numbers.length >= 7) {
        formatted = formatted.slice(0, 10) + '-' + formatted.slice(10, 14);
      }
      return formatted.slice(0, 15);
    } else if (country.code === "US") {
      let formatted = numbers;
      if (numbers.length >= 3) {
        formatted = '(' + numbers.slice(0, 3) + ') ' + numbers.slice(3);
      }
      if (numbers.length >= 6) {
        formatted = formatted.slice(0, 9) + '-' + formatted.slice(9, 13);
      }
      return formatted.slice(0, 14);
    } else if (country.code === "ES") {
      let formatted = numbers;
      if (numbers.length >= 3) {
        formatted = numbers.slice(0, 3) + ' ' + numbers.slice(3);
      }
      if (numbers.length >= 6) {
        formatted = formatted.slice(0, 7) + ' ' + formatted.slice(7, 10);
      }
      return formatted.slice(0, 11);
    } else if (country.code === "FR") {
      let formatted = numbers;
      if (numbers.length >= 1) {
        formatted = numbers.slice(0, 1) + ' ' + numbers.slice(1);
      }
      if (numbers.length >= 3) {
        formatted = formatted.slice(0, 3) + ' ' + formatted.slice(3);
      }
      if (numbers.length >= 5) {
        formatted = formatted.slice(0, 6) + ' ' + formatted.slice(6);
      }
      if (numbers.length >= 7) {
        formatted = formatted.slice(0, 9) + ' ' + formatted.slice(9, 11);
      }
      return formatted.slice(0, 14);
    } else if (country.code === "DE") {
      let formatted = numbers;
      if (numbers.length >= 3) {
        formatted = numbers.slice(0, 3) + ' ' + numbers.slice(3, 10);
      }
      return formatted.slice(0, 11);
    }
    return numbers;
  };

  const formatDate = (value: string, country: Country) => {
    const numbers = value.replace(/\D/g, '');
    
    if (country.dateFormat === "DD/MM/YYYY") {
      let formatted = numbers;
      if (numbers.length >= 2) {
        formatted = numbers.slice(0, 2) + '/' + numbers.slice(2);
      }
      if (numbers.length >= 4) {
        formatted = formatted.slice(0, 5) + '/' + formatted.slice(5, 9);
      }
      return formatted.slice(0, 10);
    } else if (country.dateFormat === "MM/DD/YYYY") {
      let formatted = numbers;
      if (numbers.length >= 2) {
        formatted = numbers.slice(0, 2) + '/' + numbers.slice(2);
      }
      if (numbers.length >= 4) {
        formatted = formatted.slice(0, 5) + '/' + formatted.slice(5, 9);
      }
      return formatted.slice(0, 10);
    } else if (country.dateFormat === "DD.MM.YYYY") {
      let formatted = numbers;
      if (numbers.length >= 2) {
        formatted = numbers.slice(0, 2) + '.' + numbers.slice(2);
      }
      if (numbers.length >= 4) {
        formatted = formatted.slice(0, 5) + '.' + formatted.slice(5, 9);
      }
      return formatted.slice(0, 10);
    }
    return numbers;
  };

  const parseDateToISO = (displayValue: string, country: Country) => {
    const numbers = displayValue.replace(/\D/g, '');
    if (numbers.length !== 8) return '';
    
    if (country.dateFormat === "DD/MM/YYYY" || country.dateFormat === "DD.MM.YYYY") {
      const day = numbers.slice(0, 2);
      const month = numbers.slice(2, 4);
      const year = numbers.slice(4, 8);
      return `${year}-${month}-${day}`;
    } else if (country.dateFormat === "MM/DD/YYYY") {
      const month = numbers.slice(0, 2);
      const day = numbers.slice(2, 4);
      const year = numbers.slice(4, 8);
      return `${year}-${month}-${day}`;
    }
    return '';
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const validation = signupSchema.pick({ email: true, password: true }).safeParse({
        email,
        password,
      });

      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success(t('login_success'));
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    try {
      if (!email) {
        toast.error(t('email') + ' é obrigatório');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast.success(t('reset_email_sent'));
      setView('login');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar email de recuperação');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' && !loading) {
      action();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md p-6">
        <div className="flex justify-center mb-6">
          <img src={prumoLogo} alt="Prumo" className="h-16" />
        </div>

        <div className="space-y-4">
            {view === 'language' ? (
              <>
                <div className="text-center space-y-2 mb-6">
                  <Globe className="w-12 h-12 mx-auto text-primary" />
                  <h2 className="text-2xl font-bold">{t('choose_language')}</h2>
                </div>
                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                  <Button 
                    onClick={() => { setLanguage('zh-CN'); setView('initial'); }} 
                    variant="outline"
                    className="w-full h-auto py-4 justify-start gap-3 hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <span className="text-3xl">🇨🇳</span>
                    <span className="text-base font-medium">中文 (简体)</span>
                  </Button>
                  <Button 
                    onClick={() => { setLanguage('de-DE'); setView('initial'); }} 
                    variant="outline"
                    className="w-full h-auto py-4 justify-start gap-3 hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <span className="text-3xl">🇩🇪</span>
                    <span className="text-base font-medium">Deutsch (Deutschland)</span>
                  </Button>
                  <Button 
                    onClick={() => { setLanguage('en-US'); setView('initial'); }} 
                    variant="outline"
                    className="w-full h-auto py-4 justify-start gap-3 hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <span className="text-3xl">🇺🇸</span>
                    <span className="text-base font-medium">English (United States)</span>
                  </Button>
                  <Button 
                    onClick={() => { setLanguage('es-ES'); setView('initial'); }} 
                    variant="outline"
                    className="w-full h-auto py-4 justify-start gap-3 hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <span className="text-3xl">🇪🇸</span>
                    <span className="text-base font-medium">Español (España)</span>
                  </Button>
                  <Button 
                    onClick={() => { setLanguage('fr-FR'); setView('initial'); }} 
                    variant="outline"
                    className="w-full h-auto py-4 justify-start gap-3 hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <span className="text-3xl">🇫🇷</span>
                    <span className="text-base font-medium">Français (France)</span>
                  </Button>
                  <Button 
                    onClick={() => { setLanguage('it-IT'); setView('initial'); }} 
                    variant="outline"
                    className="w-full h-auto py-4 justify-start gap-3 hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <span className="text-3xl">🇮🇹</span>
                    <span className="text-base font-medium">Italiano (Italia)</span>
                  </Button>
                  <Button 
                    onClick={() => { setLanguage('ko-KR'); setView('initial'); }} 
                    variant="outline"
                    className="w-full h-auto py-4 justify-start gap-3 hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <span className="text-3xl">🇰🇷</span>
                    <span className="text-base font-medium">한국어 (대한민국)</span>
                  </Button>
                  <Button 
                    onClick={() => { setLanguage('pt-BR'); setView('initial'); }} 
                    variant="outline"
                    className="w-full h-auto py-4 justify-start gap-3 hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <span className="text-3xl">🇧🇷</span>
                    <span className="text-base font-medium">Português (Brasil)</span>
                  </Button>
                  <Button 
                    onClick={() => { setLanguage('ru-RU'); setView('initial'); }} 
                    variant="outline"
                    className="w-full h-auto py-4 justify-start gap-3 hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <span className="text-3xl">🇷🇺</span>
                    <span className="text-base font-medium">Русский (Россия)</span>
                  </Button>
                  <Button 
                    onClick={() => { setLanguage('ja-JP'); setView('initial'); }} 
                    variant="outline"
                    className="w-full h-auto py-4 justify-start gap-3 hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <span className="text-3xl">🇯🇵</span>
                    <span className="text-base font-medium">日本語 (日本)</span>
                  </Button>
                </div>
              </>
            ) : view === 'initial' ? (
              <>
                <Button variant="ghost" onClick={() => setView('language')} className="mb-4 w-full justify-start" size="sm">
                  <Globe className="w-4 h-4 mr-2" />
                  {t('back')}
                </Button>
                <div className="text-center space-y-2 mb-6">
                  <h2 className="text-2xl font-bold">{t('welcome')}</h2>
                </div>
                <Button onClick={() => setView('login')} className="w-full" variant="default">
                  {t('login')}
                </Button>
                <Button onClick={() => setView('signup')} className="w-full" variant="outline">
                  {t('signup')}
                </Button>
                <Button onClick={() => setView('forgot')} className="w-full" variant="ghost">
                  {t('forgot_password')}
                </Button>
              </>
            ) : view === 'login' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t('password')}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                      placeholder="********"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? t('hide_password') : t('show_password')}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? t('loading') : t('login')}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setView('initial')}
                  className="w-full"
                >
                  {t('back')}
                </Button>
              </>
            ) : view === 'signup' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="country">{t('country')}</Label>
                  <Select
                    value={selectedCountry.code}
                    onValueChange={(value) => {
                      const country = countries.find((c) => c.code === value);
                      if (country) {
                        setSelectedCountry(country);
                        setBirthDate("");
                        setBirthDateDisplay("");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        <span className="flex items-center gap-2">
                          <span className="text-xl">{selectedCountry.flag}</span>
                          <span>{selectedCountry.name}</span>
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <span className="flex items-center gap-2">
                            <span className="text-xl">{country.flag}</span>
                            <span>{country.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">{t('username')}</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@usuario"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('full_name')}</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phone')}</Label>
                  <div className="flex gap-2">
                    <div className="w-20 flex items-center justify-center border rounded-md bg-muted">
                      <span className="text-sm font-medium">{selectedCountry.phoneCode}</span>
                    </div>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value, selectedCountry))}
                      placeholder={selectedCountry.phonePlaceholder}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">{t('birth_date')}</Label>
                  <Input
                    id="birthDate"
                    type="text"
                    value={birthDateDisplay}
                    onChange={(e) => {
                      const formatted = formatDate(e.target.value, selectedCountry);
                      setBirthDateDisplay(formatted);
                      
                      const isoDate = parseDateToISO(formatted, selectedCountry);
                      setBirthDate(isoDate);
                    }}
                    placeholder={selectedCountry.datePlaceholder}
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t('password')}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, handleSignup)}
                      placeholder="********"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? t('hide_password') : t('show_password')}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {password && <PasswordStrengthIndicator password={password} />}
                </div>

                <Button
                  onClick={handleSignup}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? t('loading') : t('signup')}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setView('initial')}
                  className="w-full"
                >
                  {t('back')}
                </Button>
              </>
            ) : (
              <>
                <div className="text-center space-y-2 mb-4">
                  <h3 className="text-lg font-semibold">{t('reset_password')}</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleForgotPassword)}
                    placeholder="seu@email.com"
                  />
                </div>

                <Button
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? t('loading') : t('reset_password')}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setView('initial')}
                  className="w-full"
                >
                  {t('back')}
                </Button>
              </>
            )}
        </div>
      </Card>
    </div>
  );
};

export default Auth;