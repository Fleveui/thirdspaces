export type AccentMode = 'find' | 'host'

export interface AccentClasses {
  imageBg: string
  placeholderText: string
  categoryBadge: string
  inputClass: string
  primaryBtn: string
  checkboxAccent: string
  successBanner: string
  successTitle: string
  link: string
  selectedBorder: string
  selectedDot: string
  stripBg: string
  requestBadge: string
  chipActive: string
  chipInactive: string
  radioBorder: string
  radioDot: string
}

const findAccent: AccentClasses = {
  imageBg: 'bg-primary-light',
  placeholderText: 'text-primary/50',
  categoryBadge: 'bg-primary-light text-primary',
  inputClass: 'input-lavender',
  primaryBtn: 'btn-primary w-full rounded-3xl py-4',
  checkboxAccent: 'accent-primary',
  successBanner: 'mt-8 p-4 rounded-2xl bg-primary-light/40',
  successTitle: 'font-medium text-primary',
  link: 'text-primary hover:underline',
  selectedBorder: 'border-primary bg-primary-light/40',
  selectedDot: 'border-primary bg-primary',
  stripBg: 'bg-primary-light/60 hover:bg-primary-light',
  requestBadge: 'bg-primary text-white',
  chipActive: 'bg-primary text-white border-primary',
  chipInactive: 'bg-primary-light/60 text-dark border-transparent hover:border-primary/30',
  radioBorder: 'border-primary',
  radioDot: 'bg-primary',
}

const hostAccent: AccentClasses = {
  imageBg: 'bg-host-cream',
  placeholderText: 'text-host-cream-accent/60',
  categoryBadge: 'bg-host-cream-light/80 text-host-cream-accent',
  inputClass: 'input-cream',
  primaryBtn: 'btn-host w-full rounded-3xl py-4',
  checkboxAccent: 'accent-host-cream',
  successBanner: 'mt-8 p-4 rounded-2xl bg-host-cream-light/50',
  successTitle: 'font-medium text-dark',
  link: 'text-host-cream-accent hover:underline',
  selectedBorder: 'border-host-cream bg-host-cream-light/50',
  selectedDot: 'border-host-cream bg-host-cream',
  stripBg:
    'bg-host-cream-light/70 hover:bg-host-cream-light border border-host-cream-accent/20',
  requestBadge:
    'bg-host-cream-light border border-host-cream-accent/25 text-dark hover:bg-host-cream',
  chipActive: 'bg-host-cream text-dark border-host-cream',
  chipInactive:
    'bg-host-cream-light/50 text-dark border-transparent hover:border-host-cream/40',
  radioBorder: 'border-host-cream',
  radioDot: 'bg-host-cream',
}

export function accentClasses(accent: AccentMode): AccentClasses {
  return accent === 'host' ? hostAccent : findAccent
}
