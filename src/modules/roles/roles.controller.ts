import type { NextFunction, Request, Response } from "express";

import { getSystemRoles } from "./roles.service.js";

export async function getSystemRolesController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const roles = await getSystemRoles();

    res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
}
