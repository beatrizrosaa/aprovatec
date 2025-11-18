// src/types.ts

import { Request } from 'express';

// Interface do Objeto de Usuário (excluindo a senha para segurança na maioria dos casos)
export interface User {
    id: number;
    email: string;
    password: string; // Incluída aqui apenas para o modelo de DB
}

// Estendendo o objeto Request do Express para incluir o userId após a autenticação
export interface AuthenticatedRequest extends Request {
    userId?: number;
}