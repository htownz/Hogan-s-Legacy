// @ts-nocheck
import { db } from "../db";
import { committees, committeeMeetings } from "@shared/schema";
import { createLogger } from "../logger";
const log = createLogger("add-test-committees");


/**
 * This script adds test committees and meetings for testing
 * the video processing feature
 */
async function addTestCommittees() {
  try {
    log.info("Adding test committees and meetings...");

    // Check if the House Committee on Natural Resources already exists
    const existingCommittee = await db.query.committees.findFirst({
      where: (committees, { eq, and }) => 
        and(
          eq(committees.name, "House Committee on Natural Resources"),
          eq(committees.chamber, "house")
        )
    });

    let committeeId;
    
    if (existingCommittee) {
      log.info("House Committee on Natural Resources already exists");
      committeeId = existingCommittee.id;
    } else {
      // Insert House Committee on Natural Resources
      const result = await db.insert(committees).values({
        name: "House Committee on Natural Resources",
        chamber: "house",
        description: "The House Committee on Natural Resources has jurisdiction over all matters pertaining to: the conservation of the natural resources of Texas; the control and development of land and water and land and water resources; irrigation and water rights; freshwater conservation districts; the management of state lands; mining and quarries; public lands and buildings; sea walls and breakwaters; oil and gas; parks; game preserves; and recreation areas.",
        chair: "Rep. Tracy King",
        viceChair: "Rep. Ernest Bailes",
        members: ["Rep. Tracy King", "Rep. Ernest Bailes", "Rep. Alma Allen", "Rep. Cecil Bell", "Rep. Keith Bell", "Rep. DeWayne Burns", "Rep. Terry Canales", "Rep. Jasmine Crockett", "Rep. John Kuempel", "Rep. Brooks Landgraf", "Rep. Penny Morales Shaw"]
      }).returning({ insertedId: committees.id });
      
      committeeId = result[0].insertedId;
      log.info(`Created committee with ID: ${committeeId}`);
    }

    // Check if we already have a meeting for this committee
    const existingMeeting = await db.query.committeeMeetings.findFirst({
      where: (meetings, { eq }) => eq(meetings.committeeId, committeeId),
    });

    if (existingMeeting) {
      log.info(`Meeting for this committee already exists with ID: ${existingMeeting.id}`);
    } else {
      // Create a meeting for this committee with a video URL that we can process
      const meetingResult = await db.insert(committeeMeetings).values({
        committeeId: committeeId,
        date: new Date("2023-04-25T09:30:00.000Z"),
        location: "E2.010",
        agenda: "Discussion on HB 1000 relating to ground water conservation districts, HB 1071 relating to the provision of water and wastewater services by certain retail public utilities, and HB 1110 relating to groundwater conservation district regulation of the minimum spacing between a new water well and an existing well.",
        billsDiscussed: ["TX-HB1000", "TX-HB1071", "TX-HB1110"],
        status: "completed",
        videoUrl: "https://tlchouse.granicus.com/MediaPlayer.php?view_id=46&clip_id=22711", // This is a real Texas Legislature video URL
        transcriptUrl: null,
        summarySummary: null,
        summaryTranscript: null,
        summaryKeyPoints: null,
        summaryBillDiscussions: null,
        summaryPublicTestimonies: null,
        summaryStatus: null,
        summaryLastUpdated: null
      }).returning({ insertedId: committeeMeetings.id });

      const meetingId = meetingResult[0].insertedId;
      log.info(`Created meeting with ID: ${meetingId}`);
    }

    log.info("Test data setup complete!");

  } catch (error: any) {
    log.error({ err: error }, "Error setting up test data");
  } finally {
    // Exit the process when done
    process.exit(0);
  }
}

// Run the function
addTestCommittees();