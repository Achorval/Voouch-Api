// src/services/user/beneficiary.service.ts
import { and, eq } from "drizzle-orm";
import { beneficiaries } from "../../db/schema";
import { BeneficiaryType } from "../../db/schema/beneficiaries";

export class BeneficiaryService {

  /**
   * Save bank beneficiary
   */
  static async saveBeneficiary(
    trx: any,
    data: {
      userId: string;
      name: string;
      type: string;
      identifier: string;
      details: Record<string, any>;
    }
  ): Promise<void> {
    // Check if beneficiary exists
    const [existing] = await trx
      .select()
      .from(beneficiaries)
      .where(
        and(
          eq(beneficiaries.userId, data.userId),
          eq(beneficiaries.type, data.type as BeneficiaryType),
          eq(beneficiaries.identifier, data.identifier)
        )
      )
      .limit(1);

    if (!existing) {
      await trx
        .insert(beneficiaries)
        .values({
          userId: data.userId,
          name: data.name,
          type: data.type,
          identifier: data.identifier,
          details: data.details,
          isFrequent: false,
          isActive: true
        });
    }
  }

}
