// tools.service.js
import { trpcQuery, trpcMutation } from "./trpc.client";
export const ToolsAPI = {
  async list(projectId) {
    const payload = await trpcQuery("llmTools.getAll", { projectId });
    return Array.isArray(payload) ? payload : (payload?.data ?? []);
  },
  create(projectId, { name, description, parameters }) {
    return trpcMutation("llmTools.create", { projectId, name, description, parameters });
  },
  update(projectId, { id, name, description, parameters }) {
    return trpcMutation("llmTools.update", { id, projectId, name, description, parameters });
  },
  delete(projectId, id) {
    return trpcMutation("llmTools.delete", { id, projectId });
  },
};
