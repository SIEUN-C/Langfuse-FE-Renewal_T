// src/Pages/Settings/lib/ProjectApiKeys.js
import { trpcQuery, trpcMutation } from "./trpc";

export async function listProjectApiKeys(projectId) {
  return trpcQuery("projectApiKeys.byProjectId", { projectId });
}

export async function createProjectApiKey(projectId, note) {
  return trpcMutation("projectApiKeys.create", { projectId, note });
}

export async function deleteProjectApiKey(projectId, id) {
  return trpcMutation("projectApiKeys.delete", { projectId, id });
}

export async function updateProjectApiKeyNote(projectId, id, note) {
  return trpcMutation("projectApiKeys.updateNote", { projectId, keyId: id, note });
}
