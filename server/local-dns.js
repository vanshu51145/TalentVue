const dns = require("dns");

// LOCAL-ONLY DNS fix for MongoDB Atlas SRV resolution.
// On this machine Node.js resolves DNS via 127.0.0.1, which cannot answer
// MongoDB Atlas SRV queries (querySrv ECONNREFUSED). Use public resolvers
// before the backend connects so mongodb+srv:// resolution succeeds.
//
// This file is for local development only. The production Render
// deployment continues to use server/server.js unchanged and is not
// affected by this file.
dns.setServers(["1.1.1.3", "1.1.1.1"]);

require("./server.js");
