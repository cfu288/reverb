import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware to log request timing information
 */
export default class RequestTimingMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Start timing
    const startTime = performance.now()
    const method = ctx.request.method()
    const url = ctx.request.url()
    const requestId = Math.random().toString(36).substring(7)
    
    console.log(`[Request Timing] ${requestId} - Started: ${method} ${url}`)
    
    // Store timing data directly on context
    ;(ctx as any).requestStartTime = startTime
    ;(ctx as any).requestId = requestId
    ;(ctx as any).authTime = 0
    
    try {
      // Execute the rest of the middleware pipeline
      await next()
      
      // Calculate total time after response is ready
      const endTime = performance.now()
      const totalTime = endTime - startTime
      const status = ctx.response.getStatus()
      
      console.log(
        `[Request Timing] ${requestId} - Completed: ${method} ${url} - Status: ${status} - Time: ${totalTime.toFixed(2)}ms`
      )
      
      // Log breakdown if we have auth timing
      const authTime = (ctx as any).authTime || 0
      if (authTime > 0) {
        const otherTime = totalTime - authTime
        console.log(
          `[Request Timing] ${requestId} - Breakdown: Auth=${authTime.toFixed(2)}ms (${((authTime/totalTime)*100).toFixed(0)}%), Other=${otherTime.toFixed(2)}ms (${((otherTime/totalTime)*100).toFixed(0)}%)`
        )
      }
      
      // Add timing header to response
      ctx.response.header('X-Response-Time', `${totalTime.toFixed(2)}ms`)
      
    } catch (error) {
      // Log error timing
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      console.log(
        `[Request Timing] ${requestId} - Failed: ${method} ${url} - Time: ${totalTime.toFixed(2)}ms - Error: ${error.message}`
      )
      
      // Re-throw the error
      throw error
    }
  }
}