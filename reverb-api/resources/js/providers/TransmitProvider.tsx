import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Transmit } from '@adonisjs/transmit-client'

const TransmitContext = createContext<Transmit | null>(null)

export function TransmitProvider({ children }: PropsWithChildren) {
  const transmitRef = useRef<Transmit | null>(null)

  if (transmitRef.current === null) {
    transmitRef.current = new Transmit({
      baseUrl: window.location.origin,
    })
  }

  return <TransmitContext.Provider value={transmitRef.current}>{children}</TransmitContext.Provider>
}

export function useTransmit() {
  const context = useContext(TransmitContext)
  if (context === null) {
    throw new Error('useTransmit must be used within a TransmitProvider')
  }
  return context
}

export function useTransmitStream<T = unknown>(streamName: string) {
  const transmit = useTransmit()
  const [data, setData] = useState<T | null>(null)

  useEffect(() => {
    let isMounted = true
    const subscription = transmit.subscription(streamName)
    subscription.create().then(() => {
      if (isMounted) {
        const stopListening = subscription.onMessage((message: T) => {
          setData(message)
        })

        return () => {
          stopListening()
          subscription.delete()
        }
      }
    })

    return () => {
      isMounted = false
    }
  }, [transmit, streamName])

  return data
}
