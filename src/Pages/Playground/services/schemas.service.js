// schemas.service.js
import { trpcQuery, trpcMutation } from "./PlaygroundTrpcApi";
export const SchemasAPI = {
  async list(projectId) {
    const payload = await trpcQuery("llmSchemas.getAll", { projectId });
    return Array.isArray(payload) ? payload : (payload?.data ?? []);
  },
  create(projectId, { name, description, schema }) {
    return trpcMutation("llmSchemas.create", { projectId, name, description, schema });
  },
  update(projectId, { id, name, description, schema }) {
    return trpcMutation("llmSchemas.update", { id, projectId, name, description, schema });
  },
  delete(projectId, id) {
    return trpcMutation("llmSchemas.delete", { id, projectId });
  },
};
