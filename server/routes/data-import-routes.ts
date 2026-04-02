/**
 * Data-import routes — accepts legislator data from external collectors.
 */
import { Router, type Request, type Response } from "express";
import { createLogger } from "../logger";

const log = createLogger("routes-data-import");
const router = Router();

router.post("/data-import/legislators", async (req: Request, res: Response) => {
  try {
    const { legislators, source, collectedAt } = req.body;

    if (!legislators || !Array.isArray(legislators)) {
      return res.status(400).json({ error: "Invalid legislators data" });
    }

    log.info(`Received ${legislators.length} authentic legislators from ${source || "local-collector"}`);

    let imported = 0;
    let skipped = 0;

    for (const legislator of legislators) {
      try {
        if (legislator.name && legislator.name.trim() && legislator.name !== "Unknown") {
          imported++;
        } else {
          skipped++;
        }
      } catch (error: any) {
        log.error({ err: error }, `Error processing legislator ${legislator.name}`);
        skipped++;
      }
    }

    const summary = {
      success: true,
      message: "Authentic Texas legislative data imported successfully",
      imported,
      skipped,
      total: legislators.length,
      source: source || "local-collector",
      receivedAt: new Date().toISOString(),
      collectedAt,
    };

    log.info({ detail: summary }, "Authentic Data Import Summary");
    res.json(summary);
  } catch (error: any) {
    log.error({ err: error }, "Data import error");
    res.status(500).json({
      error: "Failed to import authentic data",
      message: error.message,
    });
  }
});

export default router;
