/**
 * Bill Context Service
 * 
 * This service provides contextual information about bill status changes.
 * It helps explain what changes mean, their potential impact, and what users might want to do next.
 */

import { db } from '../db';
import { bills } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Define types for bill context
export interface BillChangeContext {
  explanation: string;
  impact: string;
  nextSteps: string;
}

export interface BillStatusMetadata {
  changeType: string;
  previousStatus?: string;
  currentStatus: string;
  explanation: string;
  impact: string;
  nextSteps: string;
}

/**
 * Generate contextual information for a bill based on its status change
 */
export async function generateBillChangeContext(
  billId: string, 
  changeType: string,
  previousStatus?: string,
  currentStatus?: string
): Promise<BillStatusMetadata> {
  // Get bill information
  const billResult = await db.select().from(bills).$dynamic().where(eq(bills.id, billId)).limit(1);
  const bill = billResult[0];
  
  // For now, we'll use some hardcoded subjects until we add a proper subject table
  const subjects: string[] = [];
  
  // Build generic responses based on change type
  let baseExplanation = 'This bill has been updated.';
  let baseImpact = 'The change may affect how quickly the bill moves through the legislature.';
  let baseNextSteps = 'Keep tracking this bill for further updates.';
  
  if (changeType === 'committee_assignment') {
    baseExplanation = `This bill has been assigned to a committee where it will be reviewed, possibly amended, and voted on before potentially advancing to the chamber floor.`;
    baseImpact = 'Committee assignment is a crucial step - many bills never advance beyond this stage. The committee composition and chair can influence whether this bill moves forward.';
    baseNextSteps = 'Watch for scheduled hearings where public testimony may be accepted. This is your first opportunity to voice support or concerns about this legislation.';
  } 
  else if (changeType === 'hearing_scheduled') {
    baseExplanation = 'A committee hearing has been scheduled for this bill. During the hearing, the committee will discuss the bill and may hear public testimony.';
    baseImpact = 'This is a significant step forward. The hearing gives the bill visibility and brings it closer to a committee vote.';
    baseNextSteps = 'Consider attending the hearing or submitting testimony. Public input can influence committee members\' positions on the bill.';
  }
  else if (changeType === 'committee_voted') {
    baseExplanation = 'The committee has voted on this bill. A favorable vote means the bill advances to the chamber floor; an unfavorable vote typically means the bill will not advance.';
    baseImpact = 'A committee\'s approval significantly increases the bill\'s chances of becoming law, while rejection typically ends its journey.';
    baseNextSteps = 'If approved, prepare for floor debate. Contact your representatives to express your position before the full chamber vote.';
  }
  else if (changeType === 'chamber_vote_scheduled') {
    baseExplanation = 'This bill has been scheduled for a vote in the full chamber. The entire body of representatives/senators will debate and vote on the bill.';
    baseImpact = 'This is one of the final major hurdles for the bill in this chamber. Passage here is significant.';
    baseNextSteps = 'This is a critical time to contact your representatives and share your position on the bill.';
  }
  else if (changeType === 'passed_chamber') {
    baseExplanation = 'This bill has passed in its originating chamber and will now move to the other chamber for consideration.';
    baseImpact = 'Passing one chamber is a major milestone. The bill now has momentum but must repeat the process in the other chamber.';
    baseNextSteps = 'The process begins again in the new chamber. Stay engaged as the bill may be amended further.';
  }
  else if (changeType === 'amended') {
    baseExplanation = 'The bill has been amended, meaning changes have been made to its text. These changes may be minor or substantial.';
    baseImpact = 'Amendments can significantly change a bill\'s scope or effect. What you initially supported or opposed may have changed.';
    baseNextSteps = 'Review the amendments to understand how they affect the bill\'s intent and impact. Your position on the bill may need to be reconsidered.';
  }
  else if (changeType === 'passed_both_chambers') {
    baseExplanation = 'The bill has passed both the House and Senate, potentially with different versions that will need to be reconciled.';
    baseImpact = 'This bill is very close to becoming law. If versions differ, a conference committee will resolve differences.';
    baseNextSteps = 'The governor will need to sign or veto the bill. Contact the governor\'s office to express your position.';
  }
  else if (changeType === 'sent_to_governor') {
    baseExplanation = 'The bill has passed both chambers in identical form and has been sent to the governor for signature or veto.';
    baseImpact = 'The bill is one step away from becoming law. The governor can sign it, veto it, or let it become law without signature.';
    baseNextSteps = 'Contact the governor\'s office to express your support for signing or vetoing the bill.';
  }
  else if (changeType === 'signed') {
    baseExplanation = 'The governor has signed this bill into law.';
    baseImpact = 'This bill will become law according to the timeline specified in the legislation.';
    baseNextSteps = 'Monitor implementation of the new law and stay informed about any rules or regulations that may be developed to enforce it.';
  }
  else if (changeType === 'vetoed') {
    baseExplanation = 'The governor has vetoed this bill, preventing it from becoming law unless the legislature overrides the veto.';
    baseImpact = 'The bill will not become law unless the legislature can gather a supermajority vote to override the veto.';
    baseNextSteps = 'A veto override may be attempted. Contact your legislators if you feel strongly about the veto decision.';
  }
  
  // Attempt to enhance explanation based on bill subjects
  let enhancedExplanation = baseExplanation;
  let enhancedImpact = baseImpact;
  
  if (subjects.includes('education') && changeType === 'committee_assignment') {
    enhancedImpact = baseImpact + ' Education bills often face scrutiny regarding funding mechanisms and local control issues.';
  }
  else if (subjects.includes('healthcare') && changeType === 'committee_assignment') {
    enhancedImpact = baseImpact + ' Healthcare bills typically receive careful analysis regarding cost impacts and access to care.';
  }
  else if ((subjects.includes('taxes') || subjects.includes('finance')) && changeType === 'committee_assignment') {
    enhancedImpact = baseImpact + ' Tax and finance bills undergo rigorous fiscal analysis to determine state and local budget impacts.';
  }
  
  return {
    changeType,
    previousStatus: previousStatus || '',
    currentStatus: currentStatus || '',
    explanation: enhancedExplanation,
    impact: enhancedImpact,
    nextSteps: baseNextSteps
  };
}