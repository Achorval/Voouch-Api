// // routes/user/wallet.routes.ts
import { Router } from "express";
import { AtmCardController } from "../../controllers/user/AtmCard.controller";
import { validate } from "../../middleware/validate.middleware";
import {
  addCardSchema,
  updateCardSettingsSchema,
} from "../../schemas/user/atmCard.schema";

const router = Router();

router.post("/", validate(addCardSchema), AtmCardController.addCard);
router.get("/", AtmCardController.listCards);
router.post("/:cardId/set-default", AtmCardController.setDefaultCard);
router.delete("/:cardId", AtmCardController.removeCard);

export default router;
