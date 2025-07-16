import { HttpContext } from '@adonisjs/core/http'

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    currentTenantPathParam: string | null
    currentPatientListPathParam: string | null
    currentUserPathParam: string | null
  }
}

HttpContext.getter('currentTenantPathParam', function (this: HttpContext): string | null {
  return this?.params?.org || null
})

HttpContext.getter('currentPatientListPathParam', function (this: HttpContext): string | null {
  return this?.params?.patient_list || null
})

HttpContext.getter('currentUserPathParam', function (this: HttpContext): string | null {
  return this?.params?.user || null
})
