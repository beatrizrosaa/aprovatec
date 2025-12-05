#!/bin/bash

BASE_URL="http://localhost:3000"
EMAIL="teste_profile_$(date +%s)@test.com"
PASSWORD="senha123"
NEW_PASSWORD="novaSenha456"

echo "=========================================="
echo "Testando Endpoints de Perfil do Usuário"
echo "=========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para fazer print colorido
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# 1. Registrar usuário
echo "1. Registrando novo usuário..."
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Usuario Teste\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 409 ]; then
    if [ "$HTTP_CODE" -eq 409 ]; then
        print_info "Usuário já existe, fazendo login..."
        # Se já existe, fazer login
        LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
          -H "Content-Type: application/json" \
          -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    else
        print_success "Usuário registrado com sucesso"
        # Fazer login para obter token
        echo ""
        echo "2. Fazendo login..."
        LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
          -H "Content-Type: application/json" \
          -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    fi
else
    print_error "Erro ao registrar: HTTP $HTTP_CODE"
    echo "Resposta: $BODY"
    exit 1
fi

if [ -z "$TOKEN" ]; then
    print_error "Falha ao obter token de autenticação"
    echo "Resposta do login: $LOGIN_RESPONSE"
    exit 1
fi

print_success "Token obtido: ${TOKEN:0:20}..."
echo ""

# 3. Testar GET /auth/profile
echo "3. Testando GET /auth/profile..."
PROFILE_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

PROFILE_HTTP_CODE=$(echo "$PROFILE_RESPONSE" | tail -n1)
PROFILE_BODY=$(echo "$PROFILE_RESPONSE" | sed '$d')

if [ "$PROFILE_HTTP_CODE" -eq 200 ]; then
    print_success "GET /auth/profile funcionando!"
    echo "Resposta: $PROFILE_BODY"
else
    print_error "GET /auth/profile falhou: HTTP $PROFILE_HTTP_CODE"
    echo "Resposta: $PROFILE_BODY"
    exit 1
fi
echo ""

# 4. Testar PUT /auth/profile
echo "4. Testando PUT /auth/profile (atualizando nome e email)..."
NEW_NAME="Usuario Atualizado"
NEW_EMAIL="atualizado_$(date +%s)@test.com"

UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$NEW_NAME\",\"email\":\"$NEW_EMAIL\"}")

UPDATE_HTTP_CODE=$(echo "$UPDATE_RESPONSE" | tail -n1)
UPDATE_BODY=$(echo "$UPDATE_RESPONSE" | sed '$d')

if [ "$UPDATE_HTTP_CODE" -eq 200 ]; then
    print_success "PUT /auth/profile funcionando!"
    echo "Resposta: $UPDATE_BODY"
    
    # Verificar se os dados foram atualizados
    echo ""
    echo "4.1. Verificando se os dados foram atualizados (GET /auth/profile)..."
    VERIFY_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/profile" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json")
    
    if echo "$VERIFY_RESPONSE" | grep -q "$NEW_NAME"; then
        print_success "Nome atualizado corretamente!"
    else
        print_error "Nome não foi atualizado corretamente"
    fi
    
    if echo "$VERIFY_RESPONSE" | grep -q "$NEW_EMAIL"; then
        print_success "Email atualizado corretamente!"
    else
        print_error "Email não foi atualizado corretamente"
    fi
else
    print_error "PUT /auth/profile falhou: HTTP $UPDATE_HTTP_CODE"
    echo "Resposta: $UPDATE_BODY"
    exit 1
fi
echo ""

# 5. Testar PUT /auth/password
echo "5. Testando PUT /auth/password (alterando senha)..."
PASSWORD_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/auth/password" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"currentPassword\":\"$PASSWORD\",\"newPassword\":\"$NEW_PASSWORD\"}")

PASSWORD_HTTP_CODE=$(echo "$PASSWORD_RESPONSE" | tail -n1)
PASSWORD_BODY=$(echo "$PASSWORD_RESPONSE" | sed '$d')

