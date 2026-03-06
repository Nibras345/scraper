export const logger = {
    info: (message: string) => {
        console.log(`[INFO] ${message}`);
    },
    error: (message: string, error?: any) => {
        console.error(`[ERROR] ${message}`, error || "");
    },
    success: (message: string) => {
        console.log(`✅ ${message}`);
    },
    warn: (message: string) => {
        console.warn(`⚠️ ${message}`);
    },
    startup: (message: string) => {
        console.log(`🚀 ${message}`);
    }
};
