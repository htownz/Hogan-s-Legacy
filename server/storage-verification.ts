/**
 * Community-driven Verification System for Legislative Updates
 */

import { SocialNetworkStorage } from "./storage-social";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "./db";
import {
  legislativeUpdates,
  verifications,
  verificationRules,
  verificationSources,
  userVerificationCredentials,
  LegislativeUpdate,
  InsertLegislativeUpdate, 
  Verification,
  InsertVerification,
  VerificationRule,
  InsertVerificationRule,
  VerificationSource,
  InsertVerificationSource,
  UserVerificationCredential,
  InsertUserVerificationCredential
} from "@shared/schema";

export class VerificationSystemStorage extends SocialNetworkStorage {
  // Legislative Update methods
  async getLegislativeUpdatesByBillId(billId: string): Promise<LegislativeUpdate[]> {
    return await db
      .select()
      .from(legislativeUpdates).$dynamic()
      .where(eq(legislativeUpdates.billId, billId))
      .orderBy(desc(legislativeUpdates.submittedAt));
  }

  async getLegislativeUpdateById(id: number): Promise<LegislativeUpdate | undefined> {
    const [update] = await db
      .select()
      .from(legislativeUpdates).$dynamic()
      .where(eq(legislativeUpdates.id, id));
    return update || undefined;
  }

  async getRecentLegislativeUpdates(limit: number = 10): Promise<LegislativeUpdate[]> {
    return await db
      .select()
      .from(legislativeUpdates)
      .orderBy(desc(legislativeUpdates.submittedAt))
      .limit(limit);
  }

  async getPendingLegislativeUpdates(limit: number = 10): Promise<LegislativeUpdate[]> {
    return await db
      .select()
      .from(legislativeUpdates).$dynamic()
      .where(eq(legislativeUpdates.verificationStatus, "pending"))
      .orderBy(desc(legislativeUpdates.submittedAt))
      .limit(limit);
  }

  async getVerifiedLegislativeUpdates(limit: number = 10): Promise<LegislativeUpdate[]> {
    return await db
      .select()
      .from(legislativeUpdates).$dynamic()
      .where(eq(legislativeUpdates.verificationStatus, "verified"))
      .orderBy(desc(legislativeUpdates.submittedAt))
      .limit(limit);
  }

  async createLegislativeUpdate(update: InsertLegislativeUpdate): Promise<LegislativeUpdate> {
    const [newUpdate] = await db
      .insert(legislativeUpdates)
      .values(update)
      .returning();
    return newUpdate;
  }

  async updateLegislativeUpdateStatus(id: number, status: string): Promise<LegislativeUpdate | undefined> {
    const [updated] = await db
      .update(legislativeUpdates)
      .set({ 
        verificationStatus: status,
        updatedAt: new Date()
      })
      .where(eq(legislativeUpdates.id, id))
      .returning();
    return updated || undefined;
  }

