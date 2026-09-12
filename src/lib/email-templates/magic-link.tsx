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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Your sign-in link for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandHeader />
        <Heading style={h1}>Your sign-in link</Heading>
        <Text style={text}>
          Use the button below to sign in to {siteName}. You requested this link
          from the sign-in page.
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Sign in
        </Button>
        <Text style={notice}>
          Security notice: this link expires after a short time and can only be
          used once. If you did not request it, you can safely ignore this
          email.
        </Text>
        <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
