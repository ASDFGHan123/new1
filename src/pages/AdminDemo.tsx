import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Database, Activity, Eye } from "lucide-react";

const AdminDemo = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">OffChat Admin Panel</h1>
          <p className="text-xl text-muted-foreground">Complete admin dashboard with user management and moderation tools</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                User List & Filtering
              </CardTitle>
              <CardDescription>Find and filter users quickly with advanced search</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Search by username or email</li>
                <li>• Filter by status (active, suspended, banned)</li>
                <li>• Filter by role (user, admin, moderator)</li>
                <li>• Real-time user statistics</li>
              </ul>
              <Badge className="mt-3" variant="secondary">✓ Completed</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Profile Viewer
              </CardTitle>
              <CardDescription>See and manage a user's full data</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Complete user profile information</li>
                <li>• Activity statistics and metrics</li>
                <li>• Join date and last active status</li>
                <li>• Message count and report history</li>
              </ul>
              <Badge className="mt-3" variant="secondary">✓ Completed</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Moderation Tools
              </CardTitle>
              <CardDescription>Suspend, ban, or warn users to enforce rules</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Issue warnings with custom reasons</li>
                <li>• Temporary or permanent suspensions</li>
                <li>• Ban users with duration options</li>
                <li>• Moderation action previews</li>
              </ul>
              <Badge className="mt-3" variant="secondary">✓ Completed</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Data Tools
              </CardTitle>
              <CardDescription>Export or delete data for privacy/compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• GDPR-compliant data export</li>
                <li>• Selective data deletion options</li>
                <li>• Profile, messages, and activity logs</li>
                <li>• Confirmation dialogs for safety</li>
              </ul>
              <Badge className="mt-3" variant="secondary">✓ Completed</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Activity Logs
              </CardTitle>
              <CardDescription>Audit user behavior and admin actions</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Comprehensive audit trail</li>
                <li>• User login/logout tracking</li>
                <li>• Admin action logging</li>
                <li>• Severity-based filtering</li>
              </ul>
              <Badge className="mt-3" variant="secondary">✓ Completed</Badge>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Ready to explore the admin dashboard?</p>
          <div className="flex justify-center space-x-4">
            {/* <Button asChild>
              <a href="/admin">View Admin Dashboard</a>
            </Button> */}
            <Button variant="outline" asChild>
              <a href="/admin-login">Login as Admin</a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Default admin credentials: username: <code>admin</code>, password: <code>12341234</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDemo;