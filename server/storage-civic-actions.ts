import { db } from './db';
import { eq, and, or, inArray, desc, sql, like, not, gte, lte } from 'drizzle-orm';
import {
  civicActionTypes,
  CivicActionType,
  InsertCivicActionType,
  civicActions,
  CivicAction,
  InsertCivicAction,
  quickActionShortcuts,
  QuickActionShortcut,
  InsertQuickActionShortcut,
  quickActionInteractions,
  QuickActionInteraction,
  InsertQuickActionInteraction
} from '../shared/schema-civic-actions';

/**
 * Interface for civic action storage service
 */
export interface ICivicActionStorage {
  // Civic Action Types
  getCivicActionTypes(): Promise<CivicActionType[]>;
  getCivicActionTypeById(id: number): Promise<CivicActionType | undefined>;
  getCivicActionTypesByCategory(category: string): Promise<CivicActionType[]>;
  createCivicActionType(data: InsertCivicActionType): Promise<CivicActionType>;
  updateCivicActionType(id: number, data: Partial<InsertCivicActionType>): Promise<CivicActionType | undefined>;
  
  // Civic Actions
  getCivicActions(userId: number, options?: {
    actionTypeId?: number;
    billId?: string;
    completed?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<CivicAction[]>;
  getCivicActionById(id: number): Promise<CivicAction | undefined>;
  createCivicAction(data: InsertCivicAction): Promise<CivicAction>;
  updateCivicAction(id: number, data: Partial<InsertCivicAction>): Promise<CivicAction | undefined>;
  completeCivicAction(id: number, result: string): Promise<CivicAction | undefined>;
  
  // Quick Action Shortcuts
  getQuickActionShortcuts(location: string): Promise<QuickActionShortcut[]>;
  getQuickActionShortcutById(id: number): Promise<QuickActionShortcut | undefined>;
  createQuickActionShortcut(data: InsertQuickActionShortcut): Promise<QuickActionShortcut>;
  updateQuickActionShortcut(id: number, data: Partial<InsertQuickActionShortcut>): Promise<QuickActionShortcut | undefined>;
  
  // Quick Action Interactions
  recordQuickActionInteraction(data: InsertQuickActionInteraction): Promise<QuickActionInteraction>;
  getQuickActionInteractions(userId: number, options?: {
    shortcutId?: number;
    interactionType?: string;
    limit?: number;
    offset?: number;
  }): Promise<QuickActionInteraction[]>;
  
  // Analytics
  getPopularActions(limit?: number): Promise<{actionType: string, count: number}[]>;
  getActionCompletionRateByType(): Promise<{actionType: string, completionRate: number}[]>;
  getUserActionStats(userId: number): Promise<{
    totalActions: number;
    completedActions: number;
    actionsByCategory: {category: string, count: number}[];
  }>;
}

/**
 * Implementation of civic action storage operations
 */
export class CivicActionStorage implements ICivicActionStorage {
  // Civic Action Types
  async getCivicActionTypes(): Promise<CivicActionType[]> {
    try {
      // Use raw SQL query instead of Drizzle's query builder
      const result = await db.execute(`
        SELECT id, name, description, icon, category, impact_level, created_at as "createdAt" 
        FROM civic_action_types 
        ORDER BY impact_level
      `);
      return result.rows as CivicActionType[];
    } catch (error: any) {
      console.error("Error in getCivicActionTypes:", error);
      throw error;
    }
  }
  
  async getCivicActionTypeById(id: number): Promise<CivicActionType | undefined> {
    try {
      const result = await db.execute(`
        SELECT id, name, description, icon, category, impact_level, created_at as "createdAt" 
        FROM civic_action_types 
        WHERE id = ${id}
      `);
      return result.rows[0] as CivicActionType | undefined;
    } catch (error: any) {
      console.error("Error in getCivicActionTypeById:", error);
      throw error;
    }
  }
  
  async getCivicActionTypesByCategory(category: string): Promise<CivicActionType[]> {
    try {
      // Escape single quotes in category to prevent SQL injection
      const safeCategory = category.replace(/'/g, "''");
      
      const result = await db.execute(`
        SELECT id, name, description, icon, category, impact_level, created_at as "createdAt" 
        FROM civic_action_types 
        WHERE category = '${safeCategory}' 
        ORDER BY impact_level
      `);
      return result.rows as CivicActionType[];
    } catch (error: any) {
      console.error("Error in getCivicActionTypesByCategory:", error);
      throw error;
    }
  }
  
  async createCivicActionType(data: InsertCivicActionType): Promise<CivicActionType> {
    const results = await db.insert(civicActionTypes).values(data).returning();
    return results[0];
  }
  
  async updateCivicActionType(id: number, data: Partial<InsertCivicActionType>): Promise<CivicActionType | undefined> {
    const results = await db.update(civicActionTypes)
      .set(data)
      .where(eq(civicActionTypes.id, id))
      .returning();
    return results[0];
  }
  
  // Civic Actions
  async getCivicActions(userId: number, options?: {
    actionTypeId?: number;
    billId?: string;
    completed?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<CivicAction[]> {
    let whereClause = and(eq(civicActions.userId, userId));
    
    if (options?.actionTypeId !== undefined) {
      whereClause = and(whereClause, eq(civicActions.actionTypeId, options.actionTypeId));
    }
    
    if (options?.billId !== undefined) {
      whereClause = and(whereClause, eq(civicActions.billId, options.billId));
    }
    
    if (options?.completed !== undefined) {
      whereClause = and(whereClause, eq(civicActions.completed, options.completed));
    }
    
    // Build the query with all options
    const result = await db.select()
      .from(civicActions).$dynamic()
      .where(whereClause)
      .orderBy(desc(civicActions.createdAt))
      .limit(options?.limit || 100)
      .offset(options?.offset || 0);
      
    return result;
  }
  
  async getCivicActionById(id: number): Promise<CivicAction | undefined> {
    const results = await db.select().from(civicActions).$dynamic().where(eq(civicActions.id, id));
    return results[0];
  }
  
  async createCivicAction(data: InsertCivicAction): Promise<CivicAction> {
    const results = await db.insert(civicActions).values(data).returning();
    return results[0];
  }
  
  async updateCivicAction(id: number, data: Partial<InsertCivicAction>): Promise<CivicAction | undefined> {
    const results = await db.update(civicActions)
      .set(data)
      .where(eq(civicActions.id, id))
      .returning();
    return results[0];
  }
  
  async completeCivicAction(id: number, result: string): Promise<CivicAction | undefined> {
    const results = await db.update(civicActions)
      .set({
        completed: true,
        result,
        completionDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(civicActions.id, id))
      .returning();
    return results[0];
  }
  
  // Quick Action Shortcuts
  async getQuickActionShortcuts(location: string): Promise<QuickActionShortcut[]> {
    try {
      const result = await db.execute(`
        SELECT id, action_type_id as "actionTypeId", priority, created_at as "createdAt", 
        icon, button_color as "buttonColor", location, display_text as "displayText"
        FROM quick_action_shortcuts 
        WHERE location = '${location}'
        ORDER BY priority
      `);
      return result.rows as QuickActionShortcut[];
    } catch (error: any) {
      console.error("Error in getQuickActionShortcuts:", error);
      throw error;
    }
  }
  
  async getQuickActionShortcutById(id: number): Promise<QuickActionShortcut | undefined> {
    try {
      const result = await db.execute(`
        SELECT id, action_type_id as "actionTypeId", priority, created_at as "createdAt", 
        icon, button_color as "buttonColor", location, display_text as "displayText"
        FROM quick_action_shortcuts 
        WHERE id = ${id}
      `);
      return result.rows[0] as QuickActionShortcut | undefined;
    } catch (error: any) {
      console.error("Error in getQuickActionShortcutById:", error);
      throw error;
    }
  }
  
  async createQuickActionShortcut(data: InsertQuickActionShortcut): Promise<QuickActionShortcut> {
    try {
      const priority = data.priority || 0;
      const icon = data.icon ? `'${data.icon}'` : 'NULL';
      const buttonColor = data.buttonColor ? `'${data.buttonColor}'` : 'NULL';
      const location = data.location ? `'${data.location}'` : 'NULL';
      const displayText = data.displayText ? `'${data.displayText}'` : 'NULL';
      
      const result = await db.execute(`
        INSERT INTO quick_action_shortcuts (
          action_type_id, priority, icon, button_color, location, display_text
        ) VALUES (
          ${data.actionTypeId}, ${priority}, ${icon}, ${buttonColor}, ${location}, ${displayText}
        )
        RETURNING id, action_type_id as "actionTypeId", priority, created_at as "createdAt", 
        icon, button_color as "buttonColor", location, display_text as "displayText"
      `);
      return result.rows[0] as QuickActionShortcut;
    } catch (error: any) {
      console.error("Error in createQuickActionShortcut:", error);
      throw error;
    }
  }
  
  async updateQuickActionShortcut(id: number, data: Partial<InsertQuickActionShortcut>): Promise<QuickActionShortcut | undefined> {
    try {
      // Build the SET clause dynamically
      const setValues = [];
      
      if (data.actionTypeId !== undefined) {
        setValues.push(`action_type_id = ${data.actionTypeId}`);
      }
      
      if (data.priority !== undefined) {
        setValues.push(`priority = ${data.priority}`);
      }
      
      if (data.icon !== undefined) {
        const iconValue = data.icon ? `'${data.icon}'` : 'NULL';
        setValues.push(`icon = ${iconValue}`);
      }
      
      if (data.buttonColor !== undefined) {
        const buttonColorValue = data.buttonColor ? `'${data.buttonColor}'` : 'NULL';
        setValues.push(`button_color = ${buttonColorValue}`);
      }
      
      if (data.location !== undefined) {
        const locationValue = data.location ? `'${data.location}'` : 'NULL';
        setValues.push(`location = ${locationValue}`);
      }
      
      if (data.displayText !== undefined) {
        const displayTextValue = data.displayText ? `'${data.displayText}'` : 'NULL';
        setValues.push(`display_text = ${displayTextValue}`);
      }
      
      // If no fields to update, return the existing shortcut
      if (setValues.length === 0) {
        return this.getQuickActionShortcutById(id);
      }
      
      const result = await db.execute(`
        UPDATE quick_action_shortcuts 
        SET ${setValues.join(', ')} 
        WHERE id = ${id}
        RETURNING id, action_type_id as "actionTypeId", priority, created_at as "createdAt", 
        icon, button_color as "buttonColor", location, display_text as "displayText"
      `);
      
      return result.rows[0] as QuickActionShortcut | undefined;
    } catch (error: any) {
      console.error("Error in updateQuickActionShortcut:", error);
      throw error;
    }
  }
  
  // Quick Action Interactions
  async recordQuickActionInteraction(data: InsertQuickActionInteraction): Promise<QuickActionInteraction> {
    try {
      // Safely escape the context value
      const safeContext = data.context ? `'${data.context.replace(/'/g, "''")}'` : 'NULL';
      
      // Check if there's an existing entry with the same userId, shortcutId, and interactionType
      const existingResult = await db.execute(`
        SELECT id FROM quick_action_interactions 
        WHERE user_id = ${data.userId} 
        AND shortcut_id = ${data.shortcutId} 
        AND interaction_type = '${data.interactionType}' 
        LIMIT 1
      `);
      
      if (existingResult.rows.length > 0) {
        // Update the timestamp on the existing interaction
        const result = await db.execute(`
          UPDATE quick_action_interactions 
          SET created_at = NOW(), context = ${safeContext} 
          WHERE id = ${existingResult.rows[0].id}
          RETURNING id, user_id as "userId", shortcut_id as "shortcutId", 
          interaction_type as "interactionType", context, created_at as "createdAt"
        `);
        return result.rows[0] as QuickActionInteraction;
      } else {
        // Create a new interaction record
        const result = await db.execute(`
          INSERT INTO quick_action_interactions 
          (user_id, shortcut_id, interaction_type, context) 
          VALUES (${data.userId}, ${data.shortcutId}, '${data.interactionType}', ${safeContext})
          RETURNING id, user_id as "userId", shortcut_id as "shortcutId", 
          interaction_type as "interactionType", context, created_at as "createdAt"
        `);
        return result.rows[0] as QuickActionInteraction;
      }
    } catch (error: any) {
      console.error("Error in recordQuickActionInteraction:", error);
      throw error;
    }
  }
  
  async getQuickActionInteractions(userId: number, options?: {
    shortcutId?: number;
    interactionType?: string;
    limit?: number;
    offset?: number;
  }): Promise<QuickActionInteraction[]> {
    try {
      // Build the WHERE conditions
      let whereClause = `WHERE user_id = ${userId}`;
      
      if (options?.shortcutId !== undefined) {
        whereClause += ` AND shortcut_id = ${options.shortcutId}`;
      }
      
      if (options?.interactionType !== undefined) {
        whereClause += ` AND interaction_type = '${options.interactionType.replace(/'/g, "''")}'`;
      }
      
      // Set defaults for limit and offset
      const limit = options?.limit || 100;
      const offset = options?.offset || 0;
      
      const result = await db.execute(`
        SELECT id, user_id as "userId", shortcut_id as "shortcutId", 
        interaction_type as "interactionType", context, created_at as "createdAt"
        FROM quick_action_interactions 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `);
      
      return result.rows as QuickActionInteraction[];
    } catch (error: any) {
      console.error("Error in getQuickActionInteractions:", error);
      throw error;
    }
  }
  
  // Analytics
  async getPopularActions(limit = 10): Promise<{actionType: string, count: number}[]> {
    const result = await db.select({
      actionTypeId: civicActions.actionTypeId,
      count: sql<number>`count(${civicActions.id})::int`,
    })
    .from(civicActions)
    .groupBy(civicActions.actionTypeId)
    .orderBy(desc(sql`count`))
    .limit(limit);
    
    // Fetch the action type names
    const actionTypes = await this.getCivicActionTypes();
    const actionTypeMap = new Map(actionTypes.map(type => [type.id, type.name]));
    
    return result.map(row => ({
      actionType: actionTypeMap.get(row.actionTypeId) || `Unknown Action (${row.actionTypeId})`,
      count: row.count
    }));
  }
  
  async getActionCompletionRateByType(): Promise<{actionType: string, completionRate: number}[]> {
    const result = await db.select({
      actionTypeId: civicActions.actionTypeId,
      totalCount: sql<number>`count(${civicActions.id})::int`,
      completedCount: sql<number>`sum(case when ${civicActions.completed} then 1 else 0 end)::int`
    })
    .from(civicActions)
    .groupBy(civicActions.actionTypeId);
    
    // Fetch the action type names
    const actionTypes = await this.getCivicActionTypes();
    const actionTypeMap = new Map(actionTypes.map(type => [type.id, type.name]));
    
    return result.map(row => ({
      actionType: actionTypeMap.get(row.actionTypeId) || `Unknown Action (${row.actionTypeId})`,
      completionRate: row.totalCount > 0 ? row.completedCount / row.totalCount : 0
    }));
  }
  
  async getUserActionStats(userId: number): Promise<{
    totalActions: number;
    completedActions: number;
    actionsByCategory: {category: string, count: number}[];
  }> {
    // Get total and completed action counts
    const countResult = await db.select({
      totalCount: sql<number>`count(${civicActions.id})::int`,
      completedCount: sql<number>`sum(case when ${civicActions.completed} then 1 else 0 end)::int`
    })
    .from(civicActions).$dynamic()
    .where(eq(civicActions.userId, userId));
    
    // Get actions by type
    const actionsByType = await db.select({
      actionTypeId: civicActions.actionTypeId,
      count: sql<number>`count(${civicActions.id})::int`
    })
    .from(civicActions).$dynamic()
    .where(eq(civicActions.userId, userId))
    .groupBy(civicActions.actionTypeId);
    
    // Get action types to map category information
    const actionTypes = await this.getCivicActionTypes();
    const actionTypeMap = new Map(actionTypes.map(type => [type.id, type]));
    
    // Group by category
    const categoryMap = new Map<string, number>();
    for (const action of actionsByType) {
      const actionType = actionTypeMap.get(action.actionTypeId);
      if (actionType) {
        const currentCount = categoryMap.get(actionType.category) || 0;
        categoryMap.set(actionType.category, currentCount + action.count);
      }
    }
    
    const actionsByCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count
    }));
    
    return {
      totalActions: countResult[0]?.totalCount || 0,
      completedActions: countResult[0]?.completedCount || 0,
      actionsByCategory
    };
  }
}

export const civicActionStorage = new CivicActionStorage();