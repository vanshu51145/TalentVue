// URL slug <-> internal page name map used by Dashboard + dashboardRoutes
const PAGE_SLUGS = {
  Overview: "",
  Resume: "resume",
  Projects: "projects",
  Interviews: "interviews",
  Reports: "reports",
  "Start Interview": "start-interview",
  "Device Check": "device-check",
  "Interview Room": "interview-room",
  "Interview Result": "interview-result",
};

const SLUG_PAGES = {
  "": "Overview",
  resume: "Resume",
  projects: "Projects",
  interviews: "Interviews",
  reports: "Reports",
  "start-interview": "Start Interview",
  "device-check": "Device Check",
  "interview-room": "Interview Room",
  "interview-result": "Interview Result",
};

export const getPageForPath = (pathname) => {
  const rest = pathname
    .replace(/^\/dashboard\/?/, "")
    .split("/")[0];

  const known = SLUG_PAGES[rest];

  if (known) {
    return known;
  }

  // Unknown slugs fall through to ComingSoon, same title style as before
  return rest
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

export { PAGE_SLUGS };