if [ "$PASSWORD_HTTP_CODE" -eq 200 ]; then
    print_success "PUT /auth/password funcionando!"
    echo "Resposta: $PASSWORD_BODY"
    
    # Verificar se a senha foi alterada fazendo login com a nova senha
    echo ""
    echo "5.1. Verificando se a senha foi alterada (tentando login com nova senha)..."
    NEW_LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$NEW_EMAIL\",\"password\":\"$NEW_PASSWORD\"}")
    
    NEW_LOGIN_HTTP_CODE=$(echo "$NEW_LOGIN_RESPONSE" | tail -n1)
    NEW_LOGIN_BODY=$(echo "$NEW_LOGIN_RESPONSE" | sed '$d')
    
    if [ "$NEW_LOGIN_HTTP_CODE" -eq 200 ]; then
        print_success "Senha alterada corretamente! Login com nova senha funcionou!"
    else
        print_error "Senha não foi alterada corretamente. Login falhou: HTTP $NEW_LOGIN_HTTP_CODE"
        echo "Resposta: $NEW_LOGIN_BODY"
    fi
    
    # Tentar login com senha antiga (deve falhar)
    echo ""
    echo "5.2. Verificando que senha antiga não funciona mais..."
    OLD_LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$NEW_EMAIL\",\"password\":\"$PASSWORD\"}")
    
    OLD_LOGIN_HTTP_CODE=$(echo "$OLD_LOGIN_RESPONSE" | tail -n1)
    
    if [ "$OLD_LOGIN_HTTP_CODE" -eq 401 ]; then
        print_success "Senha antiga corretamente rejeitada!"
    else
        print_error "Senha antiga ainda funciona (não deveria)! HTTP $OLD_LOGIN_HTTP_CODE"
    fi
else
    print_error "PUT /auth/password falhou: HTTP $PASSWORD_HTTP_CODE"
    echo "Resposta: $PASSWORD_BODY"
    exit 1
fi
echo ""

# 6. Testar casos de erro
echo "6. Testando casos de erro..."

# 6.1. GET /auth/profile sem token
echo "6.1. GET /auth/profile sem token (deve retornar 401)..."
NO_TOKEN_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/auth/profile" \
  -H "Content-Type: application/json")
NO_TOKEN_HTTP_CODE=$(echo "$NO_TOKEN_RESPONSE" | tail -n1)
if [ "$NO_TOKEN_HTTP_CODE" -eq 401 ]; then
    print_success "Autenticação obrigatória funcionando!"
else
    print_error "Falha na validação de autenticação: HTTP $NO_TOKEN_HTTP_CODE"
fi

# 6.2. PUT /auth/profile com email inválido
echo ""
echo "6.2. PUT /auth/profile com email inválido (deve retornar 400)..."
INVALID_EMAIL_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"email_invalido\"}")
INVALID_EMAIL_HTTP_CODE=$(echo "$INVALID_EMAIL_RESPONSE" | tail -n1)
if [ "$INVALID_EMAIL_HTTP_CODE" -eq 400 ]; then
    print_success "Validação de email funcionando!"
else
    print_error "Validação de email falhou: HTTP $INVALID_EMAIL_HTTP_CODE"
fi

# 6.3. PUT /auth/password com senha atual incorreta
echo ""
echo "6.3. PUT /auth/password com senha atual incorreta (deve retornar 400)..."
WRONG_PASSWORD_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/auth/password" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"currentPassword\":\"senha_errada\",\"newPassword\":\"nova123\"}")
WRONG_PASSWORD_HTTP_CODE=$(echo "$WRONG_PASSWORD_RESPONSE" | tail -n1)
if [ "$WRONG_PASSWORD_HTTP_CODE" -eq 400 ]; then
    print_success "Validação de senha atual funcionando!"
else
    print_error "Validação de senha atual falhou: HTTP $WRONG_PASSWORD_HTTP_CODE"
fi

echo ""
echo "=========================================="
echo "Testes concluídos!"
echo "=========================================="

