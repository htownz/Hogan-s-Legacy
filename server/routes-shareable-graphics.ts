import { Router } from 'express';
import { generateImpactCard, generateShareableGraphic } from './services/impact-card-generator';

const router = Router();

/**
 * Generate an impact card for a bill
 * POST /api/graphics/impact-card
 * Body: { billId: number, style?: string }
 */
router.post('/impact-card', async (req, res) => {
  try {
    const { billId, style } = req.body;

    if (!billId || isNaN(parseInt(billId))) {
      return res.status(400).json({
        success: false,
        error: 'Valid bill ID is required'
      });
    }

    const validStyles = ['modern', 'classic', 'bold', 'minimal'];
    const cardStyle = style && validStyles.includes(style) ? style : 'modern';

    const result = await generateImpactCard(parseInt(billId), cardStyle as any);
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error generating impact card:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Generate shareable graphic from impact card
 * POST /api/graphics/shareable
 * Body: { impactCard: ImpactCard, format?: string }
 */
router.post('/shareable', async (req, res) => {
  try {
    const { impactCard, format } = req.body;

    if (!impactCard || !impactCard.id) {
      return res.status(400).json({
        success: false,
        error: 'Valid impact card data is required'
      });
    }

    const validFormats = ['social_media', 'story', 'banner', 'infographic'];
    const graphicFormat = format && validFormats.includes(format) ? format : 'social_media';

    const result = await generateShareableGraphic(impactCard, graphicFormat as any);
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error generating shareable graphic:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Generate complete shareable package (card + graphics)
 * POST /api/graphics/complete-package
 * Body: { billId: number, style?: string, formats?: string[] }
 */
router.post('/complete-package', async (req, res) => {
  try {
    const { billId, style, formats } = req.body;

    if (!billId || isNaN(parseInt(billId))) {
      return res.status(400).json({
        success: false,
        error: 'Valid bill ID is required'
      });
    }

    // Generate impact card first
    const cardResult = await generateImpactCard(parseInt(billId), style || 'modern');
    
    if (!cardResult.success || !cardResult.data) {
      return res.json(cardResult);
    }

    // Generate graphics for requested formats
    const requestedFormats = formats || ['social_media', 'story'];
    const graphics = [];

    for (const format of requestedFormats) {
      try {
        const graphicResult = await generateShareableGraphic(cardResult.data, format);
        if (graphicResult.success && graphicResult.data) {
          graphics.push(graphicResult.data);
        }
      } catch (error: any) {
        console.error(`Error generating ${format} graphic:`, error);
      }
    }

    return res.json({
      success: true,
      data: {
        impactCard: cardResult.data,
        graphics,
        totalFormats: graphics.length
      }
    });

  } catch (error: any) {
    console.error('Error generating complete package:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Get SVG as downloadable file
 * GET /api/graphics/download/:graphicId
 */
router.get('/download/:graphicId', async (req, res) => {
  try {
    const { graphicId } = req.params;
    
    // In a real implementation, you would fetch the graphic from database
    // For now, we'll return a sample response
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `attachment; filename="impact-card-${graphicId}.svg"`);
    
    // This would be the actual SVG content from the database
    const sampleSVG = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#f8fafc"/>
      <text x="600" y="315" font-family="Arial" font-size="24" text-anchor="middle" fill="#1e293b">Impact Card - ${graphicId}</text>
    </svg>`;
    
    return res.send(sampleSVG);
  } catch (error: any) {
    console.error('Error downloading graphic:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to download graphic'
    });
  }
});

export function registerShareableGraphicsRoutes(app: any) {
  app.use('/api/graphics', router);
  console.log('Shareable graphics routes registered');
}

export default router;