import { api } from "./api";

interface ErrorContext {
  component?: string;
  url?: string;
  userId?: string;
  [key: string]: unknown;
}

class ErrorReporter {
  private queue: Array<{ error: Error; context?: ErrorContext }> = [];
  private flushTimeout: NodeJS.Timeout | null = null;

  capture(error: Error, context?: ErrorContext): void {
    if (typeof window === "undefined") return;

    this.queue.push({ error, context });

    if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => this.flush(), 2000);
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];
    this.flushTimeout = null;

    for (const { error, context } of batch) {
      try {
        await api.post("/errors/client", {
          message: error.message,
          stack_trace: error.stack,
          error_code: "CLIENT_ERROR",
          severity: "error",
          context: {
            url: window.location.href,
            userAgent: navigator.userAgent,
            ...context,
          },
        });
      } catch {
        // Silently fail — don't create infinite error loops
      }
    }
  }
}

export const errorReporter = new ErrorReporter();
