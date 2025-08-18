import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Switch } from "../../components/ui/Switch";
import { Textarea } from "../../components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/Select";
import { 
  Settings, 
  Globe, 
  Mail, 
  Shield, 
  Database,
  Save,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";

interface SystemSettings {
  general: {
    site_name: string;
    site_description: string;
    maintenance_mode: boolean;
    default_language: string;
    timezone: string;
  };
  email: {
    smtp_host: string;
    smtp_port: number;
    smtp_username: string;
    smtp_password: string;
    from_email: string;
    from_name: string;
  };
  security: {
    session_timeout: number;
    max_login_attempts: number;
    password_min_length: number;
    require_2fa: boolean;
    allowed_domains: string[];
  };
  api: {
    rate_limit: number;
    api_key_expiry: number;
    webhook_url: string;
  };
}

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      site_name: "SEEN AI",
      site_description: "Smart Recruiter Platform",
      maintenance_mode: false,
      default_language: "en",
      timezone: "UTC"
    },
    email: {
      smtp_host: "smtp.gmail.com",
      smtp_port: 587,
      smtp_username: "",
      smtp_password: "",
      from_email: "noreply@seenai.com",
      from_name: "SEEN AI"
    },
    security: {
      session_timeout: 3600,
      max_login_attempts: 5,
      password_min_length: 8,
      require_2fa: false,
      allowed_domains: []
    },
    api: {
      rate_limit: 1000,
      api_key_expiry: 30,
      webhook_url: ""
    }
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      // const response = await adminApi.getSystemSettings();
      // setSettings(response);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      // Mock API call - replace with actual
      // await adminApi.updateSystemSettings(settings);
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (section: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const tabs = [
    { id: "general", name: "General", icon: Settings },
    { id: "email", name: "Email", icon: Mail },
    { id: "security", name: "Security", icon: Shield },
    { id: "api", name: "API", icon: Database }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-400">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">System Settings</h1>
          <p className="text-gray-400 mt-2">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload
          </Button>
          <Button onClick={saveSettings} className="bg-red-600 hover:bg-red-700">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-red-500 text-red-400"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "general" && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Site Name
                  </label>
                  <Input
                    value={settings.general.site_name}
                    onChange={(e) => updateSetting("general", "site_name", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Default Language
                  </label>
                  <Select 
                    value={settings.general.default_language} 
                    onValueChange={(value) => updateSetting("general", "default_language", value)}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Timezone
                  </label>
                  <Select 
                    value={settings.general.timezone} 
                    onValueChange={(value) => updateSetting("general", "timezone", value)}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Asia/Dubai">Dubai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Site Description
                  </label>
                  <Textarea
                    value={settings.general.site_description}
                    onChange={(e) => updateSetting("general", "site_description", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">Maintenance Mode</label>
                  <p className="text-xs text-gray-500">Enable maintenance mode to restrict access</p>
                </div>
                <Switch
                  checked={settings.general.maintenance_mode}
                  onCheckedChange={(checked) => updateSetting("general", "maintenance_mode", checked)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "email" && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    SMTP Host
                  </label>
                  <Input
                    value={settings.email.smtp_host}
                    onChange={(e) => updateSetting("email", "smtp_host", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    SMTP Port
                  </label>
                  <Input
                    type="number"
                    value={settings.email.smtp_port}
                    onChange={(e) => updateSetting("email", "smtp_port", parseInt(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    SMTP Username
                  </label>
                  <Input
                    value={settings.email.smtp_username}
                    onChange={(e) => updateSetting("email", "smtp_username", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    SMTP Password
                  </label>
                  <Input
                    type="password"
                    value={settings.email.smtp_password}
                    onChange={(e) => updateSetting("email", "smtp_password", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    From Email
                  </label>
                  <Input
                    value={settings.email.from_email}
                    onChange={(e) => updateSetting("email", "from_email", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    From Name
                  </label>
                  <Input
                    value={settings.email.from_name}
                    onChange={(e) => updateSetting("email", "from_name", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "security" && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Session Timeout (seconds)
                  </label>
                  <Input
                    type="number"
                    value={settings.security.session_timeout}
                    onChange={(e) => updateSetting("security", "session_timeout", parseInt(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Login Attempts
                  </label>
                  <Input
                    type="number"
                    value={settings.security.max_login_attempts}
                    onChange={(e) => updateSetting("security", "max_login_attempts", parseInt(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Minimum Password Length
                  </label>
                  <Input
                    type="number"
                    value={settings.security.password_min_length}
                    onChange={(e) => updateSetting("security", "password_min_length", parseInt(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">Require 2FA</label>
                  <p className="text-xs text-gray-500">Force users to enable two-factor authentication</p>
                </div>
                <Switch
                  checked={settings.security.require_2fa}
                  onCheckedChange={(checked) => updateSetting("security", "require_2fa", checked)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "api" && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5" />
                API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rate Limit (requests per hour)
                  </label>
                  <Input
                    type="number"
                    value={settings.api.rate_limit}
                    onChange={(e) => updateSetting("api", "rate_limit", parseInt(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    API Key Expiry (days)
                  </label>
                  <Input
                    type="number"
                    value={settings.api.api_key_expiry}
                    onChange={(e) => updateSetting("api", "api_key_expiry", parseInt(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Webhook URL
                </label>
                <Input
                  value={settings.api.webhook_url}
                  onChange={(e) => updateSetting("api", "webhook_url", e.target.value)}
                  placeholder="https://your-webhook-url.com"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SystemSettings;
