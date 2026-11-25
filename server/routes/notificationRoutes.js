const express = require("express");

const protect = require("../middleware/authMiddleware");
const {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
} = require("../controllers/notificationController");

const router = express.Router();

router.get(
  "/unread-count",
  protect,
  getUnreadCount
);

router.get("/", protect, getNotifications);

router.patch(
  "/read-all",
  protect,
  markAllNotificationsRead
);

router.patch(
  "/:id/read",
  protect,
  markNotificationRead
);

router.delete(
  "/",
  protect,
  deleteAllNotifications
);

router.delete(
  "/:id",
  protect,
  deleteNotification
);

module.exports = router;
