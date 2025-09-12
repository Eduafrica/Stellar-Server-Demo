import { server } from "./stellar.mjs";

/**
 * Stream live payments for an account with auto-reconnect + resume
 */
function streamPaymentsForAccount(accountId, handlers = {}) {
  let es;
  let cursor = "now";
  let stopped = false;
  let retryDelay = 1000; // 1s start

  function startStream() {
    if (stopped) return;

    es = server
      .payments()
      .forAccount(accountId)
      .cursor(cursor)
      .stream({
        onmessage: (payment) => {
          cursor = payment.paging_token; // resume point
          if (handlers.onPayment) handlers.onPayment(payment);
          retryDelay = 1000; // reset delay after success
        },
        onerror: (err) => {
          if (handlers.onError) handlers.onError(err);
          if (stopped) return;

          // Close old stream
          try {
            es();
          } catch (_) {}

          // Retry with exponential backoff
          setTimeout(() => {
            if (handlers.onReconnect) handlers.onReconnect(retryDelay);
            startStream();
          }, retryDelay);

          retryDelay = Math.min(retryDelay * 2, 60000); // max 1 min
        },
      });
  }

  startStream();

  return () => {
    stopped = true;
    try {
      es();
    } catch (_) {}
  };
}

// Example usage
const userPublicKey = "PASTE_USER_PUBLIC_KEY";

const stop = streamPaymentsForAccount(userPublicKey, {
  onPayment(payment) {
    console.log("💰 Payment event:", payment);
    // save to DB, notify user (websocket/webhook), etc.
  },
  onError(err) {
    console.error("❌ Stream error:", err.message);
  },
  onReconnect(delay) {
    console.log(`🔄 Reconnecting in ${delay / 1000}s...`);
  },
});

// You can later call `stop()` to stop streaming
