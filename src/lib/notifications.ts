import { toast } from "sonner";

export const notifications = {
  // Success notifications
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
    });
  },

  // Error notifications
  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
    });
  },

  // Info notifications
  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
    });
  },

  // Warning notifications
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
    });
  },

  // Loading notifications (returns a promise that resolves when dismissed)
  loading: (message: string, description?: string) => {
    return toast.loading(message, {
      description,
    });
  },

  // Promise-based notifications
  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  },

  // Dismiss all notifications
  dismiss: () => {
    toast.dismiss();
  },

  // Dismiss specific notification
  dismissById: (id: string | number) => {
    toast.dismiss(id);
  },

  // Integration-specific notifications
  integrationExpired: (provider: string) => {
    toast.warning(`🔑 ${provider} Token Expired`, {
      description: `Your ${provider} integration needs reconnection. Click here to fix.`,
      action: {
        label: "Fix Now",
        onClick: () => (window.location.href = "/integrations"),
      },
      duration: 10000, // Show for 10 seconds
    });
  },

  integrationExpiringSoon: (provider: string, daysLeft: number) => {
    toast.info(`⏰ ${provider} Token Expiring Soon`, {
      description: `Your ${provider} token will expire in ${daysLeft} days.`,
      action: {
        label: "Renew",
        onClick: () => (window.location.href = "/integrations"),
      },
      duration: 8000,
    });
  },
};

// Export individual functions for convenience
export const {
  success,
  error,
  info,
  warning,
  loading,
  promise,
  dismiss,
  dismissById,
  integrationExpired,
  integrationExpiringSoon,
} = notifications;
