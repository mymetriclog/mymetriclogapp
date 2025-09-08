import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Send,
  TestTube,
  FileText,
  BarChart3,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { EmailService } from "@/lib/sendgrid/email-service";

export function EmailTestPanel() {
  const [email, setEmail] = useState("");
  const [reportType, setReportType] = useState<"daily" | "weekly" | "test">(
    "daily"
  );
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    error?: string;
  } | null>(null);

  const handleSendEmail = async () => {
    if (!email) {
      setResult({
        success: false,
        message: "Please enter an email address",
      });
      return;
    }

    setIsSending(true);
    setResult(null);

    try {
      let response;

      if (reportType === "test") {
        response = await fetch("/api/email/send-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "daily",
            to: email,
            userId: "test-user-id",
            date: new Date().toISOString().split("T")[0],
            testMode: true,
          }),
        });
      } else {
        response = await fetch("/api/email/send-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: reportType,
            to: email,
            userId: "test-user-id",
            date: new Date().toISOString().split("T")[0],
            subject: `${
              reportType === "daily" ? "Daily" : "Weekly"
            } Report - ${new Date().toLocaleDateString()}`,
          }),
        });
      }

      const result = await response.json();

      if (result.success) {
        setResult({
          success: true,
          message: result.message,
        });
      } else {
        setResult({
          success: false,
          message: result.message || "Failed to send email",
          error: result.error,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to send email",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handlePreview = () => {
    if (reportType === "daily") {
      const data = EmailService.generateSampleDailyData();
      const htmlContent = EmailService.generateDailyReportEmail(data);
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
      }
    } else if (reportType === "weekly") {
      const data = EmailService.generateSampleWeeklyData();
      const htmlContent = EmailService.generateWeeklyReportEmail(data);
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
      }
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-5" />
          SendGrid Email Test Panel
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Email Configuration */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter recipient email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="reportType">Report Type</Label>
            <Select
              value={reportType}
              onValueChange={(value: any) => setReportType(value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4" />
                    Daily Report
                  </div>
                </SelectItem>
                <SelectItem value="weekly">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="size-4" />
                    Weekly Report
                  </div>
                </SelectItem>
                <SelectItem value="test">
                  <div className="flex items-center gap-2">
                    <TestTube className="size-4" />
                    Test Email
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handlePreview}
            variant="outline"
            className="flex-1"
            disabled={reportType === "test"}
          >
            <FileText className="size-4 mr-2" />
            Preview {reportType === "daily" ? "Daily" : "Weekly"} Report
          </Button>

          <Button
            onClick={handleSendEmail}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={isSending || !email}
          >
            {isSending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="size-4 mr-2" />
                Send{" "}
                {reportType === "test"
                  ? "Test"
                  : reportType === "daily"
                  ? "Daily"
                  : "Weekly"}{" "}
                Email
              </>
            )}
          </Button>
        </div>

        {/* Result Display */}
        {result && (
          <div
            className={`p-4 rounded-lg border ${
              result.success
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="size-5 text-green-600" />
              ) : (
                <XCircle className="size-5 text-red-600" />
              )}
              <div>
                <p
                  className={`font-medium ${
                    result.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {result.message}
                </p>
                {result.error && (
                  <p className="text-sm text-red-600 mt-1">
                    Error: {result.error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Information Panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">
              📋 SendGrid Integration Features:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>
                <strong>Daily Reports:</strong> Personalized daily wellness
                summaries with metrics and insights
              </li>
              <li>
                <strong>Weekly Reports:</strong> Comprehensive weekly analysis
                with trends and improvements
              </li>
              <li>
                <strong>Test Emails:</strong> Verify SendGrid configuration and
                email delivery
              </li>
              <li>
                <strong>Custom Templates:</strong> Beautiful, responsive HTML
                email designs
              </li>
              <li>
                <strong>Real-time Delivery:</strong> Instant email sending with
                delivery confirmation
              </li>
            </ul>
            <p className="text-xs mt-2 text-blue-600">
              💡 Make sure to set your SENDGRID_API_KEY environment variable for
              production use.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
