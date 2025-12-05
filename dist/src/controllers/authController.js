"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.protectedRoute = protectedRoute;
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
exports.changePassword = changePassword;
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
async function getProfile(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }
        return res.json({
            id: user._id,
            name: user.name,
            email: user.email
        });
    }
    catch (error) {
        console.error("Erro no getProfile:", error);
        return res.status(500).json({ message: "Erro interno no servidor" });
    }
}
async function updateProfile(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        const { name, email } = req.body;
        if (!name && !email) {
            return res
                .status(400)
                .json({ message: "Pelo menos um campo (name ou email) deve ser enviado" });
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }
        // Validar formato de email se fornecido
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: "Formato de email inválido" });
            }
            // Verificar se o email já está em uso por outro usuário
            const existingUser = await User_1.User.findOne({ email, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(409).json({ message: "Email já está em uso" });
            }
        }
        // Atualizar apenas os campos fornecidos
        if (name)
            user.name = name;
        if (email)
            user.email = email;
        await user.save();
        return res.json({
            message: "Perfil atualizado com sucesso",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    }
    catch (error) {
        console.error("Erro no updateProfile:", error);
        return res.status(500).json({ message: "Erro interno no servidor" });
    }
}
async function changePassword(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res
                .status(400)
                .json({ message: "Senha atual e nova senha são obrigatórias" });
        }
        if (newPassword.length < 6) {
            return res
                .status(400)
                .json({ message: "A nova senha deve ter no mínimo 6 caracteres" });
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }
        // Validar senha atual
        const validPassword = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: "Senha atual incorreta" });
        }
        // Hash da nova senha
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        return res.json({ message: "Senha alterada com sucesso" });
    }
    catch (error) {
        console.error("Erro no changePassword:", error);
        return res.status(500).json({ message: "Erro interno no servidor" });
    }
}
