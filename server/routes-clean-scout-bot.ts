import { Router } from 'express';
import { workingScoutBot } from './services/working-scout-bot';

const router = Router();

// Conduct investigative research
router.post('/research', async (req, res) => {
  try {
    const { topic, scope = 'state', focus = 'comprehensive', depth = 'detailed' } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Research topic is required' });
    }

    const query = {
      topic,
      scope: scope as 'local' | 'state' | 'federal' | 'comparative',
      focus: focus as 'policy' | 'financial' | 'political' | 'social' | 'legal',
      depth: depth as 'overview' | 'detailed' | 'comprehensive'
    };

    const report = await workingScoutBot.conductResearch(query);
    
    res.json({
      success: true,
      data: report
    });

  } catch (error: any) {
    console.error('Research error:', error);
    res.status(500).json({
      error: 'Research failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Analyze specific entity
router.post('/analyze-entity', async (req, res) => {
  try {
    const { entityName } = req.body;

    if (!entityName) {
      return res.status(400).json({ error: 'Entity name is required' });
    }

    const profile = await workingScoutBot.analyzeEntity(entityName);
    
    res.json({
      success: true,
      data: profile
    });

  } catch (error: any) {
    console.error('Entity analysis error:', error);
    res.status(500).json({
      error: 'Entity analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Ethics and transparency scan
router.post('/ethics-scan', async (req, res) => {
  try {
    const { entityName } = req.body;

    if (!entityName) {
      return res.status(400).json({ error: 'Entity name is required' });
    }

    const findings = await workingScoutBot.scanForEthicsIssues(entityName);
    
    res.json({
      success: true,
      data: {
        entityName,
        findings,
        scannedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Ethics scan error:', error);
    res.status(500).json({
      error: 'Ethics scan failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get research capabilities
router.get('/capabilities', (req, res) => {
  res.json({
    success: true,
    data: {
      features: [
        'Deep investigative research',
        'Entity profiling and analysis',
        'Ethics and transparency scanning',
        'Financial network mapping',
        'Legislative activity tracking',
        'Influence pattern detection'
      ],
      scopes: ['local', 'state', 'federal', 'comparative'],
      focusAreas: ['policy', 'financial', 'political', 'social', 'legal'],
      depthLevels: ['overview', 'detailed', 'comprehensive']
    }
  });
});

export default router;