import "server-only";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { Prisma } from "@prisma/client";

type WorkOrderForPdf = Prisma.WorkOrderGetPayload<{
  include: {
    asset: true;
    requestedBy: true;
    assignedTo: true;
    parts: { include: { inventoryItem: true } };
    checklistItems: true;
    measurements: true;
    signatures: true;
    statusLogs: { include: { changedBy: true } };
  };
}>;

type InstitutionSettings = {
  institutionName: string;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  healthRegistryCode: string | null;
  logoDataUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#0f172a" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottomWidth: 2, paddingBottom: 12 },
  logo: { width: 60, height: 60, objectFit: "contain" },
  institutionName: { fontSize: 14, fontWeight: 700 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  code: { fontSize: 11, color: "#475569" },
  section: { marginTop: 14 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 130, color: "#64748b" },
  value: { flex: 1 },
  table: { marginTop: 4 },
  tableHeaderRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#cbd5e1", paddingBottom: 3, marginBottom: 3 },
  tableRow: { flexDirection: "row", paddingVertical: 2 },
  th: { flex: 1, fontWeight: 700, color: "#475569" },
  td: { flex: 1 },
  signaturesRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  signatureBox: { width: "45%" },
  signatureImage: { width: 140, height: 60, objectFit: "contain", borderBottomWidth: 1, borderBottomColor: "#94a3b8" },
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, fontSize: 8, color: "#94a3b8", textAlign: "center" },
});

export async function renderWorkOrderPdf(workOrder: WorkOrderForPdf, settings: InstitutionSettings) {
  return renderToBuffer(<WorkOrderDocument workOrder={workOrder} settings={settings} />);
}

function WorkOrderDocument({
  workOrder,
  settings,
}: {
  workOrder: WorkOrderForPdf;
  settings: InstitutionSettings;
}) {
  const deliveredBy = workOrder.signatures.find((s) => s.role === "DELIVERED_BY");
  const receivedBy = workOrder.signatures.find((s) => s.role === "RECEIVED_BY");
  const partsTotal = workOrder.parts.reduce((sum, p) => sum + p.quantityUsed * p.unitCostSnapshot, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { borderBottomColor: settings.primaryColor }]}>
          <View>
            <Text style={styles.title}>Orden de Trabajo {workOrder.code}</Text>
            <Text style={styles.code}>{workOrder.asset.code} — {workOrder.asset.name}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={[styles.institutionName, { color: settings.primaryColor, marginRight: 8 }]}>{settings.institutionName}</Text>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not an <img>; no alt prop */}
            {settings.logoDataUrl && <Image src={settings.logoDataUrl} style={styles.logo} />}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: settings.secondaryColor }]}>Datos generales</Text>
          <View style={styles.row}><Text style={styles.label}>Tipo</Text><Text style={styles.value}>{workOrder.type}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Prioridad</Text><Text style={styles.value}>{workOrder.priority}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Estado</Text><Text style={styles.value}>{workOrder.status}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Solicitada por</Text><Text style={styles.value}>{workOrder.requestedBy.name}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Asignada a</Text><Text style={styles.value}>{workOrder.assignedTo?.name ?? "Sin asignar"}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Solicitada</Text><Text style={styles.value}>{workOrder.requestedAt.toLocaleString("es-ES")}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Completada</Text><Text style={styles.value}>{workOrder.completedAt?.toLocaleString("es-ES") ?? "—"}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: settings.secondaryColor }]}>Descripción</Text>
          <Text>{workOrder.description}</Text>
          {workOrder.actionTaken && (
            <>
              <Text style={{ marginTop: 6, fontWeight: 700 }}>Trabajo realizado:</Text>
              <Text>{workOrder.actionTaken}</Text>
            </>
          )}
        </View>

        {workOrder.checklistItems.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: settings.secondaryColor }]}>Checklist de actividades</Text>
            {workOrder.checklistItems.map((item) => (
              <Text key={item.id}>{item.completed ? "[x] " : "[ ] "}{item.label}</Text>
            ))}
          </View>
        )}

        {workOrder.measurements.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: settings.secondaryColor }]}>Mediciones</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.th}>Variable</Text>
                <Text style={styles.th}>Referencia</Text>
                <Text style={styles.th}>Medido</Text>
              </View>
              {workOrder.measurements.map((m) => (
                <View key={m.id} style={styles.tableRow}>
                  <Text style={styles.td}>{m.variable}</Text>
                  <Text style={styles.td}>{m.referenceValue ?? "—"} {m.unit}</Text>
                  <Text style={styles.td}>{m.measuredValue ?? "—"} {m.unit}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {workOrder.parts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: settings.secondaryColor }]}>Repuestos utilizados</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.th}>Repuesto</Text>
                <Text style={styles.th}>Cantidad</Text>
                <Text style={styles.th}>Costo</Text>
              </View>
              {workOrder.parts.map((p) => (
                <View key={p.id} style={styles.tableRow}>
                  <Text style={styles.td}>{p.inventoryItem.code} — {p.inventoryItem.name}</Text>
                  <Text style={styles.td}>{p.quantityUsed} {p.inventoryItem.unit}</Text>
                  <Text style={styles.td}>{(p.quantityUsed * p.unitCostSnapshot).toFixed(2)}</Text>
                </View>
              ))}
            </View>
            <Text style={{ marginTop: 4, fontWeight: 700 }}>Total materiales: {partsTotal.toFixed(2)}</Text>
          </View>
        )}

        {/* eslint-disable jsx-a11y/alt-text -- @react-pdf/renderer's Image, not an <img>; no alt prop */}
        <View style={styles.signaturesRow}>
          <View style={styles.signatureBox}>
            {deliveredBy && <Image src={deliveredBy.imageDataUrl} style={styles.signatureImage} />}
            <Text style={{ marginTop: 4 }}>{deliveredBy?.signerName ?? "___________________"}</Text>
            <Text style={{ color: "#64748b" }}>{deliveredBy?.signerRole ?? "Entregado por"}</Text>
          </View>
          <View style={styles.signatureBox}>
            {receivedBy && <Image src={receivedBy.imageDataUrl} style={styles.signatureImage} />}
            <Text style={{ marginTop: 4 }}>{receivedBy?.signerName ?? "___________________"}</Text>
            <Text style={{ color: "#64748b" }}>{receivedBy?.signerRole ?? "Recibido conforme por"}</Text>
        {/* eslint-enable jsx-a11y/alt-text */}
          </View>
        </View>

        <Text style={styles.footer} fixed>
          {[settings.institutionName, settings.taxId && `NIT ${settings.taxId}`, settings.address, settings.phone, settings.healthRegistryCode && `Reg. ${settings.healthRegistryCode}`]
            .filter(Boolean)
            .join(" · ")}
          {"\n"}Generado por el sistema CMMS el {new Date().toLocaleString("es-ES")}
        </Text>
      </Page>
    </Document>
  );
}
