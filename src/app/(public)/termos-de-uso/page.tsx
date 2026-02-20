import { LegalContentTemplate } from '@/components/templates/LegalContentTemplate/legalContentTemplate'
import { LegalSection } from '@/components/templates/LegalContentTemplate/types'

const sections: LegalSection[] = [
  {
    title: 'Aceitação dos Termos',
    content: [
      <p key="acceptance">
        Ao se registrar e utilizar a plataforma da Boilerplate Corp
        (&quot;Serviço&quot;), você concorda em cumprir estes Termos de Uso. Se
        você não concorda com qualquer parte dos termos, não poderá acessar o
        Serviço.
      </p>,
    ],
  },
  {
    title: 'Contas de Usuário',
    content: [
      <p key="user-account-info">
        Ao criar uma conta conosco, você deve nos fornecer informações precisas,
        completas e atuais. A falha em fazer isso constitui uma violação dos
        Termos, que pode resultar na rescisão imediata de sua conta em nosso
        Serviço.
      </p>,
      <p key="user-account-security">
        Você é responsável por proteger a senha que usa para acessar o Serviço e
        por quaisquer atividades ou ações sob sua senha.
      </p>,
    ],
  },
  {
    title: 'Propriedade Intelectual',
    content: [
      <p key="intellectual-property">
        O Serviço e seu conteúdo original, recursos e funcionalidades são e
        continuarão sendo propriedade exclusiva da Boilerplate Corp e de seus
        licenciadores.
      </p>,
    ],
  },
  {
    title: 'Limitação de Responsabilidade',
    content: [
      <p key="liability-limitation">
        Em nenhuma circunstância a Boilerplate Corp, nem seus diretores,
        funcionários ou parceiros, serão responsáveis por quaisquer danos
        indiretos, incidentais, especiais, consequenciais ou punitivos
        resultantes do seu acesso ou uso do Serviço.
      </p>,
    ],
  },
]

export default function TermsPage() {
  return (
    <LegalContentTemplate
      pageTitle="Termos de Uso Boilerplate"
      sections={sections}
    />
  )
}
