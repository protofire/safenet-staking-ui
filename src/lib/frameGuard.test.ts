import { afterEach, describe, expect, it, vi } from 'vitest'

import { isFrameAncestorAllowed, renderFrameBlockedNotice } from './frameGuard'

function embedIn(ancestors: string[] | undefined) {
  vi.stubGlobal('top', {})
  vi.spyOn(window, 'location', 'get').mockReturnValue({
    ...window.location,
    origin: window.location.origin,
    ancestorOrigins: ancestors as unknown as DOMStringList,
  })
}

describe('isFrameAncestorAllowed', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('allows top-level windows', () => {
    expect(isFrameAncestorAllowed()).toBe(true)
  })

  it('allows frames when the browser does not expose ancestor origins', () => {
    embedIn(undefined)
    expect(isFrameAncestorAllowed()).toBe(true)
    embedIn([])
    expect(isFrameAncestorAllowed()).toBe(true)
  })

  it('allows Safe hosts over https and the app itself', () => {
    embedIn(['https://app.safe.global', 'https://safe.protofire.io', window.location.origin])

    expect(isFrameAncestorAllowed()).toBe(true)
  })

  it.each([
    ['an unrelated host', 'https://evil.example'],
    ['a Safe host over http', 'http://app.safe.global'],
    ['a lookalike domain', 'https://safe.global.evil.example'],
    ['a malformed origin', 'not a url'],
  ])('blocks %s', (_name, origin) => {
    embedIn(['https://app.safe.global', origin])

    expect(isFrameAncestorAllowed()).toBe(false)
  })
})

describe('renderFrameBlockedNotice', () => {
  it('replaces the root contents with the notice', () => {
    const root = document.createElement('div')
    root.innerHTML = '<span>app</span>'

    renderFrameBlockedNotice(root)

    expect(root.children).toHaveLength(1)
    expect(root.textContent).toMatch(/cannot be embedded on this site/)
  })
})
