'use client'

import Image from 'next/image'
import Link from 'next/link'

import { AuthTemplateProps } from './types'

export default function AuthTemplate({ form, footerLink }: AuthTemplateProps) {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Painel esquerdo: logo (empilha no mobile, lado a lado no desktop) */}
      <div className="flex min-h-[160px] w-full flex-shrink-0 flex-col items-center justify-center bg-gradient-to-b from-[#792EBD] to-[#EB34EF] py-6 sm:py-8 lg:min-h-screen lg:w-2/5 lg:py-0">
        <div className="flex flex-col items-center">
          <Image
            src="/logoupsaude.png"
            alt="Logo Upsaude"
            width={300}
            height={300}
            className="h-auto w-20 sm:w-28 md:w-36 lg:w-44 xl:w-52"
          />
        </div>
      </div>

      {/* Painel direito: formulário */}
      <div className="flex min-w-0 flex-1 flex-col items-center justify-start overflow-x-hidden bg-white px-4 py-8 sm:px-6 sm:py-10 md:px-10 md:py-12 lg:w-3/5 lg:justify-center lg:px-12 lg:py-16 xl:px-16">
        <div className="w-full max-w-md space-y-6">
          <div className="min-w-0 rounded-lg bg-white shadow-sm">{form}</div>

          {footerLink && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {footerLink.text}{' '}
                <Link
                  href={footerLink.href}
                  className="font-medium text-purple-600 hover:text-purple-800"
                >
                  {footerLink.linkText}
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
