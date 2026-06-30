import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components"

interface OtpEmailProps {
  code: string
  isNewUser?: boolean
}

export default function OtpEmail({ code = "123456", isNewUser = false }: OtpEmailProps) {
  const headline = isNewUser ? "Welcome to paper7." : "Here's your sign-in code."
  const sub = isNewUser
    ? "You're joining a community of readers who annotate what matters in research."
    : "Use this code to continue. It expires in 10 minutes."

  return (
    <Html lang="en">
      <Head />
      <Preview>{code} — your paper7 code</Preview>
      <Body style={body}>
        <Container style={container}>

          <Text style={logo}>paper7</Text>

          <Section style={card}>
            <Text style={headline_}>{headline}</Text>
            <Text style={subtext}>{sub}</Text>

            <Section style={codeBox}>
              <Text style={codeText}>{code}</Text>
            </Section>

            <Text style={expiry}>Expires in 10 minutes · Do not share this code</Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            You received this because someone tried to sign in to{" "}
            <Link href="https://paper7.org" style={footerLink}>paper7.org</Link>{" "}
            with this email. If this wasn't you, ignore it.
          </Text>

        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = {
  backgroundColor: "#000000",
  fontFamily: "Georgia, serif",
  margin: 0,
  padding: "48px 0",
}

const container: React.CSSProperties = {
  maxWidth: "520px",
  margin: "0 auto",
  padding: "0 24px",
}

const logo: React.CSSProperties = {
  fontFamily: "Georgia, serif",
  fontSize: "22px",
  fontWeight: 400,
  color: "#fcfdff",
  letterSpacing: "-0.5px",
  margin: "0 0 40px 0",
}

const card: React.CSSProperties = {
  backgroundColor: "#0a0a0c",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "16px",
  padding: "40px",
}

const headline_: React.CSSProperties = {
  fontFamily: "Georgia, serif",
  fontSize: "26px",
  fontWeight: 400,
  color: "#fcfdff",
  lineHeight: "1.25",
  letterSpacing: "-0.3px",
  margin: "0 0 8px 0",
}

const subtext: React.CSSProperties = {
  fontFamily: "Arial, sans-serif",
  fontSize: "14px",
  color: "rgba(252,253,255,0.5)",
  lineHeight: "1.6",
  margin: "0 0 36px 0",
}

const codeBox: React.CSSProperties = {
  backgroundColor: "#06060a",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "12px",
  padding: "28px 16px",
  textAlign: "center",
}

const codeText: React.CSSProperties = {
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: "42px",
  fontWeight: 700,
  color: "#fcfdff",
  letterSpacing: "16px",
  textIndent: "16px",
  lineHeight: "1",
  margin: 0,
  textAlign: "center",
}

const expiry: React.CSSProperties = {
  fontFamily: "Arial, sans-serif",
  fontSize: "11px",
  color: "rgba(252,253,255,0.25)",
  textAlign: "center",
  margin: "16px 0 0 0",
}

const divider: React.CSSProperties = {
  borderColor: "rgba(255,255,255,0.06)",
  margin: "32px 0",
}

const footer: React.CSSProperties = {
  fontFamily: "Arial, sans-serif",
  fontSize: "11px",
  color: "rgba(252,253,255,0.2)",
  lineHeight: "1.6",
  margin: 0,
}

const footerLink: React.CSSProperties = {
  color: "rgba(252,253,255,0.35)",
  textDecoration: "none",
}
