import { motion, useReducedMotion } from 'framer-motion'
import type { PropsWithChildren } from 'react'

export function PageTransition({ children }: PropsWithChildren) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}
