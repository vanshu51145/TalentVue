const mongoose = require("mongoose");
const dns = require("dns");

// Some Windows setups expose 127.0.0.1 (a dead local DNS proxy) to
// the Node DNS resolver, so SRV lookups used by mongodb+srv:// URIs
// fail with "querySrv ECONNREFUSED". Public resolvers resolve Atlas
// SRV records correctly; used only as a fallback after the system
// resolver fails once (Render's own DNS is unaffected).
const FALLBACK_RESOLVERS = ["1.1.1.1", "8.8.8.8"];

// Never let credentials reach the log even if a driver error
// message embeds parts of the connection string
const sanitizeForLog = (message) =>
  String(message).replace(/\/\/[^@\s/]+@/g, "//[credentials removed]@");

const isSrvDnsFailure = (error) => {
  const code = String(error?.cause?.code || error?.code || "");
  const message = String(error?.message || "");
  return (
    /querySrv/i.test(message) ||
    ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "EAI_AGAIN"].includes(code)
  );
};

// Connection options intentionally match the original implementation
// (no overrides) so MongoDB behavior is unchanged
const connectOnce = () =>
  mongoose.connect(process.env.MONGO_URI);

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("[db] MONGO_URI is not set. Unable to connect to the database.");
    process.exit(1);
  }

  try {
    await connectOnce();
    console.log(
      `[db] MongoDB connected (system resolver): host=${mongoose.connection.host} db=${mongoose.connection.name}`
    );
    return;
  } catch (error) {
    if (!isSrvDnsFailure(error)) {
      console.log("[db] MongoDB connection error:", sanitizeForLog(error.message));
      process.exit(1);
    }

    console.warn(
      "[db] Database hostname resolution failed via the system DNS resolver (common node error: querySrv ECONNREFUSED). Retrying with public DNS resolvers (1.1.1.1, 8.8.8.8)..."
    );

    try {
      dns.setServers(FALLBACK_RESOLVERS);
    } catch {
      // ignore resolver override errors; the retry still runs
    }

    try {
      await connectOnce();
      console.log(
        `[db] MongoDB connected (public DNS fallback): host=${mongoose.connection.host} db=${mongoose.connection.name}`
      );
    } catch (retryError) {
      console.log("[db] MongoDB connection error (after public DNS fallback):", sanitizeForLog(retryError.message));
      process.exit(1);
    }
  }
};

module.exports = connectDB;
