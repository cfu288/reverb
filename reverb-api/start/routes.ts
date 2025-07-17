/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import transmit from '@adonisjs/transmit/services/main'
// CRDT imports commented out until json-joy is installed
// import { Model } from 'json-joy/lib/json-crdt/model/Model.js'
// import { Encoder } from 'json-joy/lib/json-crdt/codec/structural/compact/Encoder.js'
// import { Patch } from 'json-joy/lib/json-crdt-patch/Patch.js'
// import {
//   encode as encodePatch,
//   decode as decodePatch,
//   CompactCodecPatch,
// } from 'json-joy/lib/json-crdt-patch/codec/compact/index.js'
import logger from '@adonisjs/core/services/logger'
// import { s } from 'json-joy/lib/json-crdt-patch/builder/schema.js'

// CRDT code commented out until json-joy is installed
// // Schema builder s
// const schema = s.obj({
//   items: s.arr([
//     s.obj({
//       input1: s.str(''),
//       input2: s.str(''),
//     }),
//     s.obj({
//       input1: s.str('1'),
//       input2: s.str('2'),
//     }),
//     s.obj({
//       input1: s.str('3'),
//       input2: s.str('4'),
//     }),
//   ]),
// })

// function getServerTimestamp() {
//   return new Date().valueOf()
// }

// const serverModel = Model.create(schema, getServerTimestamp())

// // encoder is only used for initial model setup. Patch encoding/decoding is a separate process
// const encoder = new Encoder()

// serverModel.api.onChanges.listen((patches: (number | Patch | undefined)[]) => {
//   if (patches?.length) {
//     patches.forEach((patch) => {
//       if (patch instanceof Patch) {
//         const patchJson = encodePatch(patch)
//         transmit.broadcast('patches', { patches: patchJson as any })
//       } else {
//         logger.warn('Invalid patch format:', patch)
//       }
//     })
//   }
// })

// router.get('/__transmit/crdt/init', async ({ response }) => {
//   const encoded = encoder.encode(serverModel)
//   response.ok({ model: encoded })
// })

// router.post('/__transmit/patch', async ({ request, response }) => {
//   const { patches } = request.body()

//   if (patches && typeof patches === 'object') {
//     try {
//       const patch = decodePatch(patches)
//       serverModel.applyPatch(patch)
//       response.ok({ status: 'ok' })
//     } catch (error) {
//       logger.error('Failed to decode patches:', {
//         message: error.message,
//         stack: error.stack,
//       })
//       response.badRequest({ error: 'Invalid patch data', details: error.message })
//     }
//   } else {
//     logger.error('Invalid patch data format')
//     response.badRequest({ error: 'Invalid patch data format' })
//   }
// })

// Transmit routes
const EventStreamController = () => import('@adonisjs/transmit/controllers/event_stream_controller')
const SubscribeController = () => import('@adonisjs/transmit/controllers/subscribe_controller')
const UnsubscribeController = () => import('@adonisjs/transmit/controllers/unsubscribe_controller')

router.get('/__transmit/events', [EventStreamController])
router.post('/__transmit/subscribe', [SubscribeController])
router.post('/__transmit/unsubscribe', [UnsubscribeController])

// App routes

const UsersController = () => import('#controllers/user_controller')
const AuthController = () => import('#controllers/auth_controller')
const TenantController = () => import('#controllers/tenant_controller')
const PatientListController = () => import('#controllers/patient_list_controller')
const PatientController = () => import('#controllers/patient_controller')

router.on('/').render('index')

router.post('/user', [UsersController, 'create'])
router.post('/user/login', [AuthController, 'login'])
router.post('/user/refresh', [AuthController, 'refresh'])

router
  .group(() => {
    router
      .group(() => {
        router.get('/org', [TenantController, 'all'])
        router
          .group(() => {
            router.get('/', [TenantController, 'view'])

            router.post('/user', [UsersController, 'create'])
            router.get('/user/:user', [UsersController, 'view'])
            router.get('/user', [UsersController, 'all'])

            // Patient list routes
            router.post('/patient-list', [PatientListController, 'create'])
            router.get('/patient-list', [PatientListController, 'all'])
            router.get('/patient-list/:url_safe_name', [PatientListController, 'view'])
            router.delete('/patient-list/:url_safe_name', [PatientListController, 'delete'])

            // Patient routes
            router.post('/patient-list/:list/patient', [PatientController, 'create'])
            router.get('/patient/:id', [PatientController, 'view'])
            router.put('/patient/:id', [PatientController, 'update'])
            router.delete('/patient/:id', [PatientController, 'delete'])
          })
          .prefix('org/:org')
      })
      .prefix('v1')
  })
  .prefix('api')
