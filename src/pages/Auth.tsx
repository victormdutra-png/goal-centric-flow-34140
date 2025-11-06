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
import { Eye, EyeOff } from "lucide-react";

type Country = {
  code: string;
  name: string;
  phoneCode: string;
  phoneFormat: string;
  phonePlaceholder: string;
  dateFormat: string;
  datePlaceholder: string;
  language: string;
};

const countries: Country[] = [
  {
    code: "BR",
    name: "Brasil",
    phoneCode: "+55",
    phoneFormat: "(XX) XXXXX-XXXX",
    phonePlaceholder: "(11) 99999-9999",
    dateFormat: "DD/MM/YYYY",
    datePlaceholder: "DD/MM/AAAA",
    language: "pt-BR",
  },
  {
    code: "US",
    name: "United States",
    phoneCode: "+1",
    phoneFormat: "(XXX) XXX-XXXX",
    phonePlaceholder: "(555) 555-5555",
    dateFormat: "MM/DD/YYYY",
    datePlaceholder: "MM/DD/YYYY",
    language: "en-US",
  },
  {
    code: "ES",
    name: "España",
    phoneCode: "+34",
    phoneFormat: "XXX XXX XXX",
    phonePlaceholder: "612 345 678",
    dateFormat: "DD/MM/YYYY",
    datePlaceholder: "DD/MM/AAAA",
    language: "es-ES",
  },
  {
    code: "FR",
    name: "France",
    phoneCode: "+33",
    phoneFormat: "X XX XX XX XX",
    phonePlaceholder: "6 12 34 56 78",
    dateFormat: "DD/MM/YYYY",
    datePlaceholder: "DD/MM/AAAA",
    language: "fr-FR",
  },
  {
    code: "DE",
    name: "Deutschland",
    phoneCode: "+49",
    phoneFormat: "XXX XXXXXXX",
    phonePlaceholder: "151 12345678",
    dateFormat: "DD.MM.YYYY",
    datePlaceholder: "DD.MM.JJJJ",
    language: "de-DE",
  },
];

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
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  // Signup fields
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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

      // Format phone to E.164 format
      const formattedPhone = phone.replace(/\D/g, '');
      const phoneWithCountry = `${selectedCountry.phoneCode}${formattedPhone}`;

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
      const phoneWithCountry = `${selectedCountry.phoneCode}${formattedPhone}`;

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
            {!isVerifyingPhone ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="country">País / Country</Label>
                  <Select
                    value={selectedCountry.code}
                    onValueChange={(value) => {
                      const country = countries.find((c) => c.code === value);
                      if (country) {
                        setSelectedCountry(country);
                        setPhone("");
                        setBirthDate("");
                        setBirthDateDisplay("");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name} ({country.phoneCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">
                    {selectedCountry.code === "BR" ? "Usuário" : 
                     selectedCountry.code === "US" ? "Username" :
                     selectedCountry.code === "ES" ? "Usuario" :
                     selectedCountry.code === "FR" ? "Utilisateur" : "Benutzername"}
                  </Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@usuario"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    {selectedCountry.code === "BR" ? "Nome Completo" : 
                     selectedCountry.code === "US" ? "Full Name" :
                     selectedCountry.code === "ES" ? "Nombre Completo" :
                     selectedCountry.code === "FR" ? "Nom Complet" : "Vollständiger Name"}
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={selectedCountry.code === "BR" ? "João Silva" : 
                                 selectedCountry.code === "US" ? "John Smith" :
                                 selectedCountry.code === "ES" ? "Juan García" :
                                 selectedCountry.code === "FR" ? "Jean Dupont" : "Hans Schmidt"}
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
                  <Label htmlFor="phone">
                    {selectedCountry.code === "BR" ? "Telefone" : 
                     selectedCountry.code === "US" ? "Phone" :
                     selectedCountry.code === "ES" ? "Teléfono" :
                     selectedCountry.code === "FR" ? "Téléphone" : "Telefon"}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={selectedCountry.phoneCode}
                      disabled
                      className="w-20"
                    />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value, selectedCountry);
                        setPhone(formatted);
                      }}
                      placeholder={selectedCountry.phonePlaceholder}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">
                    {selectedCountry.code === "BR" ? "Data de Nascimento" : 
                     selectedCountry.code === "US" ? "Birth Date" :
                     selectedCountry.code === "ES" ? "Fecha de Nacimiento" :
                     selectedCountry.code === "FR" ? "Date de Naissance" : "Geburtsdatum"}
                  </Label>
                  <Input
                    id="birthDate"
                    type="text"
                    value={birthDateDisplay}
                    onChange={(e) => {
                      const formatted = formatDate(e.target.value, selectedCountry);
                      setBirthDateDisplay(formatted);
                      
                      // Convert to ISO format for validation
                      const isoDate = parseDateToISO(formatted, selectedCountry);
                      setBirthDate(isoDate);
                    }}
                    placeholder={selectedCountry.datePlaceholder}
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    {selectedCountry.code === "BR" ? "Senha" : 
                     selectedCountry.code === "US" ? "Password" :
                     selectedCountry.code === "ES" ? "Contraseña" :
                     selectedCountry.code === "FR" ? "Mot de passe" : "Passwort"}
                  </Label>
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
                  {loading ? 
                    (selectedCountry.code === "BR" ? "Enviando código..." : 
                     selectedCountry.code === "US" ? "Sending code..." :
                     selectedCountry.code === "ES" ? "Enviando código..." :
                     selectedCountry.code === "FR" ? "Envoi du code..." : "Code wird gesendet...") :
                    (selectedCountry.code === "BR" ? "Criar Conta" : 
                     selectedCountry.code === "US" ? "Create Account" :
                     selectedCountry.code === "ES" ? "Crear Cuenta" :
                     selectedCountry.code === "FR" ? "Créer un compte" : "Konto erstellen")
                  }
                </Button>
              </>
            ) : (
              <>
                <div className="text-center space-y-2 mb-4">
                  <h3 className="text-lg font-semibold">
                    {selectedCountry.code === "BR" ? "Verificação de Telefone" : 
                     selectedCountry.code === "US" ? "Phone Verification" :
                     selectedCountry.code === "ES" ? "Verificación de Teléfono" :
                     selectedCountry.code === "FR" ? "Vérification du téléphone" : "Telefonverifizierung"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedCountry.code === "BR" ? `Digite o código enviado para ${selectedCountry.phoneCode} ${phone}` : 
                     selectedCountry.code === "US" ? `Enter the code sent to ${selectedCountry.phoneCode} ${phone}` :
                     selectedCountry.code === "ES" ? `Ingrese el código enviado a ${selectedCountry.phoneCode} ${phone}` :
                     selectedCountry.code === "FR" ? `Entrez le code envoyé à ${selectedCountry.phoneCode} ${phone}` : 
                     `Geben Sie den an ${selectedCountry.phoneCode} ${phone} gesendeten Code ein`}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verificationCode">
                    {selectedCountry.code === "BR" ? "Código de Verificação" : 
                     selectedCountry.code === "US" ? "Verification Code" :
                     selectedCountry.code === "ES" ? "Código de Verificación" :
                     selectedCountry.code === "FR" ? "Code de vérification" : "Bestätigungscode"}
                  </Label>
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
                  {loading ? 
                    (selectedCountry.code === "BR" ? "Verificando..." : 
                     selectedCountry.code === "US" ? "Verifying..." :
                     selectedCountry.code === "ES" ? "Verificando..." :
                     selectedCountry.code === "FR" ? "Vérification..." : "Verifizierung...") :
                    (selectedCountry.code === "BR" ? "Verificar Código" : 
                     selectedCountry.code === "US" ? "Verify Code" :
                     selectedCountry.code === "ES" ? "Verificar Código" :
                     selectedCountry.code === "FR" ? "Vérifier le code" : "Code verifizieren")
                  }
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsVerifyingPhone(false);
                    setVerificationCode("");
                  }}
                  className="w-full"
                >
                  {selectedCountry.code === "BR" ? "Voltar" : 
                   selectedCountry.code === "US" ? "Back" :
                   selectedCountry.code === "ES" ? "Volver" :
                   selectedCountry.code === "FR" ? "Retour" : "Zurück"}
                </Button>
              </>
            )}
        </div>
      </Card>
    </div>
  );
};

export default Auth;