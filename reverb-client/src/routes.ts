export const AppRoutes = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  SCUTSHEET_GENERATE_PDF: '/scutsheet/generate-pdf',
  SCUTSHEET_VIEW: '/scutsheet/:templateId',
  PATIENT_LIST_EDITOR: '/patient-list/edit',
  BP_LOG: '/bp-log',
  TEMPLATE_CONFIG: '/template-config',
  TEMPLATE_CREATE: '/template-config/create',
  TEMPLATE_EDIT: '/template-config/edit/:templateId',
} as const;