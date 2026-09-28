import { Router } from "express";

import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  getCustomers,
  toggleCustomerStatus,
  updateCustomer,
} from "./customer.controller.js";

import { asyncHandler } from "../../middlewares/async-handler.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireCompany } from "../../middlewares/company.middleware.js";

const router = Router();

router.use(authenticate);

router.use(requireCompany);

router.get("/", asyncHandler(getCustomers));
router.post("/", asyncHandler(createCustomer));
router.get("/:id", asyncHandler(getCustomer));
router.patch("/:id", asyncHandler(updateCustomer));
router.patch("/:id/status", asyncHandler(toggleCustomerStatus));
router.delete("/:id", asyncHandler(deleteCustomer));

export default router;
