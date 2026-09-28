import { db } from "../../database/index.js";

import type {
  CreateTechnicianInput,
  TechnicianListQuery,
  UpdateTechnicianInput,
  UpdateTechnicianServicesInput,
  UpdateTechnicianStatusInput,
} from "./technician.types.js";

import {
  deleteTechnician,
  findByCompanyUser,
  findByEmployeeCode,
  findCompanyServiceCatalogs,
  findCompanyUser,
  findTechnicianById,
  findTechnicians,
  getTechnicianServices,
  insertTechnician,
  replaceTechnicianServices,
  updateTechnician,
  updateTechnicianStatus,
} from "./technician.repository.js";

/**
 * ---------------------------------------------------------
 * SERVICE ERROR
 * ---------------------------------------------------------
 *
 * Agar project mein already AppError hai,
 * to is class ko apne existing AppError se replace
 * kar dena.
 */

class TechnicianServiceError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "TECHNICIAN_ERROR") {
    super(message);

    this.name = "TechnicianServiceError";

    this.statusCode = statusCode;

    this.code = code;
  }
}

function notFound(message: string) {
  return new TechnicianServiceError(message, 404, "NOT_FOUND");
}

function conflict(message: string) {
  return new TechnicianServiceError(message, 409, "CONFLICT");
}

/**
 * ---------------------------------------------------------
 * LIST TECHNICIANS
 * ---------------------------------------------------------
 */

export async function listTechnicians(
  companyId: string,
  query: TechnicianListQuery,
) {
  const result = await findTechnicians(companyId, query);

  const totalPages =
    result.total === 0 ? 0 : Math.ceil(result.total / query.limit);

  return {
    data: result.items,

    pagination: {
      page: query.page,
      limit: query.limit,
      total: result.total,
      totalPages,
    },
  };
}

/**
 * ---------------------------------------------------------
 * GET TECHNICIAN
 * ---------------------------------------------------------
 */

export async function getTechnician(companyId: string, technicianId: string) {
  const technician = await findTechnicianById(companyId, technicianId);

  if (!technician) {
    throw notFound("Technician not found");
  }

  const services = await getTechnicianServices(companyId, technicianId);

  return {
    ...technician,
    services,
  };
}

/**
 * ---------------------------------------------------------
 * CREATE TECHNICIAN
 * ---------------------------------------------------------
 */

export async function createTechnician(
  companyId: string,
  input: CreateTechnicianInput,
) {
  /**
   * 1. Verify company user.
   */
  const companyUser = await findCompanyUser(companyId, input.companyUserId);

  if (!companyUser) {
    throw notFound("Company user not found");
  }

  /**
   * Company user must be active.
   */
  if (!companyUser.isActive) {
    throw conflict("Cannot create technician for an inactive company user");
  }

  /**
   * 2. Check whether company user already
   * has technician profile.
   */
  const existingTechnician = await findByCompanyUser(
    companyId,
    input.companyUserId,
  );

  if (existingTechnician) {
    throw conflict("This company user is already a technician");
  }

  /**
   * 3. Employee code uniqueness.
   */
  const existingEmployeeCode = await findByEmployeeCode(
    companyId,
    input.employeeCode,
  );

  if (existingEmployeeCode) {
    throw conflict("Employee code already exists");
  }

  /**
   * 4. Service catalog validation.
   */
  const serviceCatalogIds = Array.from(new Set(input.serviceCatalogIds ?? []));

  if (serviceCatalogIds.length > 0) {
    const catalogs = await findCompanyServiceCatalogs(
      companyId,
      serviceCatalogIds,
    );

    /**
     * All requested services must
     * belong to this company.
     */
    if (catalogs.length !== serviceCatalogIds.length) {
      throw conflict(
        "One or more selected services do not belong to this company",
      );
    }

    /**
     * Inactive services cannot be
     * assigned to technician.
     */
    const inactiveCatalog = catalogs.find((catalog) => !catalog.isActive);

    if (inactiveCatalog) {
      throw conflict(`Service "${inactiveCatalog.name}" is inactive`);
    }
  }

  /**
   * 5. Atomic transaction.
   */
  const technician = await db.transaction(async (tx) => {
    const created = await insertTechnician(tx, {
      companyId,

      companyUserId: input.companyUserId,

      employeeCode: input.employeeCode,

      status: input.status,

      joiningDate: input.joiningDate,

      notes: input.notes,
    });

    if (!created) {
      throw new TechnicianServiceError(
        "Failed to create technician",
        500,
        "CREATE_FAILED",
      );
    }

    await replaceTechnicianServices(tx, created.id, serviceCatalogIds);

    return created;
  });

  /**
   * Return complete resource.
   */
  return getTechnician(companyId, technician.id);
}

