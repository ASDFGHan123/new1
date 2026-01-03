import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, MessageCircle, User } from "lucide-react";
import { organizationApi } from "@/lib/organization-api";

interface SignupFormProps {
  onToggleMode: () => void;
  onSignup: (username: string, email: string, password: string, departmentId?: string, officeId?: string, profileData?: any) => Promise<boolean>;
}

export const SignupForm = ({ onToggleMode, onSignup }: SignupFormProps) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [position, setPosition] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [idCardNumber, setIdCardNumber] = useState("");
  const [nationalIdCardNumber, setNationalIdCardNumber] = useState("");
  const [description, setDescription] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedOffice, setSelectedOffice] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDept) {
      fetchOffices(selectedDept);
    } else {
      setOffices([]);
      setSelectedOffice("");
    }
  }, [selectedDept]);

  const fetchDepartments = async () => {
    try {
      const data = await organizationApi.getDepartments();
      setDepartments(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchOffices = async (deptId: string) => {
    try {
      const data = await organizationApi.getOffices(deptId);
      setOffices(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error('Error fetching offices:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const profileData = {
        first_name: firstName,
        last_name: lastName,
        father_name: fatherName,
        position,
        phone_number: phoneNumber,
        id_card_number: idCardNumber,
        national_id_card_number: nationalIdCardNumber,
        description
      };
      const success = await onSignup(username, email, password, selectedDept, selectedOffice, profileData);
      if (success) {
        navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-lg border-border/50 shadow-elevated">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <MessageCircle className="h-10 w-10 text-primary" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              OffChat
            </h1>
          </div>
          <div>
            <CardTitle className="text-2xl">{t('auth.createAccount')}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('auth.joinConversation')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t('common.username')}</Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder={t('auth.usernamePlaceholder')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-10 transition-all duration-300 focus:shadow-glow"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.emailOptional')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.enterEmail')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="transition-all duration-300 focus:shadow-glow"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Enter first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="transition-all duration-300 focus:shadow-glow"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Enter last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="transition-all duration-300 focus:shadow-glow"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fatherName">Father Name</Label>
              <Input
                id="fatherName"
                type="text"
                placeholder="Enter father name"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="transition-all duration-300 focus:shadow-glow"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                type="text"
                placeholder="Enter position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="transition-all duration-300 focus:shadow-glow"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="transition-all duration-300 focus:shadow-glow"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idCardNumber">ID Card Number</Label>
              <Input
                id="idCardNumber"
                type="text"
                placeholder="Enter ID card number"
                value={idCardNumber}
                onChange={(e) => setIdCardNumber(e.target.value)}
                className="transition-all duration-300 focus:shadow-glow"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationalIdCardNumber">National ID Card Number</Label>
              <Input
                id="nationalIdCardNumber"
                type="text"
                placeholder="Enter national ID card number"
                value={nationalIdCardNumber}
                onChange={(e) => setNationalIdCardNumber(e.target.value)}
                className="transition-all duration-300 focus:shadow-glow"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                placeholder="Enter description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('common.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('auth.createPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10 transition-all duration-300 focus:shadow-glow"
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
            </div>
            <div className="space-y-2">
              <Label>Department & Office (Optional)</Label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            {selectedDept && (
              <div className="space-y-2">
                <Label htmlFor="office">Office</Label>
                <select
                  id="office"
                  value={selectedOffice}
                  onChange={(e) => setSelectedOffice(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select an office</option>
                  {offices.map((office) => (
                    <option key={office.id} value={office.id}>{office.name} - {office.location}</option>
                  ))}
                </select>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300" 
              disabled={isLoading}
            >
              {isLoading ? t('auth.creatingAccount') : t('auth.createAccountButton')}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('auth.alreadyHaveAccount')}{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-primary hover:text-primary-glow transition-colors"
                onClick={() => navigate("/login")}
              >
                {t('auth.signIn')}
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};