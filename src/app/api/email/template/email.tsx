/**
 * Template de email para convite à plataforma Boilerplate.
 *
 * Este componente gera um HTML estilizado para ser enviado como email,
 * contendo as credenciais do destinatário (email e senha).
 *
 * @param email - O endereço de email do destinatário.
 * @param password - A senha gerada ou associada ao destinatário.
 *
 * @returns Um componente React que renderiza o HTML do email.
 *
 * @example
 * ```tsx
 * const emailHTML = TemplateEmail({
 *   email: 'jose@souv.tech',
 *   password: 'senha123',
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

export const TemplateEmail = ({
  email,
  password,
}: {
  email: string
  password: string
}) => {
  return (
    <Html>
      <Head />
      <Preview>Convite para a plataforma Boilerplate</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img
              src="sua logo aqui"
              alt="logo"
              width={100}
              height={100}
              style={{ display: 'block', margin: '0 auto' }}
            />
            <Text style={styles.text}>
              Você foi convidado para ser Colaborador da plataforma
            </Text>
            <Text style={styles.text}>Aqui estão suas credenciais:</Text>
            <Text style={styles.text}>
              <strong>Email:</strong>
              <span style={styles.text}>{email}</span>
            </Text>
            <Text style={styles.text}>
              <strong>Senha:</strong>
              <span className="font-semibold text-white">{password}</span>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default TemplateEmail

const styles = {
  body: {
    backgroundColor: '#ffffff',
    fontFamily: 'Arial, sans-serif',
    color: '#151627',
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
    backgroundColor: '#F0F4F8',
    borderRadius: '8px 8px 0px 0px',
    padding: '20px',
    textAlign: 'center' as const,
  },
  content: {
    padding: '20px',
  },
  text: {
    color: '#151627',
    fontSize: '16px',
    margin: '10px 0',
  },
  credential: {
    color: '#151627',
    fontSize: '16px',
    margin: '5px 0',
    fontWeight: 'bold',
  },
}
