/**
 * AdminService
 *
 * GET  /admin/users          → { users, totalCount }
 * PATCH /admin/users/:id/role → updated user
 * PATCH /admin/users/:id/status → updated user (enable / disable)
 */

import axios from "../config/apiEndpoints";
import { getAccessToken, withAuthHeader, normalizeRole } from "./AuthService";

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms))

/* GET /admin/users */
export async function getUsers() {
  const token = await getAccessToken();
  const response = await axios.get('/api/users/admin/profiles', withAuthHeader(token));
  const data = response.data;

  return {
    users: data.map(user => ({
      id: user.id,
      name: user.fullName || "Unknown",
      email: user.email,
      role: normalizeRole(user.role) || "USER",
      status: "ACTIVE", // mock default
      provider: "email",
      avatarUrl: user.avatarUrl
    })),
    totalCount: data.length,
  };
}

/* PATCH /admin/users/:id/role */
export async function updateUserRole(userId, role) {
  await delay(400);
  // Mock success (backend doesn't have yet)
  return { id: userId, role };
}

/* PATCH /admin/users/:id/status (enable / disable) */
export async function updateUserStatus(userId, status) {
  await delay(400);
  // Mock success (backend doesn't have yet)
  return { id: userId, status };
}
