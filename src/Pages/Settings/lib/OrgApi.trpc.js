// src/Pages/Settings/lib/OrgApi.trpc.js
import { callTrpc } from "./trpcTryMany";

// 성공 경로: organizations.create (입력은 { name } 형태여야 함)
export async function createOrganization({ name }) {
  return await callTrpc("organizations.create", { name });
}
