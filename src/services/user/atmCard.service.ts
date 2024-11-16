// src/services/user/atmCard.service.ts
import { and, eq, desc } from "drizzle-orm";
import { db } from "../../config/database";
import { atmCards } from "../../db/schema";
import { ErrorResponse } from "../../utilities/error";
import { BinLookupService } from "./bin.service";
import { EncryptionService } from "../shared/encryption.service";
import { TokenizationService } from "./tokenization.service";
import type { AddCardInput, Card } from "../../types/user/atmCard.types";
import { CardType } from "../../db/schema/atmCards";

export class CardService {
  /**
   * Add new card with tokenization
   */
  static async addCard(userId: string, input: AddCardInput): Promise<Card> {
    // Get card BIN details
    const binDetails = await BinLookupService.lookup(
      input.cardNumber.substring(0, 6)
    );

    // Encrypt sensitive data
    const encryptedCard = await EncryptionService.encryptCard({
      number: input.cardNumber,
      cvv: input.cvv,
    });

    // Generate card token
    const token = await TokenizationService.tokenizeCard({
      cardNumber: input.cardNumber,
      expiryMonth: input.expiryMonth,
      expiryYear: input.expiryYear,
    });
    
    return await db.transaction(async (trx) => {
      // Handle default card setting
      if (input.setAsDefault) {
        await trx
          .update(atmCards)
          .set({ isDefault: false })
          .where(eq(atmCards.userId, userId));
      }

      // Create card record
      await trx.insert(atmCards).values({
        userId,
        token,
        cardNumber: encryptedCard.number,
        cvv: encryptedCard.cvv,
        cardHolderName: input.cardHolderName,
        last4Digits: input.cardNumber.slice(-4),
        expiryMonth: input.expiryMonth,
        expiryYear: input.expiryYear,
        cardType: binDetails.scheme.toLowerCase() as CardType,
        bin: input.cardNumber.substring(0, 6),
        isDefault: input.setAsDefault || false,
        isActive: true,
        isTokenized: true,
        metadata: {
          brand: binDetails.brand,
          issuer: binDetails.issuer,
          country: binDetails.country,
          type: binDetails.type,
        },
      });

      // Get the added card
      const card = await trx
        .select()
        .from(atmCards)
        .where(
          and(
            eq(atmCards.cardHolderName, input.cardHolderName), 
            eq(atmCards.last4Digits, input.cardNumber.slice(-4)),
            eq(atmCards.cvv, encryptedCard.cvv)
          )
        )
        .limit(1);

      return this.sanitizeCard(card);
    });
  }

  /**
   * Tokenize existing card
   */
  static async tokenizeCard(
    userId: string,
    cardId: string,
    pin: string
  ): Promise<Card> {
    const [card] = await db
      .select()
      .from(atmCards)
      .where(
        and(
          eq(atmCards.id, cardId),
          eq(atmCards.userId, userId),
          eq(atmCards.isActive, true)
        )
      )
      .limit(1);

    if (!card) {
      throw ErrorResponse.notFound("Card not found");
    }

    if (card.isTokenized) {
      throw ErrorResponse.badRequest("Card is already tokenized");
    }

    // Decrypt card details
    const decryptedCard = await EncryptionService.decryptCard({
      number: card.cardNumber,
      cvv: card.cvv,
    });

    // Tokenize with payment provider
    const token = await TokenizationService.tokenizeCard({
      cardNumber: decryptedCard.number,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      pin,
    });

    // Update card record
    await db
      .update(atmCards)
      .set({
        token,
        isTokenized: true,
        updatedAt: new Date(),
      })
      .where(eq(atmCards.id, cardId));

    return this.getCard(cardId);
  }

  /**
   * List user cards
   */
  static async listCards(userId: string): Promise<Card[]> {
    const userCards = await db
      .select()
      .from(atmCards)
      .where(and(eq(atmCards.userId, userId), eq(atmCards.isActive, true)))
      .orderBy(desc(atmCards.isDefault), desc(atmCards.createdAt));

    return userCards.map((card) => this.sanitizeCard(card));
  }

  /**
   * Get card details
   */
  static async getCard(cardId: string): Promise<Card> {
    const [card] = await db
      .select()
      .from(atmCards)
      .where(eq(atmCards.id, cardId))
      .limit(1);

    if (!card) {
      throw ErrorResponse.notFound("Card not found");
    }

    return this.sanitizeCard(card);
  }

  /**
   * Set default card
   */
  static async setDefaultCard(userId: string, cardId: string): Promise<void> {
    await db.transaction(async (trx) => {
      // Unset current default
      await trx
        .update(atmCards)
        .set({ isDefault: false })
        .where(eq(atmCards.userId, userId));

      // Set new default
      await trx
        .update(atmCards)
        .set({ isDefault: true })
        .where(and(eq(atmCards.id, cardId), eq(atmCards.userId, userId)));
    });
  }

  /**
   * Remove card
   */
  static async removeCard(userId: string, cardId: string): Promise<void> {
    const [card] = await db
      .select()
      .from(atmCards)
      .where(and(eq(atmCards.id, cardId), eq(atmCards.userId, userId)))
      .limit(1);

    if (!card) {
      throw ErrorResponse.notFound("Card not found");
    }

    await db
      .update(atmCards)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(atmCards.id, cardId));
  }

  /**
   * Detect card type from number
   */
  private static detectCardType(cardNumber: string): string {
    // Implement card type detection based on BIN ranges
    if (cardNumber.startsWith("4")) return "VISA";
    if (cardNumber.startsWith("5")) return "MASTERCARD";
    if (cardNumber.startsWith("6")) return "VERVE";
    return "UNKNOWN";
  }

  /**
   * Remove sensitive data from card
   */
  private static sanitizeCard(card: any): Card {
    const { cardNumber, ...safeCard } = card;
    return {
      ...safeCard,
      cardNumber: `**** **** **** ${safeCard.last4Digits}`,
    };
  }
}
