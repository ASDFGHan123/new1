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
          <p className="text-xl text-muted-foreground">{t('adminDemo.completeAdminDashboard')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                {t('admin.userListAndFiltering')}
              </CardTitle>
                  <CardDescription>{t('adminDemo.findFilterUsers')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• {t('adminDemo.searchByUsernameEmail')}</li>
                <li>• {t('adminDemo.filterByStatus')}</li>
                <li>• {t('adminDemo.filterByRole')}</li>
                <li>• {t('adminDemo.realtimeUserStatistics')}</li>
              </ul>
              <Badge className="mt-3" variant="secondary">✓ Completed</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                {t('adminDemo.profileViewer')}
              </CardTitle>
              <CardDescription>{t('adminDemo.seeManageUserData')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• {t('adminDemo.completeProfileInfo')}</li>
                <li>• {t('adminDemo.activityStatisticsMetrics')}</li>
                <li>• {t('adminDemo.joinDateLastActiveStatus')}</li>
                <li>• {t('adminDemo.messageCountReportHistory')}</li>
              </ul>
              <Badge className="mt-3" variant="secondary">✓ Completed</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                {t('adminDemo.moderationTools')}
              </CardTitle>
              <CardDescription>{t('adminDemo.suspendBanWarnUsers')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• {t('adminDemo.issueWarningsCustomReasons')}</li>
                <li>• {t('adminDemo.temporaryPermanentSuspensions')}</li>
                <li>• {t('adminDemo.banUsersDurationOptions')}</li>
                <li>• {t('adminDemo.moderationActionPreviews')}</li>
              </ul>
              <Badge className="mt-3" variant="secondary">✓ Completed</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                {t('adminDemo.dataTools')}
              </CardTitle>
              <CardDescription>{t('adminDemo.exportDeleteData')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• {t('adminDemo.gdprCompliantExport')}</li>
                <li>• {t('adminDemo.selectiveDataDeletion')}</li>
                <li>• {t('adminDemo.profileMessagesActivityLogs')}</li>
                <li>• {t('adminDemo.confirmationDialogsSafety')}</li>
              </ul>
              <Badge className="mt-3" variant="secondary">✓ Completed</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                {t('adminDemo.activityLogs')}
              </CardTitle>
              <CardDescription>{t('adminDemo.auditUserBehaviorAdminActions')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• {t('adminDemo.comprehensiveAuditTrail')}</li>
                <li>• {t('audit.actions.user_login_logout_tracking')}</li>
                <li>• {t('adminDemo.adminActionLogging')}</li>
                <li>• {t('adminDemo.severityBasedFiltering')}</li>
              </ul>
              <Badge className="mt-3" variant="secondary">✓ Completed</Badge>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-4">
          <p className="text-muted-foreground">{t('adminDemo.readyExploreDashboard')}</p>
          <div className="flex justify-center space-x-4">
            {/* <Button asChild>
              <a href="/admin">View Admin Dashboard</a>
            </Button> */}
            <Button variant="outline" asChild>
                  <a href="/admin-login">{t('adminDemo.loginAsAdmin')}</a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('login.defaultAdminDemoCredentials')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDemo;