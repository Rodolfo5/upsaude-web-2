'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { formatDate, isDate } from 'date-fns'
import { Edit3, Save, X, Plus, Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import Input from '@/components/atoms/Input/input'
import LoadingComponent from '@/components/atoms/Loading/loading'
import { SelectField } from '@/components/molecules/SelectField/selectField'
import { ConfirmationModal } from '@/components/organisms/Modals/ConfirmationModal/confirmationModal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getSpecialtiesForCredential, getSpecialtyLabel } from '@/utils/specialtyHelpers'
import { useAppToast } from '@/hooks/useAppToast'
import useDoctor from '@/hooks/useDoctor'
import useUser from '@/hooks/useUser'
import { formatCpf, formatcep, timestampToDate } from '@/lib/utils'
import { deleteOwnAccount, logout } from '@/services/firebase/auth'
import { uploadFile } from '@/services/firebase/firebaseStorage'
import { deleteUserDoc, updateUserDoc } from '@/services/user'
import profileEditSchema, { ProfileEditData } from '@/validations/profileEdit'

export default function PerfilPage() {
  const { currentUser, refreshUser } = useUser()
  const { currentDoctor } = useDoctor()
  const [isEditing, setIsEditing] = useState(false)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { success: successToast, error: errorToast } = useAppToast()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileEditData>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      name: currentDoctor?.name || '',
      cpf: currentDoctor?.cpf || '',
      birthDate: currentDoctor?.birthDate
        ? isDate(currentDoctor.birthDate)
          ? currentDoctor.birthDate
          : (timestampToDate(currentDoctor.birthDate) as Date)
        : new Date(),
      state: currentDoctor?.state || '',
      typeOfCredential: currentDoctor?.typeOfCredential || '',
      credential: currentDoctor?.credential || '',
      specialty: currentDoctor?.specialty || '',
      credentialDocument: currentDoctor?.credentialDocument || '',
      office: {
        address: currentDoctor?.office?.address || '',
        neighborhood: currentDoctor?.office?.neighborhood || '',
        complement: currentDoctor?.office?.complement || '',
        city: currentDoctor?.office?.city || '',
        state: currentDoctor?.office?.state || '',
        cep: currentDoctor?.office?.cep || '',
      },
    },
  })

  useEffect(() => {
    if (currentDoctor) {
      reset({
        name: currentDoctor.name || '',
        cpf: currentDoctor.cpf || '',
        birthDate: currentDoctor.birthDate
          ? isDate(currentDoctor.birthDate)
            ? currentDoctor.birthDate
            : (timestampToDate(currentDoctor.birthDate) as Date)
          : new Date(),
        state: currentDoctor.state || '',
        typeOfCredential: currentDoctor.typeOfCredential || '',
        credential: currentDoctor.credential || '',
        specialty: currentDoctor.specialty || '',
        credentialDocument: currentDoctor.credentialDocument || '',
        office: {
          address: currentDoctor.office?.address || '',
          neighborhood: currentDoctor.office?.neighborhood || '',
          complement: currentDoctor.office?.complement || '',
          city: currentDoctor.office?.city || '',
          state: currentDoctor.office?.state || '',
          cep: currentDoctor.office?.cep || '',
        },
      })
    }
  }, [currentDoctor, reset])

  const filteredSpecialties = useMemo(
    () => getSpecialtiesForCredential(currentDoctor?.typeOfCredential),
    [currentDoctor?.typeOfCredential],
  )

  const onSubmit = async (data: ProfileEditData) => {
    try {
      if (!currentDoctor?.uid) {
        errorToast('Usuário não encontrado')
        return
      }

      const updateData: Record<string, unknown> = { ...data }

      if (profileImage) {
        const { url, error } = await uploadFile(profileImage)
        if (error) {
          errorToast(error)
          return
        }
        updateData.profileImage = url
      }

      await updateUserDoc(currentDoctor.uid, updateData)

      successToast('Perfil atualizado com sucesso!')
      setIsEditing(false)
      setProfileImage(null)
      refreshUser()
    } catch (error) {
      errorToast('Erro ao atualizar perfil')
      console.error('Erro ao atualizar perfil:', error)
    }
  }

  const handleCancel = () => {
    reset()
    setProfileImage(null)
    setIsEditing(false)
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setProfileImage(file)
      const reader = new FileReader()
      reader.readAsDataURL(file)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      if (!currentDoctor?.uid) {
        errorToast('Usuário não encontrado')
        return
      }

      const { error: firestoreError } = await deleteUserDoc(currentDoctor.uid)
      if (firestoreError) {
        errorToast(firestoreError)
        return
      }

      const { error: authError } = await deleteOwnAccount()
      if (authError) {
        errorToast(authError)
        return
      }

      successToast('Conta excluída com sucesso')
      setIsDeletingAccount(false)
      logout()
      router.replace('/login')
    } catch (error) {
      errorToast('Erro ao excluir conta')
      console.error('Erro ao excluir conta:', error)
      setIsDeletingAccount(false)
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  if (!currentDoctor || !currentUser) {
    return <LoadingComponent />
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-3xl font-bold text-purple-800">Meu perfil</h1>
          <div
            className="cursor-pointer text-purple-800 hover:underline"
            onClick={() => setIsDeletingAccount(true)}
          >
            Excluir conta
          </div>
        </div>

        <Card className="mb-8 overflow-hidden bg-gradient-to-r from-purple-900 to-purple-800">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white">
                {profileImage ? (
                  <AvatarImage
                    src={URL.createObjectURL(profileImage)}
                    alt={currentUser.name}
                  />
                ) : currentUser.profileImage ? (
                  <AvatarImage
                    src={currentUser.profileImage}
                    alt={currentUser.name}
                  />
                ) : (
                  <AvatarFallback className="bg-white text-xl font-semibold text-purple-600">
                    {currentUser.name
                      ? currentUser.name
                          .split(' ')
                          .map((name, index) =>
                            index === 0 || index === 1
                              ? name.charAt(0).toUpperCase()
                              : '',
                          )
                          .join('')
                      : 'CN'}
                  </AvatarFallback>
                )}
              </Avatar>

              {isEditing && (
                <button
                  type="button"
                  onClick={handleImageClick}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-purple-600 bg-white text-purple-600 transition-colors hover:bg-purple-50"
                >
                  {currentUser.profileImage || profileImage ? (
                    <Camera className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div className="flex-1 text-white">
              <h2 className="mb-2 text-2xl font-bold">{currentDoctor.name}</h2>
              <p className="text-purple-100">{getSpecialtyLabel(currentDoctor?.specialty)}</p>
              <p className="text-sm text-purple-200">
                {currentDoctor.credential}
              </p>
            </div>

            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-red-300 text-red-600 hover:bg-red-50"
                  onClick={handleCancel}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  form="profile-form"
                  className="rounded-full bg-purple-600 text-white hover:bg-purple-700"
                  disabled={isSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </div>
            ) : (
              <Button
                className="rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Editar meu perfil
              </Button>
            )}
          </div>
        </Card>

        <form id="profile-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid h-fit gap-6 lg:grid-cols-2">
            <Card className="rounded-3xl border-none bg-purple-50 p-6">
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  Dados Cadastrais
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                  <p className="min-w-0 flex-1 text-sm text-gray-500 sm:w-1/2">
                    E-mail
                  </p>
                  <div className="min-w-0 flex-1 sm:w-1/2">
                    <p className="truncate font-medium text-gray-900">
                      {currentDoctor?.email || '-'}
                    </p>
                  </div>
                </div>

                <div className="h-px w-full bg-[#CAC4D0]" />

                <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                  <p className="min-w-0 flex-1 text-sm text-gray-500 sm:w-1/2">
                    Senha
                  </p>
                  <p className="min-w-0 flex-1 font-medium text-gray-900 sm:w-1/2">
                    *******
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl border-none bg-purple-50 p-6">
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  Dados Pessoais
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                  <p className="min-w-0 flex-1 text-sm text-gray-500 sm:w-1/2">
                    Nome
                  </p>
                  <div className="min-w-0 flex-1 sm:w-1/2">
                    <p className="truncate font-medium text-gray-900">
                      {currentDoctor?.name || '-'}
                    </p>
                  </div>
                </div>
                <div className="h-px w-full bg-[#CAC4D0]" />
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                  <p className="min-w-0 flex-1 text-sm text-gray-500 sm:w-1/2">
                    CPF
                  </p>
                  <div className="min-w-0 flex-1 sm:w-1/2">
                    <p className="font-medium text-gray-900">
                      {currentDoctor?.cpf ? formatCpf(currentDoctor.cpf) : '-'}
                    </p>
                  </div>
                </div>
                <div className="h-px w-full bg-[#CAC4D0]" />
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                  <p className="min-w-0 flex-1 text-sm text-gray-500 sm:w-1/2">
                    Data de Nascimento
                  </p>
                  <div className="min-w-0 flex-1 sm:w-1/2">
                    <p className="font-medium text-gray-900">
                      {currentDoctor?.birthDate
                        ? isDate(currentDoctor.birthDate)
                          ? formatDate(currentDoctor.birthDate, 'dd/MM/yyyy')
                          : formatDate(
                              timestampToDate(currentDoctor.birthDate) as Date,
                              'dd/MM/yyyy',
                            )
                        : '-'}
                    </p>
                  </div>
                </div>
                <div className="h-px w-full bg-[#CAC4D0]" />
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                  <p className="min-w-0 flex-1 text-sm text-gray-500 sm:w-1/2">
                    Estado
                  </p>
                  <div className="min-w-0 flex-1 sm:w-1/2">
                    <p className="font-medium text-gray-900">
                      {currentDoctor?.state || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="h-fit rounded-3xl border-none bg-purple-50 p-6">
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  Credencial de Saúde
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                  <p className="min-w-0 flex-1 text-sm text-gray-500 sm:w-1/2">
                    Credencial
                  </p>
                  <div className="min-w-0 flex-1 sm:w-1/2">
                    <p className="font-medium text-gray-900">
                      {currentDoctor?.typeOfCredential || '-'}
                    </p>
                  </div>
                </div>
                <div className="h-px w-full bg-[#CAC4D0]" />
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                  <p className="min-w-0 flex-1 text-sm text-gray-500 sm:w-1/2">
                    Número
                  </p>
                  <div className="min-w-0 flex-1 sm:w-1/2">
                    <p className="font-medium text-gray-900">
                      {currentDoctor?.credential || '-'}
                    </p>
                  </div>
                </div>
                <div className="h-px w-full bg-[#CAC4D0]" />
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                  <p className="min-w-0 flex-1 text-sm text-gray-500 sm:w-1/2">
                    Arquivo
                  </p>
                  <div className="min-w-0 flex-1 sm:w-auto">
                    <p className="max-w-full truncate font-medium text-gray-900 sm:max-w-48">
                      {currentDoctor?.credentialDocument || '-'}
                    </p>
                  </div>
                </div>
                <div className="h-px w-full bg-[#CAC4D0]" />
                <div className="flex w-full">
                  <p className="w-1/2 text-sm text-gray-500">Especialidade</p>
                  <div className="w-1/2">
                    {isEditing ? (
                      <SelectField
                        name="specialty"
                        control={control}
                        placeholder="Especialidade"
                        options={filteredSpecialties}
                        disabled={isSubmitting}
                        className="transition-all duration-200"
                      />
                    ) : (
                      <p className="font-medium text-gray-900">
                        {getSpecialtyLabel(currentDoctor?.specialty) || '-'}
                      </p>
                    )}
                    {errors.specialty && (
                      <p className="text-xs text-red-500">
                        {errors.specialty.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="h-px w-full bg-[#CAC4D0]" />
              </div>
            </Card>

            <Card className="h-fit rounded-3xl border-none bg-purple-50 p-6">
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  Endereço do Consultório
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex w-full">
                  <p className="w-1/2 text-sm text-gray-500">Endereço</p>
                  <div className="w-1/2">
                    {isEditing ? (
                      <Input
                        {...register('office.address')}
                        className="border-purple-300 focus:border-purple-500"
                        placeholder="Digite o endereço"
                      />
                    ) : (
                      <p className="font-medium text-gray-900">
                        {currentDoctor?.office?.address || '-'}
                      </p>
                    )}
                    {errors.office?.address && (
                      <p className="text-xs text-red-500">
                        {errors.office.address.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="h-px w-full bg-[#CAC4D0]" />
                <div className="flex w-full">
                  <p className="w-1/2 text-sm text-gray-500">Bairro</p>
                  <div className="w-1/2">
                    {isEditing ? (
                      <Input
                        {...register('office.neighborhood')}
                        className="border-purple-300 focus:border-purple-500"
                        placeholder="Digite o bairro"
                      />
                    ) : (
                      <p className="font-medium text-gray-900">
                        {currentDoctor?.office?.neighborhood || '-'}
                      </p>
                    )}
                    {errors.office?.neighborhood && (
                      <p className="text-xs text-red-500">
                        {errors.office.neighborhood.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="h-px w-full bg-[#CAC4D0]" />
                <div className="flex w-full">
                  <p className="w-1/2 text-sm text-gray-500">Complemento</p>
                  <div className="w-1/2">
                    {isEditing ? (
                      <Input
                        {...register('office.complement')}
                        className="border-purple-300 focus:border-purple-500"
                        placeholder="Digite o complemento"
                      />
                    ) : (
                      <p className="font-medium text-gray-900">
                        {currentDoctor?.office?.complement || '-'}
                      </p>
                    )}
                    {errors.office?.complement && (
                      <p className="text-xs text-red-500">
                        {errors.office.complement.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="h-px w-full bg-[#CAC4D0]" />
                <div className="flex w-full">
                  <p className="w-1/2 text-sm text-gray-500">Cidade / Estado</p>
                  <div className="flex w-1/2 gap-2">
                    {isEditing ? (
                      <>
                        <Input
                          {...register('office.city')}
                          className="border-purple-300 focus:border-purple-500"
                          placeholder="Cidade"
                        />
                        <Input
                          {...register('office.state')}
                          className="border-purple-300 focus:border-purple-500"
                          placeholder="Estado"
                        />
                      </>
                    ) : (
                      <p className="font-medium text-gray-900">
                        {currentDoctor?.office?.city || '-'} /{' '}
                        {currentDoctor?.office?.state || '-'}
                      </p>
                    )}
                  </div>
                </div>
                {errors.office?.city && (
                  <p className="text-xs text-red-500">
                    {errors.office.city.message}
                  </p>
                )}
                {errors.office?.state && (
                  <p className="text-xs text-red-500">
                    {errors.office.state.message}
                  </p>
                )}
                <div className="h-px w-full bg-[#CAC4D0]" />
                <div className="flex w-full">
                  <p className="w-1/2 text-sm text-gray-500">CEP</p>
                  <div className="w-1/2">
                    {isEditing ? (
                      <Input
                        {...register('office.cep')}
                        className="border-purple-300 focus:border-purple-500"
                        placeholder="00000-000"
                      />
                    ) : (
                      <p className="font-medium text-gray-900">
                        {currentDoctor?.office?.cep
                          ? formatcep(currentDoctor.office?.cep)
                          : '-'}
                      </p>
                    )}
                    {errors.office?.cep && (
                      <p className="text-xs text-red-500">
                        {errors.office.cep.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </form>
      </div>
      <ConfirmationModal
        isOpen={isDeletingAccount}
        setIsOpen={setIsDeletingAccount}
        title="Tem certeza que deseja excluir sua conta?"
        content="Esta ação é irreversível e todos os seus dados serão perdidos. Você será redirecionado para a página de login."
        actionLabel="Excluir"
        action={handleDeleteAccount}
      />
    </div>
  )
}
