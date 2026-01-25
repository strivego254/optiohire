import '@testing-library/jest-dom'

const { TextDecoder, TextEncoder } = require('util')

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder
}

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder
}

const { fetch, Request, Response, Headers } = require('undici')

global.fetch = fetch
global.Request = Request
global.Response = Response
global.Headers = Headers
