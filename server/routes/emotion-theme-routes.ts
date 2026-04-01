// @ts-nocheck
import express from 'express';
import { db } from '../db';
import { users } from '../../shared/schema';
import { emotionThemeService } from '../services/emotion-theme-service';
import { eq } from 'drizzle-orm';
import { ThemeRecommendation, UserThemePreferences } from '../../shared/types';
import { createLogger } from "../logger";
const log = createLogger("emotion-theme-routes");


// Type for authenticated request with user ID
interface CustomRequest extends express.Request {
  session: {
    userId?: number;
    [key: string]: any;
  };
}

// Middleware to check if user is authenticated
const isAuthenticated = (req: CustomRequest, res: express.Response, next: express.NextFunction) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'You must be logged in to access this resource' });
  }
};

const router = express.Router();

/**
 * Get theme recommendation for a specific bill
 */
router.get('/bill/:billId', async (req, res) => {
  const { billId } = req.params;
  
  try {
    const theme = await emotionThemeService.getBillThemeRecommendation(billId);
    res.json(theme);
  } catch (error: any) {
    log.error({ err: error }, 'Error getting bill theme');
    res.status(500).json({ error: 'Failed to get theme recommendation' });
  }
});

/**
 * Get theme recommendation for a committee
 */
router.get('/committee/:committeeId', async (req, res) => {
  const committeeId = parseInt(req.params.committeeId, 10);
  
  if (isNaN(committeeId)) {
    return res.status(400).json({ error: 'Invalid committee ID' });
  }
  
  try {
    const theme = await emotionThemeService.getCommitteeThemeRecommendation(committeeId);
    res.json(theme);
  } catch (error: any) {
    log.error({ err: error }, 'Error getting committee theme');
    res.status(500).json({ error: 'Failed to get theme recommendation' });
  }
});

/**
 * Get user theme preferences
 */
router.get('/preferences', isAuthenticated, async (req: CustomRequest, res) => {
  try {
    const userId = req.session.userId!;
    
    const userResults = await db.select({
      useEmotionTheming: users.useEmotionTheming,
      defaultTheme: users.defaultTheme,
      themeColorOverride: users.themeColorOverride,
      emotionThemeIntensity: users.emotionThemeIntensity
    })
    .from(users).$dynamic()
    .where(eq(users.id, userId as number));
    
    if (userResults.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userPrefs = userResults[0];
    
    // Convert defaultTheme to correct type
    const preferences: UserThemePreferences = {
      useEmotionTheming: userPrefs.useEmotionTheming ?? true,
      defaultTheme: (userPrefs.defaultTheme as 'light' | 'dark' | 'system') ?? 'system',
      themeColorOverride: userPrefs.themeColorOverride ?? undefined,
      emotionThemeIntensity: (userPrefs.emotionThemeIntensity as 'subtle' | 'moderate' | 'strong') ?? 'moderate'
    };
    
    res.json(preferences);
  } catch (error: any) {
    log.error({ err: error }, 'Error getting theme preferences');
    res.status(500).json({ error: 'Failed to get theme preferences' });
  }
});

/**
 * Update user theme preferences
 */
router.post('/preferences', isAuthenticated, async (req: CustomRequest, res) => {
  try {
    const userId = req.session.userId!;
    const updates = req.body as Partial<UserThemePreferences>;
    
    // Validate the input
    if (updates.defaultTheme && !['light', 'dark', 'system'].includes(updates.defaultTheme)) {
      return res.status(400).json({ error: 'Invalid theme preference' });
    }
    
    if (updates.emotionThemeIntensity && !['subtle', 'moderate', 'strong'].includes(updates.emotionThemeIntensity)) {
      return res.status(400).json({ error: 'Invalid theme intensity' });
    }
    
    // Update the user preferences
    const updateData: any = {};
    
    if (updates.useEmotionTheming !== undefined) {
      updateData.useEmotionTheming = updates.useEmotionTheming;
    }
    
    if (updates.defaultTheme) {
      updateData.defaultTheme = updates.defaultTheme;
    }
    
    if (updates.themeColorOverride !== undefined) {
      updateData.themeColorOverride = updates.themeColorOverride;
    }
    
    if (updates.emotionThemeIntensity) {
      updateData.emotionThemeIntensity = updates.emotionThemeIntensity;
    }
    
    if (Object.keys(updateData).length > 0) {
      await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId as number));
    }
    
    res.json({ success: true });
  } catch (error: any) {
    log.error({ err: error }, 'Error updating theme preferences');
    res.status(500).json({ error: 'Failed to update theme preferences' });
  }
});

/**
 * Get default theme (when not viewing specific content)
 */
router.get('/default', (req, res) => {
  const theme = emotionThemeService.getDefaultTheme();
  res.json(theme);
});

export default router;