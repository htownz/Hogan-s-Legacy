import { Router } from 'express';
import { CustomRequest } from '../types';

export function registerAdvocacyRoutes(app: Router) {
  // Get action templates
  app.get('/api/advocacy/templates', async (req, res) => {
    try {
      // In a real implementation, these would be fetched from a database
      const templates = [
        {
          id: '1',
          name: 'Support Bill Template',
          subject: 'I Support [Bill Number]',
          content: 'Dear [Representative],\n\nI am writing to express my support for [Bill Number]. This legislation is important because...\n\nSincerely,\n[Your Name]'
        },
        {
          id: '2',
          name: 'Oppose Bill Template',
          subject: 'I Oppose [Bill Number]',
          content: 'Dear [Representative],\n\nI am writing to express my opposition to [Bill Number]. This legislation concerns me because...\n\nSincerely,\n[Your Name]'
        },
        {
          id: '3',
          name: 'Request Information Template',
          subject: 'Request for Information about [Bill Number]',
          content: 'Dear [Representative],\n\nI am interested in learning more about your position on [Bill Number]. Could you please provide information about...\n\nThank you,\n[Your Name]'
        }
      ];
      
      res.json(templates);
    } catch (error: any) {
      console.error('Error getting advocacy templates:', error);
      res.status(500).json({ error: 'Failed to get advocacy templates' });
    }
  });
  
  // Get representatives by district
  app.get('/api/advocacy/representatives', async (req, res) => {
    try {
      const { district } = req.query;
      
      // In a real implementation, this would query a database based on the district
      // For now, return mock data
      const representatives = [
        {
          id: '1',
          name: 'Jane Smith',
          title: 'State Senator',
          party: 'Democratic',
          district: '14',
          email: 'jane.smith@state.gov',
          phone: '(512) 555-1234',
          office: '1400 Congress Ave, Austin, TX'
        },
        {
          id: '2',
          name: 'Robert Johnson',
          title: 'State Representative',
          party: 'Republican',
          district: '14',
          email: 'robert.johnson@state.gov',
          phone: '(512) 555-5678',
          office: '1500 Congress Ave, Austin, TX'
        },
        {
          id: '3',
          name: 'Maria Rodriguez',
          title: 'US Representative',
          party: 'Democratic',
          district: '14',
          email: 'maria.rodriguez@house.gov',
          phone: '(202) 555-9012',
          office: '123 Capitol St, Washington DC'
        }
      ];
      
      // Filter by district if provided
      const filteredReps = district 
        ? representatives.filter(rep => rep.district === district) 
        : representatives;
      
      res.json(filteredReps);
    } catch (error: any) {
      console.error('Error getting representatives:', error);
      res.status(500).json({ error: 'Failed to get representatives' });
    }
  });
  
  // Send advocacy message (email, tweet, etc)
  app.post('/api/advocacy/send', async (req: CustomRequest, res) => {
    try {
      // Check if user is authenticated
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { recipients, subject, message, method } = req.body;
      
      // Validate input
      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: 'At least one recipient is required' });
      }
      
      if (!subject) {
        return res.status(400).json({ error: 'Subject is required' });
      }
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      if (!method || !['email', 'twitter', 'facebook', 'phone'].includes(method)) {
        return res.status(400).json({ error: 'Valid method is required (email, twitter, facebook, phone)' });
      }
      
      // In a real implementation, this would send the message using the appropriate service
      // For now, just log it and return success
      console.log(`Sending ${method} message to:`, recipients);
      console.log('Subject:', subject);
      console.log('Message:', message);
      
      // Record the advocacy action for the user
      // In a real implementation, this would be stored in a database
      
      res.status(200).json({ 
        success: true, 
        message: `Your message has been sent to ${recipients.length} recipient(s)` 
      });
    } catch (error: any) {
      console.error('Error sending advocacy message:', error);
      res.status(500).json({ error: 'Failed to send advocacy message' });
    }
  });
  
  // Get user's advocacy history
  app.get('/api/advocacy/history', async (req: CustomRequest, res) => {
    try {
      // Check if user is authenticated
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // In a real implementation, this would query a database for the user's advocacy history
      // For now, return mock data
      const advocacyHistory = [
        {
          id: '1',
          date: '2023-05-15T14:30:00.000Z',
          recipients: ['Jane Smith', 'Robert Johnson'],
          subject: 'Support for Texas Clean Energy Act',
          method: 'email',
          status: 'delivered'
        },
        {
          id: '2',
          date: '2023-04-20T10:15:00.000Z',
          recipients: ['Maria Rodriguez'],
          subject: 'Opposition to Education Budget Cuts',
          method: 'twitter',
          status: 'delivered'
        },
        {
          id: '3',
          date: '2023-03-10T09:45:00.000Z',
          recipients: ['Jane Smith'],
          subject: 'Question about Infrastructure Bill',
          method: 'email',
          status: 'delivered'
        }
      ];
      
      res.json(advocacyHistory);
    } catch (error: any) {
      console.error('Error getting advocacy history:', error);
      res.status(500).json({ error: 'Failed to get advocacy history' });
    }
  });
  
  // Get advocacy impact metrics
  app.get('/api/advocacy/impact', async (req: CustomRequest, res) => {
    try {
      // Check if user is authenticated
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // In a real implementation, this would calculate real metrics from a database
      // For now, return mock data
      const impactMetrics = {
        messagesCount: 12,
        recipientsCount: 8,
        responsesCount: 5,
        responseRate: 62.5, // percentage
        billsSupported: 4,
        billsOpposed: 2,
        actionsCompletedByNetwork: 28,
        communityRanking: 'Top 15%'
      };
      
      res.json(impactMetrics);
    } catch (error: any) {
      console.error('Error getting advocacy impact metrics:', error);
      res.status(500).json({ error: 'Failed to get advocacy impact metrics' });
    }
  });
}