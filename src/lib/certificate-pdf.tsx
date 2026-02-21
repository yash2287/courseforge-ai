import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const gold = "#d4a843";
const charcoal = "#1a1a2e";
const warmGray = "#78716c";
const warmGrayLight = "#a8a29e";
const cream = "#faf8f5";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    padding: 60,
    fontFamily: "Helvetica",
    position: "relative",
  },
  // Corner accents
  cornerTL: { position: "absolute", top: 30, left: 30, width: 50, height: 50, borderTop: `2px solid ${gold}`, borderLeft: `2px solid ${gold}`, opacity: 0.4 },
  cornerTR: { position: "absolute", top: 30, right: 30, width: 50, height: 50, borderTop: `2px solid ${gold}`, borderRight: `2px solid ${gold}`, opacity: 0.4 },
  cornerBL: { position: "absolute", bottom: 30, left: 30, width: 50, height: 50, borderBottom: `2px solid ${gold}`, borderLeft: `2px solid ${gold}`, opacity: 0.4 },
  cornerBR: { position: "absolute", bottom: 30, right: 30, width: 50, height: 50, borderBottom: `2px solid ${gold}`, borderRight: `2px solid ${gold}`, opacity: 0.4 },
  // Inner border
  innerBorder: { position: "absolute", top: 50, left: 50, right: 50, bottom: 50, border: `1px solid ${gold}`, opacity: 0.15 },
  // Content
  content: { flex: 1, alignItems: "center", justifyContent: "center", textAlign: "center" },
  subtitle: { fontSize: 9, letterSpacing: 4, color: warmGrayLight, fontFamily: "Helvetica-Bold", textTransform: "uppercase", marginBottom: 10 },
  goldLine: { width: 60, height: 2, backgroundColor: gold, marginBottom: 25, opacity: 0.6 },
  presentedTo: { fontSize: 10, color: warmGray, marginBottom: 6 },
  userName: { fontSize: 32, color: charcoal, fontFamily: "Helvetica-Oblique", marginBottom: 25 },
  forCompleting: { fontSize: 10, color: warmGray, marginBottom: 6 },
  courseTitle: { fontSize: 16, color: charcoal, fontFamily: "Helvetica-Bold", marginBottom: 25, maxWidth: 350 },
  detailsRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  detailText: { fontSize: 9, color: warmGray },
  detailBold: { fontSize: 9, color: charcoal, fontFamily: "Helvetica-Bold" },
  detailDivider: { fontSize: 9, color: warmGrayLight, marginHorizontal: 8 },
  scoreBadge: { backgroundColor: cream, borderRadius: 6, paddingHorizontal: 30, paddingVertical: 12, marginBottom: 20 },
  scoreLabel: { fontSize: 7, letterSpacing: 2, color: warmGrayLight, fontFamily: "Helvetica-Bold", textTransform: "uppercase", marginBottom: 3 },
  scoreValue: { fontSize: 22, color: charcoal, fontFamily: "Helvetica-Oblique" },
  certId: { fontSize: 8, color: warmGrayLight, fontFamily: "Courier", marginBottom: 20 },
  signatureLine: { width: 100, height: 1, backgroundColor: gold, opacity: 0.5, marginBottom: 6 },
  signatureText: { fontSize: 7, letterSpacing: 3, color: warmGrayLight, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
});

interface CertificateProps {
  userName: string;
  courseTitle: string;
  companyName: string;
  completionDate: string;
  finalScore: number;
  certificateId: string;
}

export function CertificateDocument(props: CertificateProps) {
  return (
    <Document>
      <Page size="LETTER" orientation="landscape" style={styles.page}>
        {/* Decorative corners */}
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />
        <View style={styles.innerBorder} />

        <View style={styles.content}>
          <Text style={styles.subtitle}>Certificate of Completion</Text>
          <View style={styles.goldLine} />

          <Text style={styles.presentedTo}>This certificate is proudly presented to</Text>
          <Text style={styles.userName}>{props.userName}</Text>

          <Text style={styles.forCompleting}>for successfully completing</Text>
          <Text style={styles.courseTitle}>{props.courseTitle}</Text>

          <View style={styles.detailsRow}>
            <Text style={styles.detailText}>Presented by </Text>
            <Text style={styles.detailBold}>{props.companyName}</Text>
            <Text style={styles.detailDivider}>|</Text>
            <Text style={styles.detailText}>{props.completionDate}</Text>
          </View>

          <View style={styles.scoreBadge}>
            <Text style={styles.scoreLabel}>Final Score</Text>
            <Text style={styles.scoreValue}>{props.finalScore}%</Text>
          </View>

          <Text style={styles.certId}>Certificate ID: {props.certificateId}</Text>

          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>Authenticated Certificate</Text>
        </View>
      </Page>
    </Document>
  );
}
