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

interface WeeklyDigestEmailProps {
  adminName: string;
  orgName: string;
  weekOf: string;
  stats: {
    totalMembers: number;
    activeLearners: number;
    coursesCompleted: number;
    newAssignments: number;
    overdueCount: number;
    avgScore: number;
  };
  dashboardUrl: string;
}

export default function WeeklyDigestEmail({
  adminName = "Admin",
  orgName = "Your Organization",
  weekOf = "19 Feb 2026",
  stats = {
    totalMembers: 25,
    activeLearners: 18,
    coursesCompleted: 12,
    newAssignments: 8,
    overdueCount: 3,
    avgScore: 82,
  },
  dashboardUrl = "#",
}: WeeklyDigestEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>CourseForge</Text>
          </Section>
          <Section style={content}>
            <Text style={heading}>Weekly Training Report</Text>
            <Text style={subtitle}>Week of {weekOf}</Text>
            <Text style={paragraph}>Hi {adminName},</Text>
            <Text style={paragraph}>
              Here&apos;s your weekly training summary for <strong>{orgName}</strong>:
            </Text>

            {/* Stats Grid */}
            <Section style={statsGrid}>
              <Section style={statCard}>
                <Text style={statNumber}>{stats.activeLearners}</Text>
                <Text style={statLabel}>Active Learners</Text>
              </Section>
              <Section style={statCard}>
                <Text style={statNumber}>{stats.coursesCompleted}</Text>
                <Text style={statLabel}>Completed</Text>
              </Section>
              <Section style={statCard}>
                <Text style={statNumber}>{stats.newAssignments}</Text>
                <Text style={statLabel}>New Assignments</Text>
              </Section>
              <Section style={{ ...statCard, ...(stats.overdueCount > 0 ? overdueCard : {}) }}>
                <Text style={{ ...statNumber, ...(stats.overdueCount > 0 ? { color: "#dc2626" } : {}) }}>
                  {stats.overdueCount}
                </Text>
                <Text style={statLabel}>Overdue</Text>
              </Section>
            </Section>

            <Section style={avgScoreSection}>
              <Text style={avgScoreLabel}>Average Score</Text>
              <Text style={{ ...avgScoreValue, color: stats.avgScore >= 80 ? "#16a34a" : "#d97706" }}>
                {stats.avgScore}%
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={dashboardUrl}>
                View Full Analytics
              </Button>
            </Section>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              Sent weekly by CourseForge AI for {orgName}
            </Text>
            <Text style={footerText}>
              Manage digest preferences in your organization settings.
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
  marginBottom: "4px",
};

const subtitle = {
  fontSize: "13px",
  color: "#6a6a6a",
  marginBottom: "20px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#4a4a4a",
  marginBottom: "12px",
};

const statsGrid = {
  marginBottom: "20px",
};

const statCard = {
  display: "inline-block" as const,
  width: "48%",
  backgroundColor: "#faf9f6",
  borderRadius: "8px",
  padding: "12px",
  marginBottom: "8px",
  marginRight: "2%",
  textAlign: "center" as const,
  border: "1px solid #e8e4de",
};

const overdueCard = {
  backgroundColor: "#fef2f2",
  borderColor: "#fecaca",
};

const statNumber = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#1a1a1a",
  margin: "0",
};

const statLabel = {
  fontSize: "11px",
  color: "#6a6a6a",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "4px 0 0",
};

const avgScoreSection = {
  textAlign: "center" as const,
  backgroundColor: "#faf9f6",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "24px",
  border: "1px solid #e8e4de",
};

const avgScoreLabel = {
  fontSize: "12px",
  color: "#6a6a6a",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px",
};

const avgScoreValue = {
  fontSize: "32px",
  fontWeight: "700",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginBottom: "16px",
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
