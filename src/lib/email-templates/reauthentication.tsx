import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'

import {
  BrandFooter,
  BrandHeader,
  container,
  h1,
  main,
  notice,
  text,
} from './brand'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Welcome to HVAC verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Heading style={h1}>Confirm it is you</Heading>
        <Text style={text}>
          Use the verification code below to confirm your identity on Welcome to
          HVAC:
        </Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={notice}>
          Security notice: this code expires shortly and should never be shared.
          If you did not request it, you can safely ignore this email.
        </Text>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '24px',
  fontWeight: 'bold' as const,
  letterSpacing: '0.12em',
  color: '#101a24',
  margin: '0 0 24px',
}
