import { LegalContentTemplate } from '@/components/templates/LegalContentTemplate/legalContentTemplate'
import { LegalSection } from '@/components/templates/LegalContentTemplate/types'

const sections: LegalSection[] = [
  {
    title: 'Aceitação dos Termos',
    content: [
      <p key="acceptance">
        Ao baixar, instalar ou utilizar o aplicativo <strong>UPSAÚDE</strong>,
        você (&quot;Usuário&quot;) concorda integralmente com estes Termos de
        Uso e com nossa Política de Privacidade. Se não concordar, não utilize o
        serviço.
      </p>,
    ],
  },
  {
    title: 'Descrição do Serviço',
    content: [
      <p key="service-desc">
        A UPSAÚDE é uma plataforma digital focada em monitoramento de pacientes,
        gestão de saúde, conexão entre pacientes e profissionais de saúde,
        telemedicina e prescrição digital.
      </p>,
      <p key="service-disclaimer">
        A UPSAÚDE fornece ferramentas para facilitar o acompanhamento de saúde,
        mas{' '}
        <strong>
          NÃO SUBSTITUI O JULGAMENTO CLÍNICO DE UM PROFISSIONAL DE SAÚDE.
        </strong>
      </p>,
    ],
  },
  {
    title: 'Isenção de Responsabilidade Médica (Medical Disclaimer)',
    content: [
      <p key="disclaimer-intro">
        <strong>ATENÇÃO:</strong> O CONTEÚDO E AS FERRAMENTAS DA UPSAÚDE TÊM
        CARÁTER INFORMATIVO E DE MONITORAMENTO.
      </p>,
      <ul key="disclaimer-list" className="list-disc space-y-1 pl-5">
        <li key="no-emergency">
          <strong>Não atendemos emergências:</strong> Em caso de emergência
          médica, risco de morte ou sintomas graves, o usuário deve procurar
          imediatamente um pronto-socorro ou ligar para o SAMU (192).
        </li>
        <li key="no-diagnosis">
          <strong>Diagnóstico:</strong> O aplicativo não realiza diagnósticos
          médicos automáticos. Qualquer dado gerado deve ser e é interpretado
          por um profissional de saúde habilitado.
        </li>
      </ul>,
    ],
  },
  {
    title: 'Cadastro e Segurança',
    content: [
      <p key="registration">
        Para acessar certas funcionalidades, é necessário cadastro. O Usuário
        garante que as informações fornecidas (nome, CPF, dados de saúde) são
        verdadeiras. A senha é pessoal e intransferível. A UPSAÚDE não se
        responsabiliza por acessos não autorizados resultantes de negligência do
        usuário com seus dados de login.
      </p>,
    ],
  },
  {
    title: 'Responsabilidades do Usuário',
    content: [
      <p key="user-resp-intro">O Usuário compromete-se a:</p>,
      <ul key="user-resp-list" className="list-disc space-y-1 pl-5">
        <li key="accurate-data">
          Inserir dados fidedignos sobre sua saúde (sintomas, medições,
          histórico).
        </li>
        <li key="no-illegal">
          Não utilizar o app para fins ilícitos ou para inserir dados falsos.
        </li>
        <li key="follow-doctor">
          Seguir as orientações de seu médico assistente, independentemente das
          informações contidas no app.
        </li>
      </ul>,
    ],
  },
  {
    title: 'Propriedade Intelectual',
    content: [
      <p key="intellectual-property">
        Todo o design, código-fonte, marcas (UPSaúde), logotipos e conteúdos são
        propriedade exclusiva da UPSAÚDE (ou de seus licenciadores). É proibida
        a cópia, engenharia reversa ou reprodução sem autorização.
      </p>,
    ],
  },
  {
    title: 'Cancelamento e Rescisão',
    content: [
      <p key="cancellation">
        O Usuário pode encerrar sua conta a qualquer momento através das
        configurações do aplicativo. A UPSAÚDE reserva-se o direito de suspender
        contas que violem estes termos.
      </p>,
    ],
  },
  {
    title: 'Alterações nos Termos',
    content: [
      <p key="term-changes">
        A UPSAÚDE pode alterar estes termos a qualquer momento para adequação
        legal ou evolução do produto. Notificaremos sobre mudanças
        significativas.
      </p>,
    ],
  },
  {
    title: 'Foro',
    content: [
      <p key="forum">
        Fica eleito o foro da comarca de Campina Grande-PB, para dirimir
        quaisquer dúvidas oriundas deste termo.
      </p>,
    ],
  },
]

export default function TermsPage() {
  return (
    <LegalContentTemplate
      pageTitle="Termos e Condições de Uso – UPSAÚDE"
      sections={sections}
    />
  )
}
