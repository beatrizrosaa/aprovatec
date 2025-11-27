import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { SemesterGrade } from "../models/SemesterGrade";
import { evaluateSemester } from "../services/gradeService";

export async function listSemesters(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const userId = req.userId;
    const semesters = await SemesterGrade.find({ user: userId }).sort({
      year: -1,
      term: -1
    });
    return res.json(semesters);
  } catch (error) {
    console.error("Erro ao listar semestres:", error);
    return res.status(500).json({ message: "Erro ao listar semestres" });
  }
}

export async function createSemester(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const userId = req.userId;
    const { year, term, disciplines } = req.body as {
      year?: number;
      term?: number;
      disciplines?: any[];
    };

    if (year === undefined || term === undefined) {
      return res
        .status(400)
        .json({ message: "Os campos year e term são obrigatórios" });
    }

    if (!Array.isArray(disciplines) || disciplines.length === 0) {
      return res
        .status(400)
        .json({ message: "Informe ao menos uma disciplina com suas informações" });
    }

    const sanitized = disciplines.map((disc) => ({
      name: disc.name,
      workload: Number(disc.workload),
      absences: Math.max(0, Number(disc.absences ?? 0)),
      av1: disc.av1 ?? null,
      av2: disc.av2 ?? null,
      av3: disc.av3 ?? null,
      edag: disc.edag ?? null
    }));

    const hasInvalid = sanitized.some(
      (disc) => !disc.name || Number.isNaN(disc.workload) || disc.workload <= 0
    );
    if (hasInvalid) {
      return res
        .status(400)
        .json({ message: "Preencha nome e carga horária válida para todas as disciplinas" });
    }

    const { evaluated, average, approved } = evaluateSemester(sanitized);

    const semester = await SemesterGrade.create({
      user: userId,
      year,
      term,
      disciplines: evaluated,
      average,
      approved
    });

    return res.status(201).json(semester);
  } catch (error) {
    console.error("Erro ao criar semestre:", error);
    return res.status(500).json({ message: "Erro ao criar semestre" });
  }
}

export async function updateSemester(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { year, term, disciplines } = req.body as {
      year?: number;
      term?: number;
      disciplines?: any[];
    };

    const semester = await SemesterGrade.findOne({ _id: id, user: userId });
    if (!semester) {
      return res.status(404).json({ message: "Semestre não encontrado" });
    }

    if (year !== undefined) semester.year = year;
    if (term !== undefined) semester.term = term;
    if (disciplines !== undefined) {
      if (!Array.isArray(disciplines) || disciplines.length === 0) {
        return res
          .status(400)
          .json({ message: "Disciplines precisa ser uma lista com ao menos um item" });
      }
      const sanitized = disciplines.map((disc) => ({
        name: disc.name,
        workload: Number(disc.workload),
        absences: Math.max(0, Number(disc.absences ?? 0)),
        av1: disc.av1 ?? null,
        av2: disc.av2 ?? null,
        av3: disc.av3 ?? null,
        edag: disc.edag ?? null
      }));
      const hasInvalid = sanitized.some(
        (disc) => !disc.name || Number.isNaN(disc.workload) || disc.workload <= 0
      );
      if (hasInvalid) {
        return res
          .status(400)
          .json({ message: "Preencha nome e carga horária válida para todas as disciplinas" });
      }
      const { evaluated, average, approved } = evaluateSemester(sanitized);
      semester.disciplines = evaluated;
      semester.average = average;
      semester.approved = approved;
    }

    await semester.save();

    return res.json(semester);
  } catch (error) {
    console.error("Erro ao atualizar semestre:", error);
    return res.status(500).json({ message: "Erro ao atualizar semestre" });
  }
}

export async function deleteSemester(
  req: AuthRequest,
  res: Response
): Promise<Response> {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const semester = await SemesterGrade.findOneAndDelete({
      _id: id,
      user: userId
    });

    if (!semester) {
      return res.status(404).json({ message: "Semestre não encontrado" });
    }

    return res.json({ message: "Semestre removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover semestre:", error);
    return res.status(500).json({ message: "Erro ao remover semestre" });
  }
}
