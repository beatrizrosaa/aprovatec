// src/authMiddleware.ts

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from './types';

// A chave secreta deve ser uma variável de ambiente!
const JWT_SECRET = 'sua_chave_secreta_muito_forte'; 

// O tipo do payload do nosso token
interface JwtPayload {
    userId: number;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Response | void {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
    }

    try {
        // Tipa o resultado da verificação
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        
        // Adiciona o userId tipado à requisição
        req.userId = decoded.userId; 
        
        next();
    } catch (error) {
        // Tratamento de erro de verificação de token
        return res.status(403).json({ message: 'Token inválido ou expirado.' });
    }
}