  async incrementVerificationCount(updateId: number): Promise<LegislativeUpdate | undefined> {
    const [updated] = await db
      .update(legislativeUpdates)
      .set({ 
        verificationCount: sql`${legislativeUpdates.verificationCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(legislativeUpdates.id, updateId))
      .returning();
    return updated || undefined;
  }

  // Verification methods
  async getVerificationsByUpdateId(updateId: number): Promise<Verification[]> {
    return await db
      .select()
      .from(verifications).$dynamic()
      .where(eq(verifications.updateId, updateId))
      .orderBy(desc(verifications.createdAt));
  }

  async getUserVerificationsByUpdateId(userId: number, updateId: number): Promise<Verification | undefined> {
    const [verification] = await db
      .select()
      .from(verifications).$dynamic()
      .where(
        and(
          eq(verifications.userId, userId),
          eq(verifications.updateId, updateId)
        )
      );
    return verification || undefined;
  }

  async createVerification(verification: InsertVerification): Promise<Verification> {
    const [newVerification] = await db
      .insert(verifications)
      .values(verification)
      .returning();
    return newVerification;
  }

  // Verification Rule methods
  async getAllVerificationRules(): Promise<VerificationRule[]> {
    return await db
      .select()
      .from(verificationRules).$dynamic()
      .where(eq(verificationRules.isActive, true));
  }

  async getVerificationRuleByType(updateType: string): Promise<VerificationRule | undefined> {
    const [rule] = await db
      .select()
      .from(verificationRules).$dynamic()
      .where(
        and(
          eq(verificationRules.updateType, updateType),
          eq(verificationRules.isActive, true)
        )
      );
    return rule || undefined;
  }

  async createVerificationRule(rule: InsertVerificationRule): Promise<VerificationRule> {
    const [newRule] = await db
      .insert(verificationRules)
      .values(rule)
      .returning();
    return newRule;
  }

  async updateVerificationRule(id: number, data: Partial<VerificationRule>): Promise<VerificationRule | undefined> {
    const [updated] = await db
      .update(verificationRules)
      .set({ 
        ...data,
        updatedAt: new Date()
      })
      .where(eq(verificationRules.id, id))
      .returning();
    return updated || undefined;
  }

  // Verification Source methods
  async getAllVerificationSources(): Promise<VerificationSource[]> {
    return await db
      .select()
      .from(verificationSources).$dynamic()
      .where(eq(verificationSources.isActive, true))
      .orderBy(desc(verificationSources.trustLevel));
  }

  async getVerificationSourceById(id: number): Promise<VerificationSource | undefined> {
    const [source] = await db
      .select()
      .from(verificationSources).$dynamic()
      .where(eq(verificationSources.id, id));
    return source || undefined;
  }

  async getVerificationSourcesByType(sourceType: string): Promise<VerificationSource[]> {
    return await db
      .select()
      .from(verificationSources).$dynamic()
      .where(
        and(
          eq(verificationSources.sourceType, sourceType),
          eq(verificationSources.isActive, true)
        )
      )
      .orderBy(desc(verificationSources.trustLevel));
  }

  async createVerificationSource(source: InsertVerificationSource): Promise<VerificationSource> {
    const [newSource] = await db
      .insert(verificationSources)
      .values(source)
      .returning();
    return newSource;
  }

  async updateVerificationSource(id: number, data: Partial<VerificationSource>): Promise<VerificationSource | undefined> {
    const [updated] = await db
      .update(verificationSources)
      .set({ 
        ...data,
        updatedAt: new Date()
      })
      .where(eq(verificationSources.id, id))
      .returning();
    return updated || undefined;
  }

  // User Verification Credential methods
  async getUserVerificationCredentialsByUserId(userId: number): Promise<UserVerificationCredential[]> {
    return await db
      .select()
      .from(userVerificationCredentials).$dynamic()
      .where(
        and(
          eq(userVerificationCredentials.userId, userId),
          eq(userVerificationCredentials.isActive, true)
        )
      );
  }

  async createUserVerificationCredential(credential: InsertUserVerificationCredential): Promise<UserVerificationCredential> {
    const [newCredential] = await db
      .insert(userVerificationCredentials)
      .values(credential)
      .returning();
    return newCredential;
  }

  async updateUserVerificationCredential(
    userId: number, 
    credentialType: string, 
    data: Partial<UserVerificationCredential>
  ): Promise<UserVerificationCredential | undefined> {
    const [updated] = await db
      .update(userVerificationCredentials)
      .set({ 
        ...data,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(userVerificationCredentials.userId, userId),
          eq(userVerificationCredentials.credentialType, credentialType)
        )
      )
      .returning();
    return updated || undefined;
  }

  async incrementUserVerificationCount(userId: number, credentialType: string): Promise<UserVerificationCredential | undefined> {
    const [updated] = await db
      .update(userVerificationCredentials)
      .set({ 
        verificationCount: sql`${userVerificationCredentials.verificationCount} + 1`,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(userVerificationCredentials.userId, userId),
          eq(userVerificationCredentials.credentialType, credentialType)
        )
      )
      .returning();
    return updated || undefined;
  }

  async updateUserVerificationAccuracy(
    userId: number, 
    credentialType: string, 
    isAccurate: boolean
  ): Promise<UserVerificationCredential | undefined> {
    // Get current credential
    const [credential] = await db
      .select()
      .from(userVerificationCredentials).$dynamic()
      .where(
        and(
          eq(userVerificationCredentials.userId, userId),
          eq(userVerificationCredentials.credentialType, credentialType)
        )
      );
    
    if (!credential) return undefined;
    
    // Calculate new accuracy rate
    const totalVerifications = credential.verificationCount + 1;
    const accurateVerifications = isAccurate 
      ? (credential.accuracyRate * credential.verificationCount / 100) + 1 
      : (credential.accuracyRate * credential.verificationCount / 100);
    const newAccuracyRate = Math.round((accurateVerifications / totalVerifications) * 100);
    
    // Update record
    const [updated] = await db
      .update(userVerificationCredentials)
      .set({ 
        accuracyRate: newAccuracyRate,
        verificationCount: sql`${userVerificationCredentials.verificationCount} + 1`,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(userVerificationCredentials.userId, userId),
          eq(userVerificationCredentials.credentialType, credentialType)
        )
      )
      .returning();
    
    return updated || undefined;
  }
}

// Export the storage instance
export const storage = new VerificationSystemStorage();