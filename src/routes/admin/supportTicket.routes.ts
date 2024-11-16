// src/routes/admin/supportTicket.routes.ts
import { Router } from "express";
import { SupportTicketController } from "../../controllers/admin/supportTicket.controller";
import { validate } from "../../middleware/validate.middleware";
import {
  createSupportTicketSchema,
  updateSupportTicketSchema,
} from "../../schemas/admin/supportTicket.schema";

const router = Router();

router.post(
  "/",
  validate(createSupportTicketSchema),
  SupportTicketController.createTicket
);
router.put(
  "/:id",
  validate(updateSupportTicketSchema),
  SupportTicketController.updateTicket
);
router.patch("/:id/close", SupportTicketController.closeTicket);
router.patch("/:id/assign", SupportTicketController.assignTicket);
router.get("/:id", SupportTicketController.getTicket);
router.get("/", SupportTicketController.listTickets);

export default router;