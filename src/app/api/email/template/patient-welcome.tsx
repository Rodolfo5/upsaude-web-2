/**
 * Template de email para boas-vindas ao paciente na plataforma Upsaude.
 *
 * Este componente gera um HTML estilizado para ser enviado como email de boas-vindas,
 * contendo informações básicas sobre a conta criada.
 *
 * @param name - O nome do paciente.
 * @param email - O endereço de email do paciente.
 *
 * @returns Um componente React que renderiza o HTML do email.
 *
 * @example
 * ```tsx
 * const emailHTML = PatientWelcomeEmail({
 *   name: 'João Silva',
 *   email: 'joao@example.com',
 * });
 * ```
 */
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Img,
} from '@react-email/components'
import * as React from 'react'

export const PatientWelcomeEmail = ({
  name,
  email,
  password,
}: {
  name: string
  email: string
  password: string
}) => {
  return (
    <Html>
      <Head />
      <Preview>Bem-vindo ao Upsaude!</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img
              src="logo aqui"
              alt="Upsaude Logo"
              width="100"
              height="100"
              style={{ display: 'block', margin: '0 auto' }}
            />
            <Text style={styles.title}>Bem-vindo ao Upsaude!</Text>
          </Section>
          <Section style={styles.content}>
            <Text style={styles.text}>
              Olá, <strong>{name}</strong>!
            </Text>
            <Text style={styles.text}>
              Sua conta foi criada na plataforma Upsaude.
            </Text>
            <Text style={styles.text}>
              Você pode acessar a plataforma usando o email:{' '}
              <strong>{email}</strong>
            </Text>
            <Text style={styles.text}>
              Sua senha temporária é: <strong>{password}</strong>
            </Text>
            <Text style={styles.text}>
              Recomendamos alterar a senha após o primeiro login.
            </Text>
            <Text style={styles.text}>
              Atenciosamente,
              <br />
              Equipe Upsaude
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default PatientWelcomeEmail

const styles = {
  body: {
    backgroundColor: '#f4f4f4',
    fontFamily: 'Arial, sans-serif',
    color: '#333',
    padding: '20px',
  },
  container: {
    margin: '0 auto',
    maxWidth: '600px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  },
  header: {
    backgroundColor: '#792EBD',
    borderRadius: '8px 8px 0px 0px',
    padding: '20px',
    textAlign: 'center' as const,
  },
  title: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '10px 0',
  },
  content: {
    padding: '20px',
  },
  text: {
    color: '#333',
    fontSize: '16px',
    margin: '10px 0',
    lineHeight: '1.5',
  },
}
