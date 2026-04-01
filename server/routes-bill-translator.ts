import { Router } from 'express';
import { 
  simplifyLegislativeText, 
  translateBillById, 
  compareBillVersions 
} from './services/bill-translator-service';
import { createLogger } from "./logger";
const log = createLogger("routes-bill-translator");


const router = Router();

/**
 * Translate complex legislative text to simpler language
 * POST /api/translator/text
 * Body: { text: string, readabilityLevel?: string, format?: string }
 */
router.post('/text', async (req, res) => {
  try {
    const { text, readabilityLevel, format } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text to translate is required' 
      });
    }
    
    // Validate readability level
    const validLevels = ['elementary', 'middle_school', 'high_school', 'college', 'general'];
    const level = readabilityLevel && validLevels.includes(readabilityLevel) 
      ? readabilityLevel 
      : 'general';
    
    // Validate format
    const validFormats = ['plain', 'bullet_points', 'sections', 'conversational'];
    const outputFormat = format && validFormats.includes(format) 
      ? format 
      : 'plain';
    
    const result = await simplifyLegislativeText(text, level as any, outputFormat as any);
    
    return res.json(result);
  } catch (error: any) {
    log.error({ err: error }, 'Error in text translation endpoint');
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

/**
 * Translate a bill by its LegiScan ID
 * POST /api/translator/bill/:billId
 * Body: { readabilityLevel?: string, format?: string }
 */
router.post('/bill/:billId', async (req, res) => {
  try {
    const billId = parseInt(req.params.billId, 10);
    
    if (isNaN(billId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid bill ID' 
      });
    }
    
    const { readabilityLevel, format } = req.body;
    
    // Validate readability level
    const validLevels = ['elementary', 'middle_school', 'high_school', 'college', 'general'];
    const level = readabilityLevel && validLevels.includes(readabilityLevel) 
      ? readabilityLevel 
      : 'general';
    
    // Validate format
    const validFormats = ['plain', 'bullet_points', 'sections', 'conversational'];
    const outputFormat = format && validFormats.includes(format) 
      ? format 
      : 'plain';
    
    const result = await translateBillById(billId, level as any, outputFormat as any);
    
    return res.json(result);
  } catch (error: any) {
    log.error({ err: error }, 'Error in bill translation endpoint');
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

/**
 * Compare original bill text with simplified version
 * POST /api/translator/compare
 * Body: { originalText: string, simplifiedText: string }
 */
router.post('/compare', async (req, res) => {
  try {
    const { originalText, simplifiedText } = req.body;
    
    if (!originalText || !simplifiedText) {
      return res.status(400).json({ 
        success: false, 
        error: 'Both original and simplified texts are required' 
      });
    }
    
    const result = await compareBillVersions(originalText, simplifiedText);
    
    return res.json(result);
  } catch (error: any) {
    log.error({ err: error }, 'Error in version comparison endpoint');
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
});

export function registerBillTranslatorRoutes(app: any) {
  app.use('/api/translator', router);
  log.info('Bill translator routes registered');
}

export default router;