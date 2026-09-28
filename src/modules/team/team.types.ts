// src/modules/team/team.types.ts

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;

  roleId: string;
  roleName: string;
  roleSlug: string;

  isActive: boolean;
  joinedAt: Date;
}

export interface TeamInvitation {
  id: string;
  email: string;

  roleId: string;
  roleName: string;
  roleSlug: string;

  expiresAt: Date;
  createdAt: Date;
}

export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  pendingInvitations: number;
  admins: number;
}

export interface TeamQuery {
  search?: string;
  role?: string;
  status: "all" | "active" | "inactive";
  page: number;
  limit: number;
}

export interface TeamRole {
  id: string;
  name: string;
  slug: string;
}
