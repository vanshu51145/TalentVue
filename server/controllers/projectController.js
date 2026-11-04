const mongoose = require("mongoose");

const Project = require("../models/Project");

const isInvalidId = (value) =>
  !mongoose.isValidObjectId(value);

const PROJECT_TYPES = [
  "Personal",
  "Academic",
  "Internship",
  "Team",
  "Hackathon",
];

const isValidUrl = (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const buildProjectFields = (body) => {
  return {
    title: String(body.title || "").trim(),
    description: String(
      body.description || ""
    ).trim(),
    projectType:
      String(body.projectType || "")
        .trim() || "Personal",
    role: String(body.role || "")
      .trim(),
    technologies: Array.isArray(
      body.technologies
    )
      ? body.technologies
          .map((item) =>
            String(item)
              .trim()
          )
          .filter(Boolean)
      : [],
    githubUrl: String(
      body.githubUrl || ""
    )
      .trim(),
    liveUrl: String(
      body.liveUrl || ""
    )
      .trim(),
    contribution: String(
      body.contribution || ""
    )
      .trim(),
    challenges: String(
      body.challenges || ""
    )
      .trim(),
    outcome: String(
      body.outcome || ""
    )
      .trim(),
    evidenceFiles: Array.isArray(
      body.evidenceFiles
    )
      ? body.evidenceFiles.map(
          (item) =>
            String(item)
        )
      : [],
  };
};

const validateProjectFields = (
  fields
) => {
  if (fields.title.length < 3) {
    return "Project title must contain at least 3 characters.";
  }

  if (fields.description.length < 20) {
    return "Project description should contain at least 20 characters.";
  }

  if (
    !PROJECT_TYPES.includes(
      fields.projectType
    )
  ) {
    return "Invalid project type.";
  }

  if (!fields.role) {
    return "Role is required.";
  }

  if (
    !Array.isArray(fields.technologies) ||
    fields.technologies.length === 0
  ) {
    return "Technologies are required.";
  }

  if (!fields.contribution) {
    return "Contribution is required.";
  }

  if (
    fields.githubUrl &&
    !isValidUrl(fields.githubUrl)
  ) {
    return "Please enter a valid GitHub URL, including https://";
  }

  if (
    fields.liveUrl &&
    !isValidUrl(fields.liveUrl)
  ) {
    return "Please enter a valid live project URL, including https://";
  }

  return null;
};

const createProject = async (
  req,
  res
) => {
  try {
    const fields =
      buildProjectFields(req.body);

    const validationError =
      validateProjectFields(fields);

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    const project =
      await Project.create({
        ...fields,
        userId: req.user.id,
      });

    res.status(201).json({
      message: "Project saved successfully",
      project,
    });
  } catch (error) {
    console.error(
      "PROJECT CREATE ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getProjects = async (
  req,
  res
) => {
  try {
    const projects =
      await Project.find({
        userId: req.user.id,
      }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Projects fetched successfully",
      projects,
    });
  } catch (error) {
    console.error(
      "PROJECTS FETCH ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const updateProject = async (
  req,
  res
) => {
  try {
    if (isInvalidId(req.params.id)) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const ownershipQuery = {
      _id: req.params.id,
      userId: req.user.id,
    };

    const project =
      await Project.findOne(
        ownershipQuery
      );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const fields =
      buildProjectFields(req.body);

    const validationError =
      validateProjectFields(fields);

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    Object.assign(project, fields);

    await project.save();

    res.status(200).json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error(
      "PROJECT UPDATE ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const deleteProject = async (
  req,
  res
) => {
  try {
    if (isInvalidId(req.params.id)) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const project =
      await Project.findOneAndDelete(
        {
          _id: req.params.id,
          userId: req.user.id,
        }
      );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error(
      "PROJECT DELETE ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
};
