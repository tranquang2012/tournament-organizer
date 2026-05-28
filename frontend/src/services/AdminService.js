/**
 * AdminService – mock API layer for user management.
 *
 * GET  /admin/users          → { users, totalCount }
 * PATCH /admin/users/:id/role → updated user
 * PATCH /admin/users/:id/status → updated user (enable / disable)
 */

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms))

/* seed data */
let mockUsers = [
  {
    id: 'u-001',
    name: 'Nguyen Minh Tuan',
    email: 'tuan.nguyen@gmail.com',
    role: 'USER',
    status: 'ACTIVE',
    provider: 'google',
  },
  {
    id: 'u-002',
    name: 'Tran Hoang Nam',
    email: 'nam.tran@outlook.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    provider: 'google',
  },
  {
    id: 'u-003',
    name: 'Pham Thu Hien',
    email: 'hien.pham@yahoo.com',
    role: 'USER',
    status: 'DISABLED',
    provider: 'facebook',
  },
  {
    id: 'u-004',
    name: 'Le Van Duc',
    email: 'duc.le@gmail.com',
    role: 'USER',
    status: 'ACTIVE',
    provider: 'google',
  },
  {
    id: 'u-005',
    name: 'Vo Thanh Nhi',
    email: 'nhi.vo@hotmail.com',
    role: 'USER',
    status: 'ACTIVE',
    provider: 'facebook',
  },
  {
    id: 'u-006',
    name: 'Hoang Anh Khoa',
    email: 'khoa.hoang@gmail.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    provider: 'google',
  },
  {
    id: 'u-007',
    name: 'Dang Ngoc Bich',
    email: 'bich.dang@outlook.com',
    role: 'USER',
    status: 'DISABLED',
    provider: 'facebook',
  },
  {
    id: 'u-008',
    name: 'Bui Quang Huy',
    email: 'huy.bui@gmail.com',
    role: 'USER',
    status: 'ACTIVE',
    provider: 'google',
  },
]

/* GET /admin/users */
export async function getUsers() {
  await delay()
  return {
    users: mockUsers.map(({ id, name, email, role, status, provider }) => ({
      id,
      name,
      email,
      role,
      status,
      provider,
    })),
    totalCount: mockUsers.length,
  }
}

/* PATCH /admin/users/:id/role */
export async function updateUserRole(userId, role) {
  await delay(400)
  const idx = mockUsers.findIndex((u) => u.id === userId)
  if (idx === -1) throw new Error('User not found')
  mockUsers[idx] = { ...mockUsers[idx], role }
  return { ...mockUsers[idx] }
}

/* PATCH /admin/users/:id/status (enable / disable) */
export async function updateUserStatus(userId, status) {
  await delay(400)
  const idx = mockUsers.findIndex((u) => u.id === userId)
  if (idx === -1) throw new Error('User not found')
  mockUsers[idx] = { ...mockUsers[idx], status }
  return { ...mockUsers[idx] }
}
