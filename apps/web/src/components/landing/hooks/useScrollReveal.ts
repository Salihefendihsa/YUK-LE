import { type RefObject } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, registerGsapPlugins } from '../../../lib/gsap'
import {
  REVEAL_FROM,
  REVEAL_TO,
  prefersReducedMotion,
  setRevealVisible,
} from '../../../lib/scrollReveal'

registerGsapPlugins()
gsap.registerPlugin(useGSAP)

export type UseScrollRevealOptions = {
  selector?: string
  stagger?: number
  start?: string
  trigger?: RefObject<HTMLElement | null>
  once?: boolean
  enabled?: boolean
}

export function useScrollReveal(
  scopeRef: RefObject<HTMLElement | null>,
  {
    selector = '[data-reveal]',
    stagger = 0.1,
    start = 'top 82%',
    trigger,
    once = true,
    enabled = true,
  }: UseScrollRevealOptions = {},
) {
  useGSAP(
    () => {
      if (!enabled) return

      const scope = scopeRef.current
      if (!scope) return

      const targets = scope.querySelectorAll<HTMLElement>(selector)
      if (!targets.length) return

      if (prefersReducedMotion()) {
        setRevealVisible(targets)
        return
      }

      const triggerEl = trigger?.current ?? scope

      gsap.set(targets, REVEAL_FROM)
      gsap.to(targets, {
        ...REVEAL_TO,
        stagger,
        scrollTrigger: {
          trigger: triggerEl,
          start,
          toggleActions: once ? 'play none none none' : 'play reverse play reverse',
        },
      })
    },
    { scope: scopeRef, dependencies: [enabled, stagger, start, selector, once] },
  )
}
