import transmit from '@adonisjs/transmit/services/main'
// import Chat from '#models/chat'
import PatientList from '#models/patient_list'
import type { HttpContext } from '@adonisjs/core/http'
import ResourceNotFoundException from '#exceptions/resource_not_found_exception'
import { inject } from '@adonisjs/core'
import { TenantService } from '#services/tenant_service'
import { PatientListService } from '#services/patient_list_service'
import User from '#models/user'
import app from '@adonisjs/core/services/app'
import TransmitAuthService from '#services/transmit_auth_service'

transmit.authorize<{ url_safe_name: string }>(
  'patient-list/:url_safe_name',
  async (ctx: HttpContext, { url_safe_name }) => {
    const transmitAuthService = await app.container.make(TransmitAuthService)
    return transmitAuthService.authorizePatientList(ctx, url_safe_name)
  }
)
