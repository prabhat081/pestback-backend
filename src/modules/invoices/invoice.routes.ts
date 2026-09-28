import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireCompany } from "../../middlewares/company.middleware.js";

import {
  addInvoiceItemController,
  cancelInvoiceController,
  createInvoiceController,
  deleteInvoiceController,
  deleteInvoiceItemController,
  getInvoiceController,
  issueInvoiceController,
  listInvoiceItemsController,
  listInvoicesController,
  updateInvoiceController,
  updateInvoiceItemController,
  updateInvoiceStatusController,
} from "./invoice.controller.js";

const router = Router();

/* -------------------------------------------------------------------------- */
/* Invoice                                                                    */
/* -------------------------------------------------------------------------- */

router.get("/", authenticate, requireCompany, listInvoicesController);

router.post("/", authenticate, requireCompany, createInvoiceController);

router.get("/:id", authenticate, requireCompany, getInvoiceController);

router.patch("/:id", authenticate, requireCompany, updateInvoiceController);

router.delete("/:id", authenticate, requireCompany, deleteInvoiceController);

/* -------------------------------------------------------------------------- */
/* Invoice Status                                                             */
/* -------------------------------------------------------------------------- */

router.patch(
  "/:id/status",
  authenticate,
  requireCompany,
  updateInvoiceStatusController,
);

router.post("/:id/issue", authenticate, requireCompany, issueInvoiceController);

router.post(
  "/:id/cancel",
  authenticate,
  requireCompany,
  cancelInvoiceController,
);

/* -------------------------------------------------------------------------- */
/* Invoice Items                                                              */
/* -------------------------------------------------------------------------- */

router.get(
  "/:id/items",
  authenticate,
  requireCompany,
  listInvoiceItemsController,
);

router.post(
  "/:id/items",
  authenticate,
  requireCompany,
  addInvoiceItemController,
);

router.patch(
  "/:id/items/:itemId",
  authenticate,
  requireCompany,
  updateInvoiceItemController,
);

router.delete(
  "/:id/items/:itemId",
  authenticate,
  requireCompany,
  deleteInvoiceItemController,
);

export default router;
