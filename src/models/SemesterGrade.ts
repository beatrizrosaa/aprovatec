import mongoose, { Document, Schema } from "mongoose";

export interface ISemesterGrade extends Document {
  user: mongoose.Types.ObjectId;
  year: number;
  term: number;
  disciplines: IDiscipline[];
  average?: number | null;
  approved?: boolean | null;
}

export type DisciplineStatus =
  | "APROVADO"
  | "REPROVADO_NOTA"
  | "REPROVADO_FALTA"
  | "EM_RISCO"
  | "EM_ANDAMENTO";

export interface IDiscipline {
  name: string;
  workload: number;
  absences: number;
  av1?: number | null;
  av2?: number | null;
  av3?: number | null;
  edag?: number | null;
  average?: number | null;
  status?: DisciplineStatus;
  limitAbsences?: number;
  requiredScore?: number | null;
  maxAchievable?: number;
  missingAssessments?: string[];
}

const disciplineSchema = new Schema<IDiscipline>(
  {
    name: { type: String, required: true, trim: true },
    workload: { type: Number, required: true, min: 1 },
    absences: { type: Number, required: true, min: 0 },
    av1: { type: Number, required: false, min: 0, max: 10, default: null },
    av2: { type: Number, required: false, min: 0, max: 10, default: null },
    av3: { type: Number, required: false, min: 0, max: 10, default: null },
    edag: { type: Number, required: false, min: 0, max: 10, default: null },
    average: { type: Number, required: false, default: null },
    status: { type: String, required: false, default: "EM_ANDAMENTO" },
    limitAbsences: { type: Number, required: false, default: null },
    requiredScore: { type: Number, required: false, default: null },
    maxAchievable: { type: Number, required: false, default: null },
    missingAssessments: { type: [String], required: false, default: [] }
  },
  { _id: false }
);

const semesterGradeSchema = new Schema<ISemesterGrade>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    year: { type: Number, required: true },
    term: { type: Number, required: true },
    disciplines: { type: [disciplineSchema], required: true, default: [] },
    average: { type: Number, required: false, default: null },
    approved: { type: Boolean, required: false, default: null }
  },
  { timestamps: true }
);

export const SemesterGrade = mongoose.model<ISemesterGrade>(
  "SemesterGrade",
  semesterGradeSchema
);