/**
 * ---------------------------------------------------------
 * UPDATE TECHNICIAN
 * ---------------------------------------------------------
 */

export async function editTechnician(
  companyId: string,
  technicianId: string,
  input: UpdateTechnicianInput,
) {
  /**
   * 1. Existing technician.
   */
  const existing = await findTechnicianById(companyId, technicianId);

  if (!existing) {
    throw notFound("Technician not found");
  }

  /**
   * 2. Employee code duplicate check.
   */
  if (input.employeeCode && input.employeeCode !== existing.employeeCode) {
    const duplicate = await findByEmployeeCode(
      companyId,
      input.employeeCode,
      technicianId,
    );

    if (duplicate) {
      throw conflict("Employee code already exists");
    }
  }

  /**
   * 3. Update.
   */
  const updated = await updateTechnician(companyId, technicianId, input);

  if (!updated) {
    throw notFound("Technician not found");
  }

  return getTechnician(companyId, technicianId);
}

/**
 * ---------------------------------------------------------
 * CHANGE STATUS
 * ---------------------------------------------------------
 */

export async function changeTechnicianStatus(
  companyId: string,
  technicianId: string,
  input: UpdateTechnicianStatusInput,
) {
  /**
   * Verify technician.
   */
  const existing = await findTechnicianById(companyId, technicianId);

  if (!existing) {
    throw notFound("Technician not found");
  }

  /**
   * No DB update if status is unchanged.
   */
  if (existing.status === input.status) {
    return getTechnician(companyId, technicianId);
  }

  const updated = await updateTechnicianStatus(
    companyId,
    technicianId,
    input.status,
  );

  if (!updated) {
    throw notFound("Technician not found");
  }

  return getTechnician(companyId, technicianId);
}

/**
 * ---------------------------------------------------------
 * DELETE TECHNICIAN
 * ---------------------------------------------------------
 */

export async function removeTechnician(
  companyId: string,
  technicianId: string,
) {
  /**
   * Verify technician first.
   */
  const existing = await findTechnicianById(companyId, technicianId);

  if (!existing) {
    throw notFound("Technician not found");
  }

  /**
   * Delete technician.
   *
   * technician_services will be removed
   * through FK ON DELETE CASCADE.
   */
  const deleted = await deleteTechnician(companyId, technicianId);

  if (!deleted) {
    throw notFound("Technician not found");
  }

  return {
    id: deleted.id,
  };
}

/**
 * ---------------------------------------------------------
 * LIST TECHNICIAN SERVICES
 * ---------------------------------------------------------
 */

export async function listTechnicianServices(
  companyId: string,
  technicianId: string,
) {
  /**
   * Verify technician.
   */
  const technician = await findTechnicianById(companyId, technicianId);

  if (!technician) {
    throw notFound("Technician not found");
  }

  return getTechnicianServices(companyId, technicianId);
}

/**
 * ---------------------------------------------------------
 * UPDATE TECHNICIAN SERVICES
 * ---------------------------------------------------------
 */

export async function updateTechnicianServices(
  companyId: string,
  technicianId: string,
  input: UpdateTechnicianServicesInput,
) {
  /**
   * 1. Verify technician.
   */
  const technician = await findTechnicianById(companyId, technicianId);

  if (!technician) {
    throw notFound("Technician not found");
  }

  /**
   * 2. Remove duplicate IDs.
   */
  const serviceCatalogIds = Array.from(new Set(input.serviceCatalogIds));

  /**
   * 3. Validate all service catalog IDs.
   */
  if (serviceCatalogIds.length > 0) {
    const catalogs = await findCompanyServiceCatalogs(
      companyId,
      serviceCatalogIds,
    );

    /**
     * Prevent cross-tenant service assignment.
     */
    if (catalogs.length !== serviceCatalogIds.length) {
      throw conflict(
        "One or more selected services do not belong to this company",
      );
    }

    /**
     * Do not assign inactive services.
     */
    const inactiveCatalog = catalogs.find((catalog) => !catalog.isActive);

    if (inactiveCatalog) {
      throw conflict(`Service "${inactiveCatalog.name}" is inactive`);
    }
  }

  /**
   * 4. Replace mappings atomically.
   */
  await db.transaction(async (tx) => {
    await replaceTechnicianServices(tx, technicianId, serviceCatalogIds);
  });

  /**
   * 5. Return updated services.
   */
  return getTechnicianServices(companyId, technicianId);
}
