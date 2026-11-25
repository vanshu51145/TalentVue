const mongoose = require("mongoose");

const notificationSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      type: {
        type: String,
        required: true,
        trim: true,
        enum: [
          "interview_completed",
          "resume_uploaded",
          "project_created",
          "project_updated",
          "password_reset",
          "system",
        ],
      },

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
      },

      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
      },

      link: {
        type: String,
        trim: true,
        default: "",
        maxlength: 300,
      },

      read: {
        type: Boolean,
        default: false,
      },

      readAt: {
        type: Date,
        default: null,
      },

      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },

      // Sparse, optional key used to suppress duplicate event
      // notifications caused by retries of the same request.
      dedupeKey: {
        type: String,
        trim: true,
        maxlength: 200,
      },
    },
    {
      timestamps: true,
    }
  );

notificationSchema.index({
  userId: 1,
  createdAt: -1,
});

notificationSchema.index({
  userId: 1,
  read: 1,
});

notificationSchema.index(
  { userId: 1, dedupeKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      dedupeKey: { $type: "string" },
    },
  }
);

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);
