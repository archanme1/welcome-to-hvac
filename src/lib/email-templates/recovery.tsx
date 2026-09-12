import * as React from 'react'

import {
  Body,
  Button,
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
  button,
  container,
  darkModeCss,
  h1,
  main,
  notice,
  text,
} from './brand'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Reset your {siteName} password</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset the password for your {siteName}
          account. Choose a new password by clicking the button below.
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Reset my password
        </Button>
        <Text style={notice}>
          Security notice: this link expires after a short time and can only be
          used once. If you did not request a password reset, you can safely
          ignore this email — your password will not change.
        </Text>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
