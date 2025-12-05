"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSemesters = listSemesters;
exports.createSemester = createSemester;
exports.updateSemester = updateSemester;
exports.deleteSemester = deleteSemester;
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
        // Invalida o cache de semestres do usuário
        await (0, cacheService_1.deleteCachePattern)(`semesters:${userId}*`);
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
        // Invalida o cache de semestres do usuário
        await (0, cacheService_1.deleteCachePattern)(`semesters:${userId}*`);
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
        // Invalida o cache de semestres do usuário
        await (0, cacheService_1.deleteCachePattern)(`semesters:${userId}*`);
        return res.json({ message: "Semestre removido com sucesso" });
    }
    catch (error) {
        console.error("Erro ao remover semestre:", error);
        return res.status(500).json({ message: "Erro ao remover semestre" });
    }
}
