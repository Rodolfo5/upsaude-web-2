# SendPulse - Integração de Email

Este módulo fornece integração completa com a API do SendPulse para envio de emails transacionais.

## Configuração

### Variáveis de Ambiente

Adicione as seguintes variáveis ao arquivo `.env`:

```env
SENDPULSE_CLIENT_ID=seu_client_id
SENDPULSE_CLIENT_SECRET=seu_client_secret
SENDPULSE_FROM_EMAIL=seu_email@dominio.com
SENDPULSE_FROM_NAME=Seu Nome ou Empresa
```

### Obtendo Credenciais

1. Acesse [SendPulse](https://sendpulse.com/)
2. Faça login na sua conta
3. Vá em **Configurações** → **API**
4. Crie um novo aplicativo ou use um existente
5. Copie o **Client ID** e **Client Secret**

## Uso Básico

### Enviando Email Simples

```typescript
import { createSendPulseClient } from '@/lib/sendpulse'

// Cria o cliente (usa variáveis de ambiente automaticamente)
const client = createSendPulseClient()

// Envia um email simples
await client.sendSimpleEmail(
  'usuario@example.com',
  'Bem-vindo!',
  '<h1>Olá!</h1><p>Bem-vindo ao Upsaude!</p>',
  'João Silva' // nome opcional
)
```

### Enviando Email Completo

```typescript
import { createSendPulseClient } from '@/lib/sendpulse'

const client = createSendPulseClient()

await client.sendEmail({
  to: [
    { email: 'usuario1@example.com', name: 'João Silva' },
    { email: 'usuario2@example.com', name: 'Maria Santos' }
  ],
  subject: 'Notificação Importante',
  html: '<h1>Conteúdo HTML</h1>',
  text: 'Versão texto alternativa',
  cc: [{ email: 'gerente@example.com', name: 'Gerente' }],
  bcc: [{ email: 'auditoria@example.com' }],
  replyTo: 'suporte@example.com'
})
```

## Uso com React Email

O sistema já está integrado com React Email para templates:

```typescript
import { render } from '@react-email/components'
import { createSendPulseClient } from '@/lib/sendpulse'
import PatientWelcomeEmail from '@/app/api/email/template/patient-welcome'

// Renderiza o template
const emailHTML = await render(
  PatientWelcomeEmail({
    name: 'João Silva',
    email: 'joao@example.com',
    password: 'senha123'
  })
)

// Envia o email
const client = createSendPulseClient()
await client.sendSimpleEmail(
  'joao@example.com',
  'Bem-vindo ao Upsaude!',
  emailHTML,
  'João Silva'
)
```

## API Interna

O projeto já possui uma rota API configurada em `/api/email` que usa o SendPulse.

### Exemplo de Uso da API

```typescript
// No frontend ou em qualquer função
const response = await fetch('/api/email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'usuario@example.com',
    subject: 'Bem-vindo ao Upsaude!',
    template: 'patient-welcome', // ou 'doctor-welcome'
    data: {
      name: 'João Silva',
      email: 'usuario@example.com',
      password: 'senha123'
    }
  })
})

const result = await response.json()
if (result.success) {
  console.log('Email enviado com sucesso!')
} else {
  console.error('Erro:', result.message)
}
```

### Templates Disponíveis

- `patient-welcome` - Email de boas-vindas para pacientes
- `doctor-welcome` - Email de boas-vindas para médicos
- (padrão) - Template genérico de convite

## Funcionalidades

### Autenticação Automática

O cliente gerencia automaticamente:
- Autenticação OAuth2
- Renovação de tokens
- Cache de tokens em memória

### Tratamento de Erros

Todos os métodos lançam erros descritivos em caso de falha:

```typescript
try {
  await client.sendSimpleEmail(...)
} catch (error) {
  console.error('Falha no envio:', error.message)
}
```

### Validação

- Valida presença de variáveis de ambiente na criação do cliente
- Valida campos obrigatórios nas requisições
- Retorna mensagens de erro claras da API

## Tipos TypeScript

O módulo é totalmente tipado. Principais tipos:

```typescript
interface SendEmailParams {
  to: EmailRecipient[]
  subject: string
  html: string
  text?: string
  bcc?: EmailRecipient[]
  cc?: EmailRecipient[]
  replyTo?: string
  attachments?: EmailAttachment[]
}

interface EmailRecipient {
  email: string
  name?: string
}

interface SendPulseEmailResponse {
  result: boolean
  message?: string
  errors?: string[]
}
```

## Recursos Avançados

### Anexos

```typescript
await client.sendEmail({
  to: [{ email: 'usuario@example.com' }],
  subject: 'Documento Anexo',
  html: '<p>Segue o documento anexo</p>',
  attachments: [
    {
      name: 'documento.pdf',
      content: base64Content, // conteúdo em Base64
      type: 'application/pdf'
    }
  ]
})
```

### Múltiplos Destinatários

```typescript
await client.sendEmail({
  to: [
    { email: 'usuario1@example.com', name: 'João' },
    { email: 'usuario2@example.com', name: 'Maria' },
    { email: 'usuario3@example.com', name: 'Pedro' }
  ],
  subject: 'Notificação em Massa',
  html: '<p>Mensagem para todos</p>'
})
```

## Limitações e Considerações

1. **Rate Limits**: O SendPulse possui limites de envio por minuto/hora dependendo do seu plano
2. **Tamanho de Anexos**: Limite de 10MB por anexo
3. **Destinatários**: Máximo de 50 destinatários por requisição
4. **Token**: O token de acesso expira em 1 hora (renovação automática)

## Troubleshooting

### Erro de Autenticação

Verifique:
- Client ID e Client Secret corretos
- Credenciais válidas no painel do SendPulse
- Sem espaços extras nas variáveis de ambiente

### Erro ao Enviar Email

Verifique:
- Email remetente verificado no SendPulse
- Formato válido dos emails destinatários
- HTML do email sem scripts ou conteúdo bloqueado

### Logs

O sistema registra erros no console. Em produção, considere usar um serviço de logging apropriado.

## Documentação Oficial

- [SendPulse API Documentation](https://sendpulse.com/api)
- [SendPulse SMTP API](https://sendpulse.com/integrations/api/smtp)

## Suporte

Para problemas com a integração, verifique:
1. Logs do servidor
2. Variáveis de ambiente
3. Status do serviço SendPulse
4. Limites da conta SendPulse
