import { Router } from "express";

import { asyncHandler } from "../../middlewares/async-handler.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireCompany } from "../../middlewares/company.middleware.js";

import {
  createCatalog,
  deleteCatalog,
  getCatalog,
  getCatalogList,
  toggleCatalogStatus,
  updateCatalog,
} from "./service-catalog.controller.js";

const router = Router();

router.use(authenticate);
router.use(requireCompany);

router.get("/", asyncHandler(getCatalogList));

router.post("/", asyncHandler(createCatalog));

router.get("/:id", asyncHandler(getCatalog));

router.patch("/:id", asyncHandler(updateCatalog));

router.patch("/:id/status", asyncHandler(toggleCatalogStatus));

router.delete("/:id", asyncHandler(deleteCatalog));

export default router;
