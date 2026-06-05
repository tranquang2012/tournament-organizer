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
      status: user.isDisable ? "DISABLED" : "ACTIVE",
      providers: user.providers || [],
      avatarUrl: user.avatarUrl
    })),
    totalCount: data.length,
  };
}

/* PATCH /admin/users/:id/promote */
export async function promoteUserToAdmin(userId) {
  const token = await getAccessToken();
  const response = await axios.patch(`/api/users/admin/${userId}/promote`, {}, withAuthHeader(token));
  return response.data;
}

/* PATCH /admin/users/:id/demote */
export async function demoteAdminToUser(userId) {
  const token = await getAccessToken();
  const response = await axios.patch(`/api/users/admin/${userId}/demote`, {}, withAuthHeader(token));
  return response.data;
}

/* PATCH /admin/users/:id/disable */
export async function disableUserAccount(userId) {
  const token = await getAccessToken();
  const response = await axios.patch(`/api/users/admin/${userId}/disable`, {}, withAuthHeader(token));
  return response.data;
}

/* PATCH /admin/users/:id/enable */
export async function enableUserAccount(userId) {
  const token = await getAccessToken();
  const response = await axios.patch(`/api/users/admin/${userId}/enable`, {}, withAuthHeader(token));
  return response.data;
}
