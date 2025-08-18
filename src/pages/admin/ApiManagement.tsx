import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/Select";
import { 
  Code, 
  Key, 
  Globe, 
  Activity,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  RefreshCw,
  Download
} from "lucide-react";
import toast from "react-hot-toast";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  user_id: string;
  user_email: string;
  permissions: string[];
  rate_limit: number;
  created_at: string;
  last_used: string;
  is_active: boolean;
}

interface ApiEndpoint {
  path: string;
  method: string;
  description: string;
  rate_limit: number;
  requires_auth: boolean;
  status: 'active' | 'deprecated' | 'beta';
}

const ApiManagement: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKeys, setShowKeys] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [newKeyName, setNewKeyName] = useState("");

  useEffect(() => {
    loadApiData();
  }, []);

  const loadApiData = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockApiKeys: ApiKey[] = [
        {
          id: "1",
          name: "Production API Key",
          key: "sk_live_1234567890abcdef",
          user_id: "user1",
          user_email: "ahmed@example.com",
          permissions: ["read", "write"],
          rate_limit: 1000,
          created_at: "2024-01-01T00:00:00Z",
          last_used: "2024-01-15T10:30:00Z",
          is_active: true
        },
        {
          id: "2",
          name: "Development API Key",
          key: "sk_test_abcdef1234567890",
          user_id: "user2",
          user_email: "fatima@example.com",
          permissions: ["read"],
          rate_limit: 100,
          created_at: "2024-01-10T00:00:00Z",
          last_used: "2024-01-14T15:45:00Z",
          is_active: true
        }
      ];

      const mockEndpoints: ApiEndpoint[] = [
        {
          path: "/api/v1/talent-search",
          method: "POST",
          description: "Search for talent based on criteria",
          rate_limit: 100,
          requires_auth: true,
          status: "active"
        },
        {
          path: "/api/v1/cv-analysis",
          method: "POST",
          description: "Analyze CV content and extract information",
          rate_limit: 50,
          requires_auth: true,
          status: "active"
        },
        {
          path: "/api/v1/users",
          method: "GET",
          description: "Get user information",
          rate_limit: 200,
          requires_auth: true,
          status: "active"
        },
        {
          path: "/api/v1/analytics",
          method: "GET",
          description: "Get analytics data",
          rate_limit: 10,
          requires_auth: true,
          status: "beta"
        }
      ];

      setApiKeys(mockApiKeys);
      setEndpoints(mockEndpoints);
    } catch (error) {
      console.error("Error loading API data:", error);
      toast.error("Failed to load API data");
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a key name");
      return;
    }

    try {
      // Mock API key generation - replace with actual API call
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: newKeyName,
        key: `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        user_id: "current_user",
        user_email: "admin@example.com",
        permissions: ["read", "write"],
        rate_limit: 1000,
        created_at: new Date().toISOString(),
        last_used: "",
        is_active: true
      };

      setApiKeys(prev => [newKey, ...prev]);
      setNewKeyName("");
      toast.success("API key generated successfully");
    } catch (error) {
      console.error("Error generating API key:", error);
      toast.error("Failed to generate API key");
    }
  };

  const revokeApiKey = async (keyId: string) => {
    try {
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, is_active: false } : key
      ));
      toast.success("API key revoked successfully");
    } catch (error) {
      console.error("Error revoking API key:", error);
      toast.error("Failed to revoke API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "deprecated":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "beta":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "POST":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "PUT":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "DELETE":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-400">Loading API data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">API Management</h1>
          <p className="text-gray-400 mt-2">Manage API keys and monitor endpoint usage</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadApiData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-red-600 hover:bg-red-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* API Keys Section */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <Button onClick={() => setSelectedKey({} as ApiKey)} className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Generate New Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div key={key.id} className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-white">{key.name}</h4>
                      <Badge className={key.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                        {key.is_active ? "Active" : "Revoked"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                      <span>{key.user_email}</span>
                      <span>Rate Limit: {key.rate_limit}/hour</span>
                      <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Key:</span>
                        <code className="text-xs bg-slate-600 px-2 py-1 rounded">
                          {showKeys ? key.key : `${key.key.substring(0, 8)}...`}
                        </code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowKeys(!showKeys)}
                        className="text-gray-400 hover:text-white"
                      >
                        {showKeys ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(key.key)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {key.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeApiKey(key.id)}
                        className="text-red-400 border-red-400 hover:bg-red-400/20"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints Section */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="h-5 w-5" />
            API Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Endpoint</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Method</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Description</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Rate Limit</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Auth</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((endpoint, index) => (
                  <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4">
                      <code className="text-white text-sm">{endpoint.path}</code>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getMethodColor(endpoint.method)}>
                        {endpoint.method}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{endpoint.description}</td>
                    <td className="py-3 px-4 text-gray-300">{endpoint.rate_limit}/hour</td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(endpoint.status)}>
                        {endpoint.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={endpoint.requires_auth ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-400"}>
                        {endpoint.requires_auth ? "Required" : "Optional"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* API Usage Analytics */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5" />
            API Usage Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">1,234</div>
              <p className="text-sm text-gray-400">Total API Calls (24h)</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">98.5%</div>
              <p className="text-sm text-gray-400">Success Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">45ms</div>
              <p className="text-sm text-gray-400">Average Response Time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate New Key Modal */}
      {selectedKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Generate New API Key</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Key Name
                </label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Enter key name..."
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={generateApiKey} className="bg-red-600 hover:bg-red-700">
                  Generate
                </Button>
                <Button variant="outline" onClick={() => setSelectedKey(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiManagement;
