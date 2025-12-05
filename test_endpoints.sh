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

# 7. Testar endpoints de estatísticas e relatórios
echo ""
echo "=========================================="
echo "Testando Endpoints de Estatísticas e Relatórios"
echo "=========================================="
echo ""

# 7.1. Criar alguns semestres com disciplinas para testar
echo "7.1. Criando semestres de teste..."

# Semestre 1 - 2024, termo 1
SEMESTER1_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/grades" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2024,
    "term": 1,
    "disciplines": [
      {
        "name": "Matemática",
        "workload": 60,
        "absences": 5,
        "av1": 8.0,
        "av2": 7.5,
        "av3": 9.0,
        "edag": 8.5
      },
      {
        "name": "Física",
        "workload": 60,
        "absences": 3,
        "av1": 6.0,
        "av2": 7.0,
        "av3": 8.0,
        "edag": 7.5
      },
      {
        "name": "Química",
        "workload": 40,
        "absences": 2,
        "av1": 9.0,
        "av2": 8.5,
        "av3": 9.5,
        "edag": 9.0
      }
    ]
  }')

SEMESTER1_HTTP_CODE=$(echo "$SEMESTER1_RESPONSE" | tail -n1)
if [ "$SEMESTER1_HTTP_CODE" -eq 201 ]; then
    print_success "Semestre 1 criado com sucesso"
    SEMESTER1_ID=$(echo "$SEMESTER1_RESPONSE" | sed '$d' | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
else
    print_error "Falha ao criar semestre 1: HTTP $SEMESTER1_HTTP_CODE"
    echo "Resposta: $(echo "$SEMESTER1_RESPONSE" | sed '$d')"
fi

# Semestre 2 - 2023, termo 2
SEMESTER2_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/grades" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2023,
    "term": 2,
    "disciplines": [
      {
        "name": "Programação",
        "workload": 80,
        "absences": 4,
        "av1": 7.0,
        "av2": 8.0,
        "av3": 7.5,
        "edag": 8.0
      },
      {
        "name": "Banco de Dados",
        "workload": 60,
        "absences": 1,
        "av1": 9.5,
        "av2": 9.0,
        "av3": 9.5,
        "edag": 9.5
      },
      {
        "name": "Algoritmos",
        "workload": 60,
        "absences": 6,
        "av1": 5.0,
        "av2": 6.0,
        "av3": 5.5,
        "edag": 6.0
      }
    ]
  }')

SEMESTER2_HTTP_CODE=$(echo "$SEMESTER2_RESPONSE" | tail -n1)
if [ "$SEMESTER2_HTTP_CODE" -eq 201 ]; then
    print_success "Semestre 2 criado com sucesso"
else
    print_error "Falha ao criar semestre 2: HTTP $SEMESTER2_HTTP_CODE"
    echo "Resposta: $(echo "$SEMESTER2_RESPONSE" | sed '$d')"
fi

echo ""

# 7.2. Testar GET /grades/stats
echo "7.2. Testando GET /grades/stats..."
STATS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/grades/stats" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

STATS_HTTP_CODE=$(echo "$STATS_RESPONSE" | tail -n1)
STATS_BODY=$(echo "$STATS_RESPONSE" | sed '$d')

if [ "$STATS_HTTP_CODE" -eq 200 ]; then
    print_success "GET /grades/stats funcionando!"
    echo "Resposta: $STATS_BODY"
    
    # Verificar se os campos esperados estão presentes
    if echo "$STATS_BODY" | grep -q "overallAverage"; then
        print_success "Campo 'overallAverage' presente"
    else
        print_error "Campo 'overallAverage' não encontrado"
    fi
    
    if echo "$STATS_BODY" | grep -q "totalDisciplines"; then
        print_success "Campo 'totalDisciplines' presente"
    else
        print_error "Campo 'totalDisciplines' não encontrado"
    fi
    
    if echo "$STATS_BODY" | grep -q "approvalRate"; then
        print_success "Campo 'approvalRate' presente"
    else
        print_error "Campo 'approvalRate' não encontrado"
    fi
else
    print_error "GET /grades/stats falhou: HTTP $STATS_HTTP_CODE"
    echo "Resposta: $STATS_BODY"
fi
echo ""

# 7.3. Testar GET /grades/summary
echo "7.3. Testando GET /grades/summary..."
SUMMARY_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/grades/summary" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

SUMMARY_HTTP_CODE=$(echo "$SUMMARY_RESPONSE" | tail -n1)
SUMMARY_BODY=$(echo "$SUMMARY_RESPONSE" | sed '$d')

if [ "$SUMMARY_HTTP_CODE" -eq 200 ]; then
    print_success "GET /grades/summary funcionando!"
    echo "Resposta: $SUMMARY_BODY"
    
    # Verificar se os campos esperados estão presentes
    if echo "$SUMMARY_BODY" | grep -q "summary"; then
        print_success "Campo 'summary' presente"
    else
        print_error "Campo 'summary' não encontrado"
    fi
    
    if echo "$SUMMARY_BODY" | grep -q "year"; then
        print_success "Campo 'year' presente no resumo"
    else
        print_error "Campo 'year' não encontrado no resumo"
    fi
    
    if echo "$SUMMARY_BODY" | grep -q "semesterAverage"; then
        print_success "Campo 'semesterAverage' presente no resumo"
    else
        print_error "Campo 'semesterAverage' não encontrado no resumo"
    fi
else
    print_error "GET /grades/summary falhou: HTTP $SUMMARY_HTTP_CODE"
    echo "Resposta: $SUMMARY_BODY"
fi
echo ""

# 7.4. Testar GET /grades/stats sem token
echo "7.4. Testando GET /grades/stats sem token (deve retornar 401)..."
NO_TOKEN_STATS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/grades/stats" \
  -H "Content-Type: application/json")
NO_TOKEN_STATS_HTTP_CODE=$(echo "$NO_TOKEN_STATS_RESPONSE" | tail -n1)
if [ "$NO_TOKEN_STATS_HTTP_CODE" -eq 401 ]; then
    print_success "Autenticação obrigatória funcionando para /grades/stats!"
else
    print_error "Falha na validação de autenticação: HTTP $NO_TOKEN_STATS_HTTP_CODE"
fi

# 7.5. Testar GET /grades/summary sem token
echo ""
echo "7.5. Testando GET /grades/summary sem token (deve retornar 401)..."
NO_TOKEN_SUMMARY_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/grades/summary" \
  -H "Content-Type: application/json")
NO_TOKEN_SUMMARY_HTTP_CODE=$(echo "$NO_TOKEN_SUMMARY_RESPONSE" | tail -n1)
if [ "$NO_TOKEN_SUMMARY_HTTP_CODE" -eq 401 ]; then
    print_success "Autenticação obrigatória funcionando para /grades/summary!"
else
    print_error "Falha na validação de autenticação: HTTP $NO_TOKEN_SUMMARY_HTTP_CODE"
fi

echo ""
echo "=========================================="
echo "Testes concluídos!"
echo "=========================================="

