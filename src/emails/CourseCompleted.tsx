import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";

interface CourseCompletedEmailProps {
  managerName: string;
  memberName: string;
  courseTitle: string;
  score: number;
  orgName: string;
  dashboardUrl: string;
}

export default function CourseCompletedEmail({
  managerName = "Manager",
  memberName = "Team Member",
  courseTitle = "Course Title",
  score = 85,
  orgName = "Your Organization",
  dashboardUrl = "#",
}: CourseCompletedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>CourseForge</Text>
          </Section>
          <Section style={content}>
            <Text style={heading}>Course Completed</Text>
            <Text style={paragraph}>Hi {managerName},</Text>
            <Text style={paragraph}>
              Great news! <strong>{memberName}</strong> has completed a training course:
            </Text>
            <Section style={courseCard}>
              <Text style={courseTitle_}>{courseTitle}</Text>
              <Section style={scoreRow}>
                <Text style={scoreLabel}>Final Score</Text>
                <Text style={{ ...scoreValue, color: score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626" }}>
                  {score}%
                </Text>
              </Section>
              <Text style={statusText}>
                {score >= 80 ? "Passed with distinction" : score >= 60 ? "Passed" : "Needs review"}
              </Text>
            </Section>
            <Section style={buttonContainer}>
              <Button style={button} href={dashboardUrl}>
                View Analytics
              </Button>
            </Section>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              Sent by CourseForge AI on behalf of {orgName}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#faf9f6",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const header = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const logo = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#1a1a1a",
};

const content = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "32px",
  border: "1px solid #e8e4de",
};

const heading = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#1a1a1a",
  marginBottom: "16px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#4a4a4a",
  marginBottom: "12px",
};

const courseCard = {
  backgroundColor: "#faf9f6",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "24px",
  border: "1px solid #e8e4de",
};

const courseTitle_ = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1a1a1a",
  marginBottom: "12px",
};

const scoreRow = {
  display: "flex" as const,
  justifyContent: "space-between" as const,
  alignItems: "center" as const,
};

const scoreLabel = {
  fontSize: "13px",
  color: "#6a6a6a",
  margin: "0",
};

const scoreValue = {
  fontSize: "24px",
  fontWeight: "700",
  margin: "0",
};

const statusText = {
  fontSize: "12px",
  color: "#6a6a6a",
  marginTop: "4px",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const button = {
  backgroundColor: "#1a1a1a",
  color: "#d4a843",
  padding: "12px 32px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
};

const hr = {
  borderColor: "#e8e4de",
  marginTop: "24px",
};

const footer = {
  textAlign: "center" as const,
  paddingTop: "16px",
};

const footerText = {
  fontSize: "11px",
  color: "#9a9a9a",
  lineHeight: "18px",
  margin: "4px 0",
};
