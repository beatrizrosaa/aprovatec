import { DisciplineStatus, IDiscipline } from "../models/SemesterGrade";

const GRADE_WEIGHTS: Record<"av1" | "av2" | "av3" | "edag", number> = {
  av1: 0.25,
  av2: 0.25,
  av3: 0.3,
  edag: 0.2
};

export interface GradeCalculation {
  average: number | null;
  approved: boolean | null;
}

export interface DisciplineEvaluation extends IDiscipline {
  status: DisciplineStatus;
  average: number | null;
  requiredScore: number | null;
  maxAchievable: number;
  missingAssessments: string[];
  limitAbsences: number;
}

function requiredScoreForApproval(weightedSum: number, missingWeight: number) {
  if (missingWeight <= 0) return null;
  return (7 - weightedSum) / missingWeight;
}

export function evaluateDiscipline(discipline: IDiscipline): DisciplineEvaluation {
  const missingAssessments: string[] = [];
  let weightedSum = 0;
  let filledWeight = 0;

  (["av1", "av2", "av3", "edag"] as const).forEach((key) => {
    const grade = discipline[key];
    const weight = GRADE_WEIGHTS[key];
    if (typeof grade === "number" && !Number.isNaN(grade)) {
      weightedSum += grade * weight;
      filledWeight += weight;
    } else {
      missingAssessments.push(key.toUpperCase());
    }
  });

  const limitAbsences = Number((discipline.workload * 0.25).toFixed(2));
  const missingWeight = 1 - filledWeight;
  const hasAllGrades = missingWeight <= 0;
  const average = hasAllGrades ? Number(weightedSum.toFixed(2)) : null;
  const requiredScore = hasAllGrades
    ? null
    : Number(Math.max(0, requiredScoreForApproval(weightedSum, missingWeight) || 0).toFixed(2));
  const maxAchievable = Number(
    (weightedSum + Math.max(missingWeight, 0) * 10).toFixed(2)
  );

  const absenceRisk = discipline.absences >= limitAbsences * 0.8;
  const reprovFalta = discipline.absences > limitAbsences;
  const partialAverage =
    filledWeight > 0 ? Number((weightedSum / filledWeight).toFixed(2)) : null;

  let status: DisciplineStatus = "EM_ANDAMENTO";

  if (reprovFalta) {
    status = "REPROVADO_FALTA";
  } else if (average !== null) {
    status = average >= 7 ? "APROVADO" : "REPROVADO_NOTA";
  } else {
    const riskNota =
      (requiredScore !== null && requiredScore >= 7) ||
      (partialAverage !== null && partialAverage < 7);
    if (absenceRisk || riskNota) {
      status = "EM_RISCO";
    }
  }

  return {
    ...discipline,
    average,
    status,
    requiredScore,
    maxAchievable,
    missingAssessments,
    limitAbsences
  };
}

export function evaluateSemester(disciplines: IDiscipline[]) {
  const evaluated = disciplines.map(evaluateDiscipline);
  const averages = evaluated
    .map((d) => ({ avg: d.average, workload: d.workload }))
    .filter((d) => d.avg !== null);

  const totalWorkload = averages.reduce((acc, cur) => acc + cur.workload, 0);
  const weightedAverage =
    totalWorkload > 0
      ? averages.reduce((acc, cur) => acc + (cur.avg as number) * cur.workload, 0) /
        totalWorkload
      : null;

  const average =
    weightedAverage !== null && !Number.isNaN(weightedAverage)
      ? Number(weightedAverage.toFixed(2))
      : null;

  const hasReprovFalta = evaluated.some((d) => d.status === "REPROVADO_FALTA");
  const hasReprovNota = evaluated.some((d) => d.status === "REPROVADO_NOTA");
  const allApproved =
    evaluated.length > 0 && evaluated.every((d) => d.status === "APROVADO");

  let approved: boolean | null = null;
  if (allApproved) approved = true;
  else if (hasReprovFalta || hasReprovNota) approved = false;

  return { evaluated, average, approved };
}
