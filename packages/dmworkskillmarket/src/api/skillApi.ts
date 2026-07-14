/**
 * Skill marketplace API — real HTTP client.
 *
 * This module re-exports all public API functions from the real HTTP client
 * so all consumers transparently talk to the backend via /market/api/v1.
 *
 * The original mock is preserved at ./skillApiMock.ts for testing.
 */
export {
  getCategories,
  getSkills,
  getMySkills,
  getSkill,
  createSkill,
  updateSkill,
  deleteSkill,
  initUpload,
  uploadFile,
  triggerParse,
  pollParse,
  initReupload,
} from "./skillApiReal";
