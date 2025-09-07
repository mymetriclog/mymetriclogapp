// Export Bull queue service
export * from "./bull-queue-service";
// Initialize Bull worker when this module is imported
console.log("🚀 ===== INITIALIZING BULL QUEUE SYSTEM =====");
import "./bull-queue-service";
console.log("👷 Loading Bull queue worker...");
import "./bull-queue-worker";
console.log("✅ ===== BULL QUEUE SYSTEM READY =====");
console.log("⏰ Initialized at:", new Date().toISOString());
