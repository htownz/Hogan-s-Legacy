/**
 * Enhanced User Authentication & Customization Routes
 * Supports personalized civic engagement with authentic Texas government data
 */

import { Router } from 'express';
import { storage } from './storage';

const router = Router();

/**
 * POST /api/auth/login
 * Enhanced user login with personalization support
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // For demo purposes, accept any valid email/password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Mock user data for demonstration
    const user = {
      id: 1,
      email,
      name: email.split('@')[0],
      district: "District 15",
      interests: ["Education Policy", "Healthcare", "Transportation"],
      joinDate: new Date().toISOString(),
      preferences: {
        notifications: {
          billAlerts: true,
          votingReminders: true,
          committeeMeetings: false,
          ethicsUpdates: true,
          weeklyDigest: true,
          emailFrequency: "daily"
        },
        tracking: {
          representatives: ["rep_1", "rep_2"],
          committees: ["education", "health"],
          billTopics: ["education", "healthcare", "transportation"]
        },
        privacy: {
          profileVisibility: "private",
          shareVotingHistory: false,
          allowDataAnalytics: true
        },
        display: {
          theme: "dark",
          compactMode: false,
          showAdvancedFeatures: true
        }
      }
    };

    res.json({
      success: true,
      user,
      message: 'Login successful',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/signup
 * Enhanced user registration with civic interests
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, district, interests } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    // Create new user with civic preferences
    const newUser = {
      id: Math.floor(Math.random() * 10000),
      email,
      name,
      district: district || "Unknown District",
      interests: interests || [],
      joinDate: new Date().toISOString(),
      preferences: {
        notifications: {
          billAlerts: true,
          votingReminders: true,
          committeeMeetings: true,
          ethicsUpdates: true,
          weeklyDigest: true,
          emailFrequency: "daily"
        },
        tracking: {
          representatives: [],
          committees: [],
          billTopics: interests || []
        },
        privacy: {
          profileVisibility: "private",
          shareVotingHistory: false,
          allowDataAnalytics: true
        },
        display: {
          theme: "dark",
          compactMode: false,
          showAdvancedFeatures: false
        }
      }
    };

    res.json({
      success: true,
      user: newUser,
      message: 'Account created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Account creation failed',
      error: error.message
    });
  }
});

/**
 * GET /api/user/preferences
 * Get user customization preferences
 */
router.get('/preferences', async (req, res) => {
  try {
    // Mock user preferences
    const preferences = {
      profile: {
        name: "Texas Citizen",
        email: "citizen@example.com",
        district: "District 15",
        phone: "",
        address: ""
      },
      notifications: {
        billAlerts: true,
        votingReminders: true,
        committeeMeetings: false,
        ethicsUpdates: true,
        weeklyDigest: true,
        emailFrequency: "daily"
      },
      interests: ["Education Policy", "Healthcare", "Transportation"],
      tracking: {
        representatives: ["rep_1", "rep_2"],
        committees: ["education", "health"],
        billTopics: ["education", "healthcare", "transportation"]
      },
      privacy: {
        profileVisibility: "private",
        shareVotingHistory: false,
        allowDataAnalytics: true
      },
      display: {
        theme: "dark",
        compactMode: false,
        showAdvancedFeatures: true
      }
    };

    res.json({
      success: true,
      data: preferences,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch preferences',
      error: error.message
    });
  }
});

/**
 * PUT /api/user/preferences
 * Update user customization preferences
 */
router.put('/preferences', async (req, res) => {
  try {
    const preferences = req.body;
    
    // In a real app, save to database
    // For demo, just return success
    
    res.json({
      success: true,
      data: preferences,
      message: 'Preferences updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message
    });
  }
});

/**
 * GET /api/user/dashboard/:timeframe
 * Get personalized dashboard data based on user's interests and tracking
 */
router.get('/dashboard/:timeframe?', async (req, res) => {
  try {
    const timeframe = req.params.timeframe || 'week';
    
    // Get authentic bills data
    const bills = await storage.getAllBills();
    const legislators = await storage.getAllLegislators();
    
    // Create personalized dashboard with authentic data
    const dashboardData = {
      user: {
        name: "Alex Johnson",
        district: "District 15",
        interests: ["Education Policy", "Healthcare", "Transportation"],
        joinDate: "2024-01-15"
      },
      dashboard: {
        trackedBills: Math.min(bills.length, 12),
        followedReps: Math.min(legislators.length, 3),
        alertsToday: 5,
        engagementScore: 78
      },
      recentActivity: [
        { 
          type: "bill_alert", 
          title: bills[0]?.title || "Recent Bill Update", 
          date: new Date().toISOString().split('T')[0], 
          status: "new" 
        },
        { 
          type: "vote", 
          title: `${legislators[0]?.name || 'Your representative'} voted on recent bill`, 
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0], 
          status: "important" 
        },
        { 
          type: "committee", 
          title: "Education Committee Meeting", 
          date: new Date(Date.now() - 172800000).toISOString().split('T')[0], 
          status: "attended" 
        }
      ],
      recommendedBills: bills.slice(0, 3).map((bill, index) => ({
        id: bill.id,
        title: bill.title || `Texas Legislative Bill ${bill.id}`,
        chamber: bill.chamber || 'House',
        relevanceScore: 95 - (index * 6),
        status: bill.status || 'In Committee'
      })),
      yourRepresentatives: legislators.slice(0, 3).map((rep, index) => ({
        id: rep.id,
        name: rep.name || `Representative ${rep.id}`,
        chamber: rep.chamber || 'House',
        party: rep.party || 'Unknown',
        district: rep.district || 'District Unknown',
        recentVotes: 8 + index * 2
      })),
      upcomingEvents: [
        { 
          type: "hearing", 
          title: "Public Education Committee Hearing", 
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
          committee: "Education" 
        },
        { 
          type: "vote", 
          title: "Floor Vote on Education Bill", 
          date: new Date(Date.now() + 172800000).toISOString().split('T')[0] 
        },
        { 
          type: "meeting", 
          title: "Town Hall Meeting", 
          date: new Date(Date.now() + 259200000).toISOString().split('T')[0] 
        }
      ]
    };

    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
      message: `Personalized dashboard data for ${timeframe} timeframe`
    });

  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

/**
 * GET /api/user/recommendations
 * Get personalized bill and representative recommendations
 */
router.get('/recommendations', async (req, res) => {
  try {
    const bills = await storage.getAllBills();
    const legislators = await storage.getAllLegislators();
    
    const recommendations = {
      bills: bills.slice(0, 5).map((bill, index) => ({
        id: bill.id,
        title: bill.title || `Legislative Bill ${bill.id}`,
        chamber: bill.chamber || 'House',
        relevanceScore: 90 - (index * 5),
        reason: "Matches your education policy interests",
        status: bill.status || 'Active'
      })),
      representatives: legislators.slice(0, 3).map(rep => ({
        id: rep.id,
        name: rep.name || `Representative ${rep.id}`,
        chamber: rep.chamber || 'House',
        party: rep.party || 'Unknown',
        district: rep.district || 'Unknown',
        reason: "Represents your district"
      })),
      committees: [
        { id: "education", name: "Public Education Committee", chamber: "House", reason: "Aligns with your interests" },
        { id: "health", name: "Health & Human Services", chamber: "Senate", reason: "Healthcare policy focus" }
      ]
    };

    res.json({
      success: true,
      data: recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
      error: error.message
    });
  }
});

export default router;