import React, { useEffect, useState, useMemo, useSyncExternalStore } from 'react'
import { useTransmitStream } from '../providers/TransmitProvider.tsx'
import { Model } from 'json-joy/esm/json-crdt/model/Model.js'
import { Decoder } from 'json-joy/esm/json-crdt/codec/structural/compact/Decoder.js'
import {
  encode as encodePatch,
  decode as decodePatch,
  CompactCodecPatch,
} from 'json-joy/esm/json-crdt-patch/codec/compact/index.js'
import debounce from 'lodash.debounce'

type TransmitData = {
  patches: {
    ops: any[]
  }
}

// only used for initial model setup. Patch encoding/decoding is a seperate process
const decoder = new Decoder()

const SyncedTextInput = React.memo(({ model, path }: { model: Model; path: string[] }) => {
  const textNode = useMemo(() => model.api.str(path), [model])
  const text = useSyncExternalStore(
    textNode.events.subscribe,
    textNode.events.getSnapshot,
    textNode.events.getSnapshot
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    textNode.del(0, textNode.length())
    textNode.ins(0, value)
  }

  return (
    <input
      type="text"
      value={text}
      onChange={handleChange}
      style={{
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '16px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    />
  )
})

export default function App() {
  const [model, setModel] = useState<Model | null>(null)
  const data = useTransmitStream<TransmitData>('patches')

  useEffect(() => {
    const initModel = async () => {
      const response = await fetch('/__transmit/crdt/init')
      const { model: encodedModel } = await response.json()
      const newModel = decoder.decode(encodedModel)
      setModel(newModel.fork())
    }
    initModel()
  }, [])

  useEffect(() => {
    if (!model || !data?.patches) return

    try {
      const patches = decodePatch(data.patches as unknown as CompactCodecPatch)
      model.applyPatch(patches)
    } catch (error) {
      console.error('Failed to apply patches:', error)
    }
  }, [data, model])

  useEffect(() => {
    if (!model) return

    const debouncedSync = debounce(
      async () => {
        try {
          const patches = model.api.flush()
          if (patches.ops.length === 0) {
            return
          }
          const patchJson = encodePatch(patches)

          const response = await fetch('/__transmit/patch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ patches: patchJson }),
          })

          if (!response.ok) {
            throw new Error(`Failed to transmit patch: ${response.statusText}`)
          }
        } catch (error) {
          console.error('Error transmitting patch:', error)
        }
      },
      100,
      {
        leading: true,
        trailing: true,
        maxWait: 200,
      }
    )

    const unsubscribe = model.api.onLocalChanges.listen(() => {
      debouncedSync()
    })
    return () => unsubscribe()
  }, [model])

  if (!model) {
    return <div>Loading...</div>
  }

  const items = model.view().items

  return (
    <div>
      <h1 className="text-3xl font-bold underline">Collaborative Text Editor</h1>
      {items?.map((item: any, index: number) => (
        <div key={index}>
          <SyncedTextInput model={model} path={['items', index, 'input1']} />
          <SyncedTextInput model={model} path={['items', index, 'input2']} />
        </div>
      ))}
    </div>
  )
}
