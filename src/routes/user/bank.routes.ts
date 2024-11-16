// // routes/user/wallet.routes.ts
import { Router } from 'express';
import { BankController } from '../../controllers/user/bank.controller';
import { validate } from '../../middleware/validate.middleware';
import { bankTransferSchema } from '../../schemas/user/bank.schema';

const router = Router();

router.post(
  '/transfer/:walletId', 
  validate(bankTransferSchema),
  BankController.processBankTransfer
);

router.get('/beneficiaries', BankController.listBeneficiaries);

export default router;