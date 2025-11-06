import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import prumoLogo from "@/assets/prumo-logo.png";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { Eye, EyeOff } from "lucide-react";

const signupSchema = z.object({
  username: z.string().min(3, "Usuário deve ter no mínimo 3 caracteres"),
  fullName: z.string().min(3, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido"),
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
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  // Signup fields
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");

  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const handleSignup = async () => {
    setLoading(true);
    try {
      // Validate form
      const validation = signupSchema.safeParse({
        username,
        fullName,
        email,
        phone,
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
        toast.error("Usuário já existe");
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
        toast.error("Email já cadastrado");
        setLoading(false);
        return;
      }

      // Check if phone exists
      const { data: existingPhone } = await supabase
        .from("profiles")
        .select("phone")
        .eq("phone", phone)
        .maybeSingle();

      if (existingPhone) {
        toast.error("Telefone já cadastrado");
        setLoading(false);
        return;
      }

      // Format phone to E.164 format (+5511999999999)
      const formattedPhone = phone.replace(/\D/g, '');
      const phoneWithCountry = formattedPhone.startsWith('55') ? `+${formattedPhone}` : `+55${formattedPhone}`;

      // Sign up with phone verification
      const { error } = await supabase.auth.signUp({
        phone: phoneWithCountry,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
            email,
            phone,
            birth_date: birthDate,
          },
        },
      });

      if (error) throw error;

      toast.success("Código enviado para seu telefone!");
      setIsVerifyingPhone(true);
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    try {
      const formattedPhone = phone.replace(/\D/g, '');
      const phoneWithCountry = formattedPhone.startsWith('55') ? `+${formattedPhone}` : `+55${formattedPhone}`;

      const { error } = await supabase.auth.verifyOtp({
        phone: phoneWithCountry,
        token: verificationCode,
        type: 'sms',
      });

      if (error) throw error;

      toast.success("Conta criada com sucesso!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Try login with email first
      let loginEmail = loginIdentifier;

      // If not an email, search for username (case-insensitive)
      if (!loginIdentifier.includes("@")) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .ilike("username", loginIdentifier)
          .maybeSingle();

        if (!profile) {
          toast.error("Usuário não encontrado");
          setLoading(false);
          return;
        }

        loginEmail = profile.email;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      toast.success("Login realizado com sucesso!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login com Google");
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

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar Conta</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loginIdentifier">Email ou Usuário</Label>
              <Input
                id="loginIdentifier"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                placeholder="seu@email.com ou @usuario"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loginPassword">Senha</Label>
              <div className="relative">
                <Input
                  id="loginPassword"
                  type={showLoginPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                  placeholder="********"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                >
                  {showLoginPassword ? (
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
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full"
            >
              Google
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            {!isVerifyingPhone ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Usuário</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@usuario"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="João Silva"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => {
                      // Format phone as (11) 99999-9999
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = '(' + value.slice(0, 2) + ') ' + value.slice(2);
                      }
                      if (value.length >= 10) {
                        value = value.slice(0, 10) + '-' + value.slice(10, 14);
                      }
                      setPhone(value);
                    }}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="text"
                    value={birthDate}
                    onChange={(e) => {
                      // Format as DD/MM/YYYY
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2);
                      }
                      if (value.length >= 5) {
                        value = value.slice(0, 5) + '/' + value.slice(5, 9);
                      }
                      
                      // Convert to YYYY-MM-DD for validation
                      if (value.length === 10) {
                        const [day, month, year] = value.split('/');
                        setBirthDate(`${year}-${month}-${day}`);
                      } else {
                        setBirthDate('');
                      }
                      
                      // Update display value
                      e.target.value = value;
                    }}
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
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
                  {loading ? "Enviando código..." : "Criar Conta"}
                </Button>
              </>
            ) : (
              <>
                <div className="text-center space-y-2 mb-4">
                  <h3 className="text-lg font-semibold">Verificação de Telefone</h3>
                  <p className="text-sm text-muted-foreground">
                    Digite o código enviado para {phone}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Código de Verificação</Label>
                  <Input
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyPress={(e) => handleKeyPress(e, handleVerifyCode)}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>

                <Button
                  onClick={handleVerifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full"
                >
                  {loading ? "Verificando..." : "Verificar Código"}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsVerifyingPhone(false);
                    setVerificationCode("");
                  }}
                  className="w-full"
                >
                  Voltar
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;