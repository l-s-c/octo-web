import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { SSOProvider } from '../types'

// providers.ts 不再持有硬编码 SSO_PROVIDERS 常量,改为运行时从
// WKApp.remoteConfig.oidcProviders 读取后端 /v1/common/appconfig 下发的
// provider 列表。测试通过 vi.mock('@octo/base') 注入受控的 remoteConfig
// 模拟后端不同响应。
const remoteConfig: { oidcProviders: SSOProvider[] } = { oidcProviders: [] }

vi.mock('@octo/base', () => {
  return {
    WKApp: {
      get remoteConfig() {
        return remoteConfig
      },
    },
  }
})

import { getSSOProviders, getProviderById } from '../providers'

beforeEach(() => {
  remoteConfig.oidcProviders = []
})

describe('getSSOProviders', () => {
  it('returns providers from WKApp.remoteConfig.oidcProviders', () => {
    remoteConfig.oidcProviders = [
      {
        id: 'aegis',
        name: 'Aegis',
        authorizePath: '/v1/auth/oidc/aegis/authorize',
        accountUrl: 'https://aegis.example.com',
        resetPasswordUrl: 'https://aegis.example.com/reset',
      },
    ]
    const result = getSSOProviders()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('aegis')
    expect(result[0].name).toBe('Aegis')
    expect(result[0].authorizePath).toBe('/v1/auth/oidc/aegis/authorize')
    expect(result[0].accountUrl).toBe('https://aegis.example.com')
    expect(result[0].resetPasswordUrl).toBe('https://aegis.example.com/reset')
  })

  it('returns empty array when remoteConfig has no providers', () => {
    expect(getSSOProviders()).toEqual([])
  })

  it('reflects remoteConfig changes between calls (no module-load freezing)', () => {
    expect(getSSOProviders()).toEqual([])
    remoteConfig.oidcProviders = [
      { id: 'oidc', name: 'SSO', authorizePath: '/v1/auth/oidc/oidc/authorize' },
    ]
    expect(getSSOProviders()).toHaveLength(1)
  })
})

describe('getProviderById', () => {
  beforeEach(() => {
    remoteConfig.oidcProviders = [
      { id: 'aegis', name: 'Aegis', authorizePath: '/v1/auth/oidc/aegis/authorize' },
      { id: 'google', name: 'Google', authorizePath: '/v1/auth/oidc/google/authorize' },
    ]
  })

  it('returns the provider when id matches', () => {
    const result = getProviderById('aegis')
    expect(result?.id).toBe('aegis')
    expect(result?.name).toBe('Aegis')
  })

  it('matches against the configured id (no longer hardcoded to aegis)', () => {
    expect(getProviderById('google')?.name).toBe('Google')
  })

  it('returns undefined when id does not match', () => {
    expect(getProviderById('nonexistent')).toBeUndefined()
  })

  it('returns undefined when remoteConfig has no providers', () => {
    remoteConfig.oidcProviders = []
    expect(getProviderById('aegis')).toBeUndefined()
  })
})
