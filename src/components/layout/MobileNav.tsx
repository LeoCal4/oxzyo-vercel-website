'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { NavLinks } from './NavLinks'
import { LocaleSwitcher } from './LocaleSwitcher'

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Apri menu"
          className="p-2 rounded-md hover:bg-white/10 transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-64 bg-[#fd7c01] text-white border-l-0 pt-16">
        <SheetTitle className="sr-only">Menu di navigazione</SheetTitle>
        <div className="flex flex-col gap-8">
          <NavLinks
            className="flex-col items-start gap-5"
            linkClassName="text-white text-base"
            activeLinkClassName="underline underline-offset-4"
            onClick={() => setOpen(false)}
          />
          <LocaleSwitcher className="mt-2" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
