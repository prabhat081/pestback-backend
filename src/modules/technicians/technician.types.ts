import type { TechnicianStatus } from "../../database/schema/technicians.js";

export type { TechnicianStatus };

export interface TechnicianListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: TechnicianStatus | "all";
}

export interface CreateTechnicianInput {
  companyUserId: string;
  employeeCode: string;
  status?: TechnicianStatus;
  joiningDate?: string;
  notes?: string;
  serviceCatalogIds?: string[];
}

export interface UpdateTechnicianInput {
  employeeCode?: string;
  status?: TechnicianStatus;
  joiningDate?: string | null;
  notes?: string | null;
}

export interface UpdateTechnicianStatusInput {
  status: TechnicianStatus;
}

export interface UpdateTechnicianServicesInput {
  serviceCatalogIds: string[];
}
