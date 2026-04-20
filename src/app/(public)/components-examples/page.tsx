'use client'

import { DollarSign as DollarSignIcon } from 'lucide-react'
import { CheckCircle2 as CheckCircleIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { Code } from 'lucide-react'
import { Pizza as LocalPizzaIcon } from 'lucide-react'
import { Mail } from 'lucide-react'
import { User } from 'lucide-react'
import { AlertCircle as ExclamationCircleIcon } from 'lucide-react'
import { AlertTriangle as Alert } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { usersColumns } from '@/app/admin/dashboard/column'
import { Button } from '@/components/atoms/Button/button'
import { DatePicker } from '@/components/atoms/DatePicker/datePicker'
import { FormErrorLabel } from '@/components/atoms/FormError/formError'
import Input from '@/components/atoms/Input/input'
import InputCurrency from '@/components/atoms/InputCurrency/inputCurrency'
import InputMask from '@/components/atoms/InputMask/inputMask'
import { Label } from '@/components/atoms/Label/label'
import { RangeDatePicker } from '@/components/atoms/RangeDatePicker/rangeDatePicker'
import Select from '@/components/atoms/Select/select'
import DatePickerField from '@/components/molecules/DatePickerField/datePickerField'
import HourPickerField from '@/components/molecules/HourPickerField/hourPickerField'
import InputField from '@/components/molecules/InputField/inputField'
import RangeDatePickerField from '@/components/molecules/RangeDatePickerField/rangeDatePickerField'
import { SelectField } from '@/components/molecules/SelectField/selectField'
import { DataTable } from '@/components/organisms/DataTable/dataTable'
import { ConfirmationModal } from '@/components/organisms/Modals/ConfirmationModal/confirmationModal'
import useAllUsers from '@/hooks/queries/useAllUsers'

export default function ComponentsExampls() {
  const { control } = useForm()
  const { data: users, isLoading } = useAllUsers()
  const [isModalConfirmationOpen, setIsModalConfirmationOpen] = useState(false)

  return (
    <main className="mb-40 grid w-full grid-cols-2 items-center gap-4 px-10 pt-10">
      <div className="flex flex-col items-center gap-5 rounded-lg border p-4">
        <Button>Enviar E-mail</Button>
        <Button variant="secondary-gray" icon={<Mail className="h-4 w-4" />}>
          Login com E-mail
        </Button>
        <Button
          variant="ghost"
          icon={<ChevronRight className="h-4 w-4" />}
          iconPosition="right"
        >
          Ver Mais
        </Button>
        <Button variant="link">Esqueceu a senha?</Button>
        <Button loading={true} loadingText="Salvando...">
          Salvar Alterações
        </Button>
        <Button variant="ghost" size="icon">
          <Mail className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex flex-col items-center gap-5 rounded-lg border p-4">
        <Label icon={<Mail />} iconPosition="left" htmlFor="email">
          Endereço de Email
        </Label>
        <Label variant="error" required htmlFor="password">
          Senha
        </Label>
        <Label size="lg" weight="bold" icon={<User />} htmlFor="username">
          Nome de Usuário
        </Label>
        <Label disabled size="lg" weight="bold">
          Campo Desativado
        </Label>
        <Label className="rounded bg-gray-100 p-2" variant="success">
          Operação Bem Sucedida
        </Label>
        <Label
          className="items-center"
          variant="error"
          icon={<Alert />}
          htmlFor="password"
          required
        >
          Senha Fraca
        </Label>
      </div>
      <div className="flex flex-col items-center gap-5 rounded-lg border p-4">
        <FormErrorLabel>Campo obrigatório</FormErrorLabel>
        <FormErrorLabel
          className="items-center"
          icon={<ExclamationCircleIcon color="error" />}
          variant="warning"
        >
          Senha fraca
        </FormErrorLabel>
        <FormErrorLabel size="sm" spacing="tight" className="font-bold">
          E-mail inválido
        </FormErrorLabel>
      </div>
      <div className="flex flex-col items-center gap-5 rounded-lg border p-4">
        <Input placeholder="Digite seu nome" />
        <Input icon={<Mail />} variant="error" placeholder="E-mail inválido" />
        <Input name="email" icon={<Mail />} iconPosition="right" size="lg" />
        <Input
          variant="success"
          icon={<CheckCircleIcon />}
          value="Valor válido"
          readOnly
        />
      </div>
      <div className="flex flex-col items-center gap-5 rounded-lg border p-4">
        <InputCurrency currency="BRL" />
        <InputCurrency currency="USD" icon={<DollarSignIcon />} />
        <InputCurrency currency="EUR" locale="de-DE" />
        <InputCurrency
          prefix="BTC "
          thousandSeparator=","
          decimalSeparator="."
          decimalScale={8}
        />
      </div>
      <div className="flex flex-col items-center gap-5 rounded-lg border p-4">
        <InputMask
          name="document"
          maskType="cpf"
          placeholder="000.000.000-00"
        />
        <InputMask
          name="phone"
          maskType="cellphone"
          placeholder="(99) 99999-9999"
        />
        <InputMask name="address.cep" maskType="cep" placeholder="00000-000" />
        <InputMask
          name="company.document"
          maskType="cnpj"
          placeholder="00.000.000/0000-00"
        />
        <InputMask name="birthDate" maskType="date" placeholder="DD/MM/AAAA" />
      </div>
      <div className="flex flex-col items-center gap-5 rounded-lg border p-4">
        <InputField
          name="default"
          label="Nome"
          placeholder="Digite seu nome completo"
          control={control}
        />

        <InputField
          name="cpf_example"
          label="CPF"
          maskType="cpf"
          placeholder="000.000.000-00"
          control={control}
        />

        <InputField
          name="email_example"
          label="E-mail"
          type="text"
          icon={<Mail className="h-5 w-5" />}
          placeholder="seu@email.com"
          control={control}
        />

        <InputField
          name="salary_example"
          label="Salário"
          currency="EUR"
          placeholder="R$ 0,00"
          control={control}
        />

        <InputField
          name="password_error_example"
          label="Senha"
          type="password"
          placeholder="Digite sua senha"
          control={control}
        />

        <InputField
          name="plate_example"
          label="Placa (custom)"
          mask="aaa-0a00"
          placeholder="ABC-1B34"
          control={control}
        />
      </div>
      <div className="flex flex-col items-center gap-5 rounded-lg border p-4">
        <Select
          variant={'secondary-color'}
          options={[
            { value: 'apple', label: 'Maçã' },
            { value: 'banana', label: 'Banana' },
            { value: 'orange', label: 'Laranja' },
          ]}
          placeholder="Selecione uma fruta"
          onChange={(value) => console.log(value)}
          value={''}
        />
        <Select
          options={[
            { value: 'br', label: 'Brasil' },
            { value: 'us', label: 'Estados Unidos' },
            { value: 'jp', label: 'Japão' },
          ]}
          value="br"
          placeholder="Selecione um país"
          onChange={(value) => console.log(value)}
        />
        <Select
          options={[
            { value: 'react', label: 'React' },
            { value: 'vue', label: 'Vue.js' },
            { value: 'angular', label: 'Angular' },
            { value: 'svelte', label: 'Svelte' },
          ]}
          placeholder="Selecione um framework"
          emptyPlaceholder="Nenhum framework encontrado"
          onChange={(value) => console.log(value)}
          value={''}
        />
      </div>
      <div className="flex flex-col items-center gap-5 rounded-lg border p-4">
        <SelectField
          name="framework"
          control={control}
          options={[
            {
              value: 'react',
              label: 'React',
              icon: <Code className="h-4 w-4" />,
            },
            {
              value: 'vue',
              label: 'Vue.js',
              icon: <Code className="h-4 w-4" />,
            },
            {
              value: 'angular',
              label: 'Angular',
              icon: <Code className="h-4 w-4" />,
              disabled: true,
            },
          ]}
          placeholder="Selecione..."
        />

        {/* Exemplo sem busca e com ícone */}
        <SelectField
          name="user"
          control={control}
          options={[{ value: 'ana', label: 'Ana' }]}
          placeholder="Selecione um usuário..."
          searchable={false}
          icon={<User className="h-4 w-4" />}
        />

        {/* Exemplo Múltiplo */}
        <SelectField
          name="toppings"
          control={control}
          options={[
            {
              value: 'pepperoni',
              label: 'Pepperoni',
              icon: <LocalPizzaIcon className="h-4 w-4" />,
            },
            {
              value: 'calabresa',
              label: 'Calabresa',
              icon: <LocalPizzaIcon className="h-4 w-4" />,
            },
            {
              value: 'queijo',
              label: 'Extra Queijo',
              icon: <LocalPizzaIcon className="h-4 w-4" />,
            },
          ]}
          placeholder="Selecione as coberturas..."
          multiple
        />

        {/* Exemplo em estado de carregamento */}
        <SelectField
          name="loading_select"
          control={control}
          options={[]}
          placeholder="Aguarde..."
          loading
        />
      </div>
      <div className="flex flex-col items-center gap-5 rounded-lg border p-4">
        <DatePicker placeholder="Selecione a data" />
        <RangeDatePicker placeholder="Selecione o período" />
      </div>
      <div className="flex flex-col items-center gap-5 rounded-lg border p-4">
        <DatePickerField
          name="birthDate"
          control={control}
          label="Data de Nascimento (Única)"
          placeholder="Selecione a data"
        />

        <RangeDatePickerField
          name="eventDateRange"
          control={control}
          label="Período do Evento"
          placeholder="Selecione o período"
        />

        <HourPickerField
          control={control}
          name="appointmentTime"
          label="Hora da Consulta"
        />
      </div>
      <div className="flex flex-col items-center gap-5 rounded-lg border p-4">
        <Button
          variant="secondary-color"
          icon={<CheckCircleIcon className="h-4 w-4" />}
          onClick={() => setIsModalConfirmationOpen(true)}
        >
          Confirmar Ação
        </Button>
        <ConfirmationModal
          isOpen={isModalConfirmationOpen}
          setIsOpen={setIsModalConfirmationOpen}
          title="Confirmação de Ação"
          description="Você tem certeza que deseja continuar?"
          content="Esta ação não pode ser desfeita."
          icon={<CheckCircleIcon className="h-6 w-6 text-green-500" />}
          action={() => console.log('Ação confirmada')}
          actionLabel="Confirmar"
          cancelLabel="Cancelar"
          loading={false}
          actionButtonVariant="success"
        />
      </div>
      <div className="flex flex-col items-center gap-5 rounded-lg border p-4">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground">Carregando usuários...</p>
          </div>
        ) : (
          <DataTable
            columns={usersColumns}
            data={users || []}
            tableTitle="Usuários do Sistema"
            tableDescription="Gerencie todos os usuários cadastrados."
            searchColumn="name"
            searchInputPlaceholder="Buscar por nome..."
          />
        )}
      </div>
    </main>
  )
}
