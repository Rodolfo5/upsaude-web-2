import { LegalContentTemplate } from '@/components/templates/LegalContentTemplate/legalContentTemplate'
import { LegalSection } from '@/components/templates/LegalContentTemplate/types'

const sections: LegalSection[] = [
  {
    title: 'Informações que Coletamos',
    content: [
      <p key="info-collection">
        Coletamos informações para fornecer e melhorar nosso Serviço para você.
        Os tipos de informações que coletamos incluem:
      </p>,
      <ul key="info-list" className="list-disc pl-5">
        <li key="personal-data">
          <strong>Dados Pessoais:</strong> Ao se registrar, podemos pedir que
          você nos forneça informações de identificação pessoal, como seu nome e
          endereço de e-mail.
        </li>
        <li key="usage-data">
          <strong>Dados de Uso:</strong> Coletamos informações sobre como o
          Serviço é acessado e usado. Estes Dados de Uso podem incluir
          informações como o endereço IP do seu computador, tipo de navegador, e
          as páginas do nosso Serviço que você visita.
        </li>
      </ul>,
    ],
  },
  {
    title: 'Como Usamos Suas Informações',
    content: [
      <p key="data-usage-intro">
        A Boilerplate Corp usa os dados coletados para diversas finalidades:
      </p>,
      <ul key="data-usage-list" className="list-disc pl-5">
        <li key="provide-service">Para fornecer e manter nosso Serviço;</li>
        <li key="notify-changes">
          Para notificá-lo sobre alterações em nosso Serviço;
        </li>
        <li key="customer-support">Para fornecer suporte ao cliente;</li>
        <li key="monitor-service">
          Para monitorar o uso do nosso Serviço e detectar problemas técnicos.
        </li>
      </ul>,
    ],
  },
  {
    title: 'Seus Direitos de Proteção de Dados (LGPD)',
    content: [
      <p key="data-rights">
        A Boilerplate Corp visa tomar medidas razoáveis para permitir que você
        corrija, altere, exclua ou limite o uso de seus Dados Pessoais. Você tem
        o direito de acessar, atualizar ou excluir as informações que temos
        sobre você.
      </p>,
    ],
  },
]

export default function PolicyPage() {
  return (
    <LegalContentTemplate
      pageTitle="Política de Privacidade da Boilerplate Corp"
      sections={sections}
    />
  )
}
