"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.protectedRoute = protectedRoute;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
async function register(req, res) {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res
                .status(400)
                .json({ message: "Nome, email e senha são obrigatórios" });
        }
        const existing = await User_1.User.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: "Email já registrado" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        await User_1.User.create({
            name,
            email,
            password: hashedPassword
        });
        return res.status(201).json({ message: "Usuário criado com sucesso" });
    }
    catch (error) {
        console.error("Erro no register:", error);
        return res.status(500).json({ message: "Erro interno no servidor" });
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Email e senha são obrigatórios" });
        }
        const user = await User_1.User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Credenciais inválidas" });
        }
        const validPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Credenciais inválidas" });
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("JWT_SECRET não definido no .env");
            return res
                .status(500)
                .json({ message: "Erro de configuração do servidor" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, secret, {
            expiresIn: "1h"
        });
        return res.json({
            message: "Autenticado com sucesso",
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    }
    catch (error) {
        console.error("Erro no login:", error);
        return res.status(500).json({ message: "Erro interno no servidor" });
    }
}
async function protectedRoute(req, res) {
    return res.json({ message: "Acesso autorizado" });
}
