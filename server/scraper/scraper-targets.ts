/**
 * Scraper Target List for Texas Ethics Commission Data
 * 
 * This file defines the target URLs, structure, and metadata for scraping
 * campaign finance reports, forms, and other data from the Texas Ethics Commission.
 */

// =========================================================================
// Campaign Finance Report Targets
// =========================================================================
export const CAMPAIGN_FINANCE_REPORT_TARGETS = {
  // Main search form for reports
  searchForm: {
    baseUrl: "https://www.ethics.state.tx.us/search/cf/",
    pageName: "CISCoFilerSearch",
    processingNotes: "Search form allows querying by filer name, ID, and report type"
  },
  
  // Recent reports listing
  recentReports: {
    baseUrl: "https://www.ethics.state.tx.us/data/search/cf/",
    pageName: "CISRecentlyFiledCoFs",
    processingNotes: "Lists most recently filed reports for the last 30 days"
  },
  
  // API endpoints for JSON data (if available)
  apiEndpoints: {
    searchResults: "https://www.ethics.state.tx.us/api/search/results",
    reportDetails: "https://www.ethics.state.tx.us/api/report/details",
    processingNotes: "Need to check if these APIs exist or need to be reverse-engineered"
  },
  
  // PDF download format - many reports are PDF-only
  reportPdf: {
    baseUrl: "https://www.ethics.state.tx.us/data/cf/00000000/",
    format: "{reportID}.pdf",
    processingNotes: "Will need OCR processing for data extraction"
  },
  
  // HTML formatted reports (not all reports have this format)
  reportHtml: {
    baseUrl: "https://www.ethics.state.tx.us/data/cf/00000000/html/",
    format: "{reportID}.html",
    processingNotes: "HTML is easier to parse when available"
  },
  
  // Specific report types of interest
  specificReportTypes: [
    {
      name: "Semiannual Reports",
      searchParams: { report_type: "JC" },
      processingNotes: "Filed twice a year, most comprehensive"
    },
    {
      name: "8-Day Pre-Election Reports",
      searchParams: { report_type: "8" },
      processingNotes: "Filed before elections, shows last-minute activity"
    },
    {
      name: "Runoff Reports",
      searchParams: { report_type: "R" },
      processingNotes: "Only for candidates in runoff elections"
    },
    {
      name: "Final Reports",
      searchParams: { report_type: "FR" },
      processingNotes: "Filed when terminating a campaign/committee"
    }
  ],
  
  // Top filers to prioritize for scraping
  priorityFilers: [
    {
      name: "Texans for Greg Abbott",
      id: "00019028",
      category: "Candidate"
    },
    {
      name: "Texas Realtors Political Action Committee",
      id: "00000065",
      category: "General Purpose Committee"
    },
    {
      name: "Border Health Political Action Committee",
      id: "00059784",
      category: "General Purpose Committee"
    },
    {
      name: "Texas Association of REALTORS Political Action Committee",
      id: "00065465",
      category: "General Purpose Committee"
    },
    {
      name: "Texas Medical Association Political Action Committee",
      id: "00025356",
      category: "General Purpose Committee"
    }
  ]
};

