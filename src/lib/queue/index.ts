// Export Bull queue service
export * from "./bull-queue-service";
import "./bull-queue-service";
import "./bull-queue-worker";
console.log("✅ ===== BULL QUEUE SYSTEM READY =====");
console.log("⏰ Initialized at:", new Date().toISOString());
