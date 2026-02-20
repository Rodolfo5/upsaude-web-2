'use client'

import Image from 'next/image'

import { CompleteRegistrationForm } from '@/components/organisms/Forms/SignUpForm/CompleteRegistrationForm'

export default function CompleteRegistration() {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      <div className="flex min-h-[200px] w-full flex-shrink-0 flex-col items-center justify-center bg-gradient-to-b from-[#792EBD] to-[#EB34EF] py-8 lg:min-h-screen lg:w-3/5 lg:py-0">
        <div className="flex flex-col items-center space-y-4">
          <Image
            src="/logoupsaude.png"
            alt="Logo Upsaude"
            width={300}
            height={300}
            className="h-auto w-40 object-contain sm:w-56 lg:w-[300px]"
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-center justify-start overflow-y-auto bg-white px-4 py-8 sm:px-8 sm:py-12 lg:px-16 lg:py-16">
        <CompleteRegistrationForm />
      </div>
    </div>
  )
}
