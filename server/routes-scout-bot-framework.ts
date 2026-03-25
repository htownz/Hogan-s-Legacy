import { Router } from 'express';
import { scoutBot } from './services/scout-bot-framework';

const router = Router();

// Investigate a topic
router.post('/investigate', async (req, res) => {
  try {
    const { topic, scope = 'state', focus = 'policy' } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const result = await scoutBot.investigate({ topic, scope, focus });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Investigation failed:', error);
    res.status(500).json({ 
      error: 'Investigation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Analyze an entity (person, organization, etc.)
router.post('/analyze-entity', async (req, res) => {
  try {
    const { entityName } = req.body;

    if (!entityName) {
      return res.status(400).json({ error: 'Entity name is required' });
    }

    const result = await scoutBot.analyzeEntity(entityName);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Entity analysis failed:', error);
    res.status(500).json({ 
      error: 'Entity analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;