"use client";

import { Button } from "@/components/ui/button";
import { notifications } from "@/lib/notifications";

export function NotificationExample() {
  const handleSuccess = () => {
    notifications.success("Success!", "Your action was completed successfully.");
  };

  const handleError = () => {
    notifications.error("Error!", "Something went wrong. Please try again.");
  };

  const handleInfo = () => {
    notifications.info("Info", "Here's some useful information for you.");
  };

  const handleWarning = () => {
    notifications.warning("Warning!", "Please be careful with this action.");
  };

  const handleLoading = async () => {
    const loadingToast = notifications.loading("Processing...", "Please wait while we process your request.");
    
    // Simulate some async work
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Dismiss the loading toast and show success
    notifications.dismissById(loadingToast);
    notifications.success("Done!", "Your request has been processed successfully.");
  };

  const handlePromise = async () => {
    const fakeApiCall = () => new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.5) {
          resolve("Data fetched successfully");
        } else {
          reject(new Error("API call failed"));
        }
      }, 2000);
    });

    notifications.promise(fakeApiCall(), {
      loading: "Fetching data...",
      success: "Data fetched successfully!",
      error: "Failed to fetch data. Please try again.",
    });
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h3 className="text-lg font-semibold">Notification Examples</h3>
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSuccess} variant="default">
          Success
        </Button>
        <Button onClick={handleError} variant="destructive">
          Error
        </Button>
        <Button onClick={handleInfo} variant="secondary">
          Info
        </Button>
        <Button onClick={handleWarning} variant="outline">
          Warning
        </Button>
        <Button onClick={handleLoading} variant="default">
          Loading
        </Button>
        <Button onClick={handlePromise} variant="secondary">
          Promise
        </Button>
      </div>
    </div>
  );
}
