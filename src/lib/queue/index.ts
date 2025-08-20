// Export queue service
export * from "./queue-service";

// Initialize worker when this module is imported
console.log("🚀 ===== INITIALIZING QUEUE SYSTEM =====");
console.log("📦 Loading queue service...");
import "./queue-service";
console.log("👷 Loading queue worker...");
import "./queue-worker";
console.log("✅ ===== QUEUE SYSTEM READY =====");
console.log("🎯 Worker is ready to process jobs");
console.log("⏰ Initialized at:", new Date().toISOString());
