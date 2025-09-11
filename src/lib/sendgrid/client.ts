import sgMail from "@sendgrid/mail";

// Initialize SendGrid with API key
export function initializeSendGrid() {
  const apiKey =
    process.env.SENDGRID_API_KEY ||
    "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";
  if (!apiKey) {
    throw new Error("SENDGRID_API_KEY environment variable is required");
  }
  sgMail.setApiKey(apiKey);
}

// Send email function with enhanced error handling
export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  from?: string,
  cc?: string[]
) {
  try {
    // Initialize SendGrid if not already done
    initializeSendGrid();

    const senderEmail =
      from || process.env.SENDER_VERIFICATION_EMAIL || "asad@devstitch.com";

    const msg: any = {
      to,
      from: senderEmail,
      subject,
      html: htmlContent,
      trackingSettings: {
        clickTracking: { enable: true, enableText: true },
        openTracking: { enable: true },
        subscriptionTracking: { enable: false },
      },
    };

    // Add CC if provided
    if (cc && cc.length > 0) {
      msg.cc = cc;
    }

    const response = await sgMail.send(msg);

    const messageId = response[0].headers["x-message-id"];

    return {
      success: true,
      messageId,
      message: "Email sent successfully",
    };
  } catch (error: any) {
    // Enhanced error handling
    let errorMessage = "Failed to send email";

    if (error.code === 401) {
      errorMessage = "Unauthorized: Check your SendGrid API key";
    } else if (error.code === 403) {
      errorMessage = "Forbidden: Check sender email verification";
    } else if (error.code === 429) {
      errorMessage = "Rate limited: Too many requests";
    } else if (error.response?.body?.errors) {
      errorMessage = error.response.body.errors[0].message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
}

// Verify email address with better error handling
export async function verifyEmail(email: string) {
  try {
    const senderEmail =
      process.env.SENDER_VERIFICATION_EMAIL || "asad@devstitch.com";

    const msg = {
      to: email,
      from: senderEmail,
      subject: "Email Verification - DevStitch",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">✅ Email Verification</h2>
          <p>This is a test email to verify your email address: <strong>${email}</strong></p>
          <p>If you received this email, your SendGrid integration is working properly!</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Sent from DevStitch Wellness Platform<br>
            Time: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    };

    const response = await sgMail.send(msg);

    const messageId = response[0].headers["x-message-id"];

    return {
      success: true,
      messageId,
      message: "Email verification successful",
    };
  } catch (error: any) {
    let errorMessage = "Email verification failed";
    if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      message: "Failed to verify email",
    };
  }
}

// Test SendGrid connection
export async function testSendGridConnection() {
  try {
    initializeSendGrid();

    // Try to send a test email to admin
    const adminEmail = process.env.ADMIN_EMAIL || "";

    const msg = {
      to: adminEmail,
      from: process.env.SENDER_VERIFICATION_EMAIL || "asad@devstitch.com",
      subject: "🧪 SendGrid Connection Test",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🧪 SendGrid Connection Test</h2>
          <p>This is a test email to verify your SendGrid configuration is working correctly.</p>
          <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>From:</strong> ${
            process.env.SENDER_VERIFICATION_EMAIL || "asad@devstitch.com"
          }</p>
          <p><strong>To:</strong> ${adminEmail}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            If you received this email, your SendGrid integration is working properly!
          </p>
        </div>
      `,
    };

    const response = await sgMail.send(msg);
    const messageId = response[0].headers["x-message-id"];

    return {
      success: true,
      messageId,
      message: "SendGrid connection test successful",
    };
  } catch (error: any) {
    let errorMessage = "SendGrid connection test failed";
    if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      message: "Failed to test SendGrid connection",
    };
  }
}
