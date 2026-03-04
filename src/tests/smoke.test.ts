import { describe, it, expect } from 'vitest'

describe('Vitest setup', () => {
  it('runs a trivial assertion', () => {
    expect(1 + 1).toBe(2)
  })

  it('has access to jest-dom matchers', () => {
    const div = document.createElement('div')
    div.textContent = 'OxzyO'
    expect(div).toHaveTextContent('OxzyO')
  })
})
