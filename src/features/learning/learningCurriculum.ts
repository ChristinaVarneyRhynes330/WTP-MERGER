/**
 * Derived from the founder-supplied WE THE PARENT Master Operating Framework HTML.
 * This is a TEACHING prototype, not independently researched law or authenticated case evidence.
 * Source SHA-256: f97406313964dc5b7205e6d5a87be9f7f5979d6ef2be78672a26efcc0399f9b1
 *
 * Personal case details, legal rules presented as absolutes, and simulated source
 * verification statuses were intentionally NOT copied into fictional demo data.
 */
export type LearningModule = {
  id: number
  roman: string
  title: string
  focus: string
  lesson: string
  example: string
  question: string
  answers: [string, string, string]
  correct: number
  explanation: string
  provenance: string
}

export const learningModules: LearningModule[] = [
  {
    id: 1, roman: "I", title: "The Master Objective", focus: "Inquiry · Judgment · Strategy · Stewardship",
    lesson: "Begin by stating what you want to achieve, what is known, what remains unknown and which constraints cannot be traded away. Separate the objective from an intermediate tactic or favorable motion.",
    example: "A helpful intermediate step may preserve a missing document even when it does not resolve the entire dispute.",
    question: "What should govern the evaluation of an intermediate tactic?",
    answers: ["Whether it sounds forceful", "Whether it advances the defined objective without violating constraints", "Whether the other party agrees"],
    correct: 1, explanation: "A tactical win is not automatically a strategic success. Evaluate its effect on the governing objective and constraints.",
    provenance: "Framework Module I · Governing objective and four executive levels"
  },
  {
    id: 2, roman: "II", title: "Etymological Architecture", focus: "Literal · Practical · Context-specific meaning",
    lesson: "Explore the historical origin of a term separately from its ordinary use and its controlling meaning in the current legal or administrative setting. Word roots can clarify language, but cannot establish present-day authority.",
    example: "Research the current definition and governing rule for a procedural term instead of deriving legal consequences from its Latin root.",
    question: "Can an ancient word root establish a court's current legal authority?",
    answers: ["Yes, by itself", "Only if it is in Latin", "No; verify current law and context"],
    correct: 2, explanation: "Etymology is a learning aid, not a substitute for jurisdiction-specific authority.",
    provenance: "Framework Module II · Etymology and three-dimensional translation"
  },
  {
    id: 3, roman: "III", title: "Temporal Mapping", focus: "Now · Next · Later · If–Then",
    lesson: "Map immediate obligations, likely next responses, later consequences and conditional alternatives. Separate a known deadline from one requiring verification; maintain a traceable source and applicable jurisdiction.",
    example: "An upcoming hearing may require a preparation step now and a transcript/order check afterward.",
    question: "Which temporal category is a contingency if the requested document is unavailable?",
    answers: ["If–Then", "Now", "Later"],
    correct: 0, explanation: "A conditional branch records what to do if a specified event occurs, without assuming it will occur.",
    provenance: "Framework Module III · Multiple time horizons"
  },
  {
    id: 4, roman: "IV", title: "Meticulous Investigation", focus: "Record · Inference · Missing evidence",
    lesson: "Compare the precise words, origin and timing of records. Mark what each source directly supports, which assertions are repeated from another source, and which expected records have not been located.",
    example: "Two summaries repeating the same unverified source are not two independent confirmations.",
    question: "Several summaries quote the same report. What is established?",
    answers: ["Independent confirmation from every summary", "The summaries repeated a claim; independence remains to be tested", "The claim is automatically false"],
    correct: 1, explanation: "Trace each assertion back to its earliest identifiable source before calling it independently corroborated.",
    provenance: "Framework Module IV · Anomaly and source-independence review"
  },
  {
    id: 5, roman: "V", title: "Risk Allocation Matrix", focus: "Severity · Reversibility · Options · Acceptability",
    lesson: "Assess risk in terms of potential harm, reversibility, loss of options and non-negotiable constraints. Record what is verified, what requires legal review and who is responsible for the decision.",
    example: "A proposed filing may protect one opportunity while creating a different procedural or disclosure risk.",
    question: "Which approach best supports a high-stakes decision?",
    answers: ["Ignore unlikely downside risks", "Use only short-term benefits", "Review downstream risks and required verification before choosing"],
    correct: 2, explanation: "Reason about both immediate and long-horizon consequences; do not treat a simulated exercise as approval to file.",
    provenance: "Framework Module V · Risk and sufficiency framework"
  },
  {
    id: 6, roman: "VI", title: "Adversarial Empathy", focus: "Capacity · Incentive · Documented intent",
    lesson: "Distinguish what an actor can do, what incentives may influence conduct and what evidence actually establishes intent. Explore alternative explanations and resist attributing motive without support.",
    example: "A policy may create institutional incentives, but does not by itself establish what one individual intended.",
    question: "Which item is strongest evidence of an actor's actual stated intent?",
    answers: ["An authenticated statement by that actor", "A hypothetical incentive", "The outcome alone"],
    correct: 0, explanation: "A direct, authenticated statement is stronger evidence of stated intent than inference from structural incentives or outcomes.",
    provenance: "Framework Module VI · Opponent modeling and motive discipline"
  },
  {
    id: 7, roman: "VII", title: "Live Hearing Simulator", focus: "Practice · Record accuracy · Post-hearing review",
    lesson: "Rehearse separating an objection, its factual basis and a request for a clear ruling. Practice with fictional events only. A simulated response does not preserve real rights or replace applicable legal advice.",
    example: "After a practice exchange, identify which statements are recorded, which need a transcript and what remains unresolved.",
    question: "Does completing a fictional courtroom exercise preserve a real objection?",
    answers: ["Always", "No; actual procedure must be followed in the real proceeding", "Only when the practice score is high"],
    correct: 1, explanation: "Educational simulation cannot perform or prove an action in court.",
    provenance: "Framework Module VII · Fictional hearing practice"
  },
  {
    id: 8, roman: "VIII", title: "Stewardship & Adaptation", focus: "Monitor · Tactical · Operational · Strategic",
    lesson: "Choose a proportionate response to new information. Log the signal, what changed, how certain the evidence is, the expected consequence and why an adjustment is justified.",
    example: "A minor formatting error may only require correction; a verified change in hearing date may alter preparation tasks.",
    question: "What should determine the depth of a strategy adjustment?",
    answers: ["How upsetting the news feels", "A fixed rule to change everything", "The documented significance and downstream effect of the change"],
    correct: 2, explanation: "Prefer the least disruptive adjustment that adequately responds to the actual change.",
    provenance: "Framework Module VIII · Response depth and teach-back records"
  },
  {
    id: 9, roman: "IX", title: "Red-Team Sandbox", focus: "Strongest counterargument · Disconfirmation",
    lesson: "Articulate the strongest reasonable counterargument to a hypothesis or strategy. Identify assumptions, missing evidence, procedural barriers and what information could change the conclusion.",
    example: "Before relying on an inferred notice defect, test whether other admissible proof of service exists.",
    question: "What is a productive red-team result?",
    answers: ["A more precise claim with unresolved weaknesses identified", "Automatic proof the first theory was correct", "A guarantee of winning"],
    correct: 0, explanation: "Adversarial testing improves the quality of decisions; it does not guarantee outcomes.",
    provenance: "Framework Module IX · Adversarial stress testing"
  },
  {
    id: 10, roman: "X", title: "Sui Juris Dossier", focus: "Evidence chain · Decision record · Next justified step",
    lesson: "Compile verified facts, disputed claims, source links, assumptions, risks, alternative explanations and decisions into a reviewable dossier. Label unverified work and preserve the original source separately.",
    example: "A dossier entry should point to its source, distinguish a proposed draft from a filed document and record the reviewer.",
    question: "Which description belongs in a reliable dossier?",
    answers: ["A hypothesis treated as a judicial finding", "A sourced statement with its verification and procedural status", "A missing source marked as verified"],
    correct: 1, explanation: "Keep source provenance, evidence status and procedural posture distinct.",
    provenance: "Framework Module X · Strategy dossier and traceability"
  }
]
