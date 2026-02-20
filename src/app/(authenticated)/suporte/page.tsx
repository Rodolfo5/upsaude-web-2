'use client'

import { WhatsApp } from '@mui/icons-material'
import { Plus, Minus } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import useUser from '@/hooks/useUser'
import useDoctor from '@/hooks/useDoctor'

export default function SuportePage() {
  const { currentDoctor } = useDoctor()
  const [openItems, setOpenItems] = useState<string[]>(['item-3'])

  const faqData = [
    {
      id: 'item-1',
      question: 'Como faço meu cadastro na plataforma?',
      answer:
        'Para se cadastrar na plataforma, acesse a página de cadastro e preencha todos os dados solicitados. Você receberá um email de confirmação após o cadastro ser aprovado pela nossa equipe.',
    },
    {
      id: 'item-2',
      question: 'Esqueci minha senha, como recuperar o acesso?',
      answer:
        'Na página de login, clique em "Esqueci minha senha" e digite seu email cadastrado. Você receberá um link para redefinir sua senha em alguns minutos.',
    },
    {
      id: 'item-3',
      question: 'Como editar meus dados pessoais ou profissionais?',
      answer:
        'Você pode atualizar suas informações pelo seu perfil, clicando no botão "Editar". Depois de fazer as alterações, basta salvar para que elas sejam aplicadas.',
    },
    {
      id: 'item-4',
      question: 'Como funciona o agendamento de consultas pelo Up Saúde?',
      answer:
        'O agendamento é feito diretamente na plataforma. Você pode visualizar horários disponíveis, escolher o melhor horário e confirmar sua consulta. Receberá lembretes por email e WhatsApp.',
    },
    {
      id: 'item-5',
      question: 'Posso cancelar ou remarcar uma consulta? Como?',
      answer:
        'Sim, você pode cancelar ou remarcar consultas até 24 horas antes do horário agendado. Acesse "Minhas Consultas" no seu perfil e clique em "Remarcar" ou "Cancelar".',
    },
    {
      id: 'item-6',
      question: 'Como entro em contato com o suporte técnico?',
      answer:
        'Você pode entrar em contato conosco através do WhatsApp, email ou pelo chat da plataforma. Nossa equipe está disponível de segunda a sexta, das 8h às 18h.',
    },
  ]

  const handleContactManager = () => {
    // Número oficial de suporte do Up Saúde
    const supportPhone = '5511999999999' // Substitua pelo número real

    // Mensagem pré-preenchida com dados do usuário
    const userName = currentDoctor?.name || 'Usuário'
    const userCredential = currentDoctor?.credential || ''
    const userSpecialty = currentDoctor?.specialty || ''

    const message = `Olá, sou o Dr(a). ${userName}${
      userCredential ? ` (${userCredential})` : ''
    }${userSpecialty ? ` - ${userSpecialty}` : ''} e preciso de ajuda com a plataforma Up Saúde.`

    // Codificar a mensagem para URL
    const encodedMessage = encodeURIComponent(message)

    // Abrir WhatsApp com mensagem pré-preenchida
    const whatsappUrl = `https://wa.me/${supportPhone}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Seção de Suporte */}
      <div className="mb-8 w-full overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            {/* Conteúdo Principal */}
            <div className="flex-1">
              <h1 className="mb-4 text-3xl font-bold text-purple-800 md:text-4xl">
                Suporte
              </h1>
              <p className="mb-6 leading-relaxed text-gray-600">
                Aqui você encontra orientação e canais de atendimento para
                resolver dúvidas, ajustar configurações ou relatar qualquer
                problema na plataforma.
              </p>
              <Button
                onClick={handleContactManager}
                variant="outline"
                className="rounded-full border-purple-600 bg-white py-5 text-lg text-purple-600 hover:border-purple-700 hover:bg-purple-50"
              >
                <WhatsApp className="mr-2 h-5 w-5 shrink-0" />
                Entre em contato com o gerente
              </Button>
            </div>

            {/* Ilustração */}
            <div className="relative mx-auto h-[220px] w-full max-w-[280px] shrink-0 sm:h-[280px] sm:max-w-[320px] lg:mx-0 lg:h-[350px] lg:w-[350px] lg:max-w-none">
              <Image
                src="/Questions-rafiki-2.png"
                alt="Suporte"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Perguntas Frequentes */}
      <div className="overflow-hidden bg-white">
        <div className="p-6 md:p-8">
          <h2 className="mb-6 text-3xl font-bold text-purple-800 md:text-4xl">
            Perguntas Frequentes
          </h2>

          <Accordion
            type="multiple"
            value={openItems}
            onValueChange={setOpenItems}
            className="space-y-4"
          >
            {faqData.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-b border-gray-200 bg-white"
              >
                <AccordionTrigger className="px-6 py-4 text-left [&[data-state=open]>svg]:rotate-0">
                  <span className="font-medium text-gray-800">
                    {item.question}
                  </span>
                  {openItems.includes(item.id) ? (
                    <Minus className="duration-400 h-4 w-4 shrink-0 text-purple-600 transition-transform" />
                  ) : (
                    <Plus className="duration-400 h-4 w-4 shrink-0 text-purple-600 transition-transform" />
                  )}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="pt-2 leading-relaxed text-gray-600">
                    {item.answer}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  )
}
