// src/server.ts

import express, { Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { authMiddleware } from './authMiddleware';
import { User, AuthenticatedRequest } from './types';

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, '..', 'db.json'); // Ajuste o path
const JWT_SECRET = 'sua_chave_secreta_muito_forte';

app.use(cors());
app.use(express.json());

// --- Funções Auxiliares (Tipadas) ---

async function readDB(): Promise<{ users: User[] }> {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
}

async function writeDB(data: { users: User[] }): Promise<void> {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// --- ROTAS DE AUTENTICAÇÃO ---

// 1. Rota de Cadastro
app.post('/cadastro', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        const db = await readDB();
        
        if (db.users.find(u => u.email === email)) {
            return res.status(409).json({ message: 'Email já cadastrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser: User = {
            id: Date.now(),
            email,
            password: hashedPassword 
        };

        db.users.push(newUser);
        await writeDB(db);

        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// 2. Rota de Login
app.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    // ... (Validação e Busca omitidas por brevidade - similar ao JS)

    try {
        const db = await readDB();
        const user = db.users.find(u => u.email === email);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        // Gera o token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, message: 'Login realizado com sucesso!', userId: user.id });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// 3. Rota Protegida (Usando o tipo AuthenticatedRequest)
app.get('/meu-perfil', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    // req.userId é garantido pelo middleware e é do tipo number (ou undefined, se falhar)
    
    if (!req.userId) {
        // Isso não deve acontecer se o middleware funcionar, mas é um fallback de segurança do TS
        return res.status(401).json({ message: 'Usuário não autenticado.' }); 
    }
    
    res.json({ 
        message: 'Bem-vindo à página inicial!',
        data: `Seu ID de usuário autenticado é: ${req.userId}`
    });
});


app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});