import * as React from 'react'

import { Container, Hr, Section, Text } from '@react-email/components'

export const SITE_NAME = 'Welcome to HVAC'
export const SITE_URL = 'https://welcometohvac.com'

export const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
}
export const container = {
  padding: '24px',
  maxWidth: '560px',
  margin: '0 auto',
  border: '1px solid #e6eaee',
  borderRadius: '12px',
}
export const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#101a24',
  margin: '0 0 16px',
}
export const text = {
  fontSize: '15px',
  color: '#4a5561',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
export const link = { color: '#26313f', textDecoration: 'underline' }
export const button = {
  backgroundColor: '#26313f',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  border: '1px solid #26313f',
  borderRadius: '8px',
  padding: '13px 22px',
  textDecoration: 'none',
  display: 'inline-block',
}
export const notice = {
  fontSize: '13px',
  color: '#4a5561',
  lineHeight: '1.6',
  backgroundColor: '#f4f6f8',
  borderRadius: '8px',
  padding: '12px 14px',
  margin: '24px 0 0',
}
export const footer = {
  fontSize: '12px',
  color: '#8a949e',
  lineHeight: '1.6',
  margin: '16px 0 0',
}

// Rendered as a text child, which React may HTML-escape: keep this CSS free of >, &, and quotes.
export const darkModeCss = `
  @media (prefers-color-scheme: dark) {
    .dm-btn { background-color: #ffffff !important; color: #101a24 !important; border-color: #ffffff !important; }
  }
  [data-ogsc] .dm-btn { background-color: #ffffff !important; color: #101a24 !important; }
  [data-ogsb] .dm-btn { background-color: #ffffff !important; color: #101a24 !important; }
`

const brandRow = {
  fontSize: '17px',
  fontWeight: 'bold' as const,
  color: '#26313f',
  letterSpacing: '0.02em',
  margin: '0 0 4px',
}
const tagline = { fontSize: '12px', color: '#8a949e', margin: '0 0 18px' }

export const BrandHeader = () => (
  <Section>
    <Text style={brandRow}>Welcome to HVAC</Text>
    <Text style={tagline}>HVAC learning, reference and diagnostics</Text>
    <Hr style={{ borderColor: '#e6eaee', margin: '0 0 24px' }} />
  </Section>
)

export const BrandFooter = ({ children }: { children?: React.ReactNode }) => (
  <Container>
    <Hr style={{ borderColor: '#e6eaee', margin: '28px 0 14px' }} />
    {children}
    <Text style={footer}>
      Sent by Welcome to HVAC · welcometohvac.com
      <br />
      This is an automated account message. Please do not reply.
    </Text>
  </Container>
)
