import { LegalContentTemplate } from '@/components/templates/LegalContentTemplate/legalContentTemplate'
import { LegalSection } from '@/components/templates/LegalContentTemplate/types'

const sections: LegalSection[] = [
  {
    title: 'Introdução',
    content: [
      <p key="intro">
        A UPSAÚDE preza pela sua privacidade. Esta política descreve como
        coletamos, usamos, armazenamos e protegemos seus dados pessoais, em
        conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 -
        LGPD).
      </p>,
    ],
  },
  {
    title: 'Que dados coletamos?',
    content: [
      <p key="data-intro">
        Para oferecer nossos serviços de monitoramento, coletamos:
      </p>,
      <ul key="data-list" className="list-disc space-y-1 pl-5">
        <li key="cadastral">
          <strong>Dados Cadastrais:</strong> Nome completo, CPF, data de
          nascimento, telefone, e-mail e endereço.
        </li>
        <li key="sensitive">
          <strong>Dados Pessoais Sensíveis (Saúde):</strong> Histórico médico,
          sintomas relatados, medições fisiológicas (peso, pressão, glicemia),
          uso de medicamentos, exames laboratoriais e diagnósticos.
        </li>
        <li key="navigation">
          <strong>Dados de Navegação:</strong> Endereço IP, tipo de dispositivo,
          geolocalização (se autorizado) e logs de acesso (obrigatório pelo
          Marco Civil da Internet).
        </li>
      </ul>,
    ],
  },
  {
    title: 'Para que usamos seus dados? (Finalidade)',
    content: [
      <p key="usage-intro">Utilizamos seus dados para:</p>,
      <ul key="usage-list" className="list-disc space-y-1 pl-5">
        <li key="service">
          Prestar o serviço de monitoramento e gestão de saúde contratado.
        </li>
        <li key="reports">
          Gerar relatórios e gráficos de evolução para você e/ou sua equipe
          médica vinculada.
        </li>
        <li key="contact">
          Entrar em contato para alertas de saúde, lembretes de consultas ou
          medicamentos.
        </li>
        <li key="algorithms">
          Melhorar nossos algoritmos de saúde (de forma anonimizada).
        </li>
      </ul>,
    ],
  },
  {
    title: 'Com quem compartilhamos seus dados?',
    content: [
      <p key="sharing-intro">
        A UPSAÚDE <strong>não vende</strong> seus dados pessoais para terceiros
        para fins publicitários. O compartilhamento ocorre apenas com:
      </p>,
      <ul key="sharing-list" className="list-disc space-y-1 pl-5">
        <li key="health-pros">
          <strong>Profissionais de Saúde:</strong> Médicos, enfermeiros ou
          clínicas que <em>você autorizar</em> ou estiver vinculado para seu
          tratamento.
        </li>
        <li key="tech-providers">
          <strong>Fornecedores de Tecnologia:</strong> Servidores de nuvem (ex:
          AWS, Google Cloud) que possuem certificações de segurança de alto
          nível.
        </li>
        <li key="authorities">
          <strong>Autoridades:</strong> Quando exigido por lei ou ordem
          judicial.
        </li>
      </ul>,
    ],
  },
  {
    title: 'Segurança dos Dados',
    content: [
      <p key="security-intro">
        Adotamos medidas técnicas robustas, incluindo:
      </p>,
      <ul key="security-list" className="list-disc space-y-1 pl-5">
        <li key="encryption">
          Criptografia de dados em trânsito (SSL/TLS) e em repouso.
        </li>
        <li key="access-control">
          Controle estrito de acesso aos dados apenas por funcionários
          autorizados.
        </li>
        <li key="monitoring">
          Monitoramento contínuo contra vulnerabilidades.
        </li>
      </ul>,
    ],
  },
  {
    title: 'Seus Direitos (Titular dos Dados)',
    content: [
      <p key="rights-intro">
        De acordo com a LGPD, você pode solicitar a qualquer momento:
      </p>,
      <ul key="rights-list" className="list-disc space-y-1 pl-5">
        <li key="confirmation">Confirmação de que tratamos seus dados.</li>
        <li key="access">Acesso aos dados coletados.</li>
        <li key="correction">Correção de dados incompletos ou errados.</li>
        <li key="portability">
          <strong>Portabilidade</strong> dos dados para outro fornecedor de
          serviço.
        </li>
        <li key="deletion">
          Eliminação dos dados (exceto quando a retenção for obrigatória por
          lei, ex: prontuário médico por 20 anos).
        </li>
      </ul>,
    ],
  },
  {
    title: 'Retenção de Dados',
    content: [
      <p key="retention">
        Manteremos seus dados enquanto você for usuário ativo. Após o
        cancelamento, poderemos manter dados anonimizados para fins estatísticos
        ou dados identificáveis pelo prazo legal exigido por normas do Conselho
        Federal de Medicina (CFM) ou Ministério da Saúde.
      </p>,
    ],
  },
  {
    title: 'Encarregado de Dados (DPO)',
    content: [
      <p key="dpo">
        Para exercer seus direitos ou tirar dúvidas, entre em contato com nosso
        Encarregado de Proteção de Dados pelo e-mail:{' '}
        <a
          href="mailto:rodolfo.lira@upsaudeapp.com"
          className="font-medium text-[#792EBD] underline hover:text-[#EB34EF]"
        >
          rodolfo.lira@upsaudeapp.com
        </a>
      </p>,
    ],
  },
]

export default function PolicyPage() {
  return (
    <LegalContentTemplate
      pageTitle="Política de Privacidade e Proteção de Dados – UPSAÚDE"
      sections={sections}
    />
  )
}
