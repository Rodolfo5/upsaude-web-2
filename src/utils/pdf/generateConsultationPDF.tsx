import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { jsPDF as JsPDF } from 'jspdf'

import { AgendaConsultation } from '@/types/entities/agendaConsultation'
import { PatientEntity } from '@/types/entities/user'

interface GeneratePDFParams {
  consultation: AgendaConsultation
  patient: PatientEntity | null
  soapData: {
    subjective: string
    objective: string
    assessment: string
    plan: string
  }
  aiSummary?: string
}

const formatCPF = (cpf?: string): string => {
  if (!cpf) return 'N/A'
  const cleanCPF = cpf.replace(/\D/g, '')
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

const calculateAge = (birthDate?: Date): string => {
  if (!birthDate) return 'N/A'
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return `${age} anos`
}

const formatConsultationType = (format?: string): string => {
  if (format === 'PRESENTIAL' || format === 'PRESENCIAL') {
    return 'Presencial'
  }
  if (format === 'ONLINE') {
    return 'Teleconsulta'
  }
  return 'Não informado'
}

export const generateConsultationPDF = async ({
  consultation,
  patient,
  soapData,
  aiSummary,
}: GeneratePDFParams): Promise<void> => {
  try {
    const doc = new JsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const maxWidth = pageWidth - 2 * margin
    let yPosition = margin

    // Cores
    const primaryColor = '#530570'
    const textColor = '#333333'
    const grayColor = '#666666'
    const lightGrayColor = '#999999'

    // Função auxiliar para adicionar texto com quebra de linha
    const addText = (
      text: string,
      x: number,
      y: number,
      options: {
        fontSize?: number
        color?: string
        bold?: boolean
        maxWidth?: number
      } = {},
    ): number => {
      const {
        fontSize = 12,
        color = textColor,
        bold = false,
        maxWidth: textMaxWidth = maxWidth,
      } = options

      doc.setFontSize(fontSize)
      doc.setTextColor(color)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')

      const lines = doc.splitTextToSize(text, textMaxWidth)
      lines.forEach((line: string) => {
        if (y > pageHeight - margin) {
          doc.addPage()
          y = margin
        }
        doc.text(line, x, y)
        y += fontSize * 0.5 + 2
      })

      return y
    }

    // Cabeçalho
    yPosition = addText('Relatório de Consulta Médica', margin, yPosition, {
      fontSize: 24,
      color: primaryColor,
      bold: true,
    })
    yPosition += 5

    yPosition = addText(
      `Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`,
      margin,
      yPosition,
      {
        fontSize: 14,
        color: grayColor,
      },
    )
    yPosition += 10

    // Linha divisória
    doc.setDrawColor(primaryColor)
    doc.setLineWidth(2)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 15

    // Dados da Consulta
    yPosition = addText('Dados da Consulta', margin, yPosition, {
      fontSize: 16,
      color: primaryColor,
      bold: true,
    })
    yPosition += 5

    const consultationDate = consultation.date
      ? format(new Date(consultation.date), 'dd/MM/yyyy', { locale: ptBR })
      : 'N/A'

    const consultationTime = consultation.hour || 'N/A'
    const timeRange =
      consultationTime !== 'N/A' && consultationTime.includes(':')
        ? (() => {
            const [hours, minutes] = consultationTime.split(':')
            const startMinutes = parseInt(minutes || '0', 10)
            const endMinutes = startMinutes + 45
            const endHours =
              parseInt(hours || '0', 10) + Math.floor(endMinutes / 60)
            const finalMinutes = endMinutes % 60
            return `${consultationTime} - ${String(endHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`
          })()
        : consultationTime

    yPosition = addText(`Data: ${consultationDate}`, margin, yPosition, {
      fontSize: 12,
    })
    yPosition = addText(`Horário: ${timeRange}`, margin, yPosition, {
      fontSize: 12,
    })
    yPosition = addText(
      `Formato: ${formatConsultationType(consultation.format)}`,
      margin,
      yPosition,
      {
        fontSize: 12,
      },
    )

    if (consultation.protocolNumber) {
      yPosition = addText(
        `Protocolo: ${consultation.protocolNumber}`,
        margin,
        yPosition,
        {
          fontSize: 12,
        },
      )
    }
    yPosition += 10

    // Dados do Paciente
    yPosition = addText('Dados do Paciente', margin, yPosition, {
      fontSize: 16,
      color: primaryColor,
      bold: true,
    })
    yPosition += 5

    const patientName =
      patient?.name || consultation.patientName || 'Nome do Paciente'
    const patientAge = calculateAge(patient?.birthDate)
    const patientCPF = formatCPF(patient?.cpf)

    yPosition = addText(`Nome: ${patientName}`, margin, yPosition, {
      fontSize: 12,
    })
    yPosition = addText(`Idade: ${patientAge}`, margin, yPosition, {
      fontSize: 12,
    })
    yPosition = addText(`CPF: ${patientCPF}`, margin, yPosition, {
      fontSize: 12,
    })

    if (patient?.gender) {
      yPosition = addText(`Gênero: ${patient.gender}`, margin, yPosition, {
        fontSize: 12,
      })
    }
    yPosition += 10

    // Sumário de IA (se existir)
    if (aiSummary) {
      yPosition = addText('Sumário Gerado por IA', margin, yPosition, {
        fontSize: 16,
        color: primaryColor,
        bold: true,
      })
      yPosition += 5

      yPosition = addText(aiSummary, margin, yPosition, {
        fontSize: 11,
        maxWidth,
      })
      yPosition += 10
    }

    // Método SOAP
    yPosition = addText('Método SOAP', margin, yPosition, {
      fontSize: 16,
      color: primaryColor,
      bold: true,
    })
    yPosition += 5

    // Subjetivo
    yPosition = addText('S - Subjetivo', margin, yPosition, {
      fontSize: 14,
      color: primaryColor,
      bold: true,
    })
    yPosition += 5

    yPosition = addText(
      soapData.subjective || 'Não informado',
      margin + 10,
      yPosition,
      {
        fontSize: 11,
      },
    )
    yPosition += 10

    // Objetivo
    yPosition = addText('O - Objetivo', margin, yPosition, {
      fontSize: 14,
      color: primaryColor,
      bold: true,
    })
    yPosition += 5

    yPosition = addText(
      soapData.objective || 'Não informado',
      margin + 10,
      yPosition,
      {
        fontSize: 11,
      },
    )
    yPosition += 10

    // Avaliação
    yPosition = addText('A - Avaliação', margin, yPosition, {
      fontSize: 14,
      color: primaryColor,
      bold: true,
    })
    yPosition += 5

    yPosition = addText(
      soapData.assessment || 'Não informado',
      margin + 10,
      yPosition,
      {
        fontSize: 11,
      },
    )
    yPosition += 10

    // Plano
    yPosition = addText('P - Plano', margin, yPosition, {
      fontSize: 14,
      color: primaryColor,
      bold: true,
    })
    yPosition += 5

    yPosition = addText(
      soapData.plan || 'Não informado',
      margin + 10,
      yPosition,
      {
        fontSize: 11,
      },
    )

    // Rodapé
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(10)
      doc.setTextColor(lightGrayColor)
      doc.setFont('helvetica', 'normal')
      doc.text(
        'Documento gerado automaticamente pelo sistema UpSaude',
        pageWidth / 2,
        pageHeight - 15,
        {
          align: 'center',
        },
      )
    }

    // Gerar nome do arquivo
    const consultationDateFileName = consultation.date
      ? format(new Date(consultation.date), 'dd-MM-yyyy', { locale: ptBR })
      : 'data-nao-informada'
    const sanitizedPatientName = patientName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    const fileName = `consulta-${sanitizedPatientName}-${consultationDateFileName}.pdf`

    // Download
    doc.save(fileName)
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    throw error
  }
}
