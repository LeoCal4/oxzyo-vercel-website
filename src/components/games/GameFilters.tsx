'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useTransition, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type Option = { id: string; name: string }

type Props = {
  mechanics: Option[]
  categories: Option[]
  designers: Option[]
  currentParams: Record<string, string | string[] | undefined>
}

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '')
}

function arr(v: string | string[] | undefined): string[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

function useFilterRouter(currentParams: Record<string, string | string[] | undefined>) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  return useCallback(
    (key: string, value: string | string[] | null) => {
      const params = new URLSearchParams()
      for (const [k, v] of Object.entries(currentParams)) {
        if (v == null) continue
        if (Array.isArray(v)) v.forEach((val) => params.append(k, val))
        else params.set(k, v)
      }
      params.delete('page')

      if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
        params.delete(key)
      } else if (Array.isArray(value)) {
        params.delete(key)
        value.forEach((v) => params.append(key, v))
      } else {
        params.set(key, value)
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, currentParams],
  )
}

function MultiSelect({
  label,
  options,
  selectedIds,
  onChange,
}: {
  label: string
  options: Option[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const count = selectedIds.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm text-left',
            count > 0
              ? 'border-[#fd7c01] bg-orange-50 text-[#fd7c01] font-medium'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
          )}
        >
          <span>{count > 0 ? `${label} (${count})` : label}</span>
          <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 ml-2" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 max-h-72 overflow-y-auto">
        {options.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.id}
            checked={selectedIds.includes(opt.id)}
            onCheckedChange={(checked) => {
              onChange(checked ? [...selectedIds, opt.id] : selectedIds.filter((id) => id !== opt.id))
            }}
          >
            {opt.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function FiltersForm({ mechanics, categories, designers, currentParams }: Props) {
  const t = useTranslations('games')
  const updateFilter = useFilterRouter(currentParams)

  const search = str(currentParams.search)
  const players = str(currentParams.players)
  const minTime = str(currentParams.minTime)
  const maxTime = str(currentParams.maxTime)
  const minWeight = str(currentParams.minWeight)
  const maxWeight = str(currentParams.maxWeight)
  const selectedMechanics = arr(currentParams.mechanics)
  const selectedCategories = arr(currentParams.categories)
  const selectedDesigners = arr(currentParams.designers)
  const staffPick = str(currentParams.staffPick) === 'true'

  const hasFilters =
    search || players || minTime || maxTime || minWeight || maxWeight ||
    selectedMechanics.length || selectedCategories.length || selectedDesigners.length || staffPick

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={t('filterSearch')}
          defaultValue={search}
          className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-[#fd7c01] focus:ring-1 focus:ring-[#fd7c01]"
          onChange={(e) => updateFilter('search', e.target.value || null)}
        />
      </div>

      {/* Players */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{t('filterPlayers')}</label>
        <input
          type="number"
          min={1}
          max={20}
          placeholder={t('filterPlayersPlaceholder')}
          defaultValue={players}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#fd7c01] focus:ring-1 focus:ring-[#fd7c01]"
          onChange={(e) => updateFilter('players', e.target.value || null)}
        />
      </div>

      {/* Playtime */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{t('filterPlaytime')}</label>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            placeholder={t('filterMin')}
            defaultValue={minTime}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#fd7c01] focus:ring-1 focus:ring-[#fd7c01]"
            onChange={(e) => updateFilter('minTime', e.target.value || null)}
          />
          <input
            type="number"
            min={0}
            placeholder={t('filterMax')}
            defaultValue={maxTime}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#fd7c01] focus:ring-1 focus:ring-[#fd7c01]"
            onChange={(e) => updateFilter('maxTime', e.target.value || null)}
          />
        </div>
      </div>

      {/* Weight */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {t('filterWeight')}
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={5}
            step={0.5}
            placeholder={t('filterMin')}
            defaultValue={minWeight}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#fd7c01] focus:ring-1 focus:ring-[#fd7c01]"
            onChange={(e) => updateFilter('minWeight', e.target.value || null)}
          />
          <input
            type="number"
            min={1}
            max={5}
            step={0.5}
            placeholder={t('filterMax')}
            defaultValue={maxWeight}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#fd7c01] focus:ring-1 focus:ring-[#fd7c01]"
            onChange={(e) => updateFilter('maxWeight', e.target.value || null)}
          />
        </div>
      </div>

      {/* Mechanics */}
      {mechanics.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('filterMechanics')}</label>
          <MultiSelect
            label={t('filterMechanics')}
            options={mechanics}
            selectedIds={selectedMechanics}
            onChange={(ids) => updateFilter('mechanics', ids)}
          />
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('filterCategories')}</label>
          <MultiSelect
            label={t('filterCategories')}
            options={categories}
            selectedIds={selectedCategories}
            onChange={(ids) => updateFilter('categories', ids)}
          />
        </div>
      )}

      {/* Designers */}
      {designers.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('filterDesigners')}</label>
          <MultiSelect
            label={t('filterDesigners')}
            options={designers}
            selectedIds={selectedDesigners}
            onChange={(ids) => updateFilter('designers', ids)}
          />
        </div>
      )}

      {/* Staff pick */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          defaultChecked={staffPick}
          className="rounded border-gray-300 text-[#fd7c01] focus:ring-[#fd7c01]"
          onChange={(e) => updateFilter('staffPick', e.target.checked ? 'true' : null)}
        />
        <span className="text-sm text-gray-700">{t('filterStaffPick')}</span>
      </label>

      {/* Reset */}
      {hasFilters && (
        <a
          href={typeof window !== 'undefined' ? window.location.pathname : ''}
          className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
        >
          <X className="h-3.5 w-3.5" />
          {t('filterReset')}
        </a>
      )}
    </div>
  )
}

export function GameFilters(props: Props) {
  const t = useTranslations('games')
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-20">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">{t('filterHeading')}</h2>
          <FiltersForm {...props} />
        </div>
      </aside>

      {/* Mobile filter button */}
      <div className="lg:hidden mb-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">
              <SlidersHorizontal className="h-4 w-4" />
              {t('filterHeading')}
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 overflow-y-auto pt-12">
            <SheetTitle className="text-sm font-semibold text-gray-700 mb-4">{t('filterHeading')}</SheetTitle>
            <FiltersForm {...props} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
