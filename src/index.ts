import { JwtPayload } from 'jsonwebtoken'
import { createJWKS, createKeyPair, signJwt } from './tools.js'
import { setupServer } from 'msw/node'
import { HttpResponse, http, RequestHandlerOptions } from 'msw'

const createJWKSMock = (
  jwksBase: string,
  jwksPath = '/.well-known/jwks.json'
) => {
  const keypair = createKeyPair()
  const JWKS = createJWKS({
    ...keypair,
    jwksOrigin: jwksBase,
  })
  const jwksHandler = (options?: RequestHandlerOptions) =>
    http.get(
      new URL(jwksPath, jwksBase).href,
      () => HttpResponse.json(JWKS),
      options
    )
  const server = setupServer(jwksHandler())

  const kid = () => JWKS.keys[0].kid

  const start = () => {
    server.listen({ onUnhandledRequest: 'bypass' })
  }
  const stop = () => {
    server.close()
  }

  const token = (token: JwtPayload = {}) =>
    signJwt(keypair.privateKey, token, kid())

  return {
    start,
    stop,
    kid,
    token,
    jwksHandler,
  }
}

export type JWKSMock = ReturnType<typeof createJWKSMock>

export default createJWKSMock
