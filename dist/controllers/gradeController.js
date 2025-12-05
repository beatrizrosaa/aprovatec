"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSemesters = listSemesters;
exports.createSemester = createSemester;
exports.updateSemester = updateSemester;
exports.deleteSemester = deleteSemester;
exports.getStats = getStats;
exports.getSummary = getSummary;
const SemesterGrade_1 = require("../models/SemesterGrade");
const gradeService_1 = require("../services/gradeService");
const cacheService_1 = require("../services/cacheService");
async function listSemesters(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        const cacheKey = (0, cacheService_1.getCacheKey)("semesters", userId);
        // Tenta buscar do cache primeiro
        const cached = await (0, cacheService_1.getCache)(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        // Se não estiver em cache, busca do banco
        const semesters = await SemesterGrade_1.SemesterGrade.find({ user: userId }).sort({
            year: -1,
            term: -1
        });
        // Salva no cache
        await (0, cacheService_1.setCache)(cacheKey, semesters);
        return res.json(semesters);
    }
    catch (error) {
        console.error("Erro ao listar semestres:", error);
        return res.status(500).json({ message: "Erro ao listar semestres" });
    }
}
async function createSemester(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        const { year, term, disciplines } = req.body;
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
        const hasInvalid = sanitized.some((disc) => !disc.name || Number.isNaN(disc.workload) || disc.workload <= 0);
        if (hasInvalid) {
            return res
                .status(400)
                .json({ message: "Preencha nome e carga horária válida para todas as disciplinas" });
        }
        const { evaluated, average, approved } = (0, gradeService_1.evaluateSemester)(sanitized);
        const semester = await SemesterGrade_1.SemesterGrade.create({
            user: userId,
            year,
            term,
            disciplines: evaluated,
            average,
            approved
        });
        // Invalida o cache de semestres, stats e summary do usuário
        await (0, cacheService_1.deleteCachePattern)(`semesters:${userId}*`);
        await (0, cacheService_1.deleteCachePattern)(`stats:${userId}*`);
        await (0, cacheService_1.deleteCachePattern)(`summary:${userId}*`);
        return res.status(201).json(semester);
    }
    catch (error) {
        console.error("Erro ao criar semestre:", error);
        return res.status(500).json({ message: "Erro ao criar semestre" });
    }
}
async function updateSemester(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        const { id } = req.params;
        const { year, term, disciplines } = req.body;
        const semester = await SemesterGrade_1.SemesterGrade.findOne({ _id: id, user: userId });
        if (!semester) {
            return res.status(404).json({ message: "Semestre não encontrado" });
        }
        if (year !== undefined)
            semester.year = year;
        if (term !== undefined)
            semester.term = term;
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
            const hasInvalid = sanitized.some((disc) => !disc.name || Number.isNaN(disc.workload) || disc.workload <= 0);
            if (hasInvalid) {
                return res
                    .status(400)
                    .json({ message: "Preencha nome e carga horária válida para todas as disciplinas" });
            }
            const { evaluated, average, approved } = (0, gradeService_1.evaluateSemester)(sanitized);
            semester.disciplines = evaluated;
            semester.average = average;
            semester.approved = approved;
        }
        await semester.save();
        // Invalida o cache de semestres, stats e summary do usuário
        await (0, cacheService_1.deleteCachePattern)(`semesters:${userId}*`);
        await (0, cacheService_1.deleteCachePattern)(`stats:${userId}*`);
        await (0, cacheService_1.deleteCachePattern)(`summary:${userId}*`);
        return res.json(semester);
    }
    catch (error) {
        console.error("Erro ao atualizar semestre:", error);
        return res.status(500).json({ message: "Erro ao atualizar semestre" });
    }
}
async function deleteSemester(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        const { id } = req.params;
        const semester = await SemesterGrade_1.SemesterGrade.findOneAndDelete({
            _id: id,
            user: userId
        });
        if (!semester) {
            return res.status(404).json({ message: "Semestre não encontrado" });
        }
        // Invalida o cache de semestres, stats e summary do usuário
        await (0, cacheService_1.deleteCachePattern)(`semesters:${userId}*`);
        await (0, cacheService_1.deleteCachePattern)(`stats:${userId}*`);
        await (0, cacheService_1.deleteCachePattern)(`summary:${userId}*`);
        return res.json({ message: "Semestre removido com sucesso" });
    }
    catch (error) {
        console.error("Erro ao remover semestre:", error);
        return res.status(500).json({ message: "Erro ao remover semestre" });
    }
}
async function getStats(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        const cacheKey = (0, cacheService_1.getCacheKey)("stats", userId);
        // Tenta buscar do cache primeiro
        const cached = await (0, cacheService_1.getCache)(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        // Busca todos os semestres do usuário
        const semesters = await SemesterGrade_1.SemesterGrade.find({ user: userId });
        // Coleta todas as disciplinas de todos os semestres
        const allDisciplines = semesters.flatMap((semester) => semester.disciplines);
        // Calcula estatísticas
        const totalDisciplines = allDisciplines.length;
        // Disciplinas com média calculada (para média geral)
        const disciplinesWithAverage = allDisciplines.filter((d) => d.average !== null && d.average !== undefined);
        // Calcula média geral ponderada por carga horária
        let overallAverage = null;
        if (disciplinesWithAverage.length > 0) {
            const totalWorkload = disciplinesWithAverage.reduce((sum, d) => sum + d.workload, 0);
            const weightedSum = disciplinesWithAverage.reduce((sum, d) => sum + d.average * d.workload, 0);
            overallAverage =
                totalWorkload > 0
                    ? Number((weightedSum / totalWorkload).toFixed(2))
                    : null;
        }
        // Conta disciplinas por status
        const approvedCount = allDisciplines.filter((d) => d.status === "APROVADO").length;
        const failedCount = allDisciplines.filter((d) => d.status === "REPROVADO_NOTA" || d.status === "REPROVADO_FALTA").length;
        const inProgressCount = allDisciplines.filter((d) => d.status === "EM_ANDAMENTO" || d.status === "EM_RISCO").length;
        // Calcula taxa de aprovação (apenas disciplinas finalizadas)
        const finalizedCount = approvedCount + failedCount;
        const approvalRate = finalizedCount > 0
            ? Number((approvedCount / finalizedCount).toFixed(2))
            : 0;
        const stats = {
            overallAverage,
            totalDisciplines,
            approvalRate,
            totalApproved: approvedCount,
            totalFailed: failedCount,
            totalInProgress: inProgressCount
        };
        // Salva no cache
        await (0, cacheService_1.setCache)(cacheKey, stats);
        return res.json(stats);
    }
    catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
        return res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
}
async function getSummary(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        const cacheKey = (0, cacheService_1.getCacheKey)("summary", userId);
        // Tenta buscar do cache primeiro
        const cached = await (0, cacheService_1.getCache)(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        // Busca todos os semestres do usuário ordenados por ano e termo
        const semesters = await SemesterGrade_1.SemesterGrade.find({ user: userId }).sort({
            year: -1,
            term: -1
        });
        // Cria resumo por semestre
        const summary = semesters.map((semester) => {
            const disciplines = semester.disciplines;
            const approvedCount = disciplines.filter((d) => d.status === "APROVADO").length;
            const failedCount = disciplines.filter((d) => d.status === "REPROVADO_NOTA" || d.status === "REPROVADO_FALTA").length;
            const inProgressCount = disciplines.filter((d) => d.status === "EM_ANDAMENTO" || d.status === "EM_RISCO").length;
            return {
                year: semester.year,
                term: semester.term,
                semesterAverage: semester.average,
                totalDisciplines: disciplines.length,
                approvedCount,
                failedCount,
                inProgressCount
            };
        });
        const result = { summary };
        // Salva no cache
        await (0, cacheService_1.setCache)(cacheKey, result);
        return res.json(result);
    }
    catch (error) {
        console.error("Erro ao buscar resumo:", error);
        return res.status(500).json({ message: "Erro ao buscar resumo" });
    }
}