// =========================================================================
// Filing Form Templates Targets
// =========================================================================
export const FILING_FORM_TARGETS = {
  // Main forms & instructions page
  formsPage: {
    baseUrl: "https://www.ethics.state.tx.us/forms/index.php",
    processingNotes: "Main landing page for all forms"
  },
  
  // Categories of forms to scrape
  formCategories: [
    {
      name: "Campaign Finance Forms",
      url: "https://www.ethics.state.tx.us/forms/coh_coe_pacs.php",
      processingNotes: "Forms for candidates, officeholders, and PACs"
    },
    {
      name: "Lobby Forms",
      url: "https://www.ethics.state.tx.us/forms/lobby.php",
      processingNotes: "Forms for lobby registrations and activities"
    },
    {
      name: "Personal Financial Statement Forms",
      url: "https://www.ethics.state.tx.us/forms/pfs.php",
      processingNotes: "Forms for financial disclosure by public officials"
    }
  ],
  
  // Priority forms to implement in the AI assistant
  priorityForms: [
    {
      formNumber: "CTA",
      formName: "Appointment of a Campaign Treasurer by a Candidate",
      url: "https://www.ethics.state.tx.us/data/forms/coh/cta.pdf",
      instructionsUrl: "https://www.ethics.state.tx.us/data/forms/coh/CTA_ins.pdf",
      complexity: "Low",
      aiImplementationPriority: "High"
    },
    {
      formNumber: "ACTA",
      formName: "Amendment: Appointment of a Campaign Treasurer by a Candidate",
      url: "https://www.ethics.state.tx.us/data/forms/coh/acta.pdf",
      instructionsUrl: "https://www.ethics.state.tx.us/data/forms/coh/ACTA_ins.pdf",
      complexity: "Low",
      aiImplementationPriority: "High"
    },
    {
      formNumber: "C/OH",
      formName: "Candidate/Officeholder Campaign Finance Report",
      url: "https://www.ethics.state.tx.us/data/forms/coh/coh.pdf",
      instructionsUrl: "https://www.ethics.state.tx.us/data/forms/coh/COH_ins.pdf",
      complexity: "High",
      aiImplementationPriority: "High"
    },
    {
      formNumber: "SPAC",
      formName: "Appointment of a Campaign Treasurer by a Specific-Purpose Committee",
      url: "https://www.ethics.state.tx.us/data/forms/pacs/spac.pdf",
      instructionsUrl: "https://www.ethics.state.tx.us/data/forms/pacs/SPAC_ins.pdf",
      complexity: "Medium",
      aiImplementationPriority: "Medium"
    },
    {
      formNumber: "GPAC",
      formName: "Appointment of a Campaign Treasurer by a General-Purpose Committee",
      url: "https://www.ethics.state.tx.us/data/forms/pacs/gpac.pdf",
      instructionsUrl: "https://www.ethics.state.tx.us/data/forms/pacs/GPAC_ins.pdf",
      complexity: "Medium",
      aiImplementationPriority: "Medium"
    },
    {
      formNumber: "REG",
      formName: "Lobby Registration",
      url: "https://www.ethics.state.tx.us/data/forms/lobby/reg.pdf",
      instructionsUrl: "https://www.ethics.state.tx.us/data/forms/lobby/REG_ins.pdf",
      complexity: "High",
      aiImplementationPriority: "Medium"
    },
    {
      formNumber: "LA",
      formName: "Lobby Activities Report",
      url: "https://www.ethics.state.tx.us/data/forms/lobby/la.pdf",
      instructionsUrl: "https://www.ethics.state.tx.us/data/forms/lobby/LA_ins.pdf",
      complexity: "Very High",
      aiImplementationPriority: "Low"
    },
    {
      formNumber: "PFS",
      formName: "Personal Financial Statement",
      url: "https://www.ethics.state.tx.us/data/forms/pfs/pfs.pdf",
      instructionsUrl: "https://www.ethics.state.tx.us/data/forms/pfs/PFS_ins.pdf",
      complexity: "Very High",
      aiImplementationPriority: "Low"
    }
  ],
  
  // Form field extraction templates
  formFieldExtractionTemplates: {
    CTA: {
      sections: ["CANDIDATE NAME", "CAMPAIGN TREASURER NAME", "CAMPAIGN TREASURER ADDRESS", "CAMPAIGN TREASURER PHONE", "OFFICE HELD", "OFFICE SOUGHT"],
      fieldGroups: ["personal_details", "treasurer_details", "campaign_details"]
    },
    COH: {
      sections: ["FILER INFORMATION", "COVER SHEET", "SCHEDULE A", "SCHEDULE B", "SCHEDULE E", "SCHEDULE F", "SCHEDULE G", "SCHEDULE K"],
      fieldGroups: ["cover_details", "contributions", "loans", "expenditures", "credits", "interest"]
    }
  }
};

// =========================================================================
// Scraper Schedule Configuration
// =========================================================================
export const SCRAPER_SCHEDULE = {
  // Daily recent reports check
  dailyRecentReportsCheck: {
    schedule: "0 5 * * *", // 5am every day
    target: "recentReports",
    maxReportsToProcess: 100,
    priority: "High"
  },
  
  // Weekly major filer check
  weeklyMajorFilerCheck: {
    schedule: "0 2 * * 1", // 2am every Monday
    target: "priorityFilers",
    filerCount: CAMPAIGN_FINANCE_REPORT_TARGETS.priorityFilers.length,
    priority: "Medium"
  },
  
  // Monthly form template update check
  monthlyFormTemplateCheck: {
    schedule: "0 3 1 * *", // 3am on the 1st of every month
    target: "formCategories",
    checkForUpdates: true,
    priority: "Low"
  },
  
  // Election cycle-specific checks (increased frequency near elections)
  electionCycleChecks: {
    beforeElectionDays: [30, 15, 8], // Days before election to check
    schedule: "0 */4 * * *", // Every 4 hours
    target: "specificReportTypes",
    reportTypes: ["8-Day Pre-Election", "Daily Pre-Election"],
    priority: "Critical"
  }
};

// =========================================================================
// OCR Configuration for PDF Processing
// =========================================================================
export const OCR_CONFIG = {
  engine: "tesseract", // Alternative: "azure", "google"
  pdfExtractionMethod: "pdftotext", // Alternative: "pdfjs", "poppler"
  enhancementSteps: ["contrast", "noise_reduction", "deskew"],
  tableExtractionMethod: "camelot", // Alternative: "tabula"
  postProcessing: {
    currencyNormalization: true,
    dateNormalization: true,
    nameNormalization: true
  },
  debugOutput: false
};

// =========================================================================
// API Rate Limiting Settings
// =========================================================================
export const RATE_LIMIT_CONFIG = {
  baseDelay: 2000, // milliseconds between requests
  randomVariation: 1000, // +/- random variation to avoid detection
  maxConcurrentRequests: 2,
  maxDailyRequests: 1000,
  retryCount: 3,
  retryDelay: 5000,
  userAgentRotation: true,
  respectRobotsTxt: true
};