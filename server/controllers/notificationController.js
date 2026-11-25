const mongoose = require("mongoose");

const Notification = require("../models/Notification");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const parsePositiveInteger = (
  value,
  fallback
) => {
  const parsed = Number.parseInt(value, 10);

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return parsed;
};

const isValidNotificationId = (id) =>
  typeof id === "string" &&
  /^[a-fA-F0-9]{24}$/.test(id) &&
  mongoose.Types.ObjectId.isValid(id);

const getNotifications = async (
  req,
  res
) => {
  try {
    const page = parsePositiveInteger(
      req.query.page,
      1
    );

    const limit = Math.min(
      parsePositiveInteger(
        req.query.limit,
        DEFAULT_LIMIT
      ),
      MAX_LIMIT
    );

    const filter = {
      userId: req.user.id,
    };

    const [
      notifications,
      total,
      unreadCount,
    ] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Notification.countDocuments(filter),

      Notification.countDocuments({
        ...filter,
        read: false,
      }),
    ]);

    const totalPages =
      Math.ceil(total / limit) || 1;

    res.status(200).json({
      notifications,
      unreadCount,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error(
      "NOTIFICATIONS FETCH ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getUnreadCount = async (
  req,
  res
) => {
  try {
    const unreadCount =
      await Notification.countDocuments({
        userId: req.user.id,
        read: false,
      });

    res.status(200).json({
      unreadCount,
    });
  } catch (error) {
    console.error(
      "NOTIFICATION UNREAD COUNT ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const markNotificationRead = async (
  req,
  res
) => {
  try {
    if (
      !isValidNotificationId(
        req.params.id
      )
    ) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    const notification =
      await Notification.findOne({
        _id: req.params.id,
        userId: req.user.id,
      });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    if (!notification.read) {
      notification.read = true;
      notification.readAt = new Date();

      await notification.save();
    }

    res.status(200).json({
      message:
        "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error(
      "NOTIFICATION READ ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const markAllNotificationsRead = async (
  req,
  res
) => {
  try {
    const readAt = new Date();

    const result =
      await Notification.updateMany(
        {
          userId: req.user.id,
          read: false,
        },
        {
          $set: {
            read: true,
            readAt,
          },
        }
      );

    res.status(200).json({
      message:
        "All notifications marked as read",
      modifiedCount:
        result.modifiedCount || 0,
      unreadCount: 0,
    });
  } catch (error) {
    console.error(
      "NOTIFICATIONS READ ALL ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteNotification = async (
  req,
  res
) => {
  try {
    if (
      !isValidNotificationId(
        req.params.id
      )
    ) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    const notification =
      await Notification.findOneAndDelete({
        _id: req.params.id,
        userId: req.user.id,
      });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.status(200).json({
      message: "Notification deleted",
    });
  } catch (error) {
    console.error(
      "NOTIFICATION DELETE ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteAllNotifications = async (
  req,
  res
) => {
  try {
    const result =
      await Notification.deleteMany({
        userId: req.user.id,
      });

    res.status(200).json({
      message: "Notifications cleared",
      deletedCount:
        result.deletedCount || 0,
    });
  } catch (error) {
    console.error(
      "NOTIFICATIONS CLEAR ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
};
