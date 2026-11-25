const Notification = require("../models/Notification");

const MAX_TITLE_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 500;
const MAX_LINK_LENGTH = 300;
const MAX_DEDUPE_KEY_LENGTH = 200;

const normalizeText = (value, maxLength) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
};

const normalizeMetadata = (metadata) => {
  if (
    !metadata ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return {};
  }

  return metadata;
};

// Notification creation is intentionally non-blocking: any failure is
// swallowed here so the primary business operation still succeeds.
const createNotification = async ({
  userId,
  type,
  title,
  message,
  link = "",
  metadata = {},
  dedupeKey = "",
  dedupeWindowMs = 0,
}) => {
  let safeDedupeKey = "";

  try {
    const safeTitle = normalizeText(
      title,
      MAX_TITLE_LENGTH
    );

    const safeMessage = normalizeText(
      message,
      MAX_MESSAGE_LENGTH
    );

    if (!userId || !type || !safeTitle || !safeMessage) {
      return null;
    }

    safeDedupeKey = normalizeText(
      dedupeKey,
      MAX_DEDUPE_KEY_LENGTH
    );

    const payload = {
      userId,
      type,
      title: safeTitle,
      message: safeMessage,
      link: normalizeText(
        link,
        MAX_LINK_LENGTH
      ),
      metadata: normalizeMetadata(metadata),
    };

    if (safeDedupeKey) {
      const existing =
        await Notification.findOne({
          userId,
          dedupeKey: safeDedupeKey,
        });

      if (existing) {
        return existing;
      }

      payload.dedupeKey = safeDedupeKey;
    } else if (dedupeWindowMs > 0) {
      const recent =
        await Notification.findOne({
          userId,
          type,
          title: safeTitle,
          message: safeMessage,
          link: payload.link,
          createdAt: {
            $gte: new Date(
              Date.now() - dedupeWindowMs
            ),
          },
        });

      if (recent) {
        return recent;
      }
    }

    return await Notification.create(payload);
  } catch (error) {
    // A concurrent request may have inserted the same dedupe key.
    if (
      error &&
      error.code === 11000 &&
      safeDedupeKey
    ) {
      try {
        return await Notification.findOne({
          userId,
          dedupeKey: safeDedupeKey,
        });
      } catch {
        return null;
      }
    }

    console.error(
      "NOTIFICATION CREATE ERROR:",
      error && error.message
    );

    return null;
  }
};

module.exports = {
  createNotification,
};